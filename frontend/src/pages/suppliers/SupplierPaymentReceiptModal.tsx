import {
  Printer,
  X,
} from 'lucide-react'

import type {
  SupplierPaymentReceipt,
} from '../../types/supplierPayment'

import type {
  BusinessSettings,
} from '../../types/settings'

import {
  printSupplierPaymentReceipt,
} from '../../utils/printSupplierPaymentReceipt'

import {
  directPrintSupplierPaymentReceipt,
} from '../../services/directReceiptPrinter'

import deshanTextileLogo from '../../assets/deshan-textile-logo.png'

import '../../styles/supplier-payment-receipt.css'

interface Props {
  receipt:
    SupplierPaymentReceipt

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

export default function SupplierPaymentReceiptModal({
  receipt,
  settings,
  onClose,
  onPrintError,
}: Props) {
  async function handlePrint() {
    try {
      const printed =
        await directPrintSupplierPaymentReceipt(
          receipt,
          settings ?? null,
        )

      if (!printed) {
        printSupplierPaymentReceipt(
          receipt,
          settings,
        )
      }
    } catch (err) {
      onPrintError?.(
        err instanceof Error
          ? err.message
          : 'Unable to print supplier payment receipt.',
      )
    }
  }

  const businessName =
    settings?.businessName ||
    receipt.business?.name ||
    'Deshan Textile'

  const branchName =
    settings?.branchName ||
    receipt.branch?.name ||
    ''

  const businessAddress =
    settings?.businessAddress ||
    receipt.branch?.address ||
    ''

  const businessPhone =
    settings?.businessPhone ||
    settings?.branchPhone ||
    receipt.branch?.phone ||
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
      className="supplier-payment-receipt-backdrop"
      onMouseDown={
        onClose
      }
    >
      <section
        className="supplier-payment-receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Supplier payment receipt ${receipt.receiptNo}`}
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >

        <div className="supplier-payment-receipt-heading">

          <div>

            <span>
              Supplier Payment Receipt
            </span>

            <h2>
              {receipt.receiptNo}
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

        <div className="supplier-payment-receipt-body">

          <div className="supplier-payment-receipt-business">

            <img
              src={
                deshanTextileLogo
              }
              alt={
                businessName
              }
              className="supplier-payment-receipt-logo"
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

          </div>

          <div className="supplier-payment-receipt-meta">

            <div>

              <span>
                Receipt No.
              </span>

              <strong>
                {receipt.receiptNo}
              </strong>

            </div>

            <div>

              <span>
                Date
              </span>

              <strong>
                {formatDate(
                  receipt.paidAt,
                )}
              </strong>

            </div>

            <div>

              <span>
                Supplier
              </span>

              <strong>
                {receipt.supplier?.name ??
                  'Unknown Supplier'}
              </strong>

            </div>

            <div>

              <span>
                Paid By
              </span>

              <strong>
                {receipt.staff?.fullName ??
                  '—'}
              </strong>

            </div>

            <div>

              <span>
                Method
              </span>

              <strong>
                {labelText(
                  receipt.paymentMethod,
                )}
              </strong>

            </div>

            {receipt.supplier?.phone && (
              <div>

                <span>
                  Supplier Phone
                </span>

                <strong>
                  {
                    receipt.supplier
                      .phone
                  }
                </strong>

              </div>
            )}

          </div>

          <div className="supplier-payment-receipt-summary">

            <div>

              <span>
                Previous Payable
              </span>

              <strong>
                {money(
                  receipt.previousBalance,
                )}
              </strong>

            </div>

            <div className="highlight">

              <span>
                Amount Paid
              </span>

              <strong>
                {money(
                  receipt.amount,
                )}
              </strong>

            </div>

            <div>

              <span>
                Remaining Payable
              </span>

              <strong>
                {money(
                  receipt.remainingBalance,
                )}
              </strong>

            </div>

          </div>

          {receipt.referenceNo && (
            <div className="supplier-payment-receipt-detail">

              <span>
                Reference
              </span>

              <strong>
                {receipt.referenceNo}
              </strong>

            </div>
          )}

          {receipt.note && (
            <div className="supplier-payment-receipt-note">

              <strong>
                Note
              </strong>

              <p>
                {receipt.note}
              </p>

            </div>
          )}

          {receiptFooter && (
            <div className="supplier-payment-receipt-note">

              <strong>
                Receipt Message
              </strong>

              <p>
                {receiptFooter}
              </p>

            </div>
          )}

        </div>

        <div className="supplier-payment-receipt-actions">

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

            Print Receipt

          </button>

        </div>

      </section>
    </div>
  )
}