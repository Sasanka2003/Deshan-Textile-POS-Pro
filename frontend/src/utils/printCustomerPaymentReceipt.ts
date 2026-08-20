import type {
  CustomerPaymentReceipt,
} from '../types/customerPayment'

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

export function printCustomerPaymentReceipt(
  receipt:
    CustomerPaymentReceipt,

  settings?:
    BusinessSettings | null,
) {
  const printWindow =
    window.open(
      '',
      '_blank',
      [
        'width=420',
        'height=720',
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

  /*
   * =========================================================
   * BUSINESS SETTINGS
   * =========================================================
   */

  const businessNameRaw =
    settings
      ? settings.businessName
      : receipt.business?.name ||
        'Deshan Textile'

  const branchNameRaw =
    settings
      ? settings.branchName ??
        ''
      : receipt.branch?.name ??
        ''

  const businessAddressRaw =
    settings
      ? settings.businessAddress ??
        ''
      : receipt.branch?.address ??
        receipt.business?.address ??
        ''

  const businessPhoneRaw =
    settings
      ? settings.businessPhone ||
        settings.branchPhone ||
        ''
      : receipt.branch?.phone ??
        receipt.business?.phone ??
        ''

  const terminalNameRaw =
    settings?.terminalName ??
    ''

  const receiptFooterRaw =
    settings
      ? settings.receiptFooter ??
        ''
      : 'Thank you.'

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

  /*
   * =========================================================
   * PAYMENT DATA
   * =========================================================
   */

  const customer =
    escapeHtml(
      receipt.customer?.name ??
        'Unknown Customer',
    )

  const customerPhone =
    escapeHtml(
      receipt.customer?.phone,
    )

  const staff =
    escapeHtml(
      receipt.staff?.fullName ??
        '—',
    )

  const method =
    escapeHtml(
      labelText(
        receipt.paymentMethod,
      ),
    )

  const reference =
    escapeHtml(
      receipt.referenceNo,
    )

  const note =
    escapeHtml(
      receipt.note,
    )

  const receiptNo =
    escapeHtml(
      receipt.receiptNo,
    )

  const paymentId =
    escapeHtml(
      receipt.id,
    )

  const paymentDate =
    escapeHtml(
      formatDate(
        receipt.createdAt,
      ),
    )

  /*
   * =========================================================
   * HTML DOCUMENT
   * =========================================================
   */

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
          Customer Payment ${receiptNo}
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

          .business-name {
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

          .receipt-title {
            margin-top:
              1.5mm;

            font-size:
              9px;

            line-height:
              1.3;

            font-weight:
              800;

            text-transform:
              uppercase;
          }

          .receipt-number {
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

          .amount-row {
            margin:
              1.5mm
              0;

            padding:
              1.7mm
              0;

            border-top:
              1px
              solid
              #000;

            border-bottom:
              1px
              solid
              #000;

            font-size:
              12px;

            font-weight:
              800;
          }

          .amount-row span,
          .amount-row strong {
            font-size:
              12px;

            font-weight:
              800;
          }

          .remaining-row {
            font-weight:
              800;
          }

          .reference {
            font-size:
              8px;
          }

          .note {
            font-size:
              8px;

            line-height:
              1.45;

            white-space:
              pre-wrap;

            overflow-wrap:
              anywhere;
          }

          .note-title {
            display:
              block;

            margin-bottom:
              0.7mm;

            font-weight:
              800;
          }

          .footer {
            margin-top:
              3mm;

            text-align:
              center;
          }

          .footer-main {
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

          .footer-receipt {
            margin-top:
              1mm;

            font-size:
              7.5px;
          }

          .payment-id {
            margin-top:
              0.5mm;

            font-size:
              6.8px;

            overflow-wrap:
              anywhere;
          }

          .footer-system {
            margin-top:
              0.8mm;

            font-size:
              6.8px;
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

            <h1 class="business-name">
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

            <div class="receipt-title">
              Customer Payment Receipt
            </div>

            <div class="receipt-number">
              ${receiptNo}
            </div>

          </header>

          <div class="separator"></div>

          <section>

            <div class="row">

              <span>
                Date
              </span>

              <strong>
                ${paymentDate}
              </strong>

            </div>

            <div class="row">

              <span>
                Customer
              </span>

              <strong>
                ${customer}
              </strong>

            </div>

            ${
              customerPhone
                ? `
                  <div class="row">

                    <span>
                      Customer Phone
                    </span>

                    <strong>
                      ${customerPhone}
                    </strong>

                  </div>
                `
                : ''
            }

            <div class="row">

              <span>
                Received By
              </span>

              <strong>
                ${staff}
              </strong>

            </div>

            <div class="row">

              <span>
                Method
              </span>

              <strong>
                ${method}
              </strong>

            </div>

            ${
              reference
                ? `
                  <div class="row reference">

                    <span>
                      Reference
                    </span>

                    <strong>
                      ${reference}
                    </strong>

                  </div>
                `
                : ''
            }

          </section>

          <div class="separator"></div>

          <section>

            <div class="row">

              <span>
                Previous Balance
              </span>

              <strong>
                ${money(
                  receipt.previousBalance,
                )}
              </strong>

            </div>

            <div class="row amount-row">

              <span>
                Amount Received
              </span>

              <strong>
                ${money(
                  receipt.amount,
                )}
              </strong>

            </div>

            <div class="row remaining-row">

              <span>
                Remaining Balance
              </span>

              <strong>
                ${money(
                  receipt.remainingBalance,
                )}
              </strong>

            </div>

          </section>

          ${
            note
              ? `
                <div class="separator"></div>

                <section class="note">

                  <strong class="note-title">
                    Note
                  </strong>

                  ${note}

                </section>
              `
              : ''
          }

          <div class="separator"></div>

          <footer class="footer">

            ${
              receiptFooter
                ? `
                  <div class="footer-main">
                    ${receiptFooter}
                  </div>
                `
                : ''
            }

            <div class="footer-receipt">
              Receipt No:
              ${receiptNo}
            </div>

            ${
              paymentId
                ? `
                  <div class="payment-id">
                    Payment ID:
                    ${paymentId}
                  </div>
                `
                : ''
            }

            <div class="footer-system">
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