export type SaleType =
  | 'retail'
  | 'wholesale'

export type SalePaymentMethod =
  | 'cash'
  | 'card'
  | 'qr'
  | 'bank_transfer'

export interface SaleCartItem {
  productId: string
  productName: string

  sku: string | null
  barcode: string | null

  unit: string

  quantity: number
  unitPrice: number

  discountAmount: number

  availableStock: number
}

export interface SalePaymentInput {
  method: SalePaymentMethod
  amount: number
  referenceNo: string | null
}

export interface CompleteSaleInput {
  clientTransactionId: string

  businessId: string
  branchId: string

  terminalId: string | null
  shiftId: string | null

  customerId: string | null

  saleType: SaleType

  items: {
    productId: string
    quantity: number
    discountAmount: number
  }[]

  payments: SalePaymentInput[]

  orderDiscount: number
  taxRate: number

  notes: string | null
}

export interface CompleteSaleResult {
  duplicate: boolean

  sale_id: string
  invoice_no: string

  subtotal: number
  discount_amount: number

  tax_rate: number
  tax_amount: number

  total: number
  paid_amount: number
  balance_due: number

  status:
    | 'completed'
    | 'partially_paid'
    | 'credit'
}