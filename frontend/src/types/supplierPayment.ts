export type SupplierPaymentMethod =
  | 'cash'
  | 'card'
  | 'qr'
  | 'bank_transfer'
  | 'cheque'
  | 'other'

export interface SupplierStatementEntry {
  id: string

  entryType:
    | 'opening'
    | 'purchase'
    | 'payment'
    | 'adjustment'

  amount: number

  referenceType: string | null
  referenceId: string | null

  description: string | null

  createdAt: string
  runningBalance: number
}

export interface RecordSupplierPaymentInput {
  clientTransactionId: string

  businessId: string
  branchId: string
  supplierId: string

  amount: number

  paymentMethod: SupplierPaymentMethod

  referenceNo: string | null
  note: string | null
}

export interface SupplierPaymentResult {
  duplicate: boolean

  payment_id?: string

  receipt_no?: string

  amount?: number
  balance: number
}

/*
 * Full supplier payment receipt information.
 *
 * Used by:
 * - supplier payment receipt modal
 * - thermal receipt printing
 * - historical payment reprint
 */
export interface SupplierPaymentReceipt {
  id: string

  /*
   * Example:
   * SP-2026-000001
   */
  receiptNo: string

  businessId: string
  branchId: string
  supplierId: string

  paidBy: string | null

  paymentMethod:
    SupplierPaymentMethod

  amount: number

  referenceNo: string | null
  note: string | null

  paidAt: string

  supplier: {
    id: string
    name: string

    phone: string | null
  } | null

  staff: {
    id: string
    fullName: string
  } | null

  business: {
    id: string
    name: string

    phone: string | null
    address: string | null
  } | null

  branch: {
    id: string
    name: string
    code: string | null

    phone: string | null
    address: string | null
  } | null

  /*
   * Supplier payable immediately
   * before this payment.
   */
  previousBalance: number

  /*
   * Supplier payable immediately
   * after this payment.
   */
  remainingBalance: number
}