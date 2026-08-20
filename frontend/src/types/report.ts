export type ReportDatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'custom'

export interface ReportDateRange {
  startDate: string
  endDate: string
}

export interface ReportSummary {
  grossSales: number
  discounts: number
  returns: number
  netSales: number

  costOfGoodsSold: number
  grossProfit: number

  expenses: number
  operatingProfit: number

  purchases: number

  transactionCount: number
  returnedTransactionCount: number
}

export interface PaymentMethodSummary {
  method: string
  amount: number
  transactionCount: number
}

export interface TopSellingProduct {
  productId: string

  productName: string
  sku: string | null
  barcode: string | null

  quantitySold: number

  grossSales: number
  discountAmount: number
  netSales: number

  costOfGoodsSold: number
  grossProfit: number
}

export interface SalesReportRow {
  saleId: string
  invoiceNo: string
  date: string

  customerName: string | null
  staffName: string | null

  subtotal: number
  discountAmount: number
  taxAmount: number

  total: number
  paidAmount: number
  balanceDue: number

  status: string
}

export interface ExpenseReportRow {
  expenseId: string
  expenseNo: string

  date: string

  categoryName: string | null
  description: string | null

  paymentMethod: string

  amount: number

  staffName: string | null

  status: string
}

export interface DailyReportPoint {
  date: string

  sales: number
  returns: number
  expenses: number

  profit: number
}

export interface ReportData {
  summary: ReportSummary

  paymentMethods: PaymentMethodSummary[]

  topProducts: TopSellingProduct[]

  sales: SalesReportRow[]

  expenses: ExpenseReportRow[]

  daily: DailyReportPoint[]
}