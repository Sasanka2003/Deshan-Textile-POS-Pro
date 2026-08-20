export type RefundMethod =
  | 'cash'
  | 'card'
  | 'qr'
  | 'bank_transfer'
  | 'credit_adjustment'
  | 'no_refund'

export interface ReturnRequestItem {
  saleItemId: string
  quantity: number
}

export interface CompleteReturnInput {
  clientTransactionId: string

  businessId: string
  branchId: string
  saleId: string

  items: ReturnRequestItem[]

  refundMethod: RefundMethod
  reason: string | null
}

export interface CompleteReturnResult {
  duplicate: boolean

  return_id: string
  return_no: string

  sale_id: string
  invoice_no: string

  refund_method: RefundMethod
  refund_amount: number

  status: string
}

export interface ReturnHistoryItem {
  id: string

  returnNo: string
  invoiceNo: string

  customerName: string | null
  staffName: string | null

  refundMethod: RefundMethod
  refundAmount: number

  reason: string | null
  status: string

  createdAt: string
}

export interface ReturnReceiptItem {
  id: string

  productName: string

  quantity: number
  unitPrice: number

  discountAmount: number
  lineRefund: number
}

export interface ReturnReceiptDetail {
  id: string

  returnNo: string
  invoiceNo: string

  refundMethod: RefundMethod
  refundAmount: number

  reason: string | null
  status: string

  createdAt: string

  customerName: string | null
  staffName: string | null

  businessName: string

  branchName: string | null
  branchAddress: string | null
  branchPhone: string | null

  items: ReturnReceiptItem[]
}