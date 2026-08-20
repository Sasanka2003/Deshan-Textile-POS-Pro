import type {
  PurchaseReturnReceiptDetail,
} from '../types/purchaseReturn'

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

export function printPurchaseReturnReceipt(
  receipt:
    PurchaseReturnReceiptDetail,
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

  const businessName =
    escapeHtml(
      receipt.businessName,
    )

  const branchName =
    escapeHtml(
      receipt.branchName,
    )

  const branchAddress =
    escapeHtml(
      receipt.branchAddress,
    )

  const branchPhone =
    escapeHtml(
      receipt.branchPhone,
    )

  const returnNo =
    escapeHtml(
      receipt.returnNo,
    )

  const grnNo =
    escapeHtml(
      receipt.grnNo,
    )

  const supplierName =
    escapeHtml(
      receipt.supplierName,
    )

  const supplierInvoice =
    escapeHtml(
      receipt.supplierInvoiceNo ??
        '—',
    )

  const returnedBy =
    escapeHtml(
      receipt.staffName ??
        '—',
    )

  const createdAt =
    escapeHtml(
      formatDate(
        receipt.createdAt,
      ),
    )

  const reason =
    escapeHtml(
      receipt.reason,
    )

  const itemsHtml =
    receipt.items.length ===
    0
      ? `
        <div class="empty-state">
          No return items recorded.
        </div>
      `
      : receipt.items
          .map(
            (
              item,
              index,
            ) => {
              const productName =
                escapeHtml(
                  item.productName,
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

                    <strong>
                      ${productName}
                    </strong>

                    <span>
                      #${index + 1}
                    </span>

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
                        item.unitCost,
                      )}
                    </span>

                    <strong>
                      ${money(
                        item.lineRefund,
                      )}
                    </strong>

                  </div>

                  ${
                    item.lineDiscount >
                    0
                      ? `
                        <div class="discount">
                          Item Discount:
                          -${money(
                            item.lineDiscount,
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
          ${returnNo}
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

            margin: 0;
            padding: 0;

            background: #ffffff;
            color: #000000;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            font-size: 10px;
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

          .center {
            text-align: center;
          }

          .logo {
            display: block;

            width: 22mm;
            max-height: 15mm;

            margin:
              0
              auto
              1.5mm;

            object-fit: contain;

            filter:
              grayscale(1)
              contrast(1.5);
          }

          h1 {
            margin: 0;

            font-size: 15px;

            line-height: 1.15;

            font-weight: 800;
          }

          .business-info {
            margin-top: 0.7mm;

            font-size: 8px;

            line-height: 1.35;

            overflow-wrap: anywhere;
          }

          .title {
            margin-top: 1.5mm;

            font-size: 9px;

            font-weight: 800;

            text-transform: uppercase;
          }

          .return-no {
            margin-top: 0.7mm;

            font-size: 10px;

            font-weight: 800;
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
            display: flex;

            align-items:
              flex-start;

            justify-content:
              space-between;

            gap: 3mm;

            margin:
              0.9mm
              0;

            font-size: 9px;
          }

          .row span {
            min-width: 0;
            flex: 1;

            overflow-wrap: anywhere;
          }

          .row strong {
            flex-shrink: 0;

            max-width: 43mm;

            text-align: right;

            overflow-wrap: anywhere;
          }

          .section-title {
            margin-bottom: 1mm;

            font-size: 8.5px;

            font-weight: 800;

            text-transform: uppercase;
          }

          .item {
            padding:
              1.3mm
              0;
          }

          .item + .item {
            border-top:
              1px
              dotted
              #888;
          }

          .item-top {
            display: flex;

            justify-content:
              space-between;

            align-items:
              flex-start;

            gap: 2mm;
          }

          .item-top strong {
            flex: 1;

            font-size: 10px;

            overflow-wrap: anywhere;
          }

          .item-top span {
            font-size: 7px;
          }

          .item-code {
            margin-top: 0.4mm;

            font-size: 7.5px;

            overflow-wrap: anywhere;
          }

          .discount {
            margin-top: 0.5mm;

            font-size: 7.5px;
          }

          .total {
            margin-top: 1mm;

            padding-top: 1.5mm;

            border-top:
              1.5px
              solid
              #000;

            font-size: 13px;

            font-weight: 800;
          }

          .note {
            font-size: 8px;

            line-height: 1.4;

            white-space: pre-wrap;

            overflow-wrap: anywhere;
          }

          .footer {
            margin-top: 3mm;

            text-align: center;
          }

          .footer-main {
            font-size: 9px;

            font-weight: 700;
          }

          .footer-number {
            margin-top: 1mm;

            font-size: 7px;
          }

          .footer-system {
            margin-top: 0.7mm;

            font-size: 6.8px;
          }

          .empty-state {
            padding: 2mm 0;

            text-align: center;

            font-size: 8px;
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
                branchAddress
                  ? `
                    <div>
                      ${branchAddress}
                    </div>
                  `
                  : ''
              }

              ${
                branchPhone
                  ? `
                    <div>
                      Tel: ${branchPhone}
                    </div>
                  `
                  : ''
              }

            </div>

            <div class="title">
              Purchase Return Note
            </div>

            <div class="return-no">
              ${returnNo}
            </div>

          </header>

          <div class="separator"></div>

          <section>

            <div class="row">

              <span>
                Date
              </span>

              <strong>
                ${createdAt}
              </strong>

            </div>

            <div class="row">

              <span>
                Original GRN
              </span>

              <strong>
                ${grnNo}
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
                ${supplierInvoice}
              </strong>

            </div>

            <div class="row">

              <span>
                Returned By
              </span>

              <strong>
                ${returnedBy}
              </strong>

            </div>

          </section>

          <div class="separator"></div>

          <section>

            <div class="section-title">
              Returned Items
            </div>

            ${itemsHtml}

          </section>

          <div class="separator"></div>

          <section>

            <div class="row total">

              <span>
                TOTAL CREDIT
              </span>

              <strong>
                ${money(
                  receipt.refundAmount,
                )}
              </strong>

            </div>

          </section>

          ${
            reason
              ? `
                <div class="separator"></div>

                <section class="note">

                  <strong>
                    Return Reason:
                  </strong>

                  ${reason}

                </section>
              `
              : ''
          }

          <div class="separator"></div>

          <footer class="footer">

            <div class="footer-main">
              Purchase return recorded.
            </div>

            <div class="footer-number">
              ${returnNo}
            </div>

            <div class="footer-system">
              Powered by ${businessName} POS
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

              function complete() {

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
                    complete();
                    return;
                  }

                  image.addEventListener(
                    'load',
                    complete,
                    {
                      once: true
                    }
                  );

                  image.addEventListener(
                    'error',
                    complete,
                    {
                      once: true
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