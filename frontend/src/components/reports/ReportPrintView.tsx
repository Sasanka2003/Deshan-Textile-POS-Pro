import type {
  ReportData,
  ReportDateRange,
} from '../../types/report'

import type {
  BusinessCashSummary,
  ReceivablesPayablesSummary,
} from '../../services/reportService'

interface ReportPrintViewProps {
  data: ReportData
  range: ReportDateRange

  businessName?: string
  branchName?: string | null
  businessCashSummary?: BusinessCashSummary | null
  receivablesPayables?: ReceivablesPayablesSummary | null
}

function money(value: number) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function formatDate(value: string) {
  const date = new Date(
    `${value}T00:00:00`,
  )

  return date.toLocaleDateString(
    'en-LK',
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    },
  )
}

function formatDateTime(value: string) {
  return new Date(
    value,
  ).toLocaleString(
    'en-LK',
    {
      timeZone:
        'Asia/Colombo',

      year: 'numeric',
      month: 'short',
      day: '2-digit',

      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

export default function ReportPrintView({
  data,
  range,

  businessName = 'Deshan Textile',
  branchName,
  businessCashSummary,
  receivablesPayables,
}: ReportPrintViewProps) {
  const {
    summary,
    paymentMethods,
    topProducts,
    sales,
    expenses,
  } = data

  return (
    <div className="report-print-view">
      {/* HEADER */}

      <header className="report-print-header">
        <div>
          <h1>
            {businessName}
          </h1>

          {branchName && (
            <p>
              {branchName}
            </p>
          )}

          <h2>
            Business Performance Report
          </h2>
        </div>

        <div className="report-print-period">
          <span>
            Report Period
          </span>

          <strong>
            {formatDate(
              range.startDate,
            )}
            {' — '}
            {formatDate(
              range.endDate,
            )}
          </strong>
        </div>
      </header>

      {/* SUMMARY */}

      <section className="report-print-section">
        <h3>
          Financial Summary
        </h3>

        <div className="report-print-summary-grid">
          <div>
            <span>
              Gross Sales
            </span>

            <strong>
              {money(
                summary.grossSales,
              )}
            </strong>
          </div>

          <div>
            <span>
              Discounts
            </span>

            <strong>
              {money(
                summary.discounts,
              )}
            </strong>
          </div>

          <div>
            <span>
              Returns
            </span>

            <strong>
              {money(
                summary.returns,
              )}
            </strong>
          </div>

          <div>
            <span>
              Net Sales
            </span>

            <strong>
              {money(
                summary.netSales,
              )}
            </strong>
          </div>

          <div>
            <span>
              Cost of Goods Sold
            </span>

            <strong>
              {money(
                summary.costOfGoodsSold,
              )}
            </strong>
          </div>

          <div>
            <span>
              Gross Profit
            </span>

            <strong>
              {money(
                summary.grossProfit,
              )}
            </strong>
          </div>

          <div>
            <span>
              Expenses
            </span>

            <strong>
              {money(
                summary.expenses,
              )}
            </strong>
          </div>

          <div className="report-print-highlight">
            <span>
              Operating Profit
            </span>

            <strong>
              {money(
                summary.operatingProfit,
              )}
            </strong>
          </div>

          <div>
            <span>
              Purchases
            </span>

            <strong>
              {money(
                summary.purchases,
              )}
            </strong>
          </div>

          <div>
            <span>
              Sales Transactions
            </span>

            <strong>
              {
                summary.transactionCount
              }
            </strong>
          </div>
        </div>
      </section>

      {/* BUSINESS CASH SUMMARY */}

      {businessCashSummary && (
        <section className="report-print-section report-print-compact-section">
          <h3>
            Business Cash Summary
          </h3>

          <div className="report-print-summary-grid report-print-cash-grid">
            <div>
              <span>Cash Sale Payments</span>
              <strong>
                {money(
                  businessCashSummary.cashSalePayments,
                )}
              </strong>
            </div>

            <div>
              <span>Customer Cash Payments</span>
              <strong>
                {money(
                  businessCashSummary.customerCashPayments,
                )}
              </strong>
            </div>

            <div>
              <span>Credit Created</span>
              <strong>
                {money(
                  businessCashSummary.creditCreated,
                )}
              </strong>
            </div>

            <div>
              <span>Cash Refunds</span>
              <strong>
                {money(
                  businessCashSummary.cashRefunds,
                )}
              </strong>
              <small>
                Total refunds{' '}
                {money(
                  businessCashSummary.refunds,
                )}
              </small>
            </div>

            <div>
              <span>Cash In</span>
              <strong>
                {money(
                  businessCashSummary.cashIn,
                )}
              </strong>
            </div>

            <div>
              <span>Cash Out</span>
              <strong>
                {money(
                  businessCashSummary.cashOut,
                )}
              </strong>
            </div>

            <div>
              <span>Closed Shift Expected</span>
              <strong>
                {money(
                  businessCashSummary.shiftExpectedCash,
                )}
              </strong>
              <small>
                {
                  businessCashSummary.closedShiftCount
                }{' '}
                closed shift(s)
              </small>
            </div>

            <div className="report-print-highlight">
              <span>Shift Cash Difference</span>
              <strong>
                {money(
                  businessCashSummary.shiftDifference,
                )}
              </strong>
              <small>
                {
                  businessCashSummary.emergencyCloseCount
                }{' '}
                emergency close(s)
              </small>
            </div>
          </div>
        </section>
      )}

      {/* RECEIVABLES & PAYABLES */}

      {receivablesPayables && (
        <section className="report-print-section report-print-credit-section">
          <div className="report-print-section-title">
            <h3>
              Receivables &amp; Payables
            </h3>

            <p>
              Current business-level balances. These values are
              not limited by the selected report date range.
            </p>
          </div>

          <div className="report-print-summary-grid report-print-credit-grid">
            <div>
              <span>Customer Receivables</span>
              <strong>
                {money(
                  receivablesPayables.customerReceivables,
                )}
              </strong>
              <small>
                {
                  receivablesPayables.creditCustomerCount
                }{' '}
                customer(s)
              </small>
            </div>

            <div>
              <span>Supplier Payables</span>
              <strong>
                {money(
                  receivablesPayables.supplierPayables,
                )}
              </strong>
              <small>
                {
                  receivablesPayables.payableSupplierCount
                }{' '}
                supplier(s)
              </small>
            </div>

            <div className="report-print-highlight">
              <span>Net Credit Position</span>
              <strong>
                {money(
                  receivablesPayables.netCreditPosition,
                )}
              </strong>
              <small>
                Receivables minus payables
              </small>
            </div>
          </div>
        </section>
      )}

      {/* PAYMENT METHODS */}

      <section className="report-print-section">
        <h3>
          Payment Summary
        </h3>

        {paymentMethods.length ===
        0 ? (
          <p className="report-print-empty">
            No payments recorded.
          </p>
        ) : (
          <table className="report-print-table">
            <thead>
              <tr>
                <th>
                  Payment Method
                </th>

                <th>
                  Transactions
                </th>

                <th className="number">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {paymentMethods.map(
                (payment) => (
                  <tr
                    key={
                      payment.method
                    }
                  >
                    <td>
                      {
                        payment.method
                      }
                    </td>

                    <td>
                      {
                        payment.transactionCount
                      }
                    </td>

                    <td className="number">
                      {money(
                        payment.amount,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* TOP PRODUCTS */}

      <section className="report-print-section">
        <h3>
          Top Selling Products
        </h3>

        {topProducts.length ===
        0 ? (
          <p className="report-print-empty">
            No product sales found.
          </p>
        ) : (
          <table className="report-print-table">
            <thead>
              <tr>
                <th>
                  Product
                </th>

                <th>
                  SKU / Barcode
                </th>

                <th className="number">
                  Qty
                </th>

                <th className="number">
                  Net Sales
                </th>

                <th className="number">
                  COGS
                </th>

                <th className="number">
                  Profit
                </th>
              </tr>
            </thead>

            <tbody>
              {topProducts.map(
                (product) => (
                  <tr
                    key={
                      product.productId
                    }
                  >
                    <td>
                      {
                        product.productName
                      }
                    </td>

                    <td>
                      {product.sku ??
                        product.barcode ??
                        '—'}
                    </td>

                    <td className="number">
                      {
                        product.quantitySold
                      }
                    </td>

                    <td className="number">
                      {money(
                        product.netSales,
                      )}
                    </td>

                    <td className="number">
                      {money(
                        product.costOfGoodsSold,
                      )}
                    </td>

                    <td className="number">
                      {money(
                        product.grossProfit,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* SALES */}

      <section className="report-print-section report-print-page-break">
        <h3>
          Sales Report
        </h3>

        {sales.length === 0 ? (
          <p className="report-print-empty">
            No sales found.
          </p>
        ) : (
          <table className="report-print-table">
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

                <th className="number">
                  Total
                </th>

                <th className="number">
                  Paid
                </th>

                <th className="number">
                  Balance
                </th>
              </tr>
            </thead>

            <tbody>
              {sales.map(
                (sale) => (
                  <tr
                    key={
                      sale.saleId
                    }
                  >
                    <td>
                      {
                        sale.invoiceNo
                      }
                    </td>

                    <td>
                      {formatDateTime(
                        sale.date,
                      )}
                    </td>

                    <td>
                      {sale.customerName ??
                        'Walk-in Customer'}
                    </td>

                    <td className="number">
                      {money(
                        sale.total,
                      )}
                    </td>

                    <td className="number">
                      {money(
                        sale.paidAmount,
                      )}
                    </td>

                    <td className="number">
                      {money(
                        sale.balanceDue,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* EXPENSES */}

      <section className="report-print-section">
        <h3>
          Expense Report
        </h3>

        {expenses.length === 0 ? (
          <p className="report-print-empty">
            No expenses found.
          </p>
        ) : (
          <table className="report-print-table">
            <thead>
              <tr>
                <th>
                  Expense No.
                </th>

                <th>
                  Date
                </th>

                <th>
                  Category
                </th>

                <th>
                  Method
                </th>

                <th className="number">
                  Amount
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {expenses.map(
                (expense) => (
                  <tr
                    key={
                      expense.expenseId
                    }
                  >
                    <td>
                      {
                        expense.expenseNo
                      }
                    </td>

                    <td>
                      {
                        expense.date
                      }
                    </td>

                    <td>
                      {expense.categoryName ??
                        '—'}
                    </td>

                    <td>
                      {
                        expense.paymentMethod
                      }
                    </td>

                    <td className="number">
                      {money(
                        expense.amount,
                      )}
                    </td>

                    <td>
                      {
                        expense.status
                      }
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* FOOTER */}

      <footer className="report-print-footer">
        <div>
          Generated by Deshan Textile POS
        </div>

        <div>
          Generated:{' '}
          {new Date().toLocaleString(
            'en-LK',
            {
              timeZone:
                'Asia/Colombo',
            },
          )}
        </div>
      </footer>
    </div>
  )
}