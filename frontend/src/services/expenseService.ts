import { supabase } from './supabase'

import type {
  Expense,
  ExpenseCategory,
  ExpenseInput,
} from '../types/expense'

interface ExpenseCategoryRow {
  id: string
  business_id: string

  name: string
  description: string | null

  is_active: boolean

  created_at: string
  updated_at: string
}

interface ExpenseRow {
  id: string

  business_id: string
  branch_id: string

  category_id: string | null
  staff_id: string | null

  expense_no: string
  expense_date: string

  amount: number | string

  payment_method: Expense['paymentMethod']

  reference_no: string | null
  description: string | null

  status: Expense['status']

  created_at: string
  updated_at: string

  category:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null

  staff:
    | {
        full_name: string
      }
    | {
        full_name: string
      }[]
    | null
}

function getRelationValue(
  relation:
    | Record<string, unknown>
    | Record<string, unknown>[]
    | null,
  key: string,
) {
  if (!relation) {
    return null
  }

  const value = Array.isArray(relation)
    ? relation[0]?.[key]
    : relation[key]

  return typeof value === 'string'
    ? value
    : null
}

function cleanOptionalText(
  value: string | null,
) {
  const clean = value?.trim()

  return clean
    ? clean
    : null
}

function createExpenseNumber() {
  const now = new Date()

  const date = [
    now.getFullYear(),
    String(
      now.getMonth() + 1,
    ).padStart(2, '0'),
    String(
      now.getDate(),
    ).padStart(2, '0'),
  ].join('')

  const time = [
    String(
      now.getHours(),
    ).padStart(2, '0'),
    String(
      now.getMinutes(),
    ).padStart(2, '0'),
    String(
      now.getSeconds(),
    ).padStart(2, '0'),
  ].join('')

  const random = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()

  return `EXP-${date}-${time}-${random}`
}

export async function getExpenseCategories(
  businessId: string,
): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase
    .from('expense_categories')
    .select(`
      id,
      business_id,
      name,
      description,
      is_active,
      created_at,
      updated_at
    `)
    .eq(
      'business_id',
      businessId,
    )
    .eq(
      'is_active',
      true,
    )
    .order(
      'name',
      {
        ascending: true,
      },
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    (data ?? []) as ExpenseCategoryRow[]
  ).map(
    (row) => ({
      id:
        row.id,

      businessId:
        row.business_id,

      name:
        row.name,

      description:
        row.description,

      isActive:
        row.is_active,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    }),
  )
}

export async function getExpenses(
  businessId: string,
  branchId?: string,
): Promise<Expense[]> {
  let query = supabase
    .from('expenses')
    .select(`
      id,
      business_id,
      branch_id,
      category_id,
      staff_id,
      expense_no,
      expense_date,
      amount,
      payment_method,
      reference_no,
      description,
      status,
      created_at,
      updated_at,

      category:expense_categories (
        name
      ),

      staff:staff (
        full_name
      )
    `)
    .eq(
      'business_id',
      businessId,
    )
    .order(
      'expense_date',
      {
        ascending: false,
      },
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    )

  if (branchId) {
    query = query.eq(
      'branch_id',
      branchId,
    )
  }

  const { data, error } =
    await query

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    (data ?? []) as unknown as ExpenseRow[]
  ).map(
    (row) => ({
      id:
        row.id,

      businessId:
        row.business_id,

      branchId:
        row.branch_id,

      categoryId:
        row.category_id,

      staffId:
        row.staff_id,

      expenseNo:
        row.expense_no,

      expenseDate:
        row.expense_date,

      amount:
        Number(
          row.amount,
        ),

      paymentMethod:
        row.payment_method,

      referenceNo:
        row.reference_no,

      description:
        row.description,

      status:
        row.status,

      categoryName:
        getRelationValue(
          row.category,
          'name',
        ),

      staffName:
        getRelationValue(
          row.staff,
          'full_name',
        ),

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    }),
  )
}

export async function createExpense(
  input: ExpenseInput,
) {
  if (
    !Number.isFinite(
      input.amount,
    ) ||
    input.amount <= 0
  ) {
    throw new Error(
      'Expense amount must be greater than zero.',
    )
  }

  if (!input.expenseDate) {
    throw new Error(
      'Expense date is required.',
    )
  }

  const expenseNo =
    createExpenseNumber()

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      business_id:
        input.businessId,

      branch_id:
        input.branchId,

      category_id:
        input.categoryId,

      staff_id:
        input.staffId,

      expense_no:
        expenseNo,

      expense_date:
        input.expenseDate,

      amount:
        input.amount,

      payment_method:
        input.paymentMethod,

      reference_no:
        cleanOptionalText(
          input.referenceNo,
        ),

      description:
        cleanOptionalText(
          input.description,
        ),

      status:
        'completed',
    })
    .select()
    .single()

  if (error) {
    if (
      error.code === '23505'
    ) {
      throw new Error(
        'Duplicate expense number. Please try again.',
      )
    }

    throw new Error(
      error.message,
    )
  }

  return data
}

export async function cancelExpense(
  expenseId: string,
  businessId: string,
) {
  const { error } = await supabase
    .from('expenses')
    .update({
      status:
        'cancelled',
    })
    .eq(
      'id',
      expenseId,
    )
    .eq(
      'business_id',
      businessId,
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }
}