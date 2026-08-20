export type SaleType = 'retail' | 'wholesale'

export type SaleStatus =
  | 'completed'
  | 'cancelled'
  | 'returned'
  | string

export type SalePaymentMethod =
  | 'cash'
  | 'card'
  | 'qr'
  | 'bank_transfer'
  | 'cheque'
  | 'credit'
  | 'other'
  | string

export interface SalesHistoryItem {
  id: string

  businessId: string
  branchId: string

  terminalId: string | null
  shiftId: string | null
  customerId: string | null
  staffId: string

  clientTransactionId: string

  invoiceNo: string
  saleType: SaleType

  subtotal: number
  discountAmount: number

  taxRate: number
  taxAmount: number

  total: number
  paidAmount: number
  balanceDue: number

  status: SaleStatus

  notes: string | null

  createdAt: string

  customerName: string | null
  staffName: string | null
}

export interface SaleInvoiceItem {
  id: string

  saleId: string
  productId: string

  productName: string
  barcode: string | null

  quantity: number
  unitPrice: number

  discountAmount: number
  costPrice: number

  lineTotal: number
}

export interface SalePayment {
  id: string

  saleId: string | null

  businessId: string
  branchId: string

  paymentMethod: SalePaymentMethod

  amount: number

  referenceNo: string | null
  receivedBy: string | null

  createdAt: string
}

export interface SaleBusinessInfo {
  id: string

  name: string
  legalName: string | null

  phone: string | null
  email: string | null
  address: string | null

  currencyCode: string
  timezone: string
}

export interface SaleBranchInfo {
  id: string

  name: string
  code: string

  phone: string | null
  address: string | null
}

export interface SaleInvoiceDetail {
  sale: SalesHistoryItem

  items: SaleInvoiceItem[]

  payments: SalePayment[]

  business: SaleBusinessInfo | null

  branch: SaleBranchInfo | null
}