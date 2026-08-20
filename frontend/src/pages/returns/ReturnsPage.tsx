import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  QrCode,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import {
  getSaleInvoice,
  getSalesHistory,
} from '../../services/salesHistoryService'

import {
  completeReturn,
  getReturnedQuantitiesForSale,
  getReturnHistory,
  getReturnReceipt,
  type ReturnedQuantityMap,
} from '../../services/returnService'

import { createId } from '../../utils/createId'

import type {
  SaleInvoiceDetail,
  SalesHistoryItem,
} from '../../types/salesHistory'

import type {
  RefundMethod,
  ReturnHistoryItem,
  ReturnReceiptDetail,
} from '../../types/return'

import deshanTextileLogo from '../../assets/deshan-textile-logo.png'

import {
  directPrintReturnReceipt,
} from '../../services/directReceiptPrinter'

import '../../styles/returns.css'

interface SelectedReturnItem {
  saleItemId: string

  productName: string
  barcode: string | null

  soldQuantity: number
  alreadyReturned: number
  availableQuantity: number

  returnQuantity: number

  unitPrice: number
  refundPerUnit: number
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
  return new Date(
    value,
  ).toLocaleString(
    'en-LK',
    {
      timeZone: 'Asia/Colombo',

      year: 'numeric',
      month: 'short',
      day: '2-digit',

      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function labelText(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    )
}

function escapeHtml(
  value: string | null | undefined,
) {
  if (!value) {
    return ''
  }

  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export default function ReturnsPage() {
  const { staff } = useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const [
    sales,
    setSales,
  ] = useState<
    SalesHistoryItem[]
  >([])

  const [
    returnHistory,
    setReturnHistory,
  ] = useState<
    ReturnHistoryItem[]
  >([])

  const [
    selectedSale,
    setSelectedSale,
  ] =
    useState<
      SaleInvoiceDetail | null
    >(null)

  const [
    returnedQuantities,
    setReturnedQuantities,
  ] =
    useState<
      ReturnedQuantityMap
    >({})

  const [
    selectedItems,
    setSelectedItems,
  ] =
    useState<
      SelectedReturnItem[]
    >([])

  const [
    selectedReturnReceipt,
    setSelectedReturnReceipt,
  ] =
    useState<
      ReturnReceiptDetail | null
    >(null)

  const [
    invoiceSearch,
    setInvoiceSearch,
  ] = useState('')

  const [
    historySearch,
    setHistorySearch,
  ] = useState('')

  const [
    refundMethod,
    setRefundMethod,
  ] =
    useState<RefundMethod>(
      'cash',
    )

  const [
    reason,
    setReason,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    invoiceLoading,
    setInvoiceLoading,
  ] = useState(false)

  const [
    receiptLoading,
    setReceiptLoading,
  ] = useState(false)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState('')

  const [
    success,
    setSuccess,
  ] = useState('')

  const [
    transactionId,
    setTransactionId,
  ] = useState(
    () => createId(),
  )

  async function loadPageData() {
    if (!businessId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const [
        salesData,
        historyData,
      ] =
        await Promise.all([
          getSalesHistory(
            businessId,
            branchId ??
              undefined,
          ),

          getReturnHistory(
            businessId,
            branchId ??
              undefined,
          ),
        ])

      setSales(
        salesData.filter(
          (sale) =>
            sale.status !==
            'cancelled',
        ),
      )

      setReturnHistory(
        historyData,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load returns data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [
    businessId,
    branchId,
  ])

  const filteredSales =
    useMemo(() => {
      const query =
        invoiceSearch
          .trim()
          .toLowerCase()

      if (!query) {
        return sales.slice(
          0,
          12,
        )
      }

      return sales.filter(
        (sale) =>
          [
            sale.invoiceNo,
            sale.customerName,
            sale.staffName,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  query,
                ),
            ),
      )
    }, [
      sales,
      invoiceSearch,
    ])

  const filteredHistory =
    useMemo(() => {
      const query =
        historySearch
          .trim()
          .toLowerCase()

      if (!query) {
        return returnHistory
      }

      return returnHistory.filter(
        (item) =>
          [
            item.returnNo,
            item.invoiceNo,
            item.customerName,
            item.staffName,
            item.refundMethod,
            item.reason,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  query,
                ),
            ),
      )
    }, [
      returnHistory,
      historySearch,
    ])

  const refundTotal =
    useMemo(
      () =>
        selectedItems.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.refundPerUnit *
              item.returnQuantity,
          0,
        ),
      [selectedItems],
    )

  const totalReturnedToday =
    useMemo(() => {
      const today =
        new Date()
          .toLocaleDateString(
            'en-CA',
            {
              timeZone:
                'Asia/Colombo',
            },
          )

      return returnHistory
        .filter(
          (item) =>
            new Date(
              item.createdAt,
            ).toLocaleDateString(
              'en-CA',
              {
                timeZone:
                  'Asia/Colombo',
              },
            ) === today,
        )
        .reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.refundAmount,
          0,
        )
    }, [returnHistory])

  const invoiceFullyReturned =
    useMemo(() => {
      if (!selectedSale) {
        return false
      }

      if (
        selectedSale.items
          .length === 0
      ) {
        return false
      }

      return selectedSale.items.every(
        (item) => {
          const already =
            returnedQuantities[
              item.id
            ] ?? 0

          return (
            item.quantity -
              already <=
            0
          )
        },
      )
    }, [
      selectedSale,
      returnedQuantities,
    ])

  async function selectSale(
    saleId: string,
  ) {
    try {
      setInvoiceLoading(true)

      setError('')
      setSuccess('')

      const [
        invoice,
        returnedMap,
      ] =
        await Promise.all([
          getSaleInvoice(
            saleId,
          ),

          getReturnedQuantitiesForSale(
            saleId,
          ),
        ])

      setSelectedSale(
        invoice,
      )

      setReturnedQuantities(
        returnedMap,
      )

      setSelectedItems([])

      setRefundMethod(
        'cash',
      )

      setReason('')

      setTransactionId(
        createId(),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load sale.',
      )
    } finally {
      setInvoiceLoading(false)
    }
  }

  async function openReturnReceipt(
    returnId: string,
  ) {
    try {
      setReceiptLoading(true)
      setError('')

      const receipt =
        await getReturnReceipt(
          returnId,
        )

      setSelectedReturnReceipt(
        receipt,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load return receipt.',
      )
    } finally {
      setReceiptLoading(false)
    }
  }

  function closeReturnReceipt() {
    setSelectedReturnReceipt(
      null,
    )
  }

  function toggleItem(
    saleItemId: string,
  ) {
    if (!selectedSale) {
      return
    }

    const saleItem =
      selectedSale.items.find(
        (item) =>
          item.id ===
          saleItemId,
      )

    if (!saleItem) {
      return
    }

    const alreadyReturned =
      returnedQuantities[
        saleItem.id
      ] ?? 0

    const availableQuantity =
      Math.max(
        0,
        saleItem.quantity -
          alreadyReturned,
      )

    if (
      availableQuantity <=
      0
    ) {
      setError(
        `${saleItem.productName} has already been fully returned.`,
      )

      return
    }

    setError('')

    setSelectedItems(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.saleItemId ===
              saleItemId,
          )

        if (exists) {
          return current.filter(
            (item) =>
              item.saleItemId !==
              saleItemId,
          )
        }

        const refundPerUnit =
          saleItem.quantity >
          0
            ? saleItem.lineTotal /
              saleItem.quantity
            : 0

        return [
          ...current,
          {
            saleItemId:
              saleItem.id,

            productName:
              saleItem.productName,

            barcode:
              saleItem.barcode,

            soldQuantity:
              saleItem.quantity,

            alreadyReturned,

            availableQuantity,

            returnQuantity:
              Math.min(
                1,
                availableQuantity,
              ),

            unitPrice:
              saleItem.unitPrice,

            refundPerUnit,
          },
        ]
      },
    )
  }

  function updateReturnQuantity(
    saleItemId: string,
    value: number,
  ) {
    setSelectedItems(
      (current) =>
        current.map(
          (item) => {
            if (
              item.saleItemId !==
              saleItemId
            ) {
              return item
            }

            const safeValue =
              Math.min(
                Math.max(
                  value,
                  1,
                ),
                item.availableQuantity,
              )

            return {
              ...item,

              returnQuantity:
                safeValue,
            }
          },
        ),
    )
  }

  function changeReturnQuantity(
    saleItemId: string,
    delta: number,
  ) {
    const item =
      selectedItems.find(
        (selectedItem) =>
          selectedItem.saleItemId ===
          saleItemId,
      )

    if (!item) {
      return
    }

    updateReturnQuantity(
      saleItemId,
      item.returnQuantity +
        delta,
    )
  }

  function resetReturn() {
    setSelectedSale(null)

    setReturnedQuantities(
      {},
    )

    setSelectedItems([])

    setRefundMethod(
      'cash',
    )

    setReason('')

    setInvoiceSearch('')

    setSuccess('')
    setError('')

    setTransactionId(
      createId(),
    )
  }

  async function handleReturn() {
    if (
      !businessId ||
      !branchId
    ) {
      setError(
        'Business or branch information is unavailable.',
      )

      return
    }

    if (!selectedSale) {
      setError(
        'Select an invoice first.',
      )

      return
    }

    if (
      selectedItems.length ===
      0
    ) {
      setError(
        'Select at least one item to return.',
      )

      return
    }

    for (
      const item of
      selectedItems
    ) {
      const latestAlready =
        returnedQuantities[
          item.saleItemId
        ] ?? 0

      const latestAvailable =
        item.soldQuantity -
        latestAlready

      if (
        latestAvailable <= 0
      ) {
        setError(
          `${item.productName} has already been fully returned.`,
        )

        return
      }

      if (
        item.returnQuantity >
        latestAvailable
      ) {
        setError(
          `${item.productName} only has ${latestAvailable} available to return.`,
        )

        return
      }
    }

    if (
      refundMethod ===
        'credit_adjustment' &&
      !selectedSale.sale
        .customerName
    ) {
      setError(
        'Credit adjustment requires a registered customer.',
      )

      return
    }

    const confirmed =
      window.confirm(
        `Confirm return of ${selectedItems.length} item(s)? Refund value: ${money(
          refundTotal,
        )}`,
      )

    if (!confirmed) {
      return
    }

    try {
      setSaving(true)

      setError('')
      setSuccess('')

      const latestMap =
        await getReturnedQuantitiesForSale(
          selectedSale.sale.id,
        )

      for (
        const item of
        selectedItems
      ) {
        const latestReturned =
          latestMap[
            item.saleItemId
          ] ?? 0

        const available =
          item.soldQuantity -
          latestReturned

        if (
          available <= 0
        ) {
          throw new Error(
            `${item.productName} has already been fully returned.`,
          )
        }

        if (
          item.returnQuantity >
          available
        ) {
          throw new Error(
            `${item.productName} only has ${available} available to return.`,
          )
        }
      }

      const result =
        await completeReturn({
          clientTransactionId:
            transactionId,

          businessId,

          branchId,

          saleId:
            selectedSale.sale.id,

          items:
            selectedItems.map(
              (item) => ({
                saleItemId:
                  item.saleItemId,

                quantity:
                  item.returnQuantity,
              }),
            ),

          refundMethod,

          reason:
            reason.trim() ||
            null,
        })

      setSuccess(
        `${result.return_no} completed successfully. Refund value ${money(
          result.refund_amount,
        )}.`,
      )

      setSelectedSale(null)

      setReturnedQuantities(
        {},
      )

      setSelectedItems([])

      setRefundMethod(
        'cash',
      )

      setReason('')

      setInvoiceSearch('')

      setTransactionId(
        createId(),
      )

      await loadPageData()

      await openReturnReceipt(
        result.return_id,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete return.',
      )

      if (selectedSale) {
        try {
          const latestMap =
            await getReturnedQuantitiesForSale(
              selectedSale.sale.id,
            )

          setReturnedQuantities(
            latestMap,
          )

          setSelectedItems(
            [],
          )
        } catch {
          // Keep original error visible.
        }
      }
    } finally {
      setSaving(false)
    }
  }

  async function printReturnReceipt() {
    if (!selectedReturnReceipt) {
      return
    }

    const receipt =
      selectedReturnReceipt

    const directPrinted =
      await directPrintReturnReceipt(
        receipt,
      )

    if (directPrinted) {
      return
    }

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=320,height=700',
      )

    if (!printWindow) {
      setError(
        'Unable to open print window. Please allow pop-ups for this site.',
      )

      return
    }

    const itemsHtml =
      receipt.items
        .map(
          (item) => `
            <div class="receipt-item">
              <div class="receipt-item-name">
                ${escapeHtml(
                  item.productName,
                )}
              </div>

              <div class="receipt-item-row">
                <span>
                  ${item.quantity}
                  x
                  ${money(
                    item.unitPrice,
                  )}
                </span>

                <strong>
                  ${money(
                    item.lineRefund,
                  )}
                </strong>
              </div>

              ${
                item.discountAmount >
                0
                  ? `
                    <div class="receipt-item-discount">
                      Discount:
                      ${money(
                        item.discountAmount,
                      )}
                    </div>
                  `
                  : ''
              }
            </div>
          `,
        )
        .join('')

    printWindow.document.write(`
      <!doctype html>

      <html>
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>
            ${escapeHtml(
              receipt.returnNo,
            )}
          </title>

          <style>
            @page {
              size: 58mm auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 58mm;
              min-width: 58mm;
              max-width: 58mm;

              margin: 0 !important;
              padding: 0 !important;

              background: #fff;
              color: #000;
            }

            body {
              font-family:
                Arial,
                Helvetica,
                sans-serif;

              font-size: 10.5px;
              line-height: 1.3;

              -webkit-print-color-adjust:
                exact;

              print-color-adjust:
                exact;
            }

            .receipt {
              width: 48mm;
              margin: 0 auto;

              padding:
                3mm
                0
                4mm;
            }

            .receipt-logo {
              display: block;

              width: 23mm;
              max-height: 16mm;

              object-fit: contain;

              margin:
                0 auto 1.5mm;

              filter:
                grayscale(1)
                contrast(1.5);
            }

            .center {
              text-align: center;
            }

            h1 {
              margin: 0;

              font-size: 15px;
              line-height: 1.2;
            }

            .business-info {
              margin-top: 1mm;
              font-size: 8.5px;
            }

            .receipt-title {
              margin-top: 2mm;

              font-size: 12px;
              font-weight: 800;

              text-transform:
                uppercase;
            }

            .separator {
              margin: 2.2mm 0;

              border-top:
                1px dashed #000;
            }

            .row {
              display: flex;

              justify-content:
                space-between;

              align-items:
                flex-start;

              gap: 3mm;

              margin:
                0.8mm 0;
            }

            .row span {
              flex: 1;
            }

            .row strong {
              flex-shrink: 0;

              text-align: right;

              white-space:
                nowrap;
            }

            .receipt-item {
              padding:
                1.2mm 0;
            }

            .receipt-item +
            .receipt-item {
              border-top:
                1px dotted #888;
            }

            .receipt-item-name {
              font-weight: 700;
            }

            .receipt-item-row {
              display: flex;

              justify-content:
                space-between;

              gap: 3mm;

              margin-top:
                0.6mm;
            }

            .receipt-item-discount {
              margin-top:
                0.4mm;

              font-size:
                8px;
            }

            .refund-total {
              margin-top:
                1mm;

              padding-top:
                1.5mm;

              border-top:
                1px solid #000;

              font-size:
                13px;

              font-weight:
                800;
            }

            .reason {
              font-size: 9px;
            }

            .footer {
              margin-top:
                3mm;

              text-align:
                center;
            }

            .footer strong {
              display: block;
              font-size: 12px;
            }

            .footer small {
              display: block;
              margin-top: 1mm;
            }

            @media print {
              html,
              body {
                width: 58mm !important;

                min-width:
                  58mm !important;

                max-width:
                  58mm !important;
              }

              .receipt {
                width:
                  48mm !important;
              }
            }
          </style>
        </head>

        <body>

          <main class="receipt">

            <img
              class="receipt-logo"
              src="${deshanTextileLogo}"
              alt="Deshan Textile"
            />

            <div class="center">

              <h1>
                ${escapeHtml(
                  receipt.businessName,
                )}
              </h1>

              <div class="business-info">

                ${
                  receipt.branchName
                    ? `
                      <div>
                        ${escapeHtml(
                          receipt.branchName,
                        )}
                      </div>
                    `
                    : ''
                }

                ${
                  receipt.branchAddress
                    ? `
                      <div>
                        ${escapeHtml(
                          receipt.branchAddress,
                        )}
                      </div>
                    `
                    : ''
                }

                ${
                  receipt.branchPhone
                    ? `
                      <div>
                        Tel:
                        ${escapeHtml(
                          receipt.branchPhone,
                        )}
                      </div>
                    `
                    : ''
                }

              </div>

              <div class="receipt-title">
                Return / Refund Receipt
              </div>

            </div>

            <div class="separator"></div>

            <div class="row">
              <span>
                Return No
              </span>

              <strong>
                ${escapeHtml(
                  receipt.returnNo,
                )}
              </strong>
            </div>

            <div class="row">
              <span>
                Original Invoice
              </span>

              <strong>
                ${escapeHtml(
                  receipt.invoiceNo,
                )}
              </strong>
            </div>

            <div class="row">
              <span>
                Date
              </span>

              <strong>
                ${escapeHtml(
                  formatDate(
                    receipt.createdAt,
                  ),
                )}
              </strong>
            </div>

            <div class="row">
              <span>
                Customer
              </span>

              <strong>
                ${escapeHtml(
                  receipt.customerName ??
                    'Walk-in Customer',
                )}
              </strong>
            </div>

            <div class="row">
              <span>
                Staff
              </span>

              <strong>
                ${escapeHtml(
                  receipt.staffName ??
                    '—',
                )}
              </strong>
            </div>

            <div class="separator"></div>

            ${itemsHtml}

            <div class="separator"></div>

            <div class="row">
              <span>
                Refund Method
              </span>

              <strong>
                ${escapeHtml(
                  labelText(
                    receipt.refundMethod,
                  ),
                )}
              </strong>
            </div>

            <div class="row refund-total">
              <span>
                REFUND
              </span>

              <strong>
                ${money(
                  receipt.refundAmount,
                )}
              </strong>
            </div>

            ${
              receipt.reason
                ? `
                  <div class="separator"></div>

                  <div class="reason">
                    <strong>
                      Reason / Note:
                    </strong>

                    ${escapeHtml(
                      receipt.reason,
                    )}
                  </div>
                `
                : ''
            }

            <div class="footer">

              <strong>
                Return Completed
              </strong>

              <div>
                Thank you
              </div>

              <small>
                ${escapeHtml(
                  receipt.returnNo,
                )}
              </small>

            </div>

          </main>

          <script>
            function startPrint() {
              setTimeout(
                function () {
                  window.focus();
                  window.print();
                },
                350
              );
            }

            window.addEventListener(
              'load',
              startPrint
            );

            window.addEventListener(
              'afterprint',
              function () {
                window.close();
              }
            );
          </script>

        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <AppLayout>
      <div className="returns-page">

        <section className="returns-heading">

          <div>
            <h1>
              Returns
            </h1>

            <p>
              Process customer returns,
              restore stock and manage
              refunds.
            </p>
          </div>

          <div className="returns-heading-badge">

            <ShieldCheck
              size={17}
            />

            Protected Returns

          </div>

        </section>

        {error && (
          <div className="returns-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="returns-message success">

            <CheckCircle2
              size={18}
            />

            {success}

          </div>
        )}

        <section className="returns-summary-grid">

          <article>

            <div className="returns-summary-icon">
              <RotateCcw size={20} />
            </div>

            <div>
              <span>
                Total Returns
              </span>

              <strong>
                {returnHistory.length}
              </strong>
            </div>

          </article>

          <article>

            <div className="returns-summary-icon">
              <Banknote size={20} />
            </div>

            <div>
              <span>
                Returned Today
              </span>

              <strong>
                {money(
                  totalReturnedToday,
                )}
              </strong>
            </div>

          </article>

          <article>

            <div className="returns-summary-icon">
              <ReceiptText size={20} />
            </div>

            <div>
              <span>
                Selected Refund
              </span>

              <strong>
                {money(
                  refundTotal,
                )}
              </strong>
            </div>

          </article>

        </section>

        <div className="returns-workspace">

          <section className="returns-invoice-panel">

            <div className="returns-card-heading">

              <div>
                <h2>
                  Find Sale
                </h2>

                <p>
                  Search the original
                  invoice.
                </p>
              </div>

            </div>

            <div className="returns-invoice-search">

              <Search size={17} />

              <input
                value={
                  invoiceSearch
                }
                onChange={(event) =>
                  setInvoiceSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Invoice or customer..."
              />

            </div>

            <div className="returns-sale-list">

              {loading ? (

                <div className="returns-list-empty">

                  <Loader2
                    size={20}
                    className="returns-spin"
                  />

                  Loading sales...

                </div>

              ) : filteredSales.length ===
                0 ? (

                <div className="returns-list-empty">
                  No sale found.
                </div>

              ) : (

                filteredSales.map(
                  (sale) => (

                    <button
                      key={sale.id}
                      type="button"
                      className={
                        selectedSale
                          ?.sale.id ===
                        sale.id
                          ? 'returns-sale-item active'
                          : 'returns-sale-item'
                      }
                      onClick={() =>
                        void selectSale(
                          sale.id,
                        )
                      }
                      disabled={
                        invoiceLoading ||
                        saving
                      }
                    >

                      <div>

                        <strong>
                          {
                            sale.invoiceNo
                          }
                        </strong>

                        <span>
                          {sale.customerName ??
                            'Walk-in Customer'}
                        </span>

                        <small>
                          {formatDate(
                            sale.createdAt,
                          )}
                        </small>

                      </div>

                      <strong>
                        {money(
                          sale.total,
                        )}
                      </strong>

                    </button>

                  ),
                )

              )}

            </div>

          </section>

          <section className="returns-items-panel">

            <div className="returns-card-heading">

              <div>

                <h2>
                  Return Items
                </h2>

                <p>
                  Sold, returned and
                  available quantities.
                </p>

              </div>

              {selectedSale && (

                <button
                  type="button"
                  className="returns-reset-button"
                  onClick={
                    resetReturn
                  }
                  disabled={
                    saving
                  }
                >
                  Clear
                </button>

              )}

            </div>

            {invoiceLoading ? (

              <div className="returns-main-empty">

                <Loader2
                  size={25}
                  className="returns-spin"
                />

                Loading invoice...

              </div>

            ) : !selectedSale ? (

              <div className="returns-main-empty">

                <ReceiptText
                  size={34}
                />

                <strong>
                  Select an invoice
                </strong>

                <span>
                  Choose a sale from the
                  left to begin a return.
                </span>

              </div>

            ) : (

              <>

                <div className="returns-sale-info">

                  <div>
                    <span>
                      Invoice
                    </span>

                    <strong>
                      {
                        selectedSale
                          .sale
                          .invoiceNo
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Customer
                    </span>

                    <strong>
                      {selectedSale
                        .sale
                        .customerName ??
                        'Walk-in Customer'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Sale Total
                    </span>

                    <strong>
                      {money(
                        selectedSale
                          .sale.total,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedSale
                          .sale
                          .createdAt,
                      )}
                    </strong>
                  </div>

                </div>

                {invoiceFullyReturned && (

                  <div className="returns-fully-returned-message">
                    This invoice has been
                    fully returned.
                  </div>

                )}

                <div className="returns-items-table-wrap">

                  <table className="returns-items-table">

                    <thead>

                      <tr>
                        <th />

                        <th>
                          Product
                        </th>

                        <th>
                          Sold
                        </th>

                        <th>
                          Returned
                        </th>

                        <th>
                          Available
                        </th>

                        <th>
                          Price
                        </th>

                        <th>
                          Return Qty
                        </th>

                        <th>
                          Refund
                        </th>
                      </tr>

                    </thead>

                    <tbody>

                      {selectedSale.items.map(
                        (item) => {
                          const alreadyReturned =
                            returnedQuantities[
                              item.id
                            ] ?? 0

                          const available =
                            Math.max(
                              0,

                              item.quantity -
                                alreadyReturned,
                            )

                          const fullyReturned =
                            available <= 0

                          const selected =
                            selectedItems.find(
                              (
                                selectedItem,
                              ) =>
                                selectedItem.saleItemId ===
                                item.id,
                            )

                          const refund =
                            selected
                              ? selected.refundPerUnit *
                                selected.returnQuantity
                              : 0

                          return (
                            <tr
                              key={
                                item.id
                              }
                              className={
                                selected
                                  ? 'selected'
                                  : ''
                              }
                            >

                              <td>

                                <input
                                  type="checkbox"
                                  checked={
                                    selected !=
                                    null
                                  }
                                  onChange={() =>
                                    toggleItem(
                                      item.id,
                                    )
                                  }
                                  disabled={
                                    saving ||
                                    fullyReturned
                                  }
                                />

                              </td>

                              <td>

                                <div className="returns-product-cell">

                                  <strong>
                                    {
                                      item.productName
                                    }
                                  </strong>

                                  <span>
                                    {item.barcode ??
                                      'No barcode'}
                                  </span>

                                  {fullyReturned && (

                                    <span className="returns-fully-returned-label">
                                      Fully Returned
                                    </span>

                                  )}

                                </div>

                              </td>

                              <td>
                                {
                                  item.quantity
                                }
                              </td>

                              <td>
                                <strong>
                                  {
                                    alreadyReturned
                                  }
                                </strong>
                              </td>

                              <td>
                                <strong
                                  className={
                                    fullyReturned
                                      ? 'returns-available-zero'
                                      : ''
                                  }
                                >
                                  {
                                    available
                                  }
                                </strong>
                              </td>

                              <td>
                                {money(
                                  item.unitPrice,
                                )}
                              </td>

                              <td>

                                {fullyReturned ? (

                                  <span className="returns-done-text">
                                    Done
                                  </span>

                                ) : selected ? (

                                  <div className="returns-qty-control">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeReturnQuantity(
                                          item.id,
                                          -1,
                                        )
                                      }
                                      disabled={
                                        saving ||
                                        selected.returnQuantity <=
                                          1
                                      }
                                    >
                                      <Minus
                                        size={13}
                                      />
                                    </button>

                                    <input
                                      type="number"
                                      min="1"
                                      max={
                                        available
                                      }
                                      step="1"
                                      value={
                                        selected.returnQuantity
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateReturnQuantity(
                                          item.id,

                                          Number(
                                            event
                                              .target
                                              .value,
                                          ),
                                        )
                                      }
                                      disabled={
                                        saving
                                      }
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        changeReturnQuantity(
                                          item.id,
                                          1,
                                        )
                                      }
                                      disabled={
                                        saving ||
                                        selected.returnQuantity >=
                                          available
                                      }
                                    >
                                      <Plus
                                        size={13}
                                      />
                                    </button>

                                  </div>

                                ) : (
                                  '—'
                                )}

                              </td>

                              <td>
                                <strong>
                                  {selected
                                    ? money(
                                        refund,
                                      )
                                    : '—'}
                                </strong>
                              </td>

                            </tr>
                          )
                        },
                      )}

                    </tbody>

                  </table>

                </div>

              </>

            )}

          </section>

          <aside className="returns-refund-panel">

            <div className="returns-card-heading">

              <div>
                <h2>
                  Refund
                </h2>

                <p>
                  Return settlement
                  details.
                </p>
              </div>

            </div>

            <div className="returns-refund-content">

              <div className="returns-refund-total">

                <span>
                  Refund Value
                </span>

                <strong>
                  {money(
                    refundTotal,
                  )}
                </strong>

                <small>
                  {
                    selectedItems.length
                  }{' '}
                  selected item
                  {selectedItems.length ===
                  1
                    ? ''
                    : 's'}
                </small>

              </div>

              <div className="returns-refund-methods">

                <button
                  type="button"
                  className={
                    refundMethod ===
                    'cash'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRefundMethod(
                      'cash',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <Banknote size={18} />
                  Cash
                </button>

                <button
                  type="button"
                  className={
                    refundMethod ===
                    'card'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRefundMethod(
                      'card',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <CreditCard size={18} />
                  Card
                </button>

                <button
                  type="button"
                  className={
                    refundMethod ===
                    'qr'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRefundMethod(
                      'qr',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <QrCode size={18} />
                  QR
                </button>

                <button
                  type="button"
                  className={
                    refundMethod ===
                    'bank_transfer'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRefundMethod(
                      'bank_transfer',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <WalletCards size={18} />
                  Bank
                </button>

                <button
                  type="button"
                  className={
                    refundMethod ===
                    'credit_adjustment'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRefundMethod(
                      'credit_adjustment',
                    )
                  }
                  disabled={
                    saving ||
                    !selectedSale
                      ?.sale
                      .customerName
                  }
                >
                  <ArrowLeftRight size={18} />
                  Credit
                </button>

                <button
                  type="button"
                  className={
                    refundMethod ===
                    'no_refund'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setRefundMethod(
                      'no_refund',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <PackageCheck size={18} />
                  No Refund
                </button>

              </div>

              <label className="returns-reason-field">

                Reason / Note

                <textarea
                  rows={4}
                  value={
                    reason
                  }
                  onChange={(event) =>
                    setReason(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Wrong item, defect, size change..."
                  disabled={
                    saving
                  }
                />

              </label>

              <button
                type="button"
                className="returns-complete-button"
                onClick={() =>
                  void handleReturn()
                }
                disabled={
                  saving ||
                  !selectedSale ||
                  invoiceFullyReturned ||
                  selectedItems.length ===
                    0
                }
              >

                <RotateCcw size={18} />

                {saving
                  ? 'Processing Return...'
                  : invoiceFullyReturned
                    ? 'Fully Returned'
                    : 'Complete Return'}

              </button>

            </div>

          </aside>

        </div>

        <section className="returns-history-card">

          <div className="returns-history-heading">

            <div>

              <h2>
                Return History
              </h2>

              <p>
                Completed returns and
                refunds.
              </p>

            </div>

            <div className="returns-history-search">

              <Search size={16} />

              <input
                value={
                  historySearch
                }
                onChange={(event) =>
                  setHistorySearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search returns..."
              />

            </div>

          </div>

          <div className="returns-history-table-wrap">

            <table className="returns-history-table">

              <thead>

                <tr>
                  <th>
                    Return
                  </th>

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
                    Refund
                  </th>

                  <th>
                    Method
                  </th>

                  <th>
                    Staff
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    View
                  </th>
                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="returns-history-empty"
                    >
                      Loading returns...
                    </td>

                  </tr>

                ) : filteredHistory.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="returns-history-empty"
                    >
                      No returns found.
                    </td>

                  </tr>

                ) : (

                  filteredHistory.map(
                    (item) => (

                      <tr
                        key={item.id}
                      >

                        <td>
                          <strong className="returns-number">
                            {
                              item.returnNo
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            item.invoiceNo
                          }
                        </td>

                        <td>
                          {formatDate(
                            item.createdAt,
                          )}
                        </td>

                        <td>

                          <div className="returns-customer">

                            <UserRound
                              size={14}
                            />

                            {item.customerName ??
                              'Walk-in Customer'}

                          </div>

                        </td>

                        <td>
                          <strong>
                            {money(
                              item.refundAmount,
                            )}
                          </strong>
                        </td>

                        <td>

                          <span className="returns-method-badge">
                            {labelText(
                              item.refundMethod,
                            )}
                          </span>

                        </td>

                        <td>
                          {item.staffName ??
                            '—'}
                        </td>

                        <td>

                          <span
                            className={`returns-status ${item.status}`}
                          >
                            {
                              item.status
                            }
                          </span>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="returns-view-button"
                            title="View refund receipt"
                            onClick={() =>
                              void openReturnReceipt(
                                item.id,
                              )
                            }
                            disabled={
                              receiptLoading
                            }
                          >
                            <Eye size={16} />
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

        {receiptLoading && (

          <div className="return-receipt-loading">

            <div>
              <Loader2
                size={26}
                className="returns-spin"
              />

              Loading receipt...
            </div>

          </div>

        )}

        {selectedReturnReceipt && (

          <div
            className="return-receipt-backdrop"
            onMouseDown={
              closeReturnReceipt
            }
          >

            <section
              className="return-receipt-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >

              <div className="return-receipt-heading">

                <div>

                  <span>
                    Return Receipt
                  </span>

                  <h2>
                    {
                      selectedReturnReceipt
                        .returnNo
                    }
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={
                    closeReturnReceipt
                  }
                  aria-label="Close return receipt"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="return-receipt-business">

                <img
                  src={
                    deshanTextileLogo
                  }
                  alt="Deshan Textile"
                  className="return-receipt-logo"
                />

                <h3>
                  {
                    selectedReturnReceipt
                      .businessName
                  }
                </h3>

                {selectedReturnReceipt
                  .branchName && (
                  <p>
                    {
                      selectedReturnReceipt
                        .branchName
                    }
                  </p>
                )}

                {selectedReturnReceipt
                  .branchAddress && (
                  <p>
                    {
                      selectedReturnReceipt
                        .branchAddress
                    }
                  </p>
                )}

                {selectedReturnReceipt
                  .branchPhone && (
                  <p>
                    Tel:{' '}
                    {
                      selectedReturnReceipt
                        .branchPhone
                    }
                  </p>
                )}

              </div>

              <div className="return-receipt-meta">

                <div>
                  <span>
                    Original Invoice
                  </span>

                  <strong>
                    {
                      selectedReturnReceipt
                        .invoiceNo
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedReturnReceipt
                        .createdAt,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Customer
                  </span>

                  <strong>
                    {selectedReturnReceipt
                      .customerName ??
                      'Walk-in Customer'}
                  </strong>
                </div>

                <div>
                  <span>
                    Staff
                  </span>

                  <strong>
                    {selectedReturnReceipt
                      .staffName ??
                      '—'}
                  </strong>
                </div>

              </div>

              <div className="return-receipt-items-wrap">

                <table className="return-receipt-items">

                  <thead>
                    <tr>
                      <th>
                        Item
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Price
                      </th>

                      <th>
                        Discount
                      </th>

                      <th>
                        Refund
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {selectedReturnReceipt.items.map(
                      (item) => (

                        <tr
                          key={item.id}
                        >

                          <td>
                            <strong>
                              {
                                item.productName
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              item.quantity
                            }
                          </td>

                          <td>
                            {money(
                              item.unitPrice,
                            )}
                          </td>

                          <td>
                            {money(
                              item.discountAmount,
                            )}
                          </td>

                          <td>
                            <strong>
                              {money(
                                item.lineRefund,
                              )}
                            </strong>
                          </td>

                        </tr>

                      ),
                    )}

                  </tbody>

                </table>

              </div>

              <div className="return-receipt-summary">

                <div>
                  <span>
                    Refund Method
                  </span>

                  <strong>
                    {labelText(
                      selectedReturnReceipt
                        .refundMethod,
                    )}
                  </strong>
                </div>

                <div className="return-receipt-total">

                  <span>
                    Total Refund
                  </span>

                  <strong>
                    {money(
                      selectedReturnReceipt
                        .refundAmount,
                    )}
                  </strong>

                </div>

              </div>

              {selectedReturnReceipt
                .reason && (

                <div className="return-receipt-note">

                  <strong>
                    Reason / Note
                  </strong>

                  <p>
                    {
                      selectedReturnReceipt
                        .reason
                    }
                  </p>

                </div>

              )}

              <div className="return-receipt-actions">

                <button
                  type="button"
                  className="return-receipt-close"
                  onClick={
                    closeReturnReceipt
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="return-receipt-print"
                  onClick={
                    printReturnReceipt
                  }
                >
                  <ReceiptText size={17} />

                  Print / Reprint
                </button>

              </div>

            </section>

          </div>

        )}

      </div>
    </AppLayout>
  )
}