import type {
  PurchaseDetail,
} from '../types/purchase'

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
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  )}`
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

export function printPurchaseReceipt(
  purchase: PurchaseDetail,

  settings?:
    BusinessSettings | null,
) {
  const printWindow =
    window.open(
      '',
      '_blank',
      [
        'width=420',
        'height=750',
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
      'Unable to open print window. Please allow pop-ups.',
    )
  }

  /* =========================================================
     BUSINESS SETTINGS
  ========================================================= */

  const businessNameRaw =
    settings?.businessName ||
    'Deshan Textile'

  const branchNameRaw =
    settings?.branchName ??
    ''

  const businessAddressRaw =
    settings?.businessAddress ??
    ''

  const businessPhoneRaw =
    settings?.businessPhone ||
    settings?.branchPhone ||
    ''

  const terminalNameRaw =
    settings?.terminalName ??
    ''

  const receiptFooterRaw =
    settings?.receiptFooter ??
    'Thank you.'

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
     PURCHASE DATA
  ========================================================= */

  const grnNo =
    escapeHtml(
      purchase.grn_no,
    )

  const supplierName =
    escapeHtml(
      purchase.supplier?.name ??
      'Unknown Supplier',
    )

  const supplierInvoiceNo =
    escapeHtml(
      purchase.supplier_invoice_no ??
      '—',
    )

  const receivedBy =
    escapeHtml(
      purchase.staff?.full_name ??
      '—',
    )

  const receivedAt =
    escapeHtml(
      formatDate(
        purchase.received_at,
      ),
    )

  const purchaseNote =
    escapeHtml(
      purchase.notes,
    )

  /* =========================================================
     ITEMS
  ========================================================= */

  const itemsHtml =
    purchase.items.length ===
    0
      ? `
        <div class="empty-state">
          No purchase items recorded.
        </div>
      `
      : purchase.items
          .map(
            (
              item,
              index,
            ) => {
              const productName =
                escapeHtml(
                  item.product_name,
                )

              const productCode =
                escapeHtml(
                  item.sku ??
                  item.barcode ??
                  '',
                )

              const unit =
                escapeHtml(
                  item.unit,
                )

              return `
                <div class="item">

                  <div class="item-top">

                    <div class="item-name">
                      ${productName}
                    </div>

                    <div class="item-index">
                      #${index + 1}
                    </div>

                  </div>

                  ${
                    productCode
                      ? `
                        <div class="item-code">
                          ${productCode}
                        </div>
                      `
                      : ''
                  }

                  <div class="row">

                    <span>
                      ${item.quantity}
                      ${unit}
                      ×
                      ${money(
                        item.unit_cost,
                      )}
                    </span>

                    <strong>
                      ${money(
                        item.line_total,
                      )}
                    </strong>

                  </div>

                  ${
                    item.line_discount >
                    0
                      ? `
                        <div class="discount">
                          Item Discount:
                          -${money(
                            item.line_discount,
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
     HTML
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
          ${grnNo}
        </title>

        <style>

          @page {
            size:
              58mm
              auto;

            margin:
              0;
          }

          * {
            box-sizing:
              border-box;
          }

          html,
          body {
            width:
              58mm;

            min-width:
              58mm;

            max-width:
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
              0
              auto;

            padding:
              3mm
              0
              4mm;
          }

          .center {
            text-align:
              center;
          }

          .logo {
            display:
              block;

            width:
              22mm;

            max-height:
              15mm;

            margin:
              0
              auto
              1.5mm;

            object-fit:
              contain;

            filter:
              grayscale(1)
              contrast(1.5);
          }

          h1 {
            margin:
              0;

            font-size:
              15px;

            line-height:
              1.15;

            font-weight:
              800;
          }

          .business-info {
            margin-top:
              0.7mm;

            font-size:
              8px;

            line-height:
              1.35;

            overflow-wrap:
              anywhere;
          }

          .terminal {
            display:
              inline-block;

            margin-top:
              1mm;

            padding:
              0.5mm
              1.5mm;

            border:
              1px
              solid
              #000;

            border-radius:
              2mm;

            font-size:
              7.5px;

            font-weight:
              700;
          }

          .title {
            margin-top:
              1.5mm;

            font-size:
              9px;

            font-weight:
              800;

            text-transform:
              uppercase;
          }

          .grn {
            margin-top:
              0.7mm;

            font-size:
              10px;

            font-weight:
              800;
          }

          .separator {
            margin:
              2mm
              0;

            border-top:
              1px
              dashed
              #000;
          }

          .row {
            display:
              flex;

            align-items:
              flex-start;

            justify-content:
              space-between;

            gap:
              3mm;

            margin:
              0.9mm
              0;

            font-size:
              9px;
          }

          .row span {
            min-width:
              0;

            flex:
              1;

            overflow-wrap:
              anywhere;
          }

          .row strong {
            flex-shrink:
              0;

            max-width:
              43mm;

            text-align:
              right;

            overflow-wrap:
              anywhere;
          }

          .section-title {
            margin-bottom:
              1mm;

            font-size:
              8.5px;

            font-weight:
              800;

            text-transform:
              uppercase;
          }

          .item {
            padding:
              1.3mm
              0;
          }

          .item +
          .item {
            border-top:
              1px
              dotted
              #888;
          }

          .item-top {
            display:
              flex;

            justify-content:
              space-between;

            align-items:
              flex-start;

            gap:
              2mm;
          }

          .item-name {
            flex:
              1;

            font-size:
              10px;

            font-weight:
              700;

            overflow-wrap:
              anywhere;
          }

          .item-index {
            flex-shrink:
              0;

            font-size:
              7px;
          }

          .item-code {
            margin-top:
              0.4mm;

            font-size:
              7.5px;

            overflow-wrap:
              anywhere;
          }

          .discount {
            margin-top:
              0.5mm;

            font-size:
              7.5px;
          }

          .total {
            margin-top:
              1mm;

            padding-top:
              1.5mm;

            border-top:
              1.5px
              solid
              #000;

            font-size:
              13px;

            font-weight:
              800;
          }

          .credit {
            font-weight:
              800;
          }

          .note {
            font-size:
              8px;

            line-height:
              1.4;

            white-space:
              pre-wrap;

            overflow-wrap:
              anywhere;
          }

          .footer {
            margin-top:
              3mm;

            text-align:
              center;
          }

          .footer-message {
            font-size:
              9px;

            line-height:
              1.35;

            font-weight:
              700;

            white-space:
              pre-line;

            overflow-wrap:
              anywhere;
          }

          .footer-grn {
            margin-top:
              1mm;

            font-size:
              7px;
          }

          .footer-system {
            margin-top:
              0.7mm;

            font-size:
              6.8px;
          }

          .empty-state {
            padding:
              2mm
              0;

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
                0
                auto
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

          <header class="center">

            <img
              class="logo"
              src="${deshanTextileLogo}"
              alt="${businessName}"
            />

            <h1>
              ${businessName}
            </h1>

            <div class="business-info">

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
                      <span class="terminal">
                        ${terminalName}
                      </span>
                    </div>
                  `
                  : ''
              }

            </div>

            <div class="title">
              Goods Received Note
            </div>

            <div class="grn">
              ${grnNo}
            </div>

          </header>

          <div class="separator"></div>

          <section>

            <div class="row">

              <span>
                Date
              </span>

              <strong>
                ${receivedAt}
              </strong>

            </div>

            <div class="row">

              <span>
                Supplier
              </span>

              <strong>
                ${supplierName}
              </strong>

            </div>

            <div class="row">

              <span>
                Supplier Invoice
              </span>

              <strong>
                ${supplierInvoiceNo}
              </strong>

            </div>

            <div class="row">

              <span>
                Received By
              </span>

              <strong>
                ${receivedBy}
              </strong>

            </div>

          </section>

          <div class="separator"></div>

          <section>

            <div class="section-title">
              Items
            </div>

            ${itemsHtml}

          </section>

          <div class="separator"></div>

          <section>

            <div class="row">

              <span>
                Subtotal
              </span>

              <strong>
                ${money(
                  purchase.subtotal,
                )}
              </strong>

            </div>

            ${
              purchase.discount_amount >
              0
                ? `
                  <div class="row">

                    <span>
                      Discount
                    </span>

                    <strong>
                      -${money(
                        purchase.discount_amount,
                      )}
                    </strong>

                  </div>
                `
                : ''
            }

            <div class="row total">

              <span>
                TOTAL
              </span>

              <strong>
                ${money(
                  purchase.total,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Paid
              </span>

              <strong>
                ${money(
                  purchase.paid_amount,
                )}
              </strong>

            </div>

            <div class="row credit">

              <span>
                Supplier Credit
              </span>

              <strong>
                ${money(
                  purchase.balance_due,
                )}
              </strong>

            </div>

          </section>

          ${
            purchaseNote
              ? `
                <div class="separator"></div>

                <section class="note">

                  <strong>
                    Notes:
                  </strong>

                  ${purchaseNote}

                </section>
              `
              : ''
          }

          <div class="separator"></div>

          <footer class="footer">

            ${
              receiptFooter
                ? `
                  <div class="footer-message">
                    ${receiptFooter}
                  </div>
                `
                : ''
            }

            <div class="footer-grn">
              ${grnNo}
            </div>

            <div class="footer-system">
              Powered by ${systemFooter}
            </div>

          </footer>

        </main>

        <script>

          (function () {

            let printStarted =
              false;

            function startPrint() {

              if (
                printStarted
              ) {
                return;
              }

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
                startPrint();
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
                  startPrint();
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
                      once:
                        true
                    }
                  );

                  image.addEventListener(
                    'error',
                    completed,
                    {
                      once:
                        true
                    }
                  );

                }
              );

              setTimeout(
                startPrint,
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