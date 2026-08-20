import {
  Printer,
  RotateCcw,
  X,
} from 'lucide-react'

import type {
  PurchaseReturnReceiptDetail,
} from '../../types/purchaseReturn'

import {
  printPurchaseReturnReceipt,
} from '../../utils/printPurchaseReturnReceipt'

import {
  directPrintPurchaseReturnReceipt,
} from '../../services/directReceiptPrinter'

import deshanTextileLogo from '../../assets/deshan-textile-logo.png'

import '../../styles/purchase-return-receipt.css'

interface Props {
  receipt:
    PurchaseReturnReceiptDetail

  onClose: () => void

  onPrintError?: (
    message: string,
  ) => void
}

function money(
  value: number,
) {
  return `Rs. ${Number(
    value ?? 0,
  ).toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

export default function PurchaseReturnReceiptModal({
  receipt,
  onClose,
  onPrintError,
}: Props) {
  async function handlePrint() {
    try {
      const printed =
        await directPrintPurchaseReturnReceipt(
          receipt,
        )

      if (!printed) {
        printPurchaseReturnReceipt(
          receipt,
        )
      }
    } catch (err) {
      onPrintError?.(
        err instanceof Error
          ? err.message
          : 'Unable to print purchase return receipt.',
      )
    }
  }

  return (
    <div
      className="purchase-return-receipt-backdrop"
      onMouseDown={
        onClose
      }
    >

      <section
        className="purchase-return-receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Purchase Return ${receipt.returnNo}`}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        <div className="purchase-return-receipt-heading">

          <div>

            <span>
              Purchase Return Note
            </span>

            <h2>
              {receipt.returnNo}
            </h2>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close receipt"
          >

            <X
              size={18}
            />

          </button>

        </div>

        <div className="purchase-return-receipt-body">

          <div className="purchase-return-receipt-business">

            <img
              src={
                deshanTextileLogo
              }
              alt={
                receipt.businessName
              }
              className="purchase-return-receipt-logo"
            />

            <h3>
              {receipt.businessName}
            </h3>

            {receipt.branchName && (
              <p>
                {receipt.branchName}
              </p>
            )}

            {receipt.branchAddress && (
              <p>
                {receipt.branchAddress}
              </p>
            )}

            {receipt.branchPhone && (
              <p>
                Tel:{' '}
                {receipt.branchPhone}
              </p>
            )}

            <div className="purchase-return-receipt-title">

              <RotateCcw
                size={15}
              />

              Purchase Return Note

            </div>

          </div>

          <div className="purchase-return-receipt-meta">

            <div>

              <span>
                PRN No.
              </span>

              <strong>
                {receipt.returnNo}
              </strong>

            </div>

            <div>

              <span>
                Original GRN
              </span>

              <strong>
                {receipt.grnNo}
              </strong>

            </div>

            <div>

              <span>
                Date
              </span>

              <strong>
                {formatDate(
                  receipt.createdAt,
                )}
              </strong>

            </div>

            <div>

              <span>
                Supplier
              </span>

              <strong>
                {receipt.supplierName}
              </strong>

            </div>

            <div>

              <span>
                Supplier Invoice
              </span>

              <strong>
                {receipt.supplierInvoiceNo ??
                  '—'}
              </strong>

            </div>

            <div>

              <span>
                Returned By
              </span>

              <strong>
                {receipt.staffName ??
                  '—'}
              </strong>

            </div>

            <div>

              <span>
                Status
              </span>

              <strong>
                {labelText(
                  receipt.status,
                )}
              </strong>

            </div>

          </div>

          <div className="purchase-return-receipt-section-title">

            <span>
              Items
            </span>

            <strong>
              Returned Products
            </strong>

          </div>

          <div className="purchase-return-receipt-items-wrap">

            <table className="purchase-return-receipt-items">

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
                    Refund
                  </th>

                </tr>

              </thead>

              <tbody>

                {receipt.items.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={6}
                      className="purchase-return-receipt-empty"
                    >
                      No return items found.
                    </td>

                  </tr>

                ) : (

                  receipt.items.map(
                    (item) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>

                          <strong>
                            {item.productName}
                          </strong>

                          <small>
                            {item.sku ??
                              item.barcode ??
                              '—'}
                          </small>

                        </td>

                        <td>
                          {item.unit ??
                            '—'}
                        </td>

                        <td className="number">
                          {item.quantity}
                        </td>

                        <td className="number">
                          {money(
                            item.unitCost,
                          )}
                        </td>

                        <td className="number">
                          {money(
                            item.lineDiscount,
                          )}
                        </td>

                        <td className="number">

                          <strong>
                            {money(
                              item.lineRefund,
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

          <div className="purchase-return-receipt-summary">

            <span>
              Total Supplier Credit
            </span>

            <strong>
              {money(
                receipt.refundAmount,
              )}
            </strong>

          </div>

          {receipt.reason && (
            <div className="purchase-return-receipt-note">

              <strong>
                Return Reason
              </strong>

              <p>
                {receipt.reason}
              </p>

            </div>
          )}

        </div>

        <div className="purchase-return-receipt-actions">

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

            Print PRN

          </button>

        </div>

      </section>

    </div>
  )
}