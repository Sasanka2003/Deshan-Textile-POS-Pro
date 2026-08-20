import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  createPortal,
} from 'react-dom'

import {
  Banknote,
  BarChart3,
  CircleDollarSign,
  CreditCard,
  FileSpreadsheet,
  Loader2,
  PackageSearch,
  Printer,
  RefreshCcw,
  RotateCcw,
  Search,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import ReportPrintView from '../../components/reports/ReportPrintView'

import {
  getBusinessCashSummary,
  getReceivablesPayablesSummary,
  getReportData,
  type BusinessCashSummary,
  type ReceivablesPayablesSummary,
} from '../../services/reportService'

import type {
  ReportData,
  ReportDatePreset,
} from '../../types/report'

import '../../styles/reports.css'
import '../../styles/report-print.css'

function money(value: number) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function todayDate() {
  return new Date()
    .toLocaleDateString(
      'en-CA',
      {
        timeZone:
          'Asia/Colombo',
      },
    )
}

function getPresetRange(
  preset: ReportDatePreset,
) {
  const today =
    new Date()

  const format = (
    date: Date,
  ) =>
    date.toLocaleDateString(
      'en-CA',
      {
        timeZone:
          'Asia/Colombo',
      },
    )

  if (
    preset ===
    'today'
  ) {
    const value =
      format(today)

    return {
      startDate: value,
      endDate: value,
    }
  }

  if (
    preset ===
    'this_week'
  ) {
    const current =
      new Date(today)

    const day =
      current.getDay()

    const diff =
      day === 0
        ? -6
        : 1 - day

    current.setDate(
      current.getDate() +
        diff,
    )

    return {
      startDate:
        format(current),

      endDate:
        format(today),
    }
  }

  if (
    preset ===
    'this_month'
  ) {
    const start =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      )

    return {
      startDate:
        format(start),

      endDate:
        format(today),
    }
  }

  return {
    startDate:
      todayDate(),

    endDate:
      todayDate(),
  }
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

export default function ReportsPage() {
  const { staff } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const initialRange =
    getPresetRange(
      'this_month',
    )

  const [
    preset,
    setPreset,
  ] =
    useState<ReportDatePreset>(
      'this_month',
    )

  const [
    startDate,
    setStartDate,
  ] =
    useState(
      initialRange.startDate,
    )

  const [
    endDate,
    setEndDate,
  ] =
    useState(
      initialRange.endDate,
    )

  const [
    report,
    setReport,
  ] =
    useState<
      ReportData | null
    >(null)

  const [
    businessCashSummary,
    setBusinessCashSummary,
  ] =
    useState<
      BusinessCashSummary | null
    >(null)

  const [
    receivablesPayables,
    setReceivablesPayables,
  ] =
    useState<
      ReceivablesPayablesSummary | null
    >(null)

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    exporting,
    setExporting,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  async function loadReport(
    selectedStartDate =
      startDate,

    selectedEndDate =
      endDate,
  ) {
    if (
      !businessId ||
      !branchId
    ) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const range = {
        startDate:
          selectedStartDate,

        endDate:
          selectedEndDate,
      }

      const [
        data,
        cashSummary,
        creditSummary,
      ] =
        await Promise.all([
          getReportData(
            businessId,
            branchId,
            range,
          ),

          getBusinessCashSummary(
            businessId,
            branchId,
            range,
          ),

          getReceivablesPayablesSummary(
            businessId,
          ),
        ])

      setReport(
        data,
      )

      setBusinessCashSummary(
        cashSummary,
      )

      setReceivablesPayables(
        creditSummary,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load reports.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [
    businessId,
    branchId,
  ])

  function applyPreset(
    nextPreset:
      ReportDatePreset,
  ) {
    setPreset(
      nextPreset,
    )

    if (
      nextPreset ===
      'custom'
    ) {
      return
    }

    const range =
      getPresetRange(
        nextPreset,
      )

    setStartDate(
      range.startDate,
    )

    setEndDate(
      range.endDate,
    )

    void loadReport(
      range.startDate,
      range.endDate,
    )
  }

  const filteredSales =
    useMemo(() => {
      if (!report) {
        return []
      }

      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return report.sales
      }

      return report.sales.filter(
        (sale) =>
          [
            sale.invoiceNo,
            sale.customerName,
            sale.staffName,
            sale.status,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(
                  value,
                )
                  .toLowerCase()
                  .includes(
                    query,
                  ),
            ),
      )
    }, [
      report,
      search,
    ])

  const maxDailyValue =
    useMemo(() => {
      if (!report) {
        return 1
      }

      return Math.max(
        1,

        ...report.daily.map(
          (point) =>
            Math.max(
              point.sales,
              point.expenses,
              point.returns,
            ),
        ),
      )
    }, [report])

  function handlePrintReport() {
    if (!report) {
      setError(
        'Load the report before printing.',
      )

      return
    }

    setError('')

    requestAnimationFrame(
      () => {
        window.print()
      },
    )
  }

  async function handleExportExcel() {
    if (!report) {
      setError(
        'Load the report before exporting.',
      )

      return
    }

    if (exporting) {
      return
    }

    try {
      setExporting(true)
      setError('')

      /*
       * IMPORTANT:
       * ExcelJS is loaded only when
       * Export Excel is clicked.
       */
      const {
        exportReportToExcel,
      } =
        await import(
          '../../services/reportExportService'
        )

      await exportReportToExcel(
        report,
        {
          startDate,
          endDate,
        },
        'Deshan Textile',
        businessCashSummary,
        receivablesPayables,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to export Excel report.',
      )
    } finally {
      setExporting(false)
    }
  }

  const summary =
    report?.summary

  return (
    <>
      <AppLayout>

        <div className="reports-page">

          <section className="reports-heading">

            <div>

              <h1>
                Reports
              </h1>

              <p>
                Sales, profit,
                returns, purchases
                and expense
                performance.
              </p>

            </div>

            <div className="reports-heading-actions">

              <button
                type="button"
                className="reports-print-button"
                onClick={() =>
                  void handleExportExcel()
                }
                disabled={
                  loading ||
                  exporting ||
                  !report
                }
              >

                {exporting ? (
                  <Loader2
                    size={17}
                    className="reports-spin"
                  />
                ) : (
                  <FileSpreadsheet
                    size={17}
                  />
                )}

                {exporting
                  ? 'Exporting...'
                  : 'Export Excel'}

              </button>

              <button
                type="button"
                className="reports-print-button"
                onClick={
                  handlePrintReport
                }
                disabled={
                  loading ||
                  !report
                }
              >
                <Printer
                  size={17}
                />

                Print Report
              </button>

              <button
                type="button"
                className="reports-refresh-button"
                onClick={() =>
                  void loadReport()
                }
                disabled={
                  loading
                }
              >

                {loading ? (
                  <Loader2
                    size={17}
                    className="reports-spin"
                  />
                ) : (
                  <RefreshCcw
                    size={17}
                  />
                )}

                Refresh

              </button>

            </div>

          </section>

          {error && (
            <div className="reports-message error">
              {error}
            </div>
          )}

          <section className="reports-filter-card">

            <div className="reports-presets">

              <button
                type="button"
                className={
                  preset ===
                  'today'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  applyPreset(
                    'today',
                  )
                }
              >
                Today
              </button>

              <button
                type="button"
                className={
                  preset ===
                  'this_week'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  applyPreset(
                    'this_week',
                  )
                }
              >
                This Week
              </button>

              <button
                type="button"
                className={
                  preset ===
                  'this_month'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  applyPreset(
                    'this_month',
                  )
                }
              >
                This Month
              </button>

              <button
                type="button"
                className={
                  preset ===
                  'custom'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setPreset(
                    'custom',
                  )
                }
              >
                Custom
              </button>

            </div>

            <div className="reports-date-range">

              <label>
                From

                <input
                  type="date"
                  value={
                    startDate
                  }
                  onChange={(
                    event,
                  ) => {
                    setPreset(
                      'custom',
                    )

                    setStartDate(
                      event
                        .target
                        .value,
                    )
                  }}
                />
              </label>

              <label>
                To

                <input
                  type="date"
                  value={
                    endDate
                  }
                  onChange={(
                    event,
                  ) => {
                    setPreset(
                      'custom',
                    )

                    setEndDate(
                      event
                        .target
                        .value,
                    )
                  }}
                />
              </label>

              <button
                type="button"
                className="reports-apply-button"
                onClick={() =>
                  void loadReport()
                }
                disabled={
                  loading
                }
              >
                Apply
              </button>

            </div>

          </section>

          <section className="reports-summary-grid">

            <article>

              <div className="reports-summary-icon">
                <ShoppingBag
                  size={20}
                />
              </div>

              <div>

                <span>
                  Net Sales
                </span>

                <strong>
                  {money(
                    summary
                      ?.netSales ??
                      0,
                  )}
                </strong>

                <small>
                  Gross{' '}
                  {money(
                    summary
                      ?.grossSales ??
                      0,
                  )}
                </small>

              </div>

            </article>

            <article>

              <div className="reports-summary-icon">
                <TrendingUp
                  size={20}
                />
              </div>

              <div>

                <span>
                  Gross Profit
                </span>

                <strong>
                  {money(
                    summary
                      ?.grossProfit ??
                      0,
                  )}
                </strong>

                <small>
                  COGS{' '}
                  {money(
                    summary
                      ?.costOfGoodsSold ??
                      0,
                  )}
                </small>

              </div>

            </article>

            <article>

              <div className="reports-summary-icon">
                <CircleDollarSign
                  size={20}
                />
              </div>

              <div>

                <span>
                  Expenses
                </span>

                <strong>
                  {money(
                    summary
                      ?.expenses ??
                      0,
                  )}
                </strong>

                <small>
                  Operating expenses
                </small>

              </div>

            </article>

            <article>

              <div className="reports-summary-icon highlight">
                <Banknote
                  size={20}
                />
              </div>

              <div>

                <span>
                  Operating Profit
                </span>

                <strong>
                  {money(
                    summary
                      ?.operatingProfit ??
                      0,
                  )}
                </strong>

                <small>
                  After expenses
                </small>

              </div>

            </article>

            <article>

              <div className="reports-summary-icon">
                <RotateCcw
                  size={20}
                />
              </div>

              <div>

                <span>
                  Returns
                </span>

                <strong>
                  {money(
                    summary
                      ?.returns ??
                      0,
                  )}
                </strong>

                <small>
                  {
                    summary
                      ?.returnedTransactionCount ??
                    0
                  }{' '}
                  return(s)
                </small>

              </div>

            </article>

            <article>

              <div className="reports-summary-icon">
                <PackageSearch
                  size={20}
                />
              </div>

              <div>

                <span>
                  Purchases
                </span>

                <strong>
                  {money(
                    summary
                      ?.purchases ??
                      0,
                  )}
                </strong>

                <small>
                  Stock purchases
                </small>

              </div>

            </article>

          </section>

          <section className="reports-top-products-card">

            <div className="reports-card-heading">

              <div>

                <h2>
                  Business Cash Summary
                </h2>

                <p>
                  Sale collections, customer
                  payments, credit, refunds and
                  closed-shift reconciliation.
                </p>

              </div>

              <Banknote
                size={19}
              />

            </div>

            <section className="reports-summary-grid">

              <article>

                <div className="reports-summary-icon">
                  <Banknote
                    size={20}
                  />
                </div>

                <div>

                  <span>
                    Cash Sale Payments
                  </span>

                  <strong>
                    {money(
                      businessCashSummary
                        ?.cashSalePayments ??
                        0,
                    )}
                  </strong>

                  <small>
                    Cash collected from sales
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon">
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
                      businessCashSummary
                        ?.customerCashPayments ??
                        0,
                    )}
                  </strong>

                  <small>
                    Credit account collections
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon">
                  <CircleDollarSign
                    size={20}
                  />
                </div>

                <div>

                  <span>
                    Credit Created
                  </span>

                  <strong>
                    {money(
                      businessCashSummary
                        ?.creditCreated ??
                        0,
                    )}
                  </strong>

                  <small>
                    New outstanding from period sales
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon">
                  <RotateCcw
                    size={20}
                  />
                </div>

                <div>

                  <span>
                    Cash Refunds
                  </span>

                  <strong>
                    {money(
                      businessCashSummary
                        ?.cashRefunds ??
                        0,
                    )}
                  </strong>

                  <small>
                    Total refunds{' '}
                    {money(
                      businessCashSummary
                        ?.refunds ??
                        0,
                    )}
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon">
                  <Banknote
                    size={20}
                  />
                </div>

                <div>

                  <span>
                    Cash In
                  </span>

                  <strong>
                    {money(
                      businessCashSummary
                        ?.cashIn ??
                        0,
                    )}
                  </strong>

                  <small>
                    Drawer cash-in movements
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon">
                  <Banknote
                    size={20}
                  />
                </div>

                <div>

                  <span>
                    Cash Out
                  </span>

                  <strong>
                    {money(
                      businessCashSummary
                        ?.cashOut ??
                        0,
                    )}
                  </strong>

                  <small>
                    Refunds and drawer cash-out
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon">
                  <Banknote
                    size={20}
                  />
                </div>

                <div>

                  <span>
                    Closed Shift Expected
                  </span>

                  <strong>
                    {money(
                      businessCashSummary
                        ?.shiftExpectedCash ??
                        0,
                    )}
                  </strong>

                  <small>
                    {
                      businessCashSummary
                        ?.closedShiftCount ??
                      0
                    }{' '}
                    closed shift(s)
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon highlight">
                  <TrendingUp
                    size={20}
                  />
                </div>

                <div>

                  <span>
                    Shift Cash Difference
                  </span>

                  <strong>
                    {money(
                      businessCashSummary
                        ?.shiftDifference ??
                        0,
                    )}
                  </strong>

                  <small>
                    {
                      businessCashSummary
                        ?.emergencyCloseCount ??
                      0
                    }{' '}
                    emergency close(s)
                  </small>

                </div>

              </article>

            </section>

          </section>

          <section className="reports-top-products-card">

            <div className="reports-card-heading">

              <div>

                <h2>
                  Receivables & Payables
                </h2>

                <p>
                  Current business-level customer
                  receivables and supplier liabilities.
                  These balances are not limited by
                  the selected report date range.
                </p>

              </div>

              <WalletCards
                size={19}
              />

            </div>

            <section className="reports-summary-grid">

              <article>

                <div className="reports-summary-icon">

                  <CircleDollarSign
                    size={20}
                  />

                </div>

                <div>

                  <span>
                    Customer Receivables
                  </span>

                  <strong>
                    {money(
                      receivablesPayables
                        ?.customerReceivables ??
                        0,
                    )}
                  </strong>

                  <small>
                    {
                      receivablesPayables
                        ?.creditCustomerCount ??
                      0
                    }{' '}
                    customer(s) with outstanding balance
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon">

                  <ShoppingBag
                    size={20}
                  />

                </div>

                <div>

                  <span>
                    Supplier Payables
                  </span>

                  <strong>
                    {money(
                      receivablesPayables
                        ?.supplierPayables ??
                        0,
                    )}
                  </strong>

                  <small>
                    {
                      receivablesPayables
                        ?.payableSupplierCount ??
                      0
                    }{' '}
                    supplier(s) with outstanding balance
                  </small>

                </div>

              </article>

              <article>

                <div className="reports-summary-icon highlight">

                  <TrendingUp
                    size={20}
                  />

                </div>

                <div>

                  <span>
                    Net Credit Position
                  </span>

                  <strong>
                    {money(
                      receivablesPayables
                        ?.netCreditPosition ??
                        0,
                    )}
                  </strong>

                  <small>
                    Receivables minus payables
                  </small>

                </div>

              </article>

            </section>

          </section>

          <div className="reports-primary-grid">

            <section className="reports-chart-card">

              <div className="reports-card-heading">

                <div>

                  <h2>
                    Daily Performance
                  </h2>

                  <p>
                    Sales, returns and
                    operating expenses.
                  </p>

                </div>

                <BarChart3
                  size={19}
                />

              </div>

              <div className="reports-chart">

                {loading ? (

                  <div className="reports-empty">
                    Loading chart...
                  </div>

                ) : !report ||
                  report.daily
                    .length ===
                    0 ? (

                  <div className="reports-empty">
                    No daily data.
                  </div>

                ) : (

                  report.daily.map(
                    (point) => (

                      <div
                        className="reports-chart-column"
                        key={
                          point.date
                        }
                      >

                        <div className="reports-chart-bars">

                          <div
                            className="reports-bar sales"
                            style={{
                              height:
                                `${Math.max(
                                  2,

                                  (point.sales /
                                    maxDailyValue) *
                                    100,
                                )}%`,
                            }}
                            title={`Sales ${money(
                              point.sales,
                            )}`}
                          />

                          <div
                            className="reports-bar returns"
                            style={{
                              height:
                                `${Math.max(
                                  point.returns >
                                    0
                                    ? 2
                                    : 0,

                                  (point.returns /
                                    maxDailyValue) *
                                    100,
                                )}%`,
                            }}
                            title={`Returns ${money(
                              point.returns,
                            )}`}
                          />

                          <div
                            className="reports-bar expenses"
                            style={{
                              height:
                                `${Math.max(
                                  point.expenses >
                                    0
                                    ? 2
                                    : 0,

                                  (point.expenses /
                                    maxDailyValue) *
                                    100,
                                )}%`,
                            }}
                            title={`Expenses ${money(
                              point.expenses,
                            )}`}
                          />

                        </div>

                        <small>
                          {
                            point.date
                              .slice(5)
                          }
                        </small>

                      </div>

                    ),
                  )

                )}

              </div>

              <div className="reports-chart-legend">

                <span>
                  <i className="sales" />
                  Sales
                </span>

                <span>
                  <i className="returns" />
                  Returns
                </span>

                <span>
                  <i className="expenses" />
                  Expenses
                </span>

              </div>

            </section>

            <section className="reports-payment-card">

              <div className="reports-card-heading">

                <div>

                  <h2>
                    Payment Methods
                  </h2>

                  <p>
                    Collected payments
                    in selected period.
                  </p>

                </div>

                <CreditCard
                  size={19}
                />

              </div>

              <div className="reports-payment-list">

                {loading ? (

                  <div className="reports-empty">
                    Loading payments...
                  </div>

                ) : !report ||
                  report
                    .paymentMethods
                    .length ===
                    0 ? (

                  <div className="reports-empty">
                    No payments found.
                  </div>

                ) : (

                  report
                    .paymentMethods
                    .map(
                      (item) => (

                        <div
                          className="reports-payment-row"
                          key={
                            item.method
                          }
                        >

                          <div>

                            <WalletCards
                              size={17}
                            />

                            <span>
                              {labelText(
                                item.method,
                              )}
                            </span>

                          </div>

                          <div>

                            <strong>
                              {money(
                                item.amount,
                              )}
                            </strong>

                            <small>
                              {
                                item
                                  .transactionCount
                              }{' '}
                              transaction(s)
                            </small>

                          </div>

                        </div>

                      ),
                    )

                )}

              </div>

            </section>

          </div>

          <section className="reports-top-products-card">

            <div className="reports-card-heading">

              <div>

                <h2>
                  Top Selling Products
                </h2>

                <p>
                  Ranked by net sales.
                </p>

              </div>

              <PackageSearch
                size={19}
              />

            </div>

            <div className="reports-table-wrap">

              <table className="reports-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      SKU / Barcode
                    </th>

                    <th>
                      Qty Sold
                    </th>

                    <th>
                      Gross
                    </th>

                    <th>
                      Discount
                    </th>

                    <th>
                      Net Sales
                    </th>

                    <th>
                      COGS
                    </th>

                    <th>
                      Profit
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>

                      <td
                        colSpan={8}
                        className="reports-empty"
                      >
                        Loading products...
                      </td>

                    </tr>

                  ) : !report ||
                    report
                      .topProducts
                      .length ===
                      0 ? (

                    <tr>

                      <td
                        colSpan={8}
                        className="reports-empty"
                      >
                        No product sales.
                      </td>

                    </tr>

                  ) : (

                    report
                      .topProducts
                      .map(
                        (product) => (

                          <tr
                            key={
                              product
                                .productId
                            }
                          >

                            <td>

                              <strong>
                                {
                                  product
                                    .productName
                                }
                              </strong>

                            </td>

                            <td>
                              {product.sku ??
                                product.barcode ??
                                '—'}
                            </td>

                            <td>
                              {
                                product
                                  .quantitySold
                              }
                            </td>

                            <td>
                              {money(
                                product
                                  .grossSales,
                              )}
                            </td>

                            <td>
                              {money(
                                product
                                  .discountAmount,
                              )}
                            </td>

                            <td>

                              <strong>
                                {money(
                                  product
                                    .netSales,
                                )}
                              </strong>

                            </td>

                            <td>
                              {money(
                                product
                                  .costOfGoodsSold,
                              )}
                            </td>

                            <td>

                              <strong>
                                {money(
                                  product
                                    .grossProfit,
                                )}
                              </strong>

                            </td>

                          </tr>

                        ),
                      )

                  )}

                </tbody>

              </table>

            </div>

          </section>

          <section className="reports-sales-card">

            <div className="reports-history-heading">

              <div>

                <h2>
                  Sales Report
                </h2>

                <p>
                  {
                    summary
                      ?.transactionCount ??
                    0
                  }{' '}
                  transaction(s)
                </p>

              </div>

              <div className="reports-search">

                <Search
                  size={16}
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Search invoice, customer..."
                />

              </div>

            </div>

            <div className="reports-table-wrap">

              <table className="reports-table">

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
                      Staff
                    </th>

                    <th>
                      Subtotal
                    </th>

                    <th>
                      Discount
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

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>

                      <td
                        colSpan={10}
                        className="reports-empty"
                      >
                        Loading sales...
                      </td>

                    </tr>

                  ) : filteredSales
                      .length ===
                    0 ? (

                    <tr>

                      <td
                        colSpan={10}
                        className="reports-empty"
                      >
                        No sales found.
                      </td>

                    </tr>

                  ) : (

                    filteredSales.map(
                      (sale) => (

                        <tr
                          key={
                            sale.saleId
                          }
                        >

                          <td>

                            <strong>
                              {
                                sale.invoiceNo
                              }
                            </strong>

                          </td>

                          <td>
                            {new Date(
                              sale.date,
                            ).toLocaleString(
                              'en-LK',
                              {
                                timeZone:
                                  'Asia/Colombo',
                              },
                            )}
                          </td>

                          <td>
                            {sale.customerName ??
                              'Walk-in Customer'}
                          </td>

                          <td>
                            {sale.staffName ??
                              '—'}
                          </td>

                          <td>
                            {money(
                              sale.subtotal,
                            )}
                          </td>

                          <td>
                            {money(
                              sale.discountAmount,
                            )}
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
                            {money(
                              sale.balanceDue,
                            )}
                          </td>

                          <td>

                            <span
                              className={`reports-status ${sale.status}`}
                            >
                              {
                                sale.status
                              }
                            </span>

                          </td>

                        </tr>

                      ),
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>

          <section className="reports-expense-card">

            <div className="reports-card-heading">

              <div>

                <h2>
                  Expense Summary
                </h2>

                <p>
                  Expenses during
                  selected period.
                </p>

              </div>

              <CircleDollarSign
                size={19}
              />

            </div>

            <div className="reports-table-wrap">

              <table className="reports-table">

                <thead>

                  <tr>

                    <th>
                      Expense
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Description
                    </th>

                    <th>
                      Method
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Staff
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>

                      <td
                        colSpan={8}
                        className="reports-empty"
                      >
                        Loading expenses...
                      </td>

                    </tr>

                  ) : !report ||
                    report.expenses
                      .length ===
                      0 ? (

                    <tr>

                      <td
                        colSpan={8}
                        className="reports-empty"
                      >
                        No expenses found.
                      </td>

                    </tr>

                  ) : (

                    report.expenses.map(
                      (expense) => (

                        <tr
                          key={
                            expense
                              .expenseId
                          }
                        >

                          <td>

                            <strong>
                              {
                                expense
                                  .expenseNo
                              }
                            </strong>

                          </td>

                          <td>
                            {
                              expense.date
                            }
                          </td>

                          <td>
                            {expense.categoryName ??
                              'Uncategorized'}
                          </td>

                          <td>
                            {expense.description ??
                              '—'}
                          </td>

                          <td>
                            {labelText(
                              expense
                                .paymentMethod,
                            )}
                          </td>

                          <td>

                            <strong>
                              {money(
                                expense.amount,
                              )}
                            </strong>

                          </td>

                          <td>
                            {expense.staffName ??
                              '—'}
                          </td>

                          <td>

                            <span
                              className={`reports-status ${expense.status}`}
                            >
                              {
                                expense.status
                              }
                            </span>

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

      </AppLayout>

      {report &&
        createPortal(
          <div className="reports-print-portal">

            <ReportPrintView
              data={
                report
              }
              range={{
                startDate,
                endDate,
              }}
              businessName="Deshan Textile"
              businessCashSummary={
                businessCashSummary
              }
              receivablesPayables={
                receivablesPayables
              }
            />

          </div>,

          document.body,
        )}

    </>
  )
}