import ExcelJS from 'exceljs'

import type {
  BusinessCashSummary,
  ReceivablesPayablesSummary,
} from './reportService'

import type {
  ReportData,
} from '../types/report'

type ReportExportRange = {
  startDate: string
  endDate: string
}

const COLORS = {
  dark: '111827',
  light: 'F3F4F6',
  lighter: 'F9FAFB',
  border: 'D1D5DB',
  muted: '6B7280',
  white: 'FFFFFF',
  green: 'DCFCE7',
  greenText: '166534',
  red: 'FEE2E2',
  redText: '991B1B',
  amber: 'FEF3C7',
  amberText: '92400E',
}

function numberValue(
  value:
    | number
    | null
    | undefined,
) {
  const parsed =
    Number(value ?? 0)

  return Number.isFinite(parsed)
    ? parsed
    : 0
}

function labelText(
  value: string,
) {
  return value
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    )
}

function formatDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleDateString(
    'en-LK',
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    },
  )
}

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value
  }

  return date.toLocaleString(
    'en-LK',
    {
      timeZone:
        'Asia/Colombo',

      year: 'numeric',
      month: 'short',
      day: '2-digit',

      hour: '2-digit',
      minute: '2-digit',
    },
  )
}

function applyThinBorder(
  cell: ExcelJS.Cell,
) {
  cell.border = {
    top: {
      style: 'thin',
      color: {
        argb: COLORS.border,
      },
    },

    left: {
      style: 'thin',
      color: {
        argb: COLORS.border,
      },
    },

    bottom: {
      style: 'thin',
      color: {
        argb: COLORS.border,
      },
    },

    right: {
      style: 'thin',
      color: {
        argb: COLORS.border,
      },
    },
  }
}

function styleTitle(
  worksheet: ExcelJS.Worksheet,
  range: string,
  value: string,
) {
  worksheet.mergeCells(range)

  const cell =
    worksheet.getCell(
      range.split(':')[0],
    )

  cell.value = value

  cell.font = {
    name: 'Calibri',
    size: 18,
    bold: true,
    color: {
      argb: COLORS.dark,
    },
  }

  cell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }
}

function styleSubtitle(
  worksheet: ExcelJS.Worksheet,
  range: string,
  value: string,
) {
  worksheet.mergeCells(range)

  const cell =
    worksheet.getCell(
      range.split(':')[0],
    )

  cell.value = value

  cell.font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: {
      argb: COLORS.muted,
    },
  }

  cell.alignment = {
    vertical: 'middle',
    horizontal: 'left',
  }
}

function styleSectionRow(
  row: ExcelJS.Row,
  fromColumn: number,
  toColumn: number,
) {
  for (
    let column =
      fromColumn;
    column <= toColumn;
    column += 1
  ) {
    const cell =
      row.getCell(column)

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',

      fgColor: {
        argb: COLORS.light,
      },
    }

    cell.font = {
      bold: true,

      color: {
        argb: COLORS.dark,
      },
    }

    applyThinBorder(
      cell,
    )
  }
}

function styleTableHeader(
  row: ExcelJS.Row,
) {
  row.height = 22

  row.eachCell(
    (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',

        fgColor: {
          argb: COLORS.dark,
        },
      }

      cell.font = {
        bold: true,

        color: {
          argb: COLORS.white,
        },
      }

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }

      applyThinBorder(
        cell,
      )
    },
  )
}

function styleDataRows(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
) {
  for (
    let rowNumber =
      startRow;
    rowNumber <= endRow;
    rowNumber += 1
  ) {
    const row =
      worksheet.getRow(
        rowNumber,
      )

    row.eachCell(
      (cell) => {
        applyThinBorder(
          cell,
        )

        cell.alignment = {
          vertical: 'middle',
        }

        if (
          rowNumber % 2 ===
          0
        ) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',

            fgColor: {
              argb:
                COLORS.lighter,
            },
          }
        }
      },
    )
  }
}

function setSheetDefaults(
  worksheet: ExcelJS.Worksheet,
) {
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 5,
    },
  ]

  worksheet.pageSetup = {
    paperSize: 9,

    orientation:
      'landscape',

    fitToPage: true,

    fitToWidth: 1,
    fitToHeight: 0,

    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  }

  worksheet.headerFooter = {
    oddFooter:
      '&LDeshan Textile POS&CPage &P of &N&RGenerated Report',
  }
}

function createFileName(
  range: ReportExportRange,
) {
  const safeStartDate =
    range.startDate.replaceAll(
      '/',
      '-',
    )

  const safeEndDate =
    range.endDate.replaceAll(
      '/',
      '-',
    )

  return (
    `Deshan-Textile-Report-` +
    `${safeStartDate}-to-` +
    `${safeEndDate}.xlsx`
  )
}

function addMetricRow(
  worksheet: ExcelJS.Worksheet,
  label: string,
  value: number,
  currencyFormat: string,
) {
  const row =
    worksheet.addRow([
      label,
      value,
    ])

  row.getCell(
    2,
  ).numFmt =
    currencyFormat

  return row
}

export async function exportReportToExcel(
  report: ReportData,
  range: ReportExportRange,
  businessName =
    'Deshan Textile',
  businessCashSummary:
    | BusinessCashSummary
    | null =
      null,
  receivablesPayables:
    | ReceivablesPayablesSummary
    | null =
      null,
) {
  const workbook =
    new ExcelJS.Workbook()

  workbook.creator =
    'Deshan Textile POS'

  workbook.company =
    businessName

  workbook.subject =
    'Business Performance Report'

  workbook.title =
    `${businessName} Business Performance Report`

  workbook.created =
    new Date()

  const currencyFormat =
    '"Rs. " #,##0.00'

  const totalDiscounts =
    report.sales.reduce(
      (
        total,
        sale,
      ) =>
        total +
        numberValue(
          sale.discountAmount,
        ),
      0,
    )

  /* =====================================================
     SUMMARY
  ===================================================== */

  const summarySheet =
    workbook.addWorksheet(
      'Summary',
    )

  summarySheet.columns = [
    {
      width: 34,
    },
    {
      width: 26,
    },
  ]

  styleTitle(
    summarySheet,
    'A1:B1',
    businessName,
  )

  styleSubtitle(
    summarySheet,
    'A2:B2',
    'Business Performance Report',
  )

  summarySheet.getCell(
    'A3',
  ).value =
    'Report Period'

  summarySheet.getCell(
    'A3',
  ).font = {
    bold: true,
  }

  summarySheet.getCell(
    'B3',
  ).value =
    `${formatDate(
      range.startDate,
    )} to ${formatDate(
      range.endDate,
    )}`

  summarySheet.addRow([])

  const sectionRow =
    summarySheet.addRow([
      'Financial Summary',
      '',
    ])

  styleSectionRow(
    sectionRow,
    1,
    2,
  )

  const summaryHeader =
    summarySheet.addRow([
      'Metric',
      'Value',
    ])

  styleTableHeader(
    summaryHeader,
  )

  const summaryData: Array<
    [string, number]
  > = [
    [
      'Gross Sales',
      numberValue(
        report.summary
          .grossSales,
      ),
    ],

    [
      'Discounts',
      totalDiscounts,
    ],

    [
      'Returns',
      numberValue(
        report.summary
          .returns,
      ),
    ],

    [
      'Net Sales',
      numberValue(
        report.summary
          .netSales,
      ),
    ],

    [
      'Cost of Goods Sold',
      numberValue(
        report.summary
          .costOfGoodsSold,
      ),
    ],

    [
      'Gross Profit',
      numberValue(
        report.summary
          .grossProfit,
      ),
    ],

    [
      'Expenses',
      numberValue(
        report.summary
          .expenses,
      ),
    ],

    [
      'Operating Profit',
      numberValue(
        report.summary
          .operatingProfit,
      ),
    ],

    [
      'Purchases',
      numberValue(
        report.summary
          .purchases,
      ),
    ],
  ]

  const financialDataStart =
    summarySheet.rowCount +
    1

  for (
    const [
      label,
      value,
    ] of summaryData
  ) {
    addMetricRow(
      summarySheet,
      label,
      value,
      currencyFormat,
    )
  }

  const salesCountRow =
    summarySheet.addRow([
      'Sales Transactions',

      report.summary
        .transactionCount ??
        0,
    ])

  const returnCountRow =
    summarySheet.addRow([
      'Returned Transactions',

      report.summary
        .returnedTransactionCount ??
        0,
    ])

  styleDataRows(
    summarySheet,
    financialDataStart,
    returnCountRow.number,
  )

  salesCountRow.getCell(
    2,
  ).numFmt = '0'

  returnCountRow.getCell(
    2,
  ).numFmt = '0'

  /* =====================================================
     BUSINESS CASH SUMMARY
  ===================================================== */

  if (
    businessCashSummary
  ) {
    summarySheet.addRow([])

    const cashSection =
      summarySheet.addRow([
        'Business Cash Summary',
        '',
      ])

    styleSectionRow(
      cashSection,
      1,
      2,
    )

    const cashHeader =
      summarySheet.addRow([
        'Metric',
        'Value',
      ])

    styleTableHeader(
      cashHeader,
    )

    const cashStartRow =
      summarySheet.rowCount +
      1

    addMetricRow(
      summarySheet,
      'Cash Sale Payments',
      numberValue(
        businessCashSummary
          .cashSalePayments,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Customer Cash Payments',
      numberValue(
        businessCashSummary
          .customerCashPayments,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Credit Created',
      numberValue(
        businessCashSummary
          .creditCreated,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Total Refunds',
      numberValue(
        businessCashSummary
          .refunds,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Cash Refunds',
      numberValue(
        businessCashSummary
          .cashRefunds,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Cash In',
      numberValue(
        businessCashSummary
          .cashIn,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Cash Out',
      numberValue(
        businessCashSummary
          .cashOut,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Closed Shift Expected Cash',
      numberValue(
        businessCashSummary
          .shiftExpectedCash,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Shift Cash Difference',
      numberValue(
        businessCashSummary
          .shiftDifference,
      ),
      currencyFormat,
    )

    const closedShiftRow =
      summarySheet.addRow([
        'Closed Shifts',
        businessCashSummary
          .closedShiftCount,
      ])

    closedShiftRow.getCell(
      2,
    ).numFmt = '0'

    const emergencyCloseRow =
      summarySheet.addRow([
        'Emergency Closes',
        businessCashSummary
          .emergencyCloseCount,
      ])

    emergencyCloseRow.getCell(
      2,
    ).numFmt = '0'

    styleDataRows(
      summarySheet,
      cashStartRow,
      emergencyCloseRow.number,
    )

    const differenceCell =
      summarySheet
        .getRow(
          cashStartRow +
          8,
        )
        .getCell(2)

    const difference =
      numberValue(
        businessCashSummary
          .shiftDifference,
      )

    if (
      difference ===
      0
    ) {
      differenceCell.fill = {
        type: 'pattern',
        pattern: 'solid',

        fgColor: {
          argb:
            COLORS.green,
        },
      }

      differenceCell.font = {
        bold: true,

        color: {
          argb:
            COLORS.greenText,
        },
      }
    } else {
      differenceCell.fill = {
        type: 'pattern',
        pattern: 'solid',

        fgColor: {
          argb:
            COLORS.amber,
        },
      }

      differenceCell.font = {
        bold: true,

        color: {
          argb:
            COLORS.amberText,
        },
      }
    }
  }

  /* =====================================================
     RECEIVABLES & PAYABLES
  ===================================================== */

  if (
    receivablesPayables
  ) {
    summarySheet.addRow([])

    const creditSection =
      summarySheet.addRow([
        'Receivables & Payables',
        '',
      ])

    styleSectionRow(
      creditSection,
      1,
      2,
    )

    const creditHeader =
      summarySheet.addRow([
        'Metric',
        'Value',
      ])

    styleTableHeader(
      creditHeader,
    )

    const creditStartRow =
      summarySheet.rowCount +
      1

    addMetricRow(
      summarySheet,
      'Customer Receivables',
      numberValue(
        receivablesPayables
          .customerReceivables,
      ),
      currencyFormat,
    )

    addMetricRow(
      summarySheet,
      'Supplier Payables',
      numberValue(
        receivablesPayables
          .supplierPayables,
      ),
      currencyFormat,
    )

    const netPositionRow =
      addMetricRow(
        summarySheet,
        'Net Credit Position',
        numberValue(
          receivablesPayables
            .netCreditPosition,
        ),
        currencyFormat,
      )

    const customerCountRow =
      summarySheet.addRow([
        'Customers with Outstanding',
        receivablesPayables
          .creditCustomerCount,
      ])

    customerCountRow.getCell(
      2,
    ).numFmt = '0'

    const supplierCountRow =
      summarySheet.addRow([
        'Suppliers with Outstanding',
        receivablesPayables
          .payableSupplierCount,
      ])

    supplierCountRow.getCell(
      2,
    ).numFmt = '0'

    styleDataRows(
      summarySheet,
      creditStartRow,
      supplierCountRow.number,
    )

    const netPosition =
      numberValue(
        receivablesPayables
          .netCreditPosition,
      )

    netPositionRow.getCell(
      2,
    ).fill = {
      type: 'pattern',
      pattern: 'solid',

      fgColor: {
        argb:
          netPosition >= 0
            ? COLORS.green
            : COLORS.red,
      },
    }

    netPositionRow.getCell(
      2,
    ).font = {
      bold: true,

      color: {
        argb:
          netPosition >= 0
            ? COLORS.greenText
            : COLORS.redText,
      },
    }
  }

  /* =====================================================
     PAYMENT SUMMARY
  ===================================================== */

  summarySheet.addRow([])

  const paymentSection =
    summarySheet.addRow([
      'Payment Summary',
      '',
    ])

  styleSectionRow(
    paymentSection,
    1,
    2,
  )

  const paymentHeader =
    summarySheet.addRow([
      'Payment Method',
      'Amount',
    ])

  styleTableHeader(
    paymentHeader,
  )

  const paymentStart =
    summarySheet.rowCount +
    1

  for (
    const payment of
    report.paymentMethods
  ) {
    const row =
      summarySheet.addRow([
        labelText(
          payment.method,
        ),

        numberValue(
          payment.amount,
        ),
      ])

    row.getCell(
      2,
    ).numFmt =
      currencyFormat
  }

  if (
    report.paymentMethods
      .length > 0
  ) {
    styleDataRows(
      summarySheet,
      paymentStart,
      summarySheet.rowCount,
    )
  }

  summarySheet.views = [
    {
      state: 'frozen',
      ySplit: 5,
    },
  ]

  summarySheet.pageSetup = {
    paperSize: 9,

    orientation:
      'portrait',

    fitToPage: true,

    fitToWidth: 1,
    fitToHeight: 0,

    margins: {
      left: 0.4,
      right: 0.4,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  }

  summarySheet.headerFooter = {
    oddFooter:
      '&LDeshan Textile POS&CPage &P of &N&RGenerated Report',
  }

  /* =====================================================
     SALES
  ===================================================== */

  const salesSheet =
    workbook.addWorksheet(
      'Sales',
    )

  salesSheet.columns = [
    { width: 20 },
    { width: 24 },
    { width: 25 },
    { width: 20 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
  ]

  styleTitle(
    salesSheet,
    'A1:J1',
    businessName,
  )

  styleSubtitle(
    salesSheet,
    'A2:J2',
    'Sales Report',
  )

  salesSheet.getCell(
    'A3',
  ).value =
    'Report Period'

  salesSheet.getCell(
    'A3',
  ).font = {
    bold: true,
  }

  salesSheet.getCell(
    'B3',
  ).value =
    `${formatDate(
      range.startDate,
    )} to ${formatDate(
      range.endDate,
    )}`

  salesSheet.addRow([])

  const salesHeader =
    salesSheet.addRow([
      'Invoice',
      'Date',
      'Customer',
      'Staff',
      'Subtotal',
      'Discount',
      'Total',
      'Paid',
      'Balance',
      'Status',
    ])

  styleTableHeader(
    salesHeader,
  )

  const salesStartRow =
    salesSheet.rowCount +
    1

  for (
    const sale of
    report.sales
  ) {
    const row =
      salesSheet.addRow([
        sale.invoiceNo,

        formatDateTime(
          sale.date,
        ),

        sale.customerName ??
          'Walk-in Customer',

        sale.staffName ??
          '—',

        numberValue(
          sale.subtotal,
        ),

        numberValue(
          sale.discountAmount,
        ),

        numberValue(
          sale.total,
        ),

        numberValue(
          sale.paidAmount,
        ),

        numberValue(
          sale.balanceDue,
        ),

        labelText(
          sale.status,
        ),
      ])

    for (
      const column of [
        5,
        6,
        7,
        8,
        9,
      ]
    ) {
      row.getCell(
        column,
      ).numFmt =
        currencyFormat
    }
  }

  if (
    report.sales.length >
    0
  ) {
    styleDataRows(
      salesSheet,
      salesStartRow,
      salesSheet.rowCount,
    )
  }

  salesSheet.autoFilter = {
    from: {
      row: 5,
      column: 1,
    },

    to: {
      row: 5,
      column: 10,
    },
  }

  setSheetDefaults(
    salesSheet,
  )

  /* =====================================================
     TOP PRODUCTS
  ===================================================== */

  const productsSheet =
    workbook.addWorksheet(
      'Top Products',
    )

  productsSheet.columns = [
    { width: 28 },
    { width: 24 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ]

  styleTitle(
    productsSheet,
    'A1:H1',
    businessName,
  )

  styleSubtitle(
    productsSheet,
    'A2:H2',
    'Top Selling Products',
  )

  productsSheet.getCell(
    'A3',
  ).value =
    'Report Period'

  productsSheet.getCell(
    'A3',
  ).font = {
    bold: true,
  }

  productsSheet.getCell(
    'B3',
  ).value =
    `${formatDate(
      range.startDate,
    )} to ${formatDate(
      range.endDate,
    )}`

  productsSheet.addRow([])

  const productsHeader =
    productsSheet.addRow([
      'Product',
      'SKU / Barcode',
      'Qty Sold',
      'Gross Sales',
      'Discount',
      'Net Sales',
      'COGS',
      'Profit',
    ])

  styleTableHeader(
    productsHeader,
  )

  const productsStartRow =
    productsSheet.rowCount +
    1

  for (
    const product of
    report.topProducts
  ) {
    const row =
      productsSheet.addRow([
        product.productName,

        product.sku ??
          product.barcode ??
          '—',

        numberValue(
          product.quantitySold,
        ),

        numberValue(
          product.grossSales,
        ),

        numberValue(
          product.discountAmount,
        ),

        numberValue(
          product.netSales,
        ),

        numberValue(
          product.costOfGoodsSold,
        ),

        numberValue(
          product.grossProfit,
        ),
      ])

    row.getCell(
      3,
    ).numFmt =
      '#,##0.###'

    for (
      const column of [
        4,
        5,
        6,
        7,
        8,
      ]
    ) {
      row.getCell(
        column,
      ).numFmt =
        currencyFormat
    }
  }

  if (
    report.topProducts
      .length > 0
  ) {
    styleDataRows(
      productsSheet,
      productsStartRow,
      productsSheet.rowCount,
    )
  }

  for (
    let rowNumber =
      productsStartRow;
    rowNumber <=
    productsSheet.rowCount;
    rowNumber += 1
  ) {
    const profitCell =
      productsSheet
        .getRow(
          rowNumber,
        )
        .getCell(8)

    const profit =
      Number(
        profitCell.value ??
          0,
      )

    if (
      Number.isFinite(
        profit,
      ) &&
      profit >= 0
    ) {
      profitCell.fill = {
        type: 'pattern',
        pattern: 'solid',

        fgColor: {
          argb:
            COLORS.green,
        },
      }

      profitCell.font = {
        bold: true,

        color: {
          argb:
            COLORS.greenText,
        },
      }
    }
  }

  productsSheet.autoFilter = {
    from: {
      row: 5,
      column: 1,
    },

    to: {
      row: 5,
      column: 8,
    },
  }

  setSheetDefaults(
    productsSheet,
  )

  /* =====================================================
     EXPENSES
  ===================================================== */

  const expensesSheet =
    workbook.addWorksheet(
      'Expenses',
    )

  expensesSheet.columns = [
    { width: 28 },
    { width: 18 },
    { width: 22 },
    { width: 36 },
    { width: 18 },
    { width: 18 },
    { width: 20 },
    { width: 18 },
  ]

  styleTitle(
    expensesSheet,
    'A1:H1',
    businessName,
  )

  styleSubtitle(
    expensesSheet,
    'A2:H2',
    'Expense Report',
  )

  expensesSheet.getCell(
    'A3',
  ).value =
    'Report Period'

  expensesSheet.getCell(
    'A3',
  ).font = {
    bold: true,
  }

  expensesSheet.getCell(
    'B3',
  ).value =
    `${formatDate(
      range.startDate,
    )} to ${formatDate(
      range.endDate,
    )}`

  expensesSheet.addRow([])

  const expensesHeader =
    expensesSheet.addRow([
      'Expense No.',
      'Date',
      'Category',
      'Description',
      'Method',
      'Amount',
      'Staff',
      'Status',
    ])

  styleTableHeader(
    expensesHeader,
  )

  const expensesStartRow =
    expensesSheet.rowCount +
    1

  for (
    const expense of
    report.expenses
  ) {
    const row =
      expensesSheet.addRow([
        expense.expenseNo,

        formatDate(
          expense.date,
        ),

        expense.categoryName ??
          'Uncategorized',

        expense.description ??
          '—',

        labelText(
          expense.paymentMethod,
        ),

        numberValue(
          expense.amount,
        ),

        expense.staffName ??
          '—',

        labelText(
          expense.status,
        ),
      ])

    row.getCell(
      6,
    ).numFmt =
      currencyFormat
  }

  if (
    report.expenses.length >
    0
  ) {
    styleDataRows(
      expensesSheet,
      expensesStartRow,
      expensesSheet.rowCount,
    )
  }

  for (
    let rowNumber =
      expensesStartRow;
    rowNumber <=
    expensesSheet.rowCount;
    rowNumber += 1
  ) {
    const statusCell =
      expensesSheet
        .getRow(
          rowNumber,
        )
        .getCell(8)

    const status =
      String(
        statusCell.value ??
          '',
      ).toLowerCase()

    if (
      status ===
      'cancelled'
    ) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',

        fgColor: {
          argb:
            COLORS.red,
        },
      }

      statusCell.font = {
        bold: true,

        color: {
          argb:
            COLORS.redText,
        },
      }
    }
  }

  expensesSheet.autoFilter = {
    from: {
      row: 5,
      column: 1,
    },

    to: {
      row: 5,
      column: 8,
    },
  }

  setSheetDefaults(
    expensesSheet,
  )

  /* =====================================================
     PAYMENTS
  ===================================================== */

  const paymentsSheet =
    workbook.addWorksheet(
      'Payments',
    )

  paymentsSheet.columns = [
    { width: 28 },
    { width: 20 },
    { width: 22 },
  ]

  styleTitle(
    paymentsSheet,
    'A1:C1',
    businessName,
  )

  styleSubtitle(
    paymentsSheet,
    'A2:C2',
    'Payment Method Summary',
  )

  paymentsSheet.getCell(
    'A3',
  ).value =
    'Report Period'

  paymentsSheet.getCell(
    'A3',
  ).font = {
    bold: true,
  }

  paymentsSheet.getCell(
    'B3',
  ).value =
    `${formatDate(
      range.startDate,
    )} to ${formatDate(
      range.endDate,
    )}`

  paymentsSheet.addRow([])

  const paymentsHeader =
    paymentsSheet.addRow([
      'Payment Method',
      'Transactions',
      'Amount',
    ])

  styleTableHeader(
    paymentsHeader,
  )

  const paymentsStartRow =
    paymentsSheet.rowCount +
    1

  for (
    const payment of
    report.paymentMethods
  ) {
    const row =
      paymentsSheet.addRow([
        labelText(
          payment.method,
        ),

        payment.transactionCount,

        numberValue(
          payment.amount,
        ),
      ])

    row.getCell(
      2,
    ).numFmt = '0'

    row.getCell(
      3,
    ).numFmt =
      currencyFormat
  }

  if (
    report.paymentMethods
      .length > 0
  ) {
    styleDataRows(
      paymentsSheet,
      paymentsStartRow,
      paymentsSheet.rowCount,
    )
  }

  paymentsSheet.autoFilter = {
    from: {
      row: 5,
      column: 1,
    },

    to: {
      row: 5,
      column: 3,
    },
  }

  setSheetDefaults(
    paymentsSheet,
  )

  /* =====================================================
     EXPORT FILE
  ===================================================== */

  const buffer =
    await workbook.xlsx
      .writeBuffer()

  const blob =
    new Blob(
      [buffer],
      {
        type:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    )

  const url =
    URL.createObjectURL(
      blob,
    )

  const anchor =
    document.createElement(
      'a',
    )

  anchor.href = url

  anchor.download =
    createFileName(
      range,
    )

  document.body.appendChild(
    anchor,
  )

  anchor.click()

  anchor.remove()

  URL.revokeObjectURL(
    url,
  )
}