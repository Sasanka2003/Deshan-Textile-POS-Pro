import {
  useEffect,
  useState,
} from 'react'

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Printer,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  Search,
  ShoppingBag,
  UserRound,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import SaleReceiptModal from '../../components/sales/SaleReceiptModal'

import {
  getSaleInvoice,
  getSalesHistoryPage,
  type SalesHistoryStatus,
} from '../../services/salesHistoryService'

import {
  getBusinessSettings,
} from '../../services/settingsService'

import {
  printSaleReceipt,
} from '../../utils/printSaleReceipt'

import {
  directPrintSaleReceipt,
} from '../../services/directReceiptPrinter'

import type {
  SaleInvoiceDetail,
  SalesHistoryItem,
} from '../../types/salesHistory'

import '../../styles/sales-history.css'

type SaleTypeFilter =
  | 'all'
  | 'retail'
  | 'wholesale'

type PageSize =
  | 25
  | 50

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

function formatDate(
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

function labelText(
  value: string,
) {
  return value
    .replaceAll(
      '_',
      ' ',
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    )
}

export default function SalesHistoryPage() {
  const {
    staff,
  } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const [
    sales,
    setSales,
  ] =
    useState<
      SalesHistoryItem[]
    >([])

  const [
    selectedInvoice,
    setSelectedInvoice,
  ] =
    useState<
      SaleInvoiceDetail | null
    >(null)

  /*
   * =========================================================
   * FILTERS
   * =========================================================
   */

  const [
    searchInput,
    setSearchInput,
  ] =
    useState('')

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    saleType,
    setSaleType,
  ] =
    useState<SaleTypeFilter>(
      'all',
    )

  const [
    status,
    setStatus,
  ] =
    useState<SalesHistoryStatus>(
      'all',
    )

  const [
    startDate,
    setStartDate,
  ] =
    useState('')

  const [
    endDate,
    setEndDate,
  ] =
    useState('')

  /*
   * =========================================================
   * PAGINATION
   * =========================================================
   */

  const [
    page,
    setPage,
  ] =
    useState(1)

  const [
    pageSize,
    setPageSize,
  ] =
    useState<PageSize>(
      25,
    )

  const [
    totalCount,
    setTotalCount,
  ] =
    useState(0)

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(1)

  const [
    hasPreviousPage,
    setHasPreviousPage,
  ] =
    useState(false)

  const [
    hasNextPage,
    setHasNextPage,
  ] =
    useState(false)

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    invoiceLoadingId,
    setInvoiceLoadingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    printLoadingId,
    setPrintLoadingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    error,
    setError,
  ] =
    useState('')

  /*
   * =========================================================
   * LOAD SALES
   * =========================================================
   */

  async function loadSales() {
    if (!businessId) {
      setSales([])
      setTotalCount(0)
      setTotalPages(1)
      setHasPreviousPage(
        false,
      )
      setHasNextPage(
        false,
      )
      setLoading(false)

      return
    }

    try {
      setLoading(
        true,
      )

      setError('')

      const result =
        await getSalesHistoryPage({
          businessId,

          branchId:
            branchId ??
            undefined,

          search:
            search ||
            undefined,

          saleType,

          status,

          startDate:
            startDate ||
            undefined,

          endDate:
            endDate ||
            undefined,

          page,

          pageSize,
        })

      setSales(
        result.sales,
      )

      setTotalCount(
        result.totalCount,
      )

      setTotalPages(
        result.totalPages,
      )

      setHasPreviousPage(
        result.hasPreviousPage,
      )

      setHasNextPage(
        result.hasNextPage,
      )

      /*
       * If records were deleted while
       * viewing a later page.
       */
      if (
        page >
        result.totalPages
      ) {
        setPage(
          result.totalPages,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load sales history.',
      )

      setSales([])
    } finally {
      setLoading(
        false,
      )
    }
  }

  useEffect(() => {
    void loadSales()
  }, [
    businessId,
    branchId,
    search,
    saleType,
    status,
    startDate,
    endDate,
    page,
    pageSize,
  ])

  /*
   * =========================================================
   * SEARCH DEBOUNCE
   * =========================================================
   */

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          setPage(1)

          setSearch(
            searchInput.trim(),
          )
        },
        350,
      )

    return () => {
      window.clearTimeout(
        timeout,
      )
    }
  }, [
    searchInput,
  ])

  /*
   * =========================================================
   * CURRENT PAGE SUMMARY
   * =========================================================
   */

  const pageRevenue =
    sales.reduce(
      (
        total,
        sale,
      ) =>
        total +
        sale.total,
      0,
    )

  const pageOutstanding =
    sales.reduce(
      (
        total,
        sale,
      ) =>
        total +
        sale.balanceDue,
      0,
    )

  const pagePaid =
    sales.reduce(
      (
        total,
        sale,
      ) =>
        total +
        sale.paidAmount,
      0,
    )

  /*
   * =========================================================
   * FILTER ACTIONS
   * =========================================================
   */

  function handleSaleTypeChange(
    value: SaleTypeFilter,
  ) {
    setSaleType(
      value,
    )

    setPage(1)
  }

  function handleStatusChange(
    value: SalesHistoryStatus,
  ) {
    setStatus(
      value,
    )

    setPage(1)
  }

  function handleStartDateChange(
    value: string,
  ) {
    setStartDate(
      value,
    )

    setPage(1)
  }

  function handleEndDateChange(
    value: string,
  ) {
    setEndDate(
      value,
    )

    setPage(1)
  }

  function handlePageSizeChange(
    value: PageSize,
  ) {
    setPageSize(
      value,
    )

    setPage(1)
  }

  function resetFilters() {
    setSearchInput('')
    setSearch('')

    setSaleType(
      'all',
    )

    setStatus(
      'all',
    )

    setStartDate('')
    setEndDate('')

    setPage(1)
  }

  /*
   * =========================================================
   * INVOICE
   * =========================================================
   */

  async function openInvoice(
    saleId: string,
  ) {
    try {
      setInvoiceLoadingId(
        saleId,
      )

      setError('')

      const invoice =
        await getSaleInvoice(
          saleId,
        )

      setSelectedInvoice(
        invoice,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load invoice.',
      )
    } finally {
      setInvoiceLoadingId(
        null,
      )
    }
  }

  /*
   * =========================================================
   * DIRECT REPRINT
   * =========================================================
   */

  async function reprintInvoice(
    saleId: string,
  ) {
    if (!businessId) {
      setError(
        'Business information is unavailable.',
      )

      return
    }

    try {
      setPrintLoadingId(
        saleId,
      )

      setError('')

      const [
        invoice,
        settings,
      ] =
        await Promise.all([
          getSaleInvoice(
            saleId,
          ),

          getBusinessSettings(
            businessId,
            branchId ?? null,
          ),
        ])

      const printed =
        await directPrintSaleReceipt(
          invoice,
          settings,
        )

      if (!printed) {
        printSaleReceipt(
          invoice,
          settings,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reprint receipt.',
      )
    } finally {
      setPrintLoadingId(
        null,
      )
    }
  }

  function closeInvoice() {
    setSelectedInvoice(
      null,
    )
  }

  const firstVisibleRecord =
    totalCount === 0
      ? 0
      : (
          page -
          1
        ) *
          pageSize +
        1

  const lastVisibleRecord =
    totalCount === 0
      ? 0
      : Math.min(
          page *
            pageSize,
          totalCount,
        )

  const hasFilters =
    Boolean(
      search ||
        saleType !==
          'all' ||
        status !==
          'all' ||
        startDate ||
        endDate,
    )

  return (
    <AppLayout>
      <div className="sales-history-page">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="sales-history-heading">

          <div>

            <h1>
              Sales History
            </h1>

            <p>
              Review sales,
              invoices and payment
              information.
            </p>

          </div>

          <button
            type="button"
            className="sales-refresh-button"
            onClick={() =>
              void loadSales()
            }
            disabled={
              loading
            }
          >

            {loading ? (
              <Loader2
                size={17}
                className="spin"
              />
            ) : (
              <RefreshCcw
                size={17}
              />
            )}

            Refresh

          </button>

        </section>

        {error && (
          <div className="sales-history-error">
            {error}
          </div>
        )}

        {/* =================================================
            CURRENT RESULT SUMMARY
        ================================================= */}

        <section className="sales-summary-grid">

          <article>

            <div className="sales-summary-icon">

              <ShoppingBag
                size={20}
              />

            </div>

            <div>

              <span>
                Total Results
              </span>

              <strong>
                {
                  totalCount
                }
              </strong>

            </div>

          </article>

          <article>

            <div className="sales-summary-icon">

              <FileText
                size={20}
              />

            </div>

            <div>

              <span>
                Page Revenue
              </span>

              <strong>
                {money(
                  pageRevenue,
                )}
              </strong>

            </div>

          </article>

          <article>

            <div className="sales-summary-icon">

              <ReceiptText
                size={20}
              />

            </div>

            <div>

              <span>
                Page Paid
              </span>

              <strong>
                {money(
                  pagePaid,
                )}
              </strong>

            </div>

          </article>

          <article>

            <div className="sales-summary-icon warning">

              <ReceiptText
                size={20}
              />

            </div>

            <div>

              <span>
                Page Outstanding
              </span>

              <strong>
                {money(
                  pageOutstanding,
                )}
              </strong>

            </div>

          </article>

        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="sales-history-card">

          <div className="sales-history-filter-panel">

            <div className="sales-history-search">

              <Search
                size={18}
              />

              <input
                value={
                  searchInput
                }
                onChange={(event) =>
                  setSearchInput(
                    event.target
                      .value,
                  )
                }
                placeholder="Search invoice number..."
              />

            </div>

            <div className="sales-history-date-filter">

              <label>

                <span>
                  From
                </span>

                <input
                  type="date"
                  value={
                    startDate
                  }
                  max={
                    endDate ||
                    undefined
                  }
                  onChange={(event) =>
                    handleStartDateChange(
                      event.target
                        .value,
                    )
                  }
                />

              </label>

              <label>

                <span>
                  To
                </span>

                <input
                  type="date"
                  value={
                    endDate
                  }
                  min={
                    startDate ||
                    undefined
                  }
                  onChange={(event) =>
                    handleEndDateChange(
                      event.target
                        .value,
                    )
                  }
                />

              </label>

            </div>

            <label className="sales-history-status-filter">

              <span>
                Status
              </span>

              <select
                value={
                  status
                }
                onChange={(event) =>
                  handleStatusChange(
                    event.target
                      .value as
                      SalesHistoryStatus,
                  )
                }
              >

                <option value="all">
                  All Statuses
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="partially_paid">
                  Partially Paid
                </option>

                <option value="credit">
                  Credit
                </option>

                <option value="cancelled">
                  Cancelled
                </option>

              </select>

            </label>

            <button
              type="button"
              className="sales-history-reset-button"
              onClick={
                resetFilters
              }
              disabled={
                !hasFilters
              }
            >

              <RotateCcw
                size={16}
              />

              Reset

            </button>

          </div>

          <div className="sales-history-toolbar">

            <div className="sales-type-filter">

              <button
                type="button"
                className={
                  saleType ===
                  'all'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleSaleTypeChange(
                    'all',
                  )
                }
              >
                All
              </button>

              <button
                type="button"
                className={
                  saleType ===
                  'retail'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleSaleTypeChange(
                    'retail',
                  )
                }
              >
                Retail
              </button>

              <button
                type="button"
                className={
                  saleType ===
                  'wholesale'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleSaleTypeChange(
                    'wholesale',
                  )
                }
              >
                Wholesale
              </button>

            </div>

            <div className="sales-history-page-size">

              <span>
                Rows
              </span>

              <select
                value={
                  pageSize
                }
                onChange={(event) =>
                  handlePageSizeChange(
                    Number(
                      event.target
                        .value,
                    ) as PageSize,
                  )
                }
              >

                <option value={25}>
                  25
                </option>

                <option value={50}>
                  50
                </option>

              </select>

            </div>

          </div>

          {/* ===============================================
              TABLE
          =============================================== */}

          <div className="sales-history-table-wrap">

            <table className="sales-history-table">

              <thead>

                <tr>

                  <th>
                    Invoice
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Cashier
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Paid
                  </th>

                  <th>
                    Balance
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={10}
                      className="sales-history-empty"
                    >

                      <Loader2
                        size={20}
                        className="spin"
                      />

                      Loading sales...

                    </td>

                  </tr>

                ) : sales.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan={10}
                      className="sales-history-empty"
                    >
                      No sales found.
                    </td>

                  </tr>

                ) : (

                  sales.map(
                    (sale) => {
                      const isViewing =
                        invoiceLoadingId ===
                        sale.id

                      const isPrinting =
                        printLoadingId ===
                        sale.id

                      return (
                        <tr
                          key={
                            sale.id
                          }
                        >

                          <td>

                            <strong className="invoice-number">
                              {
                                sale.invoiceNo
                              }
                            </strong>

                          </td>

                          <td>
                            {formatDate(
                              sale.createdAt,
                            )}
                          </td>

                          <td>

                            <div className="sales-customer">

                              <UserRound
                                size={15}
                              />

                              <span>
                                {sale.customerName ??
                                  'Walk-in Customer'}
                              </span>

                            </div>

                          </td>

                          <td>

                            <span
                              className={`sale-type-badge ${sale.saleType}`}
                            >
                              {labelText(
                                sale.saleType,
                              )}
                            </span>

                          </td>

                          <td>
                            {sale.staffName ??
                              '—'}
                          </td>

                          <td>

                            <strong>
                              {money(
                                sale.total,
                              )}
                            </strong>

                          </td>

                          <td>
                            {money(
                              sale.paidAmount,
                            )}
                          </td>

                          <td>

                            <span
                              className={
                                sale.balanceDue >
                                0
                                  ? 'balance-due'
                                  : ''
                              }
                            >
                              {money(
                                sale.balanceDue,
                              )}
                            </span>

                          </td>

                          <td>

                            <span
                              className={`sale-status ${sale.status}`}
                            >
                              {labelText(
                                sale.status,
                              )}
                            </span>

                          </td>

                          <td>

                            <div className="sales-history-actions">

                              <button
                                className="view-sale-button"
                                type="button"
                                title="View invoice"
                                aria-label={`View ${sale.invoiceNo}`}
                                onClick={() =>
                                  void openInvoice(
                                    sale.id,
                                  )
                                }
                                disabled={
                                  isViewing ||
                                  isPrinting
                                }
                              >

                                {isViewing ? (
                                  <Loader2
                                    size={17}
                                    className="spin"
                                  />
                                ) : (
                                  <Eye
                                    size={17}
                                  />
                                )}

                              </button>

                              <button
                                className="reprint-sale-button"
                                type="button"
                                title="Reprint receipt"
                                aria-label={`Reprint ${sale.invoiceNo}`}
                                onClick={() =>
                                  void reprintInvoice(
                                    sale.id,
                                  )
                                }
                                disabled={
                                  isViewing ||
                                  isPrinting
                                }
                              >

                                {isPrinting ? (
                                  <Loader2
                                    size={17}
                                    className="spin"
                                  />
                                ) : (
                                  <Printer
                                    size={17}
                                  />
                                )}

                              </button>

                            </div>

                          </td>

                        </tr>
                      )
                    },
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* ===============================================
              PAGINATION
          =============================================== */}

          <div className="sales-history-pagination">

            <div className="sales-history-pagination-info">

              {totalCount ===
              0 ? (
                <span>
                  No records
                </span>
              ) : (
                <span>
                  Showing{' '}
                  <strong>
                    {
                      firstVisibleRecord
                    }
                  </strong>
                  {' – '}
                  <strong>
                    {
                      lastVisibleRecord
                    }
                  </strong>
                  {' of '}
                  <strong>
                    {
                      totalCount
                    }
                  </strong>
                  {' sales'}
                </span>
              )}

            </div>

            <div className="sales-history-pagination-controls">

              <button
                type="button"
                onClick={() =>
                  setPage(
                    (
                      current,
                    ) =>
                      Math.max(
                        1,
                        current -
                          1,
                      ),
                  )
                }
                disabled={
                  loading ||
                  !hasPreviousPage
                }
              >

                <ChevronLeft
                  size={16}
                />

                Previous

              </button>

              <span className="sales-history-page-indicator">
                Page{' '}
                <strong>
                  {page}
                </strong>
                {' of '}
                <strong>
                  {
                    totalPages
                  }
                </strong>
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage(
                    (
                      current,
                    ) =>
                      Math.min(
                        totalPages,
                        current +
                          1,
                      ),
                  )
                }
                disabled={
                  loading ||
                  !hasNextPage
                }
              >

                Next

                <ChevronRight
                  size={16}
                />

              </button>

            </div>

          </div>

        </section>

        {/* =================================================
            RECEIPT
        ================================================= */}

        {selectedInvoice && (

          <SaleReceiptModal
            invoice={
              selectedInvoice
            }
            onClose={
              closeInvoice
            }
            onPrintError={(
              message,
            ) =>
              setError(
                message,
              )
            }
          />

        )}

      </div>
    </AppLayout>
  )
}