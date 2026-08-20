export type HeldSaleType =
  | 'retail'
  | 'wholesale'

export interface HeldSaleItem {
  productId: string

  productName: string

  barcode:
    | string
    | null

  quantity: number

  unitPrice: number

  costPrice: number

  discountAmount: number

  lineTotal: number
}

export interface HeldSalePayment {
  method: string

  amount: number

  referenceNo:
    | string
    | null
}

export interface HeldSale {
  id: string

  businessId: string

  branchId: string

  staffId:
    | string
    | null

  customerId:
    | string
    | null

  holdNo: string

  saleType:
    HeldSaleType

  items:
    HeldSaleItem[]

  payments:
    HeldSalePayment[]

  orderDiscount: number

  taxRate: number

  notes:
    | string
    | null

  createdAt: string

  updatedAt: string
}

export interface HoldSaleInput {
  businessId: string

  branchId: string

  staffId: string

  customerId:
    | string
    | null

  saleType:
    HeldSaleType

  items:
    HeldSaleItem[]

  payments:
    HeldSalePayment[]

  orderDiscount: number

  taxRate: number

  notes:
    | string
    | null
}