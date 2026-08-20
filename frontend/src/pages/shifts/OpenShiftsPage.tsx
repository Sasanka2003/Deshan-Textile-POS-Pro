import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertTriangle,
  Banknote,
  Clock3,
  Loader2,
  RefreshCcw,
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
  emergencyCloseShift,
  getOpenShifts,
  type OpenShiftItem,
} from '../../services/shiftService'

import '../../styles/open-shifts.css'

function money(
  value: number,
) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function formatDateTime(
  value: string,
) {
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

function shiftDuration(
  openedAt: string,
) {
  const opened =
    new Date(
      openedAt,
    ).getTime()

  const now =
    Date.now()

  const totalMinutes =
    Math.max(
      0,
      Math.floor(
        (now - opened) /
          60000,
      ),
    )

  const hours =
    Math.floor(
      totalMinutes /
        60,
    )

  const minutes =
    totalMinutes %
    60

  if (hours === 0) {
    return `${minutes}m`
  }

  return `${hours}h ${minutes}m`
}

export default function OpenShiftsPage() {
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
      OpenShiftItem[]
    >([])

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
    selectedShift,
    setSelectedShift,
  ] =
    useState<
      OpenShiftItem | null
    >(null)

  const [
    closingCash,
    setClosingCash,
  ] =
    useState('')

  const [
    emergencyReason,
    setEmergencyReason,
  ] =
    useState('')

  const [
    emergencyClosing,
    setEmergencyClosing,
  ] =
    useState(false)

  const [
    emergencyError,
    setEmergencyError,
  ] =
    useState('')

  const loadShifts =
    useCallback(
      async () => {
        if (
          !businessId ||
          !branchId
        ) {
          setShifts([])
          setLoading(false)

          return
        }

        try {
          setLoading(true)
          setError('')

          const data =
            await getOpenShifts(
              businessId,
              branchId,
            )

          setShifts(
            data,
          )
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load open shifts.',
          )
        } finally {
          setLoading(false)
        }
      },
      [
        businessId,
        branchId,
      ],
    )

  useEffect(() => {
    void loadShifts()
  }, [
    loadShifts,
  ])

  const totalOpeningCash =
    useMemo(
      () =>
        shifts.reduce(
          (
            total,
            shift,
          ) =>
            total +
            shift.openingCash,
          0,
        ),
      [
        shifts,
      ],
    )

  const totalCashSales =
    useMemo(
      () =>
        shifts.reduce(
          (
            total,
            shift,
          ) =>
            total +
            shift.cashSales,
          0,
        ),
      [
        shifts,
      ],
    )

  const totalExpectedCash =
    useMemo(
      () =>
        shifts.reduce(
          (
            total,
            shift,
          ) =>
            total +
            shift.expectedCash,
          0,
        ),
      [
        shifts,
      ],
    )

  function openEmergencyModal(
    shift: OpenShiftItem,
  ) {
    setSelectedShift(
      shift,
    )

    setClosingCash(
      shift.expectedCash.toString(),
    )

    setEmergencyReason(
      '',
    )

    setEmergencyError(
      '',
    )
  }

  function closeEmergencyModal() {
    if (
      emergencyClosing
    ) {
      return
    }

    setSelectedShift(
      null,
    )

    setClosingCash(
      '',
    )

    setEmergencyReason(
      '',
    )

    setEmergencyError(
      '',
    )
  }

  async function handleEmergencyClose() {
    if (
      !selectedShift
    ) {
      return
    }

    if (
      !businessId ||
      !branchId ||
      !staff?.id
    ) {
      setEmergencyError(
        'Manager session information is incomplete.',
      )

      return
    }

    const actualCash =
      Number(
        closingCash,
      )

    if (
      !Number.isFinite(
        actualCash,
      ) ||
      actualCash < 0
    ) {
      setEmergencyError(
        'Enter a valid actual cash amount.',
      )

      return
    }

    const reason =
      emergencyReason.trim()

    if (!reason) {
      setEmergencyError(
        'Emergency close reason is required.',
      )

      return
    }

    try {
      setEmergencyClosing(
        true,
      )

      setEmergencyError(
        '',
      )

      await emergencyCloseShift({
        shiftId:
          selectedShift.id,

        businessId,

        branchId,

        managerStaffId:
          staff.id,

        closingCash:
          actualCash,

        reason,
      })

      closeEmergencyModal()

      await loadShifts()
    } catch (err) {
      setEmergencyError(
        err instanceof Error
          ? err.message
          : 'Unable to emergency close shift.',
      )
    } finally {
      setEmergencyClosing(
        false,
      )
    }
  }

  const previewDifference =
    selectedShift
      ? Number(
          closingCash ||
            '0',
        ) -
        selectedShift.expectedCash
      : 0

  return (
    <AppLayout>

      <div className="open-shifts-page">

        <section className="open-shifts-heading">

          <div>

            <h1>
              Open Shifts
            </h1>

            <p>
              Monitor currently active
              cashier shifts and expected
              drawer balances.
            </p>

          </div>

          <button
            type="button"
            className="open-shifts-refresh"
            onClick={() =>
              void loadShifts()
            }
            disabled={
              loading
            }
          >

            <RefreshCcw
              size={16}
              className={
                loading
                  ? 'open-shifts-spin'
                  : undefined
              }
            />

            Refresh

          </button>

        </section>

        {error && (
          <div className="open-shifts-error">
            {error}
          </div>
        )}

        <section className="open-shifts-summary">

          <article>

            <div className="open-shifts-summary-icon">
              <UserRound
                size={20}
              />
            </div>

            <div>

              <span>
                Active Shifts
              </span>

              <strong>
                {shifts.length}
              </strong>

            </div>

          </article>

          <article>

            <div className="open-shifts-summary-icon">
              <Banknote
                size={20}
              />
            </div>

            <div>

              <span>
                Opening Cash
              </span>

              <strong>
                {money(
                  totalOpeningCash,
                )}
              </strong>

            </div>

          </article>

          <article>

            <div className="open-shifts-summary-icon">
              <WalletCards
                size={20}
              />
            </div>

            <div>

              <span>
                Cash Sales
              </span>

              <strong>
                {money(
                  totalCashSales,
                )}
              </strong>

            </div>

          </article>

          <article>

            <div className="open-shifts-summary-icon">
              <Banknote
                size={20}
              />
            </div>

            <div>

              <span>
                Expected Cash
              </span>

              <strong>
                {money(
                  totalExpectedCash,
                )}
              </strong>

            </div>

          </article>

        </section>

        <section className="open-shifts-panel">

          <div className="open-shifts-panel-heading">

            <div>

              <h2>
                Active Cashier Shifts
              </h2>

              <p>
                Live drawer overview for
                the current branch.
              </p>

            </div>

            <span className="open-shifts-count">

              {shifts.length}{' '}

              {shifts.length ===
              1
                ? 'shift'
                : 'shifts'}

            </span>

          </div>

          <div className="open-shifts-table-wrap">

            <table className="open-shifts-table">

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
                    Duration
                  </th>

                  <th>
                    Opening
                  </th>

                  <th>
                    Cash Sales
                  </th>

                  <th>
                    Expected
                  </th>

                  <th>
                    Status
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
                      colSpan={9}
                      className="open-shifts-empty"
                    >

                      <Loader2
                        size={20}
                        className="open-shifts-spin"
                      />

                      Loading open shifts...

                    </td>

                  </tr>

                ) : shifts.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="open-shifts-empty"
                    >

                      No cashier shifts
                      are currently open.

                    </td>

                  </tr>

                ) : (

                  shifts.map(
                    (shift) => (

                      <tr
                        key={
                          shift.id
                        }
                      >

                        <td>

                          <div className="open-shift-cashier">

                            <div className="open-shift-avatar">

                              {shift.cashierName
                                .charAt(
                                  0,
                                )
                                .toUpperCase()}

                            </div>

                            <div>

                              <strong>
                                {
                                  shift.cashierName
                                }
                              </strong>

                              <small>
                                {
                                  shift.staffId.slice(
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
                            '—'}
                        </td>

                        <td>

                          <span className="open-shift-time">

                            <Clock3
                              size={14}
                            />

                            {formatDateTime(
                              shift.openedAt,
                            )}

                          </span>

                        </td>

                        <td>

                          <strong>
                            {shiftDuration(
                              shift.openedAt,
                            )}
                          </strong>

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

                          <strong>
                            {money(
                              shift.expectedCash,
                            )}
                          </strong>

                        </td>

                        <td>

                          <span className="open-shift-status">
                            Open
                          </span>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="open-shift-emergency-button"
                            onClick={() =>
                              openEmergencyModal(
                                shift,
                              )
                            }
                          >
                            <ShieldAlert
                              size={14}
                            />

                            Emergency Close
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

      </div>

      {selectedShift && (
        <div
          className="emergency-shift-backdrop"
          onMouseDown={
            closeEmergencyModal
          }
        >

          <section
            className="emergency-shift-modal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >

            <div className="emergency-shift-heading">

              <div className="emergency-shift-icon">

                <AlertTriangle
                  size={22}
                />

              </div>

              <div>

                <span>
                  Manager Action
                </span>

                <h2>
                  Emergency Close Shift
                </h2>

                <p>
                  {
                    selectedShift.cashierName
                  }{' '}
                  ·{' '}
                  {
                    selectedShift.terminalName ??
                    'No terminal'
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeEmergencyModal
                }
                disabled={
                  emergencyClosing
                }
                aria-label="Close emergency shift dialog"
              >
                <X
                  size={18}
                />
              </button>

            </div>

            <div className="emergency-shift-body">

              <div className="emergency-shift-warning">

                <AlertTriangle
                  size={17}
                />

                <p>
                  Use this only when the
                  cashier cannot close the
                  shift normally. This action
                  will be recorded as an
                  emergency close.
                </p>

              </div>

              <div className="emergency-shift-summary">

                <div>

                  <span>
                    Opening Cash
                  </span>

                  <strong>
                    {money(
                      selectedShift.openingCash,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Cash Sales
                  </span>

                  <strong>
                    {money(
                      selectedShift.cashSales,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Expected Cash
                  </span>

                  <strong>
                    {money(
                      selectedShift.expectedCash,
                    )}
                  </strong>

                </div>

              </div>

              <label className="emergency-shift-field">

                <span>
                  Actual Cash *
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    closingCash
                  }
                  onChange={(
                    event,
                  ) =>
                    setClosingCash(
                      event.target.value,
                    )
                  }
                  disabled={
                    emergencyClosing
                  }
                />

              </label>

              <div className="emergency-shift-difference">

                <span>
                  Difference
                </span>

                <strong
                  className={
                    previewDifference <
                    0
                      ? 'negative'
                      : previewDifference >
                          0
                        ? 'positive'
                        : ''
                  }
                >
                  {money(
                    previewDifference,
                  )}
                </strong>

              </div>

              <label className="emergency-shift-field">

                <span>
                  Emergency Reason *
                </span>

                <textarea
                  rows={4}
                  value={
                    emergencyReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setEmergencyReason(
                      event.target.value,
                    )
                  }
                  placeholder="Example: Cashier PC failed before shift could be closed."
                  disabled={
                    emergencyClosing
                  }
                />

              </label>

              {emergencyError && (
                <div className="emergency-shift-error">
                  {emergencyError}
                </div>
              )}

            </div>

            <div className="emergency-shift-actions">

              <button
                type="button"
                className="secondary"
                onClick={
                  closeEmergencyModal
                }
                disabled={
                  emergencyClosing
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={() =>
                  void handleEmergencyClose()
                }
                disabled={
                  emergencyClosing
                }
              >

                {emergencyClosing ? (
                  <Loader2
                    size={16}
                    className="open-shifts-spin"
                  />
                ) : (
                  <ShieldAlert
                    size={16}
                  />
                )}

                {emergencyClosing
                  ? 'Closing Shift...'
                  : 'Emergency Close Shift'}

              </button>

            </div>

          </section>

        </div>
      )}

    </AppLayout>
  )
}