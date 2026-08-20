import { supabase } from './supabase'

import type {
  HeldBill,
  HeldBillItem,
  SaveHeldBillInput,
} from '../types/heldBill'

interface HeldBillRow {
  id: string

  business_id: string
  branch_id: string
  staff_id: string

  hold_no: string

  customer_id: string | null

  sale_type:
    HeldBill['saleType']

  items: HeldBillItem[]

  order_discount:
    number | string

  payment_method:
    HeldBill['paymentMethod']

  paid_amount:
    number | string

  payment_reference:
    string | null

  notes:
    string | null

  created_at: string
  updated_at: string

  customer:
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

function singleRelation<T>(
  value: T | T[] | null,
): T | null {
  if (!value) {
    return null
  }

  return Array.isArray(value)
    ? value[0] ?? null
    : value
}

function mapHeldBill(
  row: HeldBillRow,
): HeldBill {
  const customer =
    singleRelation(
      row.customer,
    )

  const staff =
    singleRelation(
      row.staff,
    )

  return {
    id:
      row.id,

    businessId:
      row.business_id,

    branchId:
      row.branch_id,

    staffId:
      row.staff_id,

    holdNo:
      row.hold_no,

    customerId:
      row.customer_id,

    customerName:
      customer?.name ??
      null,

    staffName:
      staff?.full_name ??
      null,

    saleType:
      row.sale_type,

    items:
      Array.isArray(
        row.items,
      )
        ? row.items
        : [],

    orderDiscount:
      Number(
        row.order_discount,
      ),

    paymentMethod:
      row.payment_method,

    paidAmount:
      Number(
        row.paid_amount,
      ),

    paymentReference:
      row.payment_reference,

    notes:
      row.notes,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

const selectHeldBill = `
  id,
  business_id,
  branch_id,
  staff_id,
  hold_no,
  customer_id,
  sale_type,
  items,
  order_discount,
  payment_method,
  paid_amount,
  payment_reference,
  notes,
  created_at,
  updated_at,

  customer:customers (
    name
  ),

  staff:staff (
    full_name
  )
`

export async function getHeldBills(
  businessId: string,
  branchId: string,
): Promise<HeldBill[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from('held_bills')
      .select(
        selectHeldBill,
      )
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .order(
        'updated_at',
        {
          ascending:
            false,
        },
      )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    (data ?? []) as unknown as
      HeldBillRow[]
  ).map(
    mapHeldBill,
  )
}

export async function saveHeldBill(
  input: SaveHeldBillInput,
  heldBillId?: string | null,
): Promise<HeldBill> {
  if (
    input.items.length ===
    0
  ) {
    throw new Error(
      'Cannot hold an empty bill.',
    )
  }

  const payload = {
    business_id:
      input.businessId,

    branch_id:
      input.branchId,

    staff_id:
      input.staffId,

    customer_id:
      input.customerId,

    sale_type:
      input.saleType,

    items:
      input.items,

    order_discount:
      input.orderDiscount,

    payment_method:
      input.paymentMethod,

    paid_amount:
      input.paidAmount,

    payment_reference:
      input.paymentReference,

    notes:
      input.notes,

    updated_at:
      new Date()
        .toISOString(),
  }

  if (heldBillId) {
    const {
      data,
      error,
    } =
      await supabase
        .from('held_bills')
        .update(
          payload,
        )
        .eq(
          'id',
          heldBillId,
        )
        .eq(
          'business_id',
          input.businessId,
        )
        .eq(
          'branch_id',
          input.branchId,
        )
        .select(
          selectHeldBill,
        )
        .single()

    if (error) {
      throw new Error(
        error.message,
      )
    }

    return mapHeldBill(
      data as unknown as
        HeldBillRow,
    )
  }

  const {
    data,
    error,
  } =
    await supabase
      .from('held_bills')
      .insert(
        payload,
      )
      .select(
        selectHeldBill,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return mapHeldBill(
    data as unknown as
      HeldBillRow,
  )
}

export async function deleteHeldBill(
  heldBillId: string,
  businessId: string,
  branchId: string,
) {
  const {
    error,
  } =
    await supabase
      .from('held_bills')
      .delete()
      .eq(
        'id',
        heldBillId,
      )
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )

  if (error) {
    throw new Error(
      error.message,
    )
  }
}