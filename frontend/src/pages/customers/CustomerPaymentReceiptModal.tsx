import {
  Printer,
  X,
} from 'lucide-react'

import type {
  CustomerPaymentReceipt,
} from '../../types/customerPayment'

import type {
  BusinessSettings,
} from '../../types/settings'

import {
  printCustomerPaymentReceipt,
} from '../../utils/printCustomerPaymentReceipt'

import {
  directPrintCustomerPaymentReceipt,
} from '../../services/directReceiptPrinter'

import deshanTextileLogo from '../../assets/deshan-textile-logo.png'

import '../../styles/customer-payment-receipt.css'

interface Props {
  receipt:
    CustomerPaymentReceipt

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

export default function CustomerPaymentReceiptModal({
  receipt,
  settings,
  onClose,
  onPrintError,
}: Props) {
  async function handlePrint() {
    try {
      const printed =
        await directPrintCustomerPaymentReceipt(
          receipt,
          settings ?? null,
        )

      if (!printed) {
        printCustomerPaymentReceipt(
          receipt,
          settings,
        )
      }
    } catch (err) {
      onPrintError?.(
        err instanceof Error
          ? err.message
          : 'Unable to print customer payment receipt.',
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
    receipt.business?.address ||
    ''

  const businessPhone =
    settings?.businessPhone ||
    settings?.branchPhone ||
    receipt.branch?.phone ||
    receipt.business?.phone ||
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
      className="customer-payment-receipt-backdrop"
      onMouseDown={
        onClose
      }
    >
      <section
        className="customer-payment-receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Customer payment receipt ${receipt.receiptNo}`}
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >

        <div className="customer-payment-receipt-heading">

          <div>

            <span>
              Customer Payment Receipt
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

        <div className="customer-payment-receipt-body">

          <div className="customer-payment-receipt-business">

            <img
              src={
                deshanTextileLogo
              }
              alt={
                businessName
              }
              className="customer-payment-receipt-logo"
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

          <div className="customer-payment-receipt-meta">

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
                  receipt.createdAt,
                )}
              </strong>

            </div>

            <div>

              <span>
                Customer
              </span>

              <strong>
                {receipt.customer?.name ??
                  'Unknown Customer'}
              </strong>

            </div>

            <div>

              <span>
                Received By
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

            {receipt.customer?.phone && (
              <div>

                <span>
                  Customer Phone
                </span>

                <strong>
                  {
                    receipt.customer
                      .phone
                  }
                </strong>

              </div>
            )}

          </div>

          <div className="customer-payment-receipt-summary">

            <div>

              <span>
                Previous Balance
              </span>

              <strong>
                {money(
                  receipt.previousBalance,
                )}
              </strong>

            </div>

            <div className="highlight">

              <span>
                Amount Received
              </span>

              <strong>
                {money(
                  receipt.amount,
                )}
              </strong>

            </div>

            <div>

              <span>
                Remaining Balance
              </span>

              <strong>
                {money(
                  receipt.remainingBalance,
                )}
              </strong>

            </div>

          </div>

          {receipt.referenceNo && (
            <div className="customer-payment-receipt-detail">

              <span>
                Reference
              </span>

              <strong>
                {
                  receipt.referenceNo
                }
              </strong>

            </div>
          )}

          {receipt.note && (
            <div className="customer-payment-receipt-note">

              <strong>
                Note
              </strong>

              <p>
                {
                  receipt.note
                }
              </p>

            </div>
          )}

          {receiptFooter && (
            <div className="customer-payment-receipt-note">

              <strong>
                Receipt Message
              </strong>

              <p>
                {receiptFooter}
              </p>

            </div>
          )}

        </div>

        <div className="customer-payment-receipt-actions">

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