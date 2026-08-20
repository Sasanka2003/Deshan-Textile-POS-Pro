import {
  useEffect,
  useState,
} from 'react'

import {
  AlertTriangle,
  Banknote,
  Boxes,
  CircleDollarSign,
  Clock3,
  HandCoins,
  Loader2,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Truck,
  UserRound,
  WalletCards,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import {
  getDashboardData,
  type DashboardData,
} from '../../services/dashboardService'

import {
  getShiftHistory,
  type ShiftHistoryItem,
} from '../../services/shiftService'

import '../../styles/dashboard.css'

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

export default function DashboardPage() {
  const {
    staff,
  } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const isManager =
    staff?.role ===
    'manager'

  const [
    dashboard,
    setDashboard,
  ] =
    useState<
      DashboardData | null
    >(null)

  const [
    openShifts,
    setOpenShifts,
  ] =
    useState<
      ShiftHistoryItem[]
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

  async function loadDashboard() {
    if (
      !businessId ||
      !branchId
    ) {
      setLoading(
        false,
      )

      return
    }

    try {
      setLoading(
        true,
      )

      setError('')

      const dashboardPromise =
        getDashboardData(
          businessId,
          branchId,
        )

      const shiftPromise =
        isManager
          ? getShiftHistory(
              businessId,
              branchId,
            )
          : Promise.resolve(
              [],
            )

      const [
        dashboardData,
        shiftData,
      ] =
        await Promise.all([
          dashboardPromise,
          shiftPromise,
        ])

      setDashboard(
        dashboardData,
      )

      setOpenShifts(
        shiftData.filter(
          (shift) =>
            shift.status ===
            'open',
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load dashboard.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [
    businessId,
    branchId,
    isManager,
  ])

  return (
    <AppLayout>
      <div className="dashboard-page">

        <section className="page-heading dashboard-heading">

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Overview of today's
              Deshan Textile operations.
            </p>

          </div>

          <div className="dashboard-heading-actions">

            <span className="business-day">
              Main Branch
            </span>

            <button
              type="button"
              className="dashboard-refresh-button"
              onClick={() =>
                void loadDashboard()
              }
              disabled={
                loading
              }
            >

              {loading ? (
                <Loader2
                  size={16}
                  className="dashboard-spin"
                />
              ) : (
                <RefreshCcw
                  size={16}
                />
              )}

              Refresh

            </button>

          </div>

        </section>

        {error && (
          <div className="dashboard-message error">
            {error}
          </div>
        )}

        {isManager && (
          <section className="dashboard-open-shifts">

            <div className="dashboard-open-shifts-heading">

              <div>

                <h2>
                  Open Shifts
                </h2>

                <p>
                  Cashier shifts currently
                  active in this branch.
                </p>

              </div>

              <span className="dashboard-open-shifts-count">
                {
                  openShifts.length
                }{' '}
                open
              </span>

            </div>

            {loading ? (

              <div className="dashboard-open-shifts-empty">

                <Loader2
                  size={18}
                  className="dashboard-spin"
                />

                Loading shifts...

              </div>

            ) : openShifts.length ===
            0 ? (

              <div className="dashboard-open-shifts-empty success">
                No cashier shifts are currently open.
              </div>

            ) : (

              <div className="dashboard-open-shifts-grid">

                {openShifts.map(
                  (shift) => (

                    <article
                      className="dashboard-open-shift-card"
                      key={
                        shift.id
                      }
                    >

                      <div className="dashboard-open-shift-top">

                        <div className="dashboard-open-shift-avatar">

                          <UserRound
                            size={18}
                          />

                        </div>

                        <div className="dashboard-open-shift-user">

                          <strong>
                            {
                              shift.cashierName
                            }
                          </strong>

                          <span>
                            {
                              shift.terminalName ??
                              'No terminal'
                            }
                          </span>

                        </div>

                        <span className="dashboard-open-shift-status">
                          Open
                        </span>

                      </div>

                      <div className="dashboard-open-shift-details">

                        <div>

                          <span>
                            Opened
                          </span>

                          <strong>

                            <Clock3
                              size={13}
                            />

                            {formatDateTime(
                              shift.openedAt,
                            )}

                          </strong>

                        </div>

                        <div>

                          <span>
                            Opening Cash
                          </span>

                          <strong>
                            {money(
                              shift.openingCash,
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            Cash Sales
                          </span>

                          <strong>
                            {money(
                              shift.cashSales,
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            Expected Cash
                          </span>

                          <strong>
                            {money(
                              shift.expectedCash ??
                                shift.openingCash,
                            )}
                          </strong>

                        </div>

                      </div>

                    </article>

                  ),
                )}

              </div>

            )}

          </section>
        )}

        <section className="dashboard-grid dashboard-primary-metrics">

          <article className="metric-card">

            <div className="metric-icon">
              <Banknote
                size={21}
              />
            </div>

            <div>

              <span>
                Today's Sales
              </span>

              <strong>
                {money(
                  dashboard
                    ?.todaySales ??
                    0,
                )}
              </strong>

              <small>
                Net sales today
              </small>

            </div>

          </article>

          <article className="metric-card">

            <div className="metric-icon">
              <TrendingUp
                size={21}
              />
            </div>

            <div>

              <span>
                Gross Profit
              </span>

              <strong>
                {money(
                  dashboard
                    ?.grossProfit ??
                    0,
                )}
              </strong>

              <small>
                After stock cost
              </small>

            </div>

          </article>

          <article className="metric-card">

            <div className="metric-icon">
              <CircleDollarSign
                size={21}
              />
            </div>

            <div>

              <span>
                Expenses
              </span>

              <strong>
                {money(
                  dashboard
                    ?.expenses ??
                    0,
                )}
              </strong>

              <small>
                Today
              </small>

            </div>

          </article>

          <article className="metric-card metric-card-highlight">

            <div className="metric-icon">
              <HandCoins
                size={21}
              />
            </div>

            <div>

              <span>
                Operating Profit
              </span>

              <strong>
                {money(
                  dashboard
                    ?.operatingProfit ??
                    0,
                )}
              </strong>

              <small>
                After expenses
              </small>

            </div>

          </article>

        </section>

        <section className="dashboard-grid dashboard-secondary-metrics">

          <article className="metric-card compact">

            <div className="metric-icon">
              <ReceiptText
                size={20}
              />
            </div>

            <div>

              <span>
                Transactions
              </span>

              <strong>
                {
                  dashboard
                    ?.transactions ??
                  0
                }
              </strong>

            </div>

          </article>

          <article className="metric-card compact">

            <div className="metric-icon">
              <ShoppingBag
                size={20}
              />
            </div>

            <div>

              <span>
                Products Sold
              </span>

              <strong>
                {
                  dashboard
                    ?.productsSold ??
                  0
                }
              </strong>

            </div>

          </article>

          <article className="metric-card compact">

            <div className="metric-icon">
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
                  dashboard
                    ?.returns ??
                    0,
                )}
              </strong>

              <small>
                {
                  dashboard
                    ?.returnCount ??
                  0
                }{' '}
                return(s)
              </small>

            </div>

          </article>

          <article className="metric-card compact">

            <div className="metric-icon">
              <Boxes
                size={20}
              />
            </div>

            <div>

              <span>
                Purchases
              </span>

              <strong>
                {money(
                  dashboard
                    ?.purchases ??
                    0,
                )}
              </strong>

            </div>

          </article>

        </section>

        <section
          className={`dashboard-finance-grid ${
            isManager
              ? ''
              : 'cashier'
          }`}
        >

          <article className="dashboard-finance-card">

            <div className="dashboard-finance-icon warning">

              <AlertTriangle
                size={21}
              />

            </div>

            <div>

              <span>
                Low Stock
              </span>

              <strong>
                {
                  dashboard
                    ?.lowStockCount ??
                  0
                }
              </strong>

              <small>
                Products at or below minimum
              </small>

            </div>

          </article>

          <article className="dashboard-finance-card">

            <div className="dashboard-finance-icon">

              <WalletCards
                size={21}
              />

            </div>

            <div>

              <span>
                Customer Outstanding
              </span>

              <strong>
                {money(
                  dashboard
                    ?.customerOutstanding ??
                    0,
                )}
              </strong>

              <small>
                Amount receivable
              </small>

            </div>

          </article>

          {isManager && (
            <article className="dashboard-finance-card">

              <div className="dashboard-finance-icon">

                <Truck
                  size={21}
                />

              </div>

              <div>

                <span>
                  Supplier Payables
                </span>

                <strong>
                  {money(
                    dashboard
                      ?.supplierPayables ??
                      0,
                  )}
                </strong>

                <small>
                  Amount payable
                </small>

              </div>

            </article>
          )}

        </section>

        <div className="dashboard-main-grid">

          <section className="dashboard-panel">

            <div className="dashboard-panel-heading">

              <div>

                <h2>
                  Today's Recent Sales
                </h2>

                <p>
                  Latest transactions
                  completed today.
                </p>

              </div>

              <ReceiptText
                size={19}
              />

            </div>

            {loading ? (

              <div className="dashboard-empty">

                <Loader2
                  size={20}
                  className="dashboard-spin"
                />

                Loading recent sales...

              </div>

            ) : !dashboard ||
              dashboard.recentSales
                .length === 0 ? (

              <div className="dashboard-empty">
                No sales recorded today.
              </div>

            ) : (

              <div className="dashboard-table-wrap">

                <table className="dashboard-table">

                  <thead>

                    <tr>

                      <th>
                        Invoice
                      </th>

                      <th>
                        Customer
                      </th>

                      <th>
                        Time
                      </th>

                      <th className="number">
                        Total
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {dashboard.recentSales.map(
                      (sale) => (

                        <tr
                          key={
                            sale.id
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
                            {
                              sale.customerName
                            }
                          </td>

                          <td>
                            {formatDateTime(
                              sale.createdAt,
                            )}
                          </td>

                          <td className="number">

                            <strong>
                              {money(
                                sale.total,
                              )}
                            </strong>

                          </td>

                          <td>

                            <span
                              className={`dashboard-status ${sale.status}`}
                            >
                              {labelText(
                                sale.status,
                              )}
                            </span>

                          </td>

                        </tr>

                      ),
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

          <section className="dashboard-panel">

            <div className="dashboard-panel-heading">

              <div>

                <h2>
                  Top Products
                </h2>

                <p>
                  Today's best sellers.
                </p>

              </div>

              <PackageSearch
                size={19}
              />

            </div>

            {loading ? (

              <div className="dashboard-empty">

                <Loader2
                  size={20}
                  className="dashboard-spin"
                />

                Loading products...

              </div>

            ) : !dashboard ||
              dashboard.topProducts
                .length === 0 ? (

              <div className="dashboard-empty">
                No product sales today.
              </div>

            ) : (

              <div className="dashboard-product-list">

                {dashboard.topProducts.map(
                  (
                    product,
                    index,
                  ) => (

                    <div
                      className="dashboard-product-row"
                      key={
                        product.productId
                      }
                    >

                      <div className="dashboard-product-rank">
                        {index + 1}
                      </div>

                      <div className="dashboard-product-info">

                        <strong>
                          {
                            product.productName
                          }
                        </strong>

                        <span>
                          {product.sku ??
                            product.barcode ??
                            'No code'}
                          {' · '}
                          {
                            product.quantitySold
                          }{' '}
                          sold
                        </span>

                      </div>

                      <strong className="dashboard-product-value">
                        {money(
                          product.netSales,
                        )}
                      </strong>

                    </div>

                  ),
                )}

              </div>

            )}

          </section>

        </div>

        <div className="dashboard-bottom-grid">

          <section className="dashboard-panel">

            <div className="dashboard-panel-heading">

              <div>

                <h2>
                  Low Stock Alerts
                </h2>

                <p>
                  Products requiring stock attention.
                </p>

              </div>

              <AlertTriangle
                size={19}
              />

            </div>

            {loading ? (

              <div className="dashboard-empty">
                Loading inventory...
              </div>

            ) : !dashboard ||
              dashboard.lowStockItems
                .length === 0 ? (

              <div className="dashboard-empty success">
                Stock levels are healthy.
              </div>

            ) : (

              <div className="dashboard-stock-list">

                {dashboard.lowStockItems.map(
                  (item) => (

                    <div
                      className="dashboard-stock-row"
                      key={
                        item.productId
                      }
                    >

                      <div>

                        <strong>
                          {
                            item.productName
                          }
                        </strong>

                        <span>
                          {item.sku ??
                            item.barcode ??
                            'No code'}
                        </span>

                      </div>

                      <div className="dashboard-stock-values">

                        <span>
                          Stock
                        </span>

                        <strong>
                          {
                            item.quantity
                          }{' '}
                          {
                            item.unit
                          }
                        </strong>

                        <small>
                          Min{' '}
                          {
                            item.minimumStockQty
                          }
                        </small>

                      </div>

                    </div>

                  ),
                )}

              </div>

            )}

          </section>

          <section className="dashboard-panel">

            <div className="dashboard-panel-heading">

              <div>

                <h2>
                  Today's Payments
                </h2>

                <p>
                  Collected by payment method.
                </p>

              </div>

              <WalletCards
                size={19}
              />

            </div>

            {loading ? (

              <div className="dashboard-empty">
                Loading payments...
              </div>

            ) : !dashboard ||
              dashboard.paymentMethods
                .length === 0 ? (

              <div className="dashboard-empty">
                No payments today.
              </div>

            ) : (

              <div className="dashboard-payment-list">

                {dashboard.paymentMethods.map(
                  (payment) => (

                    <div
                      className="dashboard-payment-row"
                      key={
                        payment.method
                      }
                    >

                      <div>

                        <strong>
                          {labelText(
                            payment.method,
                          )}
                        </strong>

                        <span>
                          {
                            payment.transactionCount
                          }{' '}
                          transaction(s)
                        </span>

                      </div>

                      <strong>
                        {money(
                          payment.amount,
                        )}
                      </strong>

                    </div>

                  ),
                )}

              </div>

            )}

          </section>

        </div>

      </div>
    </AppLayout>
  )
}