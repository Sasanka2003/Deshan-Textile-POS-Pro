import type {
  SaleInvoiceDetail,
} from '../types/salesHistory'

import type {
  BusinessSettings,
} from '../types/settings'

import deshanTextileLogo from '../assets/deshan-textile-logo.png'

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
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return ''
  }

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

function escapeHtml(
  value:
    | string
    | number
    | null
    | undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  return String(
    value,
  )
    .replaceAll(
      '&',
      '&amp;',
    )
    .replaceAll(
      '<',
      '&lt;',
    )
    .replaceAll(
      '>',
      '&gt;',
    )
    .replaceAll(
      '"',
      '&quot;',
    )
    .replaceAll(
      "'",
      '&#039;',
    )
}

function numberValue(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const parsed =
    Number(
      value ?? 0,
    )

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0
}

export function printSaleReceipt(
  invoice: SaleInvoiceDetail,
  settings?:
    BusinessSettings | null,
) {
  const printWindow =
    window.open(
      '',
      '_blank',
      [
        'width=420',
        'height=760',
        'toolbar=no',
        'location=no',
        'status=no',
        'menubar=no',
        'scrollbars=yes',
        'resizable=yes',
      ].join(','),
    )

  if (!printWindow) {
    throw new Error(
      'Unable to open print window. Please allow pop-ups for this site.',
    )
  }

  /* =========================================================
     BUSINESS / BRANCH SETTINGS
  ========================================================= */

  const businessNameRaw =
    settings
      ? settings.businessName
      : invoice.business?.name ||
        'Deshan Textile'

  const branchNameRaw =
    settings
      ? settings.branchName ??
        ''
      : invoice.branch?.name ??
        ''

  const businessAddressRaw =
    settings
      ? settings.businessAddress ??
        ''
      : invoice.branch?.address ??
        ''

  const businessPhoneRaw =
    settings
      ? settings.businessPhone ||
        settings.branchPhone ||
        ''
      : invoice.branch?.phone ??
        ''

  const terminalNameRaw =
    settings?.terminalName ??
    ''

  const receiptFooterRaw =
    settings
      ? settings.receiptFooter ??
        ''
      : 'Thank You! Please come again'

  const showBusinessAddress =
    settings
      ? Boolean(
          settings.showBusinessAddress,
        )
      : true

  const showBusinessPhone =
    settings
      ? Boolean(
          settings.showBusinessPhone,
        )
      : true

  const businessName =
    escapeHtml(
      businessNameRaw,
    )

  const branchName =
    escapeHtml(
      branchNameRaw,
    )

  const businessAddress =
    escapeHtml(
      businessAddressRaw,
    )

  const businessPhone =
    escapeHtml(
      businessPhoneRaw,
    )

  const terminalName =
    escapeHtml(
      terminalNameRaw,
    )

  const receiptFooter =
    escapeHtml(
      receiptFooterRaw,
    )

  const systemFooter =
    escapeHtml(
      `${businessNameRaw} POS`,
    )

  /* =========================================================
     SALE DATA
  ========================================================= */

  const invoiceNo =
    escapeHtml(
      invoice.sale.invoiceNo,
    )

  const cashierName =
    escapeHtml(
      invoice.sale.staffName ??
        '—',
    )

  const customerName =
    escapeHtml(
      invoice.sale.customerName ??
        'Walk-in Customer',
    )

  const saleDate =
    escapeHtml(
      formatDate(
        invoice.sale.createdAt,
      ),
    )

  const saleType =
    escapeHtml(
      labelText(
        invoice.sale.saleType,
      ),
    )

  const subtotal =
    numberValue(
      invoice.sale.subtotal,
    )

  const discount =
    numberValue(
      invoice.sale.discountAmount,
    )

  const taxAmount =
    numberValue(
      invoice.sale.taxAmount,
    )

  const taxRate =
    numberValue(
      invoice.sale.taxRate,
    )

  const total =
    numberValue(
      invoice.sale.total,
    )

  const paidAmount =
    numberValue(
      invoice.sale.paidAmount,
    )

  const balanceDue =
    numberValue(
      invoice.sale.balanceDue,
    )

  const changeAmount =
    Math.max(
      0,
      paidAmount -
        total,
    )

  /* =========================================================
     ITEMS
  ========================================================= */

  const itemsHtml =
    invoice.items.length ===
    0
      ? `
        <div class="empty-state">
          No items recorded.
        </div>
      `
      : invoice.items
          .map(
            (
              item,
              index,
            ) => {
              const productName =
                escapeHtml(
                  item.productName,
                )

              const barcode =
                escapeHtml(
                  item.barcode,
                )

              const quantity =
                numberValue(
                  item.quantity,
                )

              const unitPrice =
                numberValue(
                  item.unitPrice,
                )

              const itemDiscount =
                numberValue(
                  item.discountAmount,
                )

              const lineTotal =
                numberValue(
                  item.lineTotal,
                )

              return `
                <div class="receipt-item">

                  <div class="receipt-item-top">

                    <strong class="receipt-item-name">
                      ${productName}
                    </strong>

                    <span class="receipt-item-index">
                      #${index + 1}
                    </span>

                  </div>

                  ${
                    barcode
                      ? `
                        <div class="receipt-item-code">
                          ${barcode}
                        </div>
                      `
                      : ''
                  }

                  <div class="receipt-item-row">

                    <span>
                      ${quantity}
                      ×
                      ${money(
                        unitPrice,
                      )}
                    </span>

                    <strong>
                      ${money(
                        lineTotal,
                      )}
                    </strong>

                  </div>

                  ${
                    itemDiscount >
                    0
                      ? `
                        <div class="receipt-discount">
                          Item Discount:
                          -${money(
                            itemDiscount,
                          )}
                        </div>
                      `
                      : ''
                  }

                </div>
              `
            },
          )
          .join('')

  /* =========================================================
     PAYMENTS
  ========================================================= */

  const paymentsHtml =
    invoice.payments.length ===
    0
      ? `
        <div class="receipt-row">

          <span>
            Method
          </span>

          <strong>
            Credit
          </strong>

        </div>
      `
      : invoice.payments
          .map(
            (payment) => {
              const method =
                escapeHtml(
                  labelText(
                    payment.paymentMethod,
                  ),
                )

              const reference =
                escapeHtml(
                  payment.referenceNo,
                )

              return `
                <div class="payment-entry">

                  <div class="receipt-row">

                    <span>
                      ${method}
                    </span>

                    <strong>
                      ${money(
                        numberValue(
                          payment.amount,
                        ),
                      )}
                    </strong>

                  </div>

                  ${
                    reference
                      ? `
                        <div class="receipt-reference">
                          Ref:
                          ${reference}
                        </div>
                      `
                      : ''
                  }

                </div>
              `
            },
          )
          .join('')

  /* =========================================================
     NOTE
  ========================================================= */

  const noteHtml =
    invoice.sale.notes
      ? `
        <div class="receipt-separator"></div>

        <section class="receipt-note">

          <strong>
            Note
          </strong>

          <p>
            ${escapeHtml(
              invoice.sale.notes,
            )}
          </p>

        </section>
      `
      : ''

  /* =========================================================
     TAX
  ========================================================= */

  const taxHtml =
    taxAmount > 0
      ? `
        <div class="receipt-row">

          <span>
            Tax${
              taxRate > 0
                ? ` (${taxRate}%)`
                : ''
            }
          </span>

          <strong>
            ${money(
              taxAmount,
            )}
          </strong>

        </div>
      `
      : ''

  /* =========================================================
     BALANCE
  ========================================================= */

  const balanceHtml =
    balanceDue > 0
      ? `
        <div class="receipt-row balance-due">

          <span>
            Balance Due
          </span>

          <strong>
            ${money(
              balanceDue,
            )}
          </strong>

        </div>
      `
      : `
        <div class="receipt-row">

          <span>
            Balance
          </span>

          <strong>
            ${money(0)}
          </strong>

        </div>
      `

  /* =========================================================
     CHANGE
  ========================================================= */

  const changeHtml =
    changeAmount > 0
      ? `
        <div class="receipt-row receipt-change">

          <span>
            Change
          </span>

          <strong>
            ${money(
              changeAmount,
            )}
          </strong>

        </div>
      `
      : ''

  /* =========================================================
     HTML DOCUMENT
  ========================================================= */

  printWindow.document.open()

  printWindow.document.write(`
    <!doctype html>

    <html lang="en">

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <title>
          ${invoiceNo}
        </title>

        <style>

          @page {
            size: 58mm 210mm;
            margin: 0;
          }

          * {
            box-sizing:
              border-box;
          }

          html,
          body {
            width:
              58mm;

            margin:
              0;

            padding:
              0;

            background:
              #ffffff;

            color:
              #000000;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size:
              10px;

            line-height:
              1.3;

            -webkit-print-color-adjust:
              exact;

            print-color-adjust:
              exact;
          }

          .receipt {
            width:
              48mm;

            margin:
              0 auto;

            padding:
              3mm 0 5mm;
          }

          .receipt-logo {
            display:
              block;

            width:
              22mm;

            max-height:
              15mm;

            margin:
              0 auto 1.5mm;

            object-fit:
              contain;

            filter:
              grayscale(1)
              contrast(1.5);
          }

          .receipt-center {
            text-align:
              center;
          }

          .receipt-business-name {
            margin:
              0;

            font-size:
              15px;

            line-height:
              1.15;

            font-weight:
              800;
          }

          .receipt-business-info {
            margin-top:
              0.7mm;

            font-size:
              8.2px;

            line-height:
              1.35;

            word-break:
              break-word;
          }

          .receipt-terminal {
            display:
              inline-block;

            margin-top:
              1mm;

            padding:
              0.5mm 1.5mm;

            border:
              1px solid #000;

            border-radius:
              2mm;

            font-size:
              7.5px;

            font-weight:
              700;
          }

          .receipt-title {
            margin-top:
              1.5mm;

            font-size:
              8px;

            font-weight:
              700;

            letter-spacing:
              0.5px;

            text-transform:
              uppercase;
          }

          .receipt-separator {
            margin:
              2mm 0;

            border-top:
              1px dashed #000;
          }

          .receipt-meta {
            font-size:
              8.8px;
          }

          .receipt-row {
            display:
              flex;

            align-items:
              flex-start;

            justify-content:
              space-between;

            gap:
              3mm;

            margin:
              0.7mm 0;
          }

          .receipt-row span {
            min-width:
              0;

            flex:
              1;

            overflow-wrap:
              anywhere;
          }

          .receipt-row strong {
            max-width:
              43mm;

            flex-shrink:
              0;

            text-align:
              right;

            overflow-wrap:
              anywhere;
          }

          .receipt-section-title {
            margin-bottom:
              1mm;

            font-size:
              8.5px;

            font-weight:
              800;

            text-transform:
              uppercase;
          }

          .receipt-item {
            padding:
              1.3mm 0;
          }

          .receipt-item +
          .receipt-item {
            border-top:
              1px dotted #777;
          }

          .receipt-item-top {
            display:
              flex;

            align-items:
              flex-start;

            justify-content:
              space-between;

            gap:
              2mm;
          }

          .receipt-item-name {
            flex:
              1;

            font-size:
              9.8px;

            overflow-wrap:
              anywhere;
          }

          .receipt-item-index {
            flex-shrink:
              0;

            font-size:
              7px;
          }

          .receipt-item-code {
            margin-top:
              0.3mm;

            font-size:
              7.2px;

            color:
              #222;

            overflow-wrap:
              anywhere;
          }

          .receipt-item-row {
            display:
              flex;

            justify-content:
              space-between;

            align-items:
              flex-start;

            gap:
              3mm;

            margin-top:
              0.7mm;
          }

          .receipt-item-row span {
            flex:
              1;
          }

          .receipt-item-row strong {
            flex-shrink:
              0;

            text-align:
              right;
          }

          .receipt-discount {
            margin-top:
              0.4mm;

            font-size:
              7.4px;
          }

          .payment-entry +
          .payment-entry {
            margin-top:
              0.6mm;
          }

          .receipt-reference {
            margin:
              -0.1mm 0 0.6mm;

            font-size:
              7.2px;

            overflow-wrap:
              anywhere;
          }

          .receipt-total {
            margin-top:
              1mm;

            padding-top:
              1.5mm;

            border-top:
              1.5px solid #000;

            font-size:
              13px;

            font-weight:
              800;
          }

          .balance-due {
            font-weight:
              800;
          }

          .receipt-change {
            font-weight:
              800;
          }

          .receipt-note {
            font-size:
              8px;
          }

          .receipt-note strong {
            display:
              block;

            margin-bottom:
              0.5mm;
          }

          .receipt-note p {
            margin:
              0;

            white-space:
              pre-wrap;

            overflow-wrap:
              anywhere;
          }

          .receipt-footer {
            margin-top:
              3mm;

            text-align:
              center;
          }

          .receipt-footer-message {
            font-size:
              9.5px;

            line-height:
              1.35;

            font-weight:
              700;

            white-space:
              pre-line;

            overflow-wrap:
              anywhere;
          }

          .receipt-footer-small {
            margin-top:
              1.2mm;

            font-size:
              7px;
          }

          .receipt-footer-system {
            margin-top:
              0.8mm;

            font-size:
              6.8px;
          }

          .empty-state {
            padding:
              2mm 0;

            text-align:
              center;

            font-size:
              8px;
          }

          @media print {

            html,
            body {
              width:
                58mm
                !important;

              min-width:
                58mm
                !important;

              max-width:
                58mm
                !important;

              margin:
                0
                !important;

              padding:
                0
                !important;

              overflow:
                visible
                !important;
            }

            .receipt {
              width:
                48mm
                !important;

              margin:
                0 auto
                !important;

              padding-bottom:
                2mm
                !important;
            }

          }

        </style>

      </head>

      <body>

        <main class="receipt">

          <header>

            <img
              id="receipt-logo"
              class="receipt-logo"
              src="${deshanTextileLogo}"
              alt="${businessName}"
            />

            <section class="receipt-center">

              <h1 class="receipt-business-name">
                ${businessName}
              </h1>

              <div class="receipt-business-info">

                ${
                  branchName
                    ? `
                      <div>
                        ${branchName}
                      </div>
                    `
                    : ''
                }

                ${
                  showBusinessAddress &&
                  businessAddress
                    ? `
                      <div>
                        ${businessAddress}
                      </div>
                    `
                    : ''
                }

                ${
                  showBusinessPhone &&
                  businessPhone
                    ? `
                      <div>
                        Tel:
                        ${businessPhone}
                      </div>
                    `
                    : ''
                }

                ${
                  terminalName
                    ? `
                      <div>
                        <span class="receipt-terminal">
                          ${terminalName}
                        </span>
                      </div>
                    `
                    : ''
                }

              </div>

              <div class="receipt-title">
                Sales Receipt
              </div>

            </section>

          </header>

          <div class="receipt-separator"></div>

          <section class="receipt-meta">

            <div class="receipt-row">
              <span>
                Invoice
              </span>

              <strong>
                ${invoiceNo}
              </strong>
            </div>

            <div class="receipt-row">
              <span>
                Date
              </span>

              <strong>
                ${saleDate}
              </strong>
            </div>

            <div class="receipt-row">
              <span>
                Cashier
              </span>

              <strong>
                ${cashierName}
              </strong>
            </div>

            <div class="receipt-row">
              <span>
                Customer
              </span>

              <strong>
                ${customerName}
              </strong>
            </div>

            <div class="receipt-row">
              <span>
                Sale Type
              </span>

              <strong>
                ${saleType}
              </strong>
            </div>

          </section>

          <div class="receipt-separator"></div>

          <section>

            <div class="receipt-section-title">
              Items
            </div>

            ${itemsHtml}

          </section>

          <div class="receipt-separator"></div>

          <section>

            <div class="receipt-row">

              <span>
                Subtotal
              </span>

              <strong>
                ${money(
                  subtotal,
                )}
              </strong>

            </div>

            ${
              discount > 0
                ? `
                  <div class="receipt-row">

                    <span>
                      Discount
                    </span>

                    <strong>
                      -${money(
                        discount,
                      )}
                    </strong>

                  </div>
                `
                : ''
            }

            ${taxHtml}

            <div class="receipt-row receipt-total">

              <span>
                TOTAL
              </span>

              <strong>
                ${money(
                  total,
                )}
              </strong>

            </div>

            <div class="receipt-row">

              <span>
                Paid
              </span>

              <strong>
                ${money(
                  paidAmount,
                )}
              </strong>

            </div>

            ${balanceHtml}

            ${changeHtml}

          </section>

          <div class="receipt-separator"></div>

          <section>

            <div class="receipt-section-title">
              Payment
            </div>

            ${paymentsHtml}

          </section>

          ${noteHtml}

          <footer class="receipt-footer">

            ${
              receiptFooter
                ? `
                  <div class="receipt-footer-message">
                    ${receiptFooter}
                  </div>
                `
                : ''
            }

            <div class="receipt-footer-small">
              ${invoiceNo}
            </div>

            <div class="receipt-footer-system">
              Powered by ${systemFooter}
            </div>

          </footer>

        </main>

        <script>

          (function () {

            let printStarted =
              false;

            function applyDynamicPageSize() {

              const receipt =
                document.querySelector(
                  '.receipt'
                );

              if (!receipt) {
                return;
              }

              const pixelsPerMillimeter =
                96 / 25.4;

              const measuredHeight =
                Math.ceil(
                  receipt.scrollHeight /
                  pixelsPerMillimeter
                );

              // Small feed allowance prevents the last line
              // from sitting on the tear/cut edge.
              const pageHeight =
                Math.max(
                  60,
                  measuredHeight + 6
                );

              let pageStyle =
                document.getElementById(
                  'dynamic-receipt-page-size'
                );

              if (!pageStyle) {
                pageStyle =
                  document.createElement(
                    'style'
                  );

                pageStyle.id =
                  'dynamic-receipt-page-size';

                document.head.appendChild(
                  pageStyle
                );
              }

              pageStyle.textContent =
                '@page { size: 58mm ' +
                pageHeight +
                'mm; margin: 0; }';

            }

            function printReceipt() {

              if (
                printStarted
              ) {
                return;
              }

              applyDynamicPageSize();

              printStarted =
                true;

              window.focus();

              setTimeout(
                function () {
                  window.print();
                },
                150
              );
            }

            function waitForImages() {

              const images =
                Array.from(
                  document.images
                );

              if (
                images.length ===
                0
              ) {
                printReceipt();
                return;
              }

              let remaining =
                images.length;

              function completed() {

                remaining -=
                  1;

                if (
                  remaining <=
                  0
                ) {
                  printReceipt();
                }

              }

              images.forEach(
                function (
                  image
                ) {

                  if (
                    image.complete
                  ) {
                    completed();
                    return;
                  }

                  image.addEventListener(
                    'load',
                    completed,
                    {
                      once: true
                    }
                  );

                  image.addEventListener(
                    'error',
                    completed,
                    {
                      once: true
                    }
                  );

                }
              );

              setTimeout(
                printReceipt,
                1200
              );

            }

            window.addEventListener(
              'load',
              waitForImages
            );

            window.addEventListener(
              'afterprint',
              function () {

                setTimeout(
                  function () {
                    window.close();
                  },
                  100
                );

              }
            );

          })();

        </script>

      </body>

    </html>
  `)

  printWindow.document.close()
}