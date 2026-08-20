import {
  Printer,
  X,
} from 'lucide-react'

import type {
  PurchaseDetail,
} from '../../types/purchase'

import type {
  BusinessSettings,
} from '../../types/settings'

import {
  printPurchaseReceipt,
} from '../../utils/printPurchaseReceipt'

import {
  directPrintPurchaseReceipt,
} from '../../services/directReceiptPrinter'

import deshanTextileLogo from '../../assets/deshan-textile-logo.png'

import '../../styles/purchase-receipt.css'

interface Props {
  purchase:
    PurchaseDetail

  settings:
    BusinessSettings | null

  onClose: () => void

  onPrintError?: (
    message: string,
  ) => void
}

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

export default function PurchaseReceiptModal({
  purchase,
  settings,
  onClose,
  onPrintError,
}: Props) {
  async function handlePrint() {
    try {
      const printed =
        await directPrintPurchaseReceipt(
          purchase,
          settings ?? null,
        )

      if (!printed) {
        printPurchaseReceipt(
          purchase,
          settings,
        )
      }
    } catch (err) {
      onPrintError?.(
        err instanceof Error
          ? err.message
          : 'Unable to print GRN.',
      )
    }
  }

  const businessName =
    settings?.businessName ||
    'Deshan Textile'

  const branchName =
    settings?.branchName ||
    ''

  const businessAddress =
    settings?.businessAddress ||
    ''

  const businessPhone =
    settings?.businessPhone ||
    settings?.branchPhone ||
    ''

  const showBusinessAddress =
    settings
      ? settings.showBusinessAddress
      : true

  const showBusinessPhone =
    settings
      ? settings.showBusinessPhone
      : true

  const terminalName =
    settings?.terminalName ||
    ''

  const receiptFooter =
    settings?.receiptFooter ||
    ''

  return (
    <div
      className="purchase-receipt-backdrop"
      onMouseDown={
        onClose
      }
    >
      <section
        className="purchase-receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`GRN ${purchase.grn_no}`}
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >

        <div className="purchase-receipt-heading">

          <div>

            <span>
              Goods Received Note
            </span>

            <h2>
              {purchase.grn_no}
            </h2>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close GRN"
          >
            <X
              size={18}
            />
          </button>

        </div>

        <div className="purchase-receipt-body">

          <div className="purchase-receipt-business">

            <img
              src={
                deshanTextileLogo
              }
              alt={
                businessName
              }
              className="purchase-receipt-logo"
            />

            <h3>
              {businessName}
            </h3>

            {branchName && (
              <p>
                {branchName}
              </p>
            )}

            {showBusinessAddress &&
              businessAddress && (
                <p>
                  {businessAddress}
                </p>
              )}

            {showBusinessPhone &&
              businessPhone && (
                <p>
                  Tel:{' '}
                  {businessPhone}
                </p>
              )}

            {terminalName && (
              <p>
                {terminalName}
              </p>
            )}

            <p>
              Goods Received Note
            </p>

          </div>

          <div className="purchase-receipt-meta">

            <div>

              <span>
                GRN No.
              </span>

              <strong>
                {purchase.grn_no}
              </strong>

            </div>

            <div>

              <span>
                Date
              </span>

              <strong>
                {formatDate(
                  purchase.received_at,
                )}
              </strong>

            </div>

            <div>

              <span>
                Supplier
              </span>

              <strong>
                {purchase.supplier?.name ??
                  'Unknown Supplier'}
              </strong>

            </div>

            <div>

              <span>
                Supplier Invoice
              </span>

              <strong>
                {purchase.supplier_invoice_no ??
                  '—'}
              </strong>

            </div>

            <div>

              <span>
                Received By
              </span>

              <strong>
                {purchase.staff?.full_name ??
                  '—'}
              </strong>

            </div>

            <div>

              <span>
                Payment Status
              </span>

              <strong>
                {labelText(
                  purchase.payment_status,
                )}
              </strong>

            </div>

          </div>

          <div className="purchase-receipt-section-title">

            <span>
              Items
            </span>

            <strong>
              Received Products
            </strong>

          </div>

          <div className="purchase-receipt-items-wrap">

            <table className="purchase-receipt-items">

              <thead>

                <tr>

                  <th>
                    Product
                  </th>

                  <th>
                    Unit
                  </th>

                  <th className="number">
                    Qty
                  </th>

                  <th className="number">
                    Cost
                  </th>

                  <th className="number">
                    Discount
                  </th>

                  <th className="number">
                    Total
                  </th>

                </tr>

              </thead>

              <tbody>

                {purchase.items.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="purchase-receipt-empty"
                    >
                      No GRN items found.
                    </td>

                  </tr>

                ) : (

                  purchase.items.map(
                    (item) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>

                          <strong>
                            {item.product_name}
                          </strong>

                          <small>
                            {item.sku ??
                              item.barcode ??
                              '—'}
                          </small>

                        </td>

                        <td>
                          {item.unit}
                        </td>

                        <td className="number">
                          {item.quantity}
                        </td>

                        <td className="number">
                          {money(
                            item.unit_cost,
                          )}
                        </td>

                        <td className="number">
                          {money(
                            item.line_discount,
                          )}
                        </td>

                        <td className="number">

                          <strong>
                            {money(
                              item.line_total,
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

          <div className="purchase-receipt-summary">

            <div>

              <span>
                Subtotal
              </span>

              <strong>
                {money(
                  purchase.subtotal,
                )}
              </strong>

            </div>

            <div>

              <span>
                Discount
              </span>

              <strong>
                -{money(
                  purchase.discount_amount,
                )}
              </strong>

            </div>

            <div className="main">

              <span>
                Total
              </span>

              <strong>
                {money(
                  purchase.total,
                )}
              </strong>

            </div>

            <div>

              <span>
                Paid
              </span>

              <strong>
                {money(
                  purchase.paid_amount,
                )}
              </strong>

            </div>

            <div
              className={
                purchase.balance_due >
                0
                  ? 'balance'
                  : ''
              }
            >

              <span>
                Supplier Credit
              </span>

              <strong>
                {money(
                  purchase.balance_due,
                )}
              </strong>

            </div>

          </div>

          {purchase.notes && (
            <div className="purchase-receipt-note">

              <strong>
                Notes
              </strong>

              <p>
                {purchase.notes}
              </p>

            </div>
          )}

          {receiptFooter && (
            <div className="purchase-receipt-note">

              <strong>
                Receipt Message
              </strong>

              <p>
                {receiptFooter}
              </p>

            </div>
          )}

        </div>

        <div className="purchase-receipt-actions">

          <button
            type="button"
            className="secondary"
            onClick={
              onClose
            }
          >
            Close
          </button>

          <button
            type="button"
            className="primary"
            onClick={
              handlePrint
            }
          >

            <Printer
              size={16}
            />

            Print GRN

          </button>

        </div>

      </section>
    </div>
  )
}