export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'cheque'
  | 'card'
  | 'qr'
  | 'other'

export type PurchasePaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'

export interface PurchaseItemInput {
  productId: string
  productName: string
  sku: string | null
  barcode: string | null
  unit: string

  quantity: number
  unitCost: number
  lineDiscount: number
}

export interface ReceivePurchaseInput {
  clientTransactionId: string

  businessId: string
  branchId: string
  supplierId: string

  supplierInvoiceNo: string | null

  items: PurchaseItemInput[]

  discountAmount: number
  paidAmount: number

  paymentMethod: PaymentMethod
  paymentReference: string | null

  notes: string | null
}

export interface ReceivePurchaseResult {
  duplicate: boolean

  purchase_id: string
  grn_no: string

  subtotal: number
  discount_amount: number
  total: number

  paid_amount: number
  balance_due: number

  payment_status: PurchasePaymentStatus

  supplier_payment_id?: string | null
  supplier_balance?: number
}

export interface PurchaseListItem {
  id: string
  grn_no: string

  supplier_invoice_no: string | null

  subtotal: number
  discount_amount: number
  total: number

  paid_amount: number
  balance_due: number

  payment_status: PurchasePaymentStatus
  status: 'received' | 'voided'

  received_at: string

  supplier: {
    id: string
    name: string
  } | null

  staff: {
    id: string
    full_name: string
  } | null
}

/* =========================================================
   GRN DETAIL TYPES
========================================================= */

export interface PurchaseDetailItem {
  id: string

  product_id: string

  product_name: string

  sku: string | null
  barcode: string | null

  unit: string

  quantity: number
  unit_cost: number

  line_discount: number
  line_total: number
}

export interface PurchaseSupplierDetail {
  id: string

  name: string

  contact_person: string | null
  phone: string | null
  email: string | null

  address: string | null
  city: string | null
}

export interface PurchaseStaffDetail {
  id: string
  full_name: string
}

export interface PurchaseDetail {
  id: string

  client_transaction_id: string

  business_id: string
  branch_id: string
  supplier_id: string

  received_by: string

  grn_no: string

  supplier_invoice_no: string | null

  subtotal: number
  discount_amount: number
  total: number

  paid_amount: number
  balance_due: number

  payment_status: PurchasePaymentStatus

  status:
    | 'received'
    | 'voided'

  notes: string | null

  received_at: string
  created_at: string

  supplier:
    | PurchaseSupplierDetail
    | null

  staff:
    | PurchaseStaffDetail
    | null

  items: PurchaseDetailItem[]
}