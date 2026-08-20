import {
  supabase,
} from './supabase'

import type {
  HeldSale,
  HeldSaleItem,
  HeldSalePayment,
  HeldSaleType,
  HoldSaleInput,
} from '../types/heldSale'

interface HeldSaleRow {
  id: string

  business_id: string
  branch_id: string

  staff_id:
    | string
    | null

  customer_id:
    | string
    | null

  hold_no: string

  sale_type:
    HeldSaleType

  items: unknown

  payments: unknown

  order_discount:
    number | string

  tax_rate:
    number | string

  notes:
    | string
    | null

  created_at: string
  updated_at: string
}

function mapHeldSale(
  row: HeldSaleRow,
): HeldSale {
  return {
    id:
      row.id,

    businessId:
      row.business_id,

    branchId:
      row.branch_id,

    staffId:
      row.staff_id,

    customerId:
      row.customer_id,

    holdNo:
      row.hold_no,

    saleType:
      row.sale_type,

    items:
      Array.isArray(
        row.items,
      )
        ? (
            row.items as
              HeldSaleItem[]
          )
        : [],

    payments:
      Array.isArray(
        row.payments,
      )
        ? (
            row.payments as
              HeldSalePayment[]
          )
        : [],

    orderDiscount:
      Number(
        row.order_discount,
      ),

    taxRate:
      Number(
        row.tax_rate,
      ),

    notes:
      row.notes,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

function validateHoldInput(
  input: HoldSaleInput,
) {
  if (
    !input.businessId
  ) {
    throw new Error(
      'Business ID is required.',
    )
  }

  if (
    !input.branchId
  ) {
    throw new Error(
      'Branch ID is required.',
    )
  }

  if (
    !input.staffId
  ) {
    throw new Error(
      'Staff ID is required.',
    )
  }

  if (
    input.items.length === 0
  ) {
    throw new Error(
      'Cannot hold an empty bill.',
    )
  }

  if (
    input.saleType !==
      'retail' &&
    input.saleType !==
      'wholesale'
  ) {
    throw new Error(
      'Invalid sale type.',
    )
  }

  if (
    !Number.isFinite(
      input.orderDiscount,
    ) ||
    input.orderDiscount < 0
  ) {
    throw new Error(
      'Invalid order discount.',
    )
  }

  if (
    !Number.isFinite(
      input.taxRate,
    ) ||
    input.taxRate < 0
  ) {
    throw new Error(
      'Invalid tax rate.',
    )
  }
}

function generateHoldNo() {
  const now =
    new Date()

  const date =
    now
      .toISOString()
      .slice(
        0,
        10,
      )
      .replaceAll(
        '-',
        '',
      )

  const time =
    [
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    ]
      .map(
        (value) =>
          String(
            value,
          ).padStart(
            2,
            '0',
          ),
      )
      .join('')

  const random =
    Math.random()
      .toString(36)
      .slice(
        2,
        6,
      )
      .toUpperCase()

  return `HOLD-${date}-${time}-${random}`
}

export async function getHeldSales(
  businessId: string,
  branchId: string,
): Promise<HeldSale[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'held_sales',
      )
      .select(`
        id,
        business_id,
        branch_id,
        staff_id,
        customer_id,
        hold_no,
        sale_type,
        items,
        payments,
        order_discount,
        tax_rate,
        notes,
        created_at,
        updated_at
      `)
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .order(
        'created_at',
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
    (data ?? []) as
      HeldSaleRow[]
  ).map(
    mapHeldSale,
  )
}

export async function getHeldSaleById(
  heldSaleId: string,
  businessId: string,
  branchId: string,
): Promise<HeldSale> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'held_sales',
      )
      .select(`
        id,
        business_id,
        branch_id,
        staff_id,
        customer_id,
        hold_no,
        sale_type,
        items,
        payments,
        order_discount,
        tax_rate,
        notes,
        created_at,
        updated_at
      `)
      .eq(
        'id',
        heldSaleId,
      )
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return mapHeldSale(
    data as HeldSaleRow,
  )
}

export async function holdSale(
  input: HoldSaleInput,
): Promise<HeldSale> {
  validateHoldInput(
    input,
  )

  const holdNo =
    generateHoldNo()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'held_sales',
      )
      .insert({
        business_id:
          input.businessId,

        branch_id:
          input.branchId,

        staff_id:
          input.staffId,

        customer_id:
          input.customerId,

        hold_no:
          holdNo,

        sale_type:
          input.saleType,

        items:
          input.items,

        payments:
          input.payments,

        order_discount:
          input.orderDiscount,

        tax_rate:
          input.taxRate,

        notes:
          input.notes,
      })
      .select(`
        id,
        business_id,
        branch_id,
        staff_id,
        customer_id,
        hold_no,
        sale_type,
        items,
        payments,
        order_discount,
        tax_rate,
        notes,
        created_at,
        updated_at
      `)
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return mapHeldSale(
    data as HeldSaleRow,
  )
}

export async function updateHeldSale(
  heldSaleId: string,
  input: HoldSaleInput,
): Promise<HeldSale> {
  validateHoldInput(
    input,
  )

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'held_sales',
      )
      .update({
        customer_id:
          input.customerId,

        sale_type:
          input.saleType,

        items:
          input.items,

        payments:
          input.payments,

        order_discount:
          input.orderDiscount,

        tax_rate:
          input.taxRate,

        notes:
          input.notes,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        heldSaleId,
      )
      .eq(
        'business_id',
        input.businessId,
      )
      .eq(
        'branch_id',
        input.branchId,
      )
      .select(`
        id,
        business_id,
        branch_id,
        staff_id,
        customer_id,
        hold_no,
        sale_type,
        items,
        payments,
        order_discount,
        tax_rate,
        notes,
        created_at,
        updated_at
      `)
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return mapHeldSale(
    data as HeldSaleRow,
  )
}

export async function deleteHeldSale(
  heldSaleId: string,
  businessId: string,
  branchId: string,
): Promise<void> {
  const {
    error,
  } =
    await supabase
      .from(
        'held_sales',
      )
      .delete()
      .eq(
        'id',
        heldSaleId,
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