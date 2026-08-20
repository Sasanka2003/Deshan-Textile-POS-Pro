import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgeDollarSign,
  Banknote,
  CalendarDays,
  CircleAlert,
  Clock3,
  CreditCard,
  Eye,
  Landmark,
  ListRestart,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  ShieldAlert,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import {
  getShiftDetailSummary,
  getShiftHistory,
  type ShiftDetailSummary,
  type ShiftHistoryItem,
} from '../../services/shiftService'

import {
  printShiftReport,
} from '../../utils/printShiftReport'

import {
  directPrintShiftReport,
} from '../../services/directReceiptPrinter'

import {
  getBusinessSettings,
} from '../../services/settingsService'

import type {
  BusinessSettings,
} from '../../types/settings'

import '../../styles/shift-history.css'

function money(
  value: number,
) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  )}`
}

function formatDateTime(
  value:
    | string
    | null,
) {
  if (!value) {
    return 'â€”'
  }

  return new Date(
    value,
  ).toLocaleString(
    'en-LK',
    {
      timeZone:
        'Asia/Colombo',

      year:
        'numeric',

      month:
        'short',

      day:
        '2-digit',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  )
}

function dateInputValue(
  date: Date,
) {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
}

function isWithinDateRange(
  value: string,
  fromDate: string,
  toDate: string,
) {
  const opened =
    new Date(
      value,
    )

  if (fromDate) {
    const from =
      new Date(
        `${fromDate}T00:00:00`,
      )

    if (
      opened <
      from
    ) {
      return false
    }
  }

  if (toDate) {
    const to =
      new Date(
        `${toDate}T23:59:59.999`,
      )

    if (
      opened >
      to
    ) {
      return false
    }
  }

  return true
}

function closeTypeLabel(
  shift: ShiftHistoryItem,
) {
  if (
    shift.status ===
    'open'
  ) {
    return 'Open'
  }

  return shift.closeType ===
    'emergency'
    ? 'Emergency Close'
    : 'Normal Close'
}

function reconciliationLabel(
  difference:
    | number
    | null,
) {
  if (
    difference ===
    null
  ) {
    return 'Not Reconciled'
  }

  if (
    difference ===
    0
  ) {
    return 'Balanced'
  }

  if (
    difference >
    0
  ) {
    return 'Cash Over'
  }

  return 'Cash Short'
}

export default function ShiftHistoryPage() {
  const {
    staff,
  } = useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const [
    shifts,
    setShifts,
  ] =
    useState<
      ShiftHistoryItem[]
    >([])

  const [
    selectedShift,
    setSelectedShift,
  ] =
    useState<
      ShiftHistoryItem | null
    >(null)

  const [
    shiftDetail,
    setShiftDetail,
  ] =
    useState<
      ShiftDetailSummary | null
    >(null)

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false)

  const [
    detailError,
    setDetailError,
  ] =
    useState('')

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    printSettings,
    setPrintSettings,
  ] =
    useState<BusinessSettings | null>(null)

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | 'all'
      | 'open'
      | 'closed'
    >('all')

  const [
    closeTypeFilter,
    setCloseTypeFilter,
  ] =
    useState<
      | 'all'
      | 'normal'
      | 'emergency'
    >('all')

  const now =
    new Date()

  const firstDay =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )

  const [
    fromDate,
    setFromDate,
  ] =
    useState(
      dateInputValue(
        firstDay,
      ),
    )

  const [
    toDate,
    setToDate,
  ] =
    useState(
      dateInputValue(
        now,
      ),
    )

  useEffect(() => {
    if (!businessId) {
      setPrintSettings(null)
      return
    }

    const currentBusinessId = businessId
    let active = true

    async function loadPrintSettings() {
      try {
        const value = await getBusinessSettings(
          currentBusinessId,
          branchId ?? null,
        )

        if (active) {
          setPrintSettings(value)
        }
      } catch {
        if (active) {
          setPrintSettings(null)
        }
      }
    }

    void loadPrintSettings()

    return () => {
      active = false
    }
  }, [businessId, branchId])

  useEffect(() => {
    if (
      !businessId ||
      !branchId
    ) {
      setLoading(
        false,
      )

      return
    }

    const currentBusinessId =
      businessId

    const currentBranchId =
      branchId

    async function loadHistory() {
      try {
        setLoading(
          true,
        )

        setError('')

        const data =
          await getShiftHistory(
            currentBusinessId,
            currentBranchId,
          )

        setShifts(
          data,
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load shift history.',
        )
      } finally {
        setLoading(
          false,
        )
      }
    }

    void loadHistory()
  }, [
    businessId,
    branchId,
  ])

  async function openShiftDetails(
    shift: ShiftHistoryItem,
  ) {
    try {
      setSelectedShift(
        shift,
      )

      setShiftDetail(
        null,
      )

      setDetailError(
        '',
      )

      setDetailLoading(
        true,
      )

      const detail =
        await getShiftDetailSummary(
          shift.id,
        )

      setShiftDetail(
        detail,
      )
    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : 'Unable to load shift details.',
      )
    } finally {
      setDetailLoading(
        false,
      )
    }
  }

  function closeShiftDetails() {
    setSelectedShift(
      null,
    )

    setShiftDetail(
      null,
    )

    setDetailError(
      '',
    )
  }

  async function handlePrintShiftReport() {
    if (
      !selectedShift ||
      !shiftDetail
    ) {
      setDetailError(
        'Shift report data is not ready yet.',
      )

      return
    }

    try {
      const printed =
        await directPrintShiftReport(
          selectedShift,
          shiftDetail,
          printSettings,
        )

      if (!printed) {
        printShiftReport(
          selectedShift,
          shiftDetail,
        )
      }
    } catch (err) {
      setDetailError(
        err instanceof Error
          ? err.message
          : 'Unable to print shift report.',
      )
    }
  }

  const filteredShifts =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase()

        return shifts.filter(
          (shift) => {
            if (
              statusFilter !==
                'all' &&
              shift.status !==
                statusFilter
            ) {
              return false
            }

            if (
              closeTypeFilter !==
                'all' &&
              shift.closeType !==
                closeTypeFilter
            ) {
              return false
            }

            if (
              !isWithinDateRange(
                shift.openedAt,
                fromDate,
                toDate,
              )
            ) {
              return false
            }

            if (!query) {
              return true
            }

            return [
              shift.cashierName,
              shift.terminalName ??
                '',
              shift.status,
              shift.closeType,
              shift.closedByName ??
                '',
              shift.emergencyCloseReason ??
                '',
            ].some(
              (value) =>
                value
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            )
          },
        )
      },
      [
        shifts,
        search,
        statusFilter,
        closeTypeFilter,
        fromDate,
        toDate,
      ],
    )

  const totals =
    useMemo(
      () => {
        return filteredShifts.reduce(
          (
            summary,
            shift,
          ) => {
            summary.openingCash +=
              shift.openingCash

            summary.cashSales +=
              shift.cashSales

            summary.customerCashPayments +=
              shift.customerCashPayments

            summary.cashIn +=
              shift.cashIn

            summary.cashOut +=
              shift.cashOut

            summary.netMovement +=
              shift.netCashMovement

            summary.expectedCash +=
              shift.expectedCash ??
              0

            summary.closingCash +=
              shift.closingCash ??
              0

            summary.difference +=
              shift.cashDifference ??
              0

            if (
              shift.closeType ===
              'emergency'
            ) {
              summary.emergencyCount +=
                1
            }

            return summary
          },
          {
            openingCash:
              0,

            cashSales:
              0,

            customerCashPayments:
              0,

            cashIn:
              0,

            cashOut:
              0,

            netMovement:
              0,

            expectedCash:
              0,

            closingCash:
              0,

            difference:
              0,

            emergencyCount:
              0,
          },
        )
      },
      [
        filteredShifts,
      ],
    )

  return (
    <AppLayout>

      <div className="shift-history-page">

        <section className="shift-history-heading">

          <div>

            <h1>
              Shift History
            </h1>

            <p>
              Review cashier shifts,
              cash sales, drawer
              movements and reconciliation.
            </p>

          </div>

          <div className="shift-history-count">

            {
              filteredShifts.length
            }{' '}
            shift
            {filteredShifts.length ===
            1
              ? ''
              : 's'}

          </div>

        </section>

        {error && (
          <div className="shift-history-error">

            <CircleAlert
              size={17}
            />

            {error}

          </div>
        )}

        <section className="shift-summary-grid">

          <article className="shift-summary-card">

            <div className="shift-summary-icon">

              <BadgeDollarSign
                size={20}
              />

            </div>

            <div>

              <span>
                Opening Cash
              </span>

              <strong>
                {money(
                  totals.openingCash,
                )}
              </strong>

            </div>

          </article>

          <article className="shift-summary-card">

            <div className="shift-summary-icon">

              <Banknote
                size={20}
              />

            </div>

            <div>

              <span>
                Cash Sales
              </span>

              <strong>
                {money(
                  totals.cashSales,
                )}
              </strong>

            </div>

          </article>

          <article className="shift-summary-card">

            <div className="shift-summary-icon">

              <WalletCards
                size={20}
              />

            </div>

            <div>

              <span>
                Customer Cash Payments
              </span>

              <strong>
                {money(
                  totals.customerCashPayments,
                )}
              </strong>

            </div>

          </article>

          <article className="shift-summary-card">

            <div className="shift-summary-icon">

              <ArrowDownToLine
                size={20}
              />

            </div>

            <div>

              <span>
                Cash In
              </span>

              <strong className="positive">
                +{money(
                  totals.cashIn,
                )}
              </strong>

            </div>

          </article>

          <article className="shift-summary-card">

            <div className="shift-summary-icon">

              <ArrowUpFromLine
                size={20}
              />

            </div>

            <div>

              <span>
                Cash Out
              </span>

              <strong className="negative">
                -{money(
                  totals.cashOut,
                )}
              </strong>

            </div>

          </article>

          <article className="shift-summary-card">

            <div className="shift-summary-icon">

              <BadgeDollarSign
                size={20}
              />

            </div>

            <div>

              <span>
                Expected Cash
              </span>

              <strong>
                {money(
                  totals.expectedCash,
                )}
              </strong>

            </div>

          </article>

          <article className="shift-summary-card">

            <div className="shift-summary-icon">

              <AlertTriangle
                size={20}
              />

            </div>

            <div>

              <span>
                Emergency Closes
              </span>

              <strong>
                {
                  totals.emergencyCount
                }
              </strong>

            </div>

          </article>

        </section>

        <section className="shift-history-panel">

          <div className="shift-history-toolbar">

            <div className="shift-history-search">

              <Search
                size={17}
              />

              <input
                value={
                  search
                }
                onChange={(
                  event,
                ) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search cashier, manager, terminal or reason..."
              />

            </div>

            <div className="shift-history-filters">

              <label>

                <CalendarDays
                  size={15}
                />

                <input
                  type="date"
                  value={
                    fromDate
                  }
                  onChange={(
                    event,
                  ) =>
                    setFromDate(
                      event.target.value,
                    )
                  }
                />

              </label>

              <label>

                <CalendarDays
                  size={15}
                />

                <input
                  type="date"
                  value={
                    toDate
                  }
                  onChange={(
                    event,
                  ) =>
                    setToDate(
                      event.target.value,
                    )
                  }
                />

              </label>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event,
                ) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | 'all'
                      | 'open'
                      | 'closed',
                  )
                }
              >

                <option value="all">
                  All Statuses
                </option>

                <option value="open">
                  Open
                </option>

                <option value="closed">
                  Closed
                </option>

              </select>

              <select
                value={
                  closeTypeFilter
                }
                onChange={(
                  event,
                ) =>
                  setCloseTypeFilter(
                    event.target
                      .value as
                      | 'all'
                      | 'normal'
                      | 'emergency',
                  )
                }
              >

                <option value="all">
                  All Close Types
                </option>

                <option value="normal">
                  Normal Close
                </option>

                <option value="emergency">
                  Emergency Close
                </option>

              </select>

            </div>

          </div>

          <div className="shift-history-table-wrap">

            <table className="shift-history-table">

              <thead>

                <tr>

                  <th>
                    Cashier
                  </th>

                  <th>
                    Terminal
                  </th>

                  <th>
                    Opened
                  </th>

                  <th>
                    Closed
                  </th>

                  <th>
                    Opening
                  </th>

                  <th>
                    Cash Sales
                  </th>

                  <th>
                    Customer Cash
                  </th>

                  <th>
                    Cash In
                  </th>

                  <th>
                    Cash Out
                  </th>

                  <th>
                    Expected
                  </th>

                  <th>
                    Actual
                  </th>

                  <th>
                    Difference
                  </th>

                  <th>
                    Close Type
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={14}
                      className="shift-history-empty"
                    >
                      Loading shift history...
                    </td>

                  </tr>

                ) : filteredShifts.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={14}
                      className="shift-history-empty"
                    >
                      No shifts found.
                    </td>

                  </tr>

                ) : (

                  filteredShifts.map(
                    (shift) => (

                      <tr
                        key={
                          shift.id
                        }
                        className="shift-history-row"
                        onClick={() =>
                          void openShiftDetails(
                            shift,
                          )
                        }
                      >

                        <td>

                          <div className="shift-cashier">

                            <UserRound
                              size={16}
                            />

                            <div>

                              <strong>
                                {
                                  shift.cashierName
                                }
                              </strong>

                              <small>
                                {
                                  shift.staffId
                                    .slice(
                                      0,
                                      8,
                                    )
                                }
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          {shift.terminalName ??
                            'â€”'}

                        </td>

                        <td>

                          <span className="shift-time">

                            <Clock3
                              size={14}
                            />

                            {formatDateTime(
                              shift.openedAt,
                            )}

                          </span>

                        </td>

                        <td>

                          {formatDateTime(
                            shift.closedAt,
                          )}

                        </td>

                        <td>

                          {money(
                            shift.openingCash,
                          )}

                        </td>

                        <td>

                          {money(
                            shift.cashSales,
                          )}

                        </td>

                        <td>

                          {money(
                            shift.customerCashPayments,
                          )}

                        </td>

                        <td>

                          <strong className="shift-cash-in-value">

                            +{money(
                              shift.cashIn,
                            )}

                          </strong>

                        </td>

                        <td>

                          <strong className="shift-cash-out-value">

                            -{money(
                              shift.cashOut,
                            )}

                          </strong>

                        </td>

                        <td>

                          {shift.expectedCash ===
                          null
                            ? 'â€”'
                            : money(
                                shift.expectedCash,
                              )}

                        </td>

                        <td>

                          {shift.closingCash ===
                          null
                            ? 'â€”'
                            : money(
                                shift.closingCash,
                              )}

                        </td>

                        <td>

                          {shift.cashDifference ===
                          null ? (

                            'â€”'

                          ) : (

                            <strong
                              className={
                                shift.cashDifference <
                                0
                                  ? 'shift-difference negative'
                                  : shift.cashDifference >
                                      0
                                    ? 'shift-difference positive'
                                    : 'shift-difference'
                              }
                            >

                              {money(
                                shift.cashDifference,
                              )}

                            </strong>

                          )}

                        </td>

                        <td>

                          {shift.status ===
                          'open' ? (

                            <span className="shift-status open">
                              Open
                            </span>

                          ) : shift.closeType ===
                            'emergency' ? (

                            <span className="shift-close-type emergency">

                              <ShieldAlert
                                size={12}
                              />

                              Emergency

                            </span>

                          ) : (

                            <span className="shift-close-type normal">
                              Normal
                            </span>

                          )}

                        </td>

                        <td>

                          <button
                            type="button"
                            className="shift-view-button"
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation()

                              void openShiftDetails(
                                shift,
                              )
                            }}
                          >

                            <Eye
                              size={15}
                            />

                            View

                          </button>

                        </td>

                      </tr>

                    ),
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

        {selectedShift && (
          <div
            className="shift-detail-backdrop"
            onMouseDown={
              closeShiftDetails
            }
          >

            <section
              className="shift-detail-modal"
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
            >

              <div className="shift-detail-heading">

                <div>

                  <span>
                    Shift Reconciliation
                  </span>

                  <h2>
                    {
                      selectedShift.cashierName
                    }
                  </h2>

                  <p>
                    {
                      selectedShift.terminalName ??
                      'No terminal'
                    }
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeShiftDetails
                  }
                  aria-label="Close shift details"
                >

                  <X
                    size={19}
                  />

                </button>

              </div>

              <div className="shift-detail-body">

                {selectedShift.closeType ===
                  'emergency' && (

                  <div className="shift-emergency-audit">

                    <div className="shift-emergency-audit-heading">

                      <ShieldAlert
                        size={18}
                      />

                      <div>

                        <strong>
                          Emergency Close
                        </strong>

                        <span>
                          This shift was closed by
                          manager override.
                        </span>

                      </div>

                    </div>

                    <div className="shift-emergency-audit-grid">

                      <div>

                        <span>
                          Closed By
                        </span>

                        <strong>
                          {
                            selectedShift.closedByName ??
                            selectedShift.closedBy ??
                            'Unknown Manager'
                          }
                        </strong>

                      </div>

                      <div>

                        <span>
                          Closed At
                        </span>

                        <strong>
                          {formatDateTime(
                            selectedShift.closedAt,
                          )}
                        </strong>

                      </div>

                    </div>

                    <div className="shift-emergency-reason">

                      <span>
                        Emergency Reason
                      </span>

                      <p>
                        {
                          selectedShift.emergencyCloseReason ??
                          'No emergency reason recorded.'
                        }
                      </p>

                    </div>

                  </div>

                )}

                <div className="shift-detail-meta">

                  <div>

                    <span>
                      Status
                    </span>

                    <strong>

                      <span
                        className={`shift-status ${selectedShift.status}`}
                      >
                        {
                          selectedShift.status
                        }
                      </span>

                    </strong>

                  </div>

                  <div>

                    <span>
                      Close Type
                    </span>

                    <strong>
                      {closeTypeLabel(
                        selectedShift,
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Staff ID
                    </span>

                    <strong>
                      {
                        selectedShift.staffId
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Closed By
                    </span>

                    <strong>
                      {selectedShift.closedByName ??
                        selectedShift.closedBy ??
                        'â€”'}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Opened
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedShift.openedAt,
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Closed
                    </span>

                    <strong>
                      {formatDateTime(
                        selectedShift.closedAt,
                      )}
                    </strong>

                  </div>

                </div>

                <div className="shift-detail-money-grid">

                  <article>

                    <span>
                      Opening Cash
                    </span>

                    <strong>
                      {money(
                        selectedShift.openingCash,
                      )}
                    </strong>

                  </article>

                  <article>

                    <span>
                      Cash Sales
                    </span>

                    <strong>
                      {money(
                        selectedShift.cashSales,
                      )}
                    </strong>

                  </article>

                  <article>

                    <span>
                      Customer Cash Payments
                    </span>

                    <strong>
                      {money(
                        selectedShift.customerCashPayments,
                      )}
                    </strong>

                  </article>

                  <article>

                    <span>
                      Cash In
                    </span>

                    <strong className="positive">

                      +{money(
                        selectedShift.cashIn,
                      )}

                    </strong>

                  </article>

                  <article>

                    <span>
                      Cash Out
                    </span>

                    <strong className="negative">

                      -{money(
                        selectedShift.cashOut,
                      )}

                    </strong>

                  </article>

                  <article>

                    <span>
                      Net Cash Movement
                    </span>

                    <strong
                      className={
                        selectedShift.netCashMovement >
                        0
                          ? 'positive'
                          : selectedShift.netCashMovement <
                              0
                            ? 'negative'
                            : ''
                      }
                    >

                      {selectedShift.netCashMovement >
                      0
                        ? '+'
                        : ''}

                      {money(
                        selectedShift.netCashMovement,
                      )}

                    </strong>

                  </article>

                  <article>

                    <span>
                      Expected Cash
                    </span>

                    <strong>
                      {selectedShift.expectedCash ===
                      null
                        ? 'â€”'
                        : money(
                            selectedShift.expectedCash,
                          )}
                    </strong>

                  </article>

                  <article>

                    <span>
                      Actual Cash
                    </span>

                    <strong>
                      {selectedShift.closingCash ===
                      null
                        ? 'â€”'
                        : money(
                            selectedShift.closingCash,
                          )}
                    </strong>

                  </article>

                  <article className="shift-detail-difference-card">

                    <span>
                      {
                        reconciliationLabel(
                          selectedShift.cashDifference,
                        )
                      }
                    </span>

                    <strong
                      className={
                        selectedShift.cashDifference ===
                        null
                          ? ''
                          : selectedShift.cashDifference <
                              0
                            ? 'negative'
                            : selectedShift.cashDifference >
                                0
                              ? 'positive'
                              : ''
                      }
                    >

                      {selectedShift.cashDifference ===
                      null
                        ? 'â€”'
                        : money(
                            selectedShift.cashDifference,
                          )}

                    </strong>

                  </article>

                </div>

                <div className="shift-cash-formula">

                  <span>
                    Expected Cash Formula
                  </span>

                  <strong>
                    Opening + Cash Sales + Customer Cash Payments + Cash In âˆ’ Cash Out
                  </strong>

                  <p>

                    {money(
                      selectedShift.openingCash,
                    )}

                    {' + '}

                    {money(
                      selectedShift.cashSales,
                    )}

                    {' + '}

                    {money(
                      selectedShift.customerCashPayments,
                    )}

                    {' + '}

                    {money(
                      selectedShift.cashIn,
                    )}

                    {' âˆ’ '}

                    {money(
                      selectedShift.cashOut,
                    )}

                    {' = '}

                    <strong>
                      {selectedShift.expectedCash ===
                      null
                        ? 'â€”'
                        : money(
                            selectedShift.expectedCash,
                          )}
                    </strong>

                  </p>

                </div>

                <div className="shift-detail-sales-section">

                  <div className="shift-detail-section-heading">

                    <div>

                      <span>
                        Shift Sales
                      </span>

                      <h3>
                        Sales & Payment Breakdown
                      </h3>

                    </div>

                    <ReceiptText
                      size={18}
                    />

                  </div>

                  {detailError && (
                    <div className="shift-detail-load-error">

                      <CircleAlert
                        size={15}
                      />

                      {detailError}

                    </div>
                  )}

                  {detailLoading ? (

                    <div className="shift-detail-loading">

                      Loading shift details...

                    </div>

                  ) : shiftDetail ? (

                    <div className="shift-detail-sales-grid">

                      <article>

                        <div className="shift-detail-sales-icon">

                          <ReceiptText
                            size={18}
                          />

                        </div>

                        <div>

                          <span>
                            Transactions
                          </span>

                          <strong>
                            {
                              shiftDetail.transactionCount
                            }
                          </strong>

                        </div>

                      </article>

                      <article>

                        <div className="shift-detail-sales-icon">

                          <WalletCards
                            size={18}
                          />

                        </div>

                        <div>

                          <span>
                            Total Sales
                          </span>

                          <strong>
                            {money(
                              shiftDetail.totalSales,
                            )}
                          </strong>

                        </div>

                      </article>

                      <article>

                        <div className="shift-detail-sales-icon">

                          <Banknote
                            size={18}
                          />

                        </div>

                        <div>

                          <span>
                            Cash
                          </span>

                          <strong>
                            {money(
                              shiftDetail.payments.cash,
                            )}
                          </strong>

                        </div>

                      </article>

                      <article>

                        <div className="shift-detail-sales-icon">

                          <CreditCard
                            size={18}
                          />

                        </div>

                        <div>

                          <span>
                            Card
                          </span>

                          <strong>
                            {money(
                              shiftDetail.payments.card,
                            )}
                          </strong>

                        </div>

                      </article>

                      <article>

                        <div className="shift-detail-sales-icon">

                          <QrCode
                            size={18}
                          />

                        </div>

                        <div>

                          <span>
                            QR
                          </span>

                          <strong>
                            {money(
                              shiftDetail.payments.qr,
                            )}
                          </strong>

                        </div>

                      </article>

                      <article>

                        <div className="shift-detail-sales-icon">

                          <Landmark
                            size={18}
                          />

                        </div>

                        <div>

                          <span>
                            Bank
                          </span>

                          <strong>
                            {money(
                              shiftDetail.payments.bankTransfer,
                            )}
                          </strong>

                        </div>

                      </article>

                    </div>

                  ) : null}

                </div>

                {shiftDetail && (
                  <div className="shift-movement-section">

                    <div className="shift-detail-section-heading">

                      <div>

                        <span>
                          Cash Drawer Audit
                        </span>

                        <h3>
                          Cash Movements
                        </h3>

                      </div>

                      <ListRestart
                        size={18}
                      />

                    </div>

                    <div className="shift-movement-summary">

                      <article>

                        <ArrowDownToLine
                          size={17}
                        />

                        <div>

                          <span>
                            Cash In
                          </span>

                          <strong className="positive">

                            +{money(
                              shiftDetail.cashIn,
                            )}

                          </strong>

                        </div>

                      </article>

                      <article>

                        <ArrowUpFromLine
                          size={17}
                        />

                        <div>

                          <span>
                            Cash Out
                          </span>

                          <strong className="negative">

                            -{money(
                              shiftDetail.cashOut,
                            )}

                          </strong>

                        </div>

                      </article>

                      <article>

                        <WalletCards
                          size={17}
                        />

                        <div>

                          <span>
                            Net Movement
                          </span>

                          <strong
                            className={
                              shiftDetail.netCashMovement >
                              0
                                ? 'positive'
                                : shiftDetail.netCashMovement <
                                    0
                                  ? 'negative'
                                  : ''
                            }
                          >

                            {shiftDetail.netCashMovement >
                            0
                              ? '+'
                              : ''}

                            {money(
                              shiftDetail.netCashMovement,
                            )}

                          </strong>

                        </div>

                      </article>

                    </div>

                    {shiftDetail.movements.length ===
                    0 ? (

                      <div className="shift-movement-empty">

                        No cash drawer movements
                        recorded for this shift.

                      </div>

                    ) : (

                      <div className="shift-movement-list">

                        {shiftDetail.movements.map(
                          (movement) => (

                            <article
                              key={
                                movement.id
                              }
                              className="shift-movement-item"
                            >

                              <div className="shift-movement-icon">

                                {movement.movementType ===
                                'cash_in' ? (

                                  <ArrowDownToLine
                                    size={16}
                                  />

                                ) : (

                                  <ArrowUpFromLine
                                    size={16}
                                  />

                                )}

                              </div>

                              <div className="shift-movement-info">

                                <div>

                                  <strong>

                                    {
                                      movement.reason
                                    }

                                  </strong>

                                  <span>

                                    {formatDateTime(
                                      movement.createdAt,
                                    )}

                                  </span>

                                </div>

                                {movement.referenceNo && (

                                  <small>

                                    Reference:{' '}

                                    {
                                      movement.referenceNo
                                    }

                                  </small>

                                )}

                              </div>

                              <strong
                                className={
                                  movement.movementType ===
                                  'cash_in'
                                    ? 'shift-movement-amount positive'
                                    : 'shift-movement-amount negative'
                                }
                              >

                                {movement.movementType ===
                                'cash_in'
                                  ? '+'
                                  : '-'}

                                {money(
                                  movement.amount,
                                )}

                              </strong>

                            </article>

                          ),
                        )}

                      </div>

                    )}

                  </div>
                )}

                <div className="shift-detail-notes">

                  <div>

                    <span>
                      Opening Note
                    </span>

                    <p>
                      {
                        selectedShift.openingNote ??
                        'No opening note.'
                      }
                    </p>

                  </div>

                  <div>

                    <span>
                      Closing Note
                    </span>

                    <p>
                      {
                        selectedShift.closingNote ??
                        'No closing note.'
                      }
                    </p>

                  </div>

                </div>

              </div>

              <div className="shift-detail-actions">

                <button
                  type="button"
                  className="shift-detail-close-button"
                  onClick={
                    closeShiftDetails
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="shift-detail-print-button"
                  onClick={
                    handlePrintShiftReport
                  }
                  disabled={
                    detailLoading ||
                    !shiftDetail
                  }
                >

                  <Printer
                    size={16}
                  />

                  Print Shift Report

                </button>

              </div>

            </section>

          </div>
        )}

      </div>

    </AppLayout>
  )
}
