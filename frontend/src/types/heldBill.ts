import type {
  SalePaymentMethod,
  SaleType,
} from './sale'

export interface HeldBillItem {
  productId: string
  quantity: number
  discountAmount: number
}

export interface HeldBill {
  id: string

  businessId: string
  branchId: string
  staffId: string

  holdNo: string

  customerId: string | null
  customerName: string | null

  staffName: string | null

  saleType: SaleType

  items: HeldBillItem[]

  orderDiscount: number

  paymentMethod: SalePaymentMethod
  paidAmount: number

  paymentReference: string | null
  notes: string | null

  createdAt: string
  updatedAt: string
}

export interface SaveHeldBillInput {
  businessId: string
  branchId: string
  staffId: string

  customerId: string | null

  saleType: SaleType

  items: HeldBillItem[]

  orderDiscount: number

  paymentMethod: SalePaymentMethod
  paidAmount: number

  paymentReference: string | null
  notes: string | null
}