import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Printer,
  ReceiptText,
  X,
} from 'lucide-react'

import type {
  SaleInvoiceDetail,
} from '../../types/salesHistory'

import type {
  BusinessSettings,
} from '../../types/settings'

import {
  getBusinessSettings,
} from '../../services/settingsService'

import deshanTextileLogo from '../../assets/deshan-textile-logo.png'

import {
  printSaleReceipt,
} from '../../utils/printSaleReceipt'

import {
  directPrintSaleReceipt,
} from '../../services/directReceiptPrinter'

import '../../styles/sale-receipt-modal.css'

interface SaleReceiptModalProps {
  invoice: SaleInvoiceDetail

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

const RECEIPT_SETTINGS_CACHE_PREFIX =
  'deshan_pos_receipt_settings_v1'

function getReceiptSettingsCacheKey(
  businessId: string,
  branchId: string | null,
) {
  return `${RECEIPT_SETTINGS_CACHE_PREFIX}:${businessId}:${branchId ?? 'all'}`
}

function readCachedReceiptSettings(
  businessId: string,
  branchId: string | null,
): BusinessSettings | null {
  try {
    const raw =
      window.localStorage.getItem(
        getReceiptSettingsCacheKey(
          businessId,
          branchId,
        ),
      )

    if (!raw) {
      return null
    }

    return JSON.parse(
      raw,
    ) as BusinessSettings
  } catch (error) {
    console.warn(
      'Unable to read cached receipt settings:',
      error,
    )

    return null
  }
}

function cacheReceiptSettings(
  settings: BusinessSettings,
) {
  try {
    window.localStorage.setItem(
      getReceiptSettingsCacheKey(
        settings.businessId,
        settings.branchId,
      ),
      JSON.stringify(
        settings,
      ),
    )
  } catch (error) {
    console.warn(
      'Unable to cache receipt settings:',
      error,
    )
  }
}

export default function SaleReceiptModal({
  invoice,
  onClose,
  onPrintError,
}: SaleReceiptModalProps) {
  const [
    settings,
    setSettings,
  ] =
    useState<BusinessSettings | null>(
      null,
    )

  /*
   * Receipt settings are cached locally so an offline receipt is
   * print-ready immediately. When online we refresh the cache in the
   * background without blocking the Print button.
   */
  useEffect(() => {
    const businessId =
      invoice.business?.id

    const branchId =
      invoice.branch?.id ??
      null

    if (!businessId) {
      setSettings(
        null,
      )

      return
    }

    const cachedSettings =
      readCachedReceiptSettings(
        businessId,
        branchId,
      )

    if (cachedSettings) {
      setSettings(
        cachedSettings,
      )
    }

    // Offline/local invoices must never wait for Supabase.
    if (
      !navigator.onLine ||
      invoice.sale.invoiceNo.startsWith(
        'OFF-',
      )
    ) {
      return
    }

    const resolvedBusinessId =
      businessId

    let active =
      true

    async function refreshSettings() {
      try {
        const result =
          await getBusinessSettings(
            resolvedBusinessId,
            branchId,
          )

        if (!active) {
          return
        }

        setSettings(
          result,
        )

        if (result) {
          cacheReceiptSettings(
            result,
          )
        }
      } catch (error) {
        console.error(
          'Unable to refresh receipt settings:',
          error,
        )
      } finally {
      }
    }

    void refreshSettings()

    return () => {
      active =
        false
    }
  }, [
    invoice.business?.id,
    invoice.branch?.id,
    invoice.sale.invoiceNo,
  ])

  /*
   * Modal keyboard / scroll behaviour.
   */
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        onClose()
      }
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    onClose,
  ])

  /*
   * Receipt totals.
   */
  const totalQuantity =
    useMemo(
      () =>
        invoice.items.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.quantity,
            ),
          0,
        ),
      [
        invoice.items,
      ],
    )

  const itemDiscountTotal =
    useMemo(
      () =>
        invoice.items.reduce(
          (
            total,
            item,
          ) =>
            total +
            Number(
              item.discountAmount,
            ),
          0,
        ),
      [
        invoice.items,
      ],
    )

  /*
   * Print receipt using the exact
   * settings loaded above.
   */
  async function handlePrint() {
    try {
      const printed =
        await directPrintSaleReceipt(
          invoice,
          settings,
        )

      if (printed) {
        return
      }

      // Safe fallback when the local XP-58C bridge
      // is not running or the printer is unavailable.
      printSaleReceipt(
        invoice,
        settings,
      )
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to print receipt.'

      if (onPrintError) {
        onPrintError(
          message,
        )
      }
    }
  }

  /*
   * Business information.
   *
   * Settings have priority.
   * Invoice data is used only as fallback.
   */
  const businessName =
    settings?.businessName ||
    invoice.business?.name ||
    'Deshan Textile'

  const branchName =
    settings?.branchName ||
    invoice.branch?.name ||
    ''

  const businessAddress =
    settings?.businessAddress ||
    invoice.branch?.address ||
    ''

  const businessPhone =
    settings?.businessPhone ||
    settings?.branchPhone ||
    invoice.branch?.phone ||
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
    'Thank You! Please come again'

  return (
    <div
      className="sale-receipt-backdrop"
      onMouseDown={
        onClose
      }
    >
      <section
        className="sale-receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Receipt ${invoice.sale.invoiceNo}`}
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >

        {/* ================================
            MODAL HEADER
        ================================= */}

        <div className="sale-receipt-heading">

          <div className="sale-receipt-heading-title">

            <div className="sale-receipt-heading-icon">

              <ReceiptText
                size={18}
              />

            </div>

            <div>

              <span>
                Sales Receipt
              </span>

              <h2>
                {
                  invoice.sale
                    .invoiceNo
                }
              </h2>

            </div>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close receipt"
          >
            <X
              size={19}
            />
          </button>

        </div>

        {/* ================================
            RECEIPT CONTENT
        ================================= */}

        <div className="sale-receipt-scroll-area">

          {/* BUSINESS INFORMATION */}

          <div className="sale-receipt-business">

            <img
              src={
                deshanTextileLogo
              }
              alt={
                businessName
              }
              className="sale-receipt-logo"
            />

            <h3>
              {businessName}
            </h3>

            {branchName && (
              <p className="sale-receipt-branch">
                {branchName}
              </p>
            )}

            {showBusinessAddress &&
              businessAddress && (
                <p>
                  {
                    businessAddress
                  }
                </p>
              )}

            {showBusinessPhone &&
              businessPhone && (
                <p>
                  Tel:{' '}
                  {
                    businessPhone
                  }
                </p>
              )}

            {terminalName && (
              <span className="sale-receipt-terminal">
                {terminalName}
              </span>
            )}

          </div>

          {/* SALE INFORMATION */}

          <div className="sale-receipt-meta">

            <div>

              <span>
                Date & Time
              </span>

              <strong>
                {formatDate(
                  invoice.sale
                    .createdAt,
                )}
              </strong>

            </div>

            <div>

              <span>
                Customer
              </span>

              <strong>
                {invoice.sale
                  .customerName ??
                  'Walk-in Customer'}
              </strong>

            </div>

            <div>

              <span>
                Cashier
              </span>

              <strong>
                {invoice.sale
                  .staffName ??
                  '—'}
              </strong>

            </div>

            <div>

              <span>
                Sale Type
              </span>

              <strong>
                {labelText(
                  invoice.sale
                    .saleType,
                )}
              </strong>

            </div>

          </div>

          {/* RECEIPT STATS */}

          <div className="sale-receipt-stats">

            <div>

              <span>
                Line Items
              </span>

              <strong>
                {
                  invoice.items.length
                }
              </strong>

            </div>

            <div>

              <span>
                Quantity
              </span>

              <strong>
                {totalQuantity}
              </strong>

            </div>

            <div>

              <span>
                Item Discounts
              </span>

              <strong>
                {money(
                  itemDiscountTotal,
                )}
              </strong>

            </div>

            <div>

              <span>
                Payments
              </span>

              <strong>
                {
                  invoice.payments.length
                }
              </strong>

            </div>

          </div>

          {/* ITEMS HEADER */}

          <div className="sale-receipt-section-heading">

            <div>

              <span>
                Items
              </span>

              <strong>
                Sale Details
              </strong>

            </div>

          </div>

          {/* ITEMS TABLE */}

          <div className="sale-receipt-items-wrap">

            <table className="sale-receipt-items">

              <thead>

                <tr>

                  <th>
                    Item
                  </th>

                  <th className="number">
                    Qty
                  </th>

                  <th className="number">
                    Price
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

                {invoice.items.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={5}
                      className="sale-receipt-empty"
                    >
                      No invoice items.
                    </td>

                  </tr>

                ) : (

                  invoice.items.map(
                    (item) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>

                          <strong>
                            {
                              item.productName
                            }
                          </strong>

                          {item.barcode && (
                            <small>
                              {
                                item.barcode
                              }
                            </small>
                          )}

                        </td>

                        <td className="number">
                          {
                            item.quantity
                          }
                        </td>

                        <td className="number">
                          {money(
                            item.unitPrice,
                          )}
                        </td>

                        <td className="number">
                          {money(
                            item.discountAmount,
                          )}
                        </td>

                        <td className="number">

                          <strong>
                            {money(
                              item.lineTotal,
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

          {/* ================================
              PAYMENT + TOTALS
          ================================= */}

          <div className="sale-receipt-bottom">

            {/* PAYMENT BREAKDOWN */}

            <div className="sale-receipt-payments">

              <div className="sale-receipt-block-title">

                <span>
                  Payment
                </span>

                <h4>
                  Payment Breakdown
                </h4>

              </div>

              {invoice.payments.length ===
              0 ? (

                <p className="sale-receipt-muted">
                  No payment recorded.
                </p>

              ) : (

                <div className="sale-receipt-payment-list">

                  {invoice.payments.map(
                    (payment) => (

                      <div
                        className="sale-receipt-payment-row"
                        key={
                          payment.id
                        }
                      >

                        <div>

                          <strong>
                            {labelText(
                              payment.paymentMethod,
                            )}
                          </strong>

                          {payment.referenceNo && (
                            <span>
                              Ref:{' '}
                              {
                                payment.referenceNo
                              }
                            </span>
                          )}

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

            </div>

            {/* TOTALS */}

            <div className="sale-receipt-totals">

              <div>

                <span>
                  Subtotal
                </span>

                <strong>
                  {money(
                    invoice.sale
                      .subtotal,
                  )}
                </strong>

              </div>

              {invoice.sale
                .discountAmount >
                0 && (

                <div>

                  <span>
                    Discount
                  </span>

                  <strong className="sale-receipt-discount-value">
                    -{money(
                      invoice.sale
                        .discountAmount,
                    )}
                  </strong>

                </div>

              )}

              {invoice.sale
                .taxAmount >
                0 && (

                <div>

                  <span>
                    Tax
                  </span>

                  <strong>
                    {money(
                      invoice.sale
                        .taxAmount,
                    )}
                  </strong>

                </div>

              )}

              <div className="sale-receipt-total-main">

                <span>
                  Grand Total
                </span>

                <strong>
                  {money(
                    invoice.sale
                      .total,
                  )}
                </strong>

              </div>

              <div>

                <span>
                  Paid
                </span>

                <strong>
                  {money(
                    invoice.sale
                      .paidAmount,
                  )}
                </strong>

              </div>

              <div
                className={
                  invoice.sale
                    .balanceDue >
                  0
                    ? 'sale-receipt-balance-due'
                    : ''
                }
              >

                <span>
                  Balance
                </span>

                <strong>
                  {money(
                    invoice.sale
                      .balanceDue,
                  )}
                </strong>

              </div>

            </div>

          </div>

          {/* SALE NOTES */}

          {invoice.sale.notes && (

            <div className="sale-receipt-note">

              <strong>
                Sale Note
              </strong>

              <p>
                {
                  invoice.sale
                    .notes
                }
              </p>

            </div>

          )}

          {/* RECEIPT FOOTER */}

          <div className="sale-receipt-footer-message">

            <ReceiptText
              size={16}
            />

            <p>
              {receiptFooter}
            </p>

          </div>

        </div>

        {/* ================================
            ACTION BUTTONS
        ================================= */}

        <div className="sale-receipt-actions">

          <div className="sale-receipt-actions-note">

            <span>
              Receipt ready
            </span>

            <small>
              Print or save as PDF from your browser.
            </small>

          </div>

          <div className="sale-receipt-actions-buttons">

            <button
              type="button"
              className="sale-receipt-close"
              onClick={
                onClose
              }
            >
              Close
            </button>

            <button
              type="button"
              className="sale-receipt-print"
              onClick={
                handlePrint
              }
              disabled={false}
            >

              <Printer
                size={16}
              />

              Print Receipt

            </button>

          </div>

        </div>

      </section>
    </div>
  )
}