export type ExpensePaymentMethod =
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'qr'
  | 'other'

export type ExpenseStatus =
  | 'completed'
  | 'cancelled'

export interface ExpenseCategory {
  id: string
  businessId: string

  name: string
  description: string | null

  isActive: boolean

  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string

  businessId: string
  branchId: string

  categoryId: string | null
  staffId: string | null

  expenseNo: string

  expenseDate: string

  amount: number

  paymentMethod: ExpensePaymentMethod

  referenceNo: string | null
  description: string | null

  status: ExpenseStatus

  categoryName: string | null
  staffName: string | null

  createdAt: string
  updatedAt: string
}

export interface ExpenseInput {
  businessId: string
  branchId: string

  categoryId: string | null
  staffId: string | null

  expenseDate: string

  amount: number

  paymentMethod: ExpensePaymentMethod

  referenceNo: string | null
  description: string | null
}