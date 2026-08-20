export interface PurchaseReturnSourceItem {
  id: string

  productId: string

  productName: string

  sku: string | null
  barcode: string | null
  unit: string

  purchasedQuantity: number
  alreadyReturnedQuantity: number
  returnableQuantity: number

  unitCost: number

  lineDiscount: number
  lineTotal: number
}

export interface PurchaseReturnSource {
  purchaseId: string

  grnNo: string

  supplierId: string
  supplierName: string

  supplierInvoiceNo:
    | string
    | null

  receivedAt: string

  subtotal: number
  discountAmount: number
  total: number

  items:
    PurchaseReturnSourceItem[]
}

export interface PurchaseReturnInputItem {
  purchaseItemId: string
  quantity: number
}

export interface CompletePurchaseReturnInput {
  clientTransactionId: string

  businessId: string
  branchId: string

  purchaseId: string

  items:
    PurchaseReturnInputItem[]

  reason: string | null
}

export interface CompletePurchaseReturnResult {
  duplicate: boolean

  purchaseReturnId: string

  returnNo: string

  purchaseId: string
  grnNo: string

  supplierId: string

  refundAmount: number
  supplierBalance: number
}

export interface PurchaseReturnHistoryItem {
  id: string

  returnNo: string

  grnNo: string

  supplierName: string

  refundAmount: number

  reason: string | null

  status: string

  staffName: string | null

  createdAt: string
}

export interface PurchaseReturnReceiptItem {
  id: string

  productName: string

  sku: string | null
  barcode: string | null
  unit: string | null

  quantity: number

  unitCost: number

  lineDiscount: number
  lineRefund: number
}

export interface PurchaseReturnReceiptDetail {
  id: string

  returnNo: string

  grnNo: string

  supplierName: string

  supplierInvoiceNo:
    | string
    | null

  businessName: string

  branchName:
    | string
    | null

  branchAddress:
    | string
    | null

  branchPhone:
    | string
    | null

  staffName:
    | string
    | null

  refundAmount: number

  reason:
    | string
    | null

  status: string

  createdAt: string

  items:
    PurchaseReturnReceiptItem[]
}