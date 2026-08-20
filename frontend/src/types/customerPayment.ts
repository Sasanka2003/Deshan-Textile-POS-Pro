export type CustomerPaymentMethod =
  | 'cash'
  | 'card'
  | 'qr'
  | 'bank_transfer'
  | 'other'

export interface CustomerStatementEntry {
  id: string

  entryType:
    | 'opening'
    | 'sale'
    | 'payment'
    | 'sale_return'
    | 'adjustment'

  amount: number

  referenceType: string | null
  referenceId: string | null

  description: string | null

  createdAt: string
  runningBalance: number
}

export interface RecordCustomerPaymentInput {
  clientTransactionId: string

  businessId: string
  branchId: string
  customerId: string

  amount: number

  paymentMethod: CustomerPaymentMethod

  referenceNo: string | null
  note: string | null
}

export interface CustomerPaymentResult {
  duplicate: boolean

  payment_id?: string

  receipt_no?: string

  amount?: number
  balance: number
}

/*
 * Full customer payment information
 * used by:
 *
 * - payment receipt modal
 * - thermal receipt printing
 * - payment reprint
 */
export interface CustomerPaymentReceipt {
  id: string

  /*
   * Customer-facing receipt number.
   *
   * Example:
   * CP-2026-000001
   */
  receiptNo: string

  businessId: string
  branchId: string
  customerId: string

  receivedBy: string | null

  clientTransactionId: string | null

  paymentMethod: CustomerPaymentMethod

  amount: number

  referenceNo: string | null
  note: string | null

  createdAt: string

  customer: {
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
   * Customer balance immediately
   * before this payment.
   */
  previousBalance: number

  /*
   * Customer balance immediately
   * after this payment.
   */
  remainingBalance: number
}