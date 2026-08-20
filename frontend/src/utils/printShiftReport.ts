import type {
  ShiftDetailSummary,
  ShiftHistoryItem,
} from '../services/shiftService'

import deshanTextileLogo from '../assets/deshan-textile-logo.png'

function money(
  value: number,
) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function signedMoney(
  value: number,
) {
  if (value > 0) {
    return `+${money(
      value,
    )}`
  }

  if (value < 0) {
    return `-${money(
      Math.abs(
        value,
      ),
    )}`
  }

  return money(0)
}

function formatDateTime(
  value:
    | string
    | null,
) {
  if (!value) {
    return '—'
  }

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

function escapeHtml(
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

export function printShiftReport(
  shift:
    ShiftHistoryItem,
  detail:
    ShiftDetailSummary,
) {
  const printWindow =
    window.open(
      '',
      '_blank',
      'width=320,height=760',
    )

  if (!printWindow) {
    throw new Error(
      'Unable to open print window. Please allow pop-ups for this site.',
    )
  }

  const cashierName =
    escapeHtml(
      shift.cashierName,
    )

  const terminalName =
    escapeHtml(
      shift.terminalName ??
        'POS Terminal',
    )

  const openingNote =
    escapeHtml(
      shift.openingNote,
    )

  const closingNote =
    escapeHtml(
      shift.closingNote,
    )

  const openedAt =
    escapeHtml(
      formatDateTime(
        shift.openedAt,
      ),
    )

  const closedAt =
    escapeHtml(
      formatDateTime(
        shift.closedAt,
      ),
    )

  const status =
    escapeHtml(
      shift.status
        .charAt(0)
        .toUpperCase() +
        shift.status.slice(1),
    )

  const closeType =
    shift.status ===
    'open'
      ? 'OPEN'
      : shift.closeType ===
          'emergency'
        ? 'EMERGENCY'
        : 'NORMAL'

  const closedBy =
    escapeHtml(
      shift.closedByName ??
        shift.closedBy ??
        '',
    )

  const emergencyReason =
    escapeHtml(
      shift.emergencyCloseReason,
    )

  const difference =
    shift.cashDifference ??
    0

  const differenceLabel =
    shift.cashDifference ===
    null
      ? 'Not Reconciled'
      : difference ===
          0
        ? 'Balanced'
        : difference >
            0
          ? 'Cash Over'
          : 'Cash Short'

  const emergencyAuditHtml =
    shift.closeType ===
      'emergency' &&
    shift.status ===
      'closed'
      ? `
        <div class="separator"></div>

        <section class="audit-section">

          <div class="audit-title">
            EMERGENCY CLOSE
          </div>

          <div class="row">

            <span>
              Closed By
            </span>

            <strong>
              ${
                closedBy ||
                'Unknown Manager'
              }
            </strong>

          </div>

          <div class="row">

            <span>
              Closed At
            </span>

            <strong>
              ${closedAt}
            </strong>

          </div>

          ${
            emergencyReason
              ? `
                <div class="audit-reason">

                  <strong>
                    Reason:
                  </strong>

                  ${emergencyReason}

                </div>
              `
              : ''
          }

        </section>
      `
      : ''

  const movementsHtml =
    detail.movements.length ===
    0
      ? `
        <div class="movement-empty">
          No cash drawer movements recorded.
        </div>
      `
      : detail.movements
          .map(
            (
              movement,
            ) => {
              const isCashIn =
                movement.movementType ===
                'cash_in'

              const movementLabel =
                isCashIn
                  ? 'CASH IN'
                  : 'CASH OUT'

              const amountLabel =
                isCashIn
                  ? `+${money(
                      movement.amount,
                    )}`
                  : `-${money(
                      movement.amount,
                    )}`

              const reason =
                escapeHtml(
                  movement.reason,
                )

              const reference =
                escapeHtml(
                  movement.referenceNo,
                )

              const createdAt =
                escapeHtml(
                  formatDateTime(
                    movement.createdAt,
                  ),
                )

              return `
                <div class="movement-item">

                  <div class="movement-top">

                    <strong>
                      ${movementLabel}
                    </strong>

                    <strong>
                      ${amountLabel}
                    </strong>

                  </div>

                  <div class="movement-reason">
                    ${reason}
                  </div>

                  <div class="movement-meta">

                    <span>
                      ${createdAt}
                    </span>

                    ${
                      reference
                        ? `
                          <span>
                            Ref: ${reference}
                          </span>
                        `
                        : ''
                    }

                  </div>

                </div>
              `
            },
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
          Shift Report
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

          .report {
            width: 48mm;

            margin:
              0 auto;

            padding:
              3mm
              0
              4mm;
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

          .center {
            text-align: center;
          }

          h1 {
            margin: 0;

            font-size: 15px;

            line-height: 1.15;

            font-weight: 800;
          }

          .subtitle {
            margin-top: 0.8mm;

            font-size: 9px;

            font-weight: 700;
          }

          .small {
            margin-top: 0.5mm;

            font-size: 8px;
          }

          .separator {
            margin:
              2.2mm
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
              0.8mm
              0;
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

          .section-title {
            margin-bottom:
              1mm;

            font-size:
              10px;

            font-weight:
              800;

            text-transform:
              uppercase;
          }

          .total-row {
            margin-top:
              1mm;

            padding-top:
              1.4mm;

            border-top:
              1px solid
              #000;

            font-size:
              12px;

            font-weight:
              800;
          }

          .difference {
            margin-top:
              1.5mm;

            padding:
              1.5mm
              0;

            border-top:
              1px solid
              #000;

            border-bottom:
              1px solid
              #000;

            font-size:
              11px;

            font-weight:
              800;
          }

          .formula {
            margin-top:
              1.5mm;

            padding:
              1.5mm;

            border:
              1px dotted
              #000;

            font-size:
              8px;

            line-height:
              1.4;
          }

          .formula-title {
            margin-bottom:
              0.7mm;

            font-weight:
              800;

            text-transform:
              uppercase;
          }

          .audit-section {
            border:
              1px
              solid
              #000;

            padding:
              1.8mm;
          }

          .audit-title {
            margin-bottom:
              1.2mm;

            padding-bottom:
              1mm;

            border-bottom:
              1px
              solid
              #000;

            text-align:
              center;

            font-size:
              10px;

            font-weight:
              900;
          }

          .audit-reason {
            margin-top:
              1.3mm;

            padding-top:
              1.2mm;

            border-top:
              1px
              dotted
              #000;

            font-size:
              8px;

            line-height:
              1.35;

            white-space:
              normal;

            overflow-wrap:
              anywhere;
          }

          .audit-reason strong {
            display: inline;

            margin-right:
              1mm;
          }

          .movement-summary {
            padding-bottom:
              1mm;

            border-bottom:
              1px solid
              #000;
          }

          .movement-list {
            margin-top:
              1mm;
          }

          .movement-item {
            padding:
              1.2mm
              0;

            border-bottom:
              1px dotted
              #777;
          }

          .movement-item:last-child {
            border-bottom:
              0;
          }

          .movement-top {
            display: flex;

            justify-content:
              space-between;

            gap: 3mm;

            font-size:
              9px;
          }

          .movement-top strong:last-child {
            white-space:
              nowrap;

            text-align:
              right;
          }

          .movement-reason {
            margin-top:
              0.5mm;

            font-size:
              8px;

            font-weight:
              700;

            overflow-wrap:
              anywhere;
          }

          .movement-meta {
            display: flex;

            justify-content:
              space-between;

            gap: 2mm;

            margin-top:
              0.5mm;

            color: #333;

            font-size:
              7px;
          }

          .movement-meta span {
            overflow-wrap:
              anywhere;
          }

          .movement-empty {
            padding:
              1.5mm
              0;

            font-size:
              8px;
          }

          .note {
            font-size:
              8px;

            white-space:
              pre-line;
          }

          .footer {
            margin-top:
              3mm;

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
            }

            .report {
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

        <main class="report">

          <img
            class="logo"
            src="${deshanTextileLogo}"
            alt="Deshan Textile"
          />

          <section class="center">

            <h1>
              Deshan Textile
            </h1>

            <div class="subtitle">
              Shift Reconciliation Report
            </div>

            <div class="small">
              ${terminalName}
            </div>

          </section>

          <div class="separator"></div>

          <section>

            <div class="row">

              <span>
                Cashier
              </span>

              <strong>
                ${cashierName}
              </strong>

            </div>

            <div class="row">

              <span>
                Staff ID
              </span>

              <strong>
                ${escapeHtml(
                  shift.staffId.slice(
                    0,
                    8,
                  ),
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Status
              </span>

              <strong>
                ${status}
              </strong>

            </div>

            <div class="row">

              <span>
                Close Type
              </span>

              <strong>
                ${closeType}
              </strong>

            </div>

            ${
              shift.status ===
                'closed' &&
              closedBy
                ? `
                  <div class="row">

                    <span>
                      Closed By
                    </span>

                    <strong>
                      ${closedBy}
                    </strong>

                  </div>
                `
                : ''
            }

            <div class="row">

              <span>
                Opened
              </span>

              <strong>
                ${openedAt}
              </strong>

            </div>

            <div class="row">

              <span>
                Closed
              </span>

              <strong>
                ${closedAt}
              </strong>

            </div>

          </section>

          ${emergencyAuditHtml}

          <div class="separator"></div>

          <section>

            <div class="section-title">
              Shift Cash
            </div>

            <div class="row">

              <span>
                Opening Cash
              </span>

              <strong>
                ${money(
                  shift.openingCash,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Cash Sales
              </span>

              <strong>
                ${money(
                  shift.cashSales,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Customer Cash Payments
              </span>

              <strong>
                ${money(
                  shift.customerCashPayments,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Cash In
              </span>

              <strong>
                +${money(
                  detail.cashIn,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Cash Out
              </span>

              <strong>
                -${money(
                  detail.cashOut,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Net Movement
              </span>

              <strong>
                ${signedMoney(
                  detail.netCashMovement,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Expected Cash
              </span>

              <strong>
                ${
                  shift.expectedCash ===
                  null
                    ? '—'
                    : money(
                        shift.expectedCash,
                      )
                }
              </strong>

            </div>

            <div class="row">

              <span>
                Actual Cash
              </span>

              <strong>
                ${
                  shift.closingCash ===
                  null
                    ? '—'
                    : money(
                        shift.closingCash,
                      )
                }
              </strong>

            </div>

            <div class="row difference">

              <span>
                ${differenceLabel}
              </span>

              <strong>
                ${
                  shift.cashDifference ===
                  null
                    ? '—'
                    : money(
                        shift.cashDifference,
                      )
                }
              </strong>

            </div>

            <div class="formula">

              <div class="formula-title">
                Expected Cash Formula
              </div>

              <div>
                Opening + Cash Sales + Customer Cash Payments + Cash In - Cash Out
              </div>

              <div
                style="
                  margin-top:
                    0.5mm;
                  font-weight:
                    700;
                "
              >
                ${money(
                  shift.openingCash,
                )}
                +
                ${money(
                  shift.cashSales,
                )}
                +
                ${money(
                  shift.customerCashPayments,
                )}
                +
                ${money(
                  detail.cashIn,
                )}
                -
                ${money(
                  detail.cashOut,
                )}
                =
                ${
                  shift.expectedCash ===
                  null
                    ? '—'
                    : money(
                        shift.expectedCash,
                      )
                }
              </div>

            </div>

          </section>

          <div class="separator"></div>

          <section>

            <div class="section-title">
              Cash Drawer Movements
            </div>

            <div class="movement-summary">

              <div class="row">

                <span>
                  Cash In
                </span>

                <strong>
                  +${money(
                    detail.cashIn,
                  )}
                </strong>

              </div>

              <div class="row">

                <span>
                  Cash Out
                </span>

                <strong>
                  -${money(
                    detail.cashOut,
                  )}
                </strong>

              </div>

              <div class="row">

                <span>
                  Net Movement
                </span>

                <strong>
                  ${signedMoney(
                    detail.netCashMovement,
                  )}
                </strong>

              </div>

            </div>

            <div class="movement-list">
              ${movementsHtml}
            </div>

          </section>

          <div class="separator"></div>

          <section>

            <div class="section-title">
              Sales Summary
            </div>

            <div class="row">

              <span>
                Transactions
              </span>

              <strong>
                ${detail.transactionCount}
              </strong>

            </div>

            <div class="row total-row">

              <span>
                Total Sales
              </span>

              <strong>
                ${money(
                  detail.totalSales,
                )}
              </strong>

            </div>

          </section>

          <div class="separator"></div>

          <section>

            <div class="section-title">
              Payment Breakdown
            </div>

            <div class="row">

              <span>
                Cash
              </span>

              <strong>
                ${money(
                  detail.payments.cash,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Card
              </span>

              <strong>
                ${money(
                  detail.payments.card,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                QR
              </span>

              <strong>
                ${money(
                  detail.payments.qr,
                )}
              </strong>

            </div>

            <div class="row">

              <span>
                Bank Transfer
              </span>

              <strong>
                ${money(
                  detail.payments.bankTransfer,
                )}
              </strong>

            </div>

            ${
              detail.payments.other >
              0
                ? `
                  <div class="row">

                    <span>
                      Other
                    </span>

                    <strong>
                      ${money(
                        detail.payments.other,
                      )}
                    </strong>

                  </div>
                `
                : ''
            }

          </section>

          ${
            openingNote ||
            closingNote
              ? `
                <div class="separator"></div>

                <section>

                  <div class="section-title">
                    Notes
                  </div>

                  ${
                    openingNote
                      ? `
                        <div class="note">

                          <strong>
                            Opening:
                          </strong>

                          ${openingNote}

                        </div>
                      `
                      : ''
                  }

                  ${
                    closingNote
                      ? `
                        <div
                          class="note"
                          style="
                            margin-top:
                              1mm;
                          "
                        >

                          <strong>
                            Closing:
                          </strong>

                          ${closingNote}

                        </div>
                      `
                      : ''
                  }

                </section>
              `
              : ''
          }

          <footer class="footer">

            <div>
              Shift ID:
              ${escapeHtml(
                shift.id.slice(
                  0,
                  8,
                ),
              )}
            </div>

            <div
              style="
                margin-top:
                  0.5mm;
              "
            >
              Printed:
              ${escapeHtml(
                formatDateTime(
                  new Date()
                    .toISOString(),
                ),
              )}
            </div>

          </footer>

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