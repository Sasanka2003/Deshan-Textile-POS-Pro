import { supabase } from './supabase'

import type {
  CompleteReturnInput,
  CompleteReturnResult,
  RefundMethod,
  ReturnHistoryItem,
  ReturnReceiptDetail,
  ReturnReceiptItem,
} from '../types/return'

interface ReturnHistoryRow {
  id: string

  return_no: string

  refund_method: RefundMethod
  refund_amount: number | string

  reason: string | null
  status: string

  created_at: string

  sales:
    | {
        invoice_no: string

        customers:
          | {
              name: string
            }
          | {
              name: string
            }[]
          | null
      }
    | {
        invoice_no: string

        customers:
          | {
              name: string
            }
          | {
              name: string
            }[]
          | null
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

interface ReturnIdRow {
  id: string
}

interface ReturnedItemRow {
  sale_item_id: string
  quantity: number | string
}

interface ReturnReceiptRow {
  id: string

  business_id: string
  branch_id: string | null

  return_no: string

  refund_method: RefundMethod
  refund_amount: number | string

  reason: string | null
  status: string

  created_at: string

  businesses:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null

  branches:
    | {
        name: string
        address: string | null
        phone: string | null
      }
    | {
        name: string
        address: string | null
        phone: string | null
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

  sales:
    | {
        invoice_no: string

        customers:
          | {
              name: string
            }
          | {
              name: string
            }[]
          | null
      }
    | {
        invoice_no: string

        customers:
          | {
              name: string
            }
          | {
              name: string
            }[]
          | null
      }[]
    | null
}

interface ReturnReceiptItemRow {
  id: string

  product_name: string

  quantity: number | string
  unit_price: number | string

  discount_amount: number | string
  line_refund: number | string
}

interface ReceiptSettingsRow {
  business_name: string
  business_phone: string | null
  business_address: string | null

  branch_name: string | null
  branch_phone: string | null
}

export type ReturnedQuantityMap =
  Record<string, number>

function firstRelation<T>(
  value: T | T[] | null,
): T | null {
  if (!value) {
    return null
  }

  return Array.isArray(value)
    ? value[0] ?? null
    : value
}

async function getReceiptSettings(
  businessId: string,
  branchId: string | null,
): Promise<ReceiptSettingsRow | null> {
  let query =
    supabase
      .from('business_settings')
      .select(`
        business_name,
        business_phone,
        business_address,
        branch_name,
        branch_phone
      `)
      .eq(
        'business_id',
        businessId,
      )

  if (branchId) {
    query =
      query.eq(
        'branch_id',
        branchId,
      )
  } else {
    query =
      query.is(
        'branch_id',
        null,
      )
  }

  const {
    data,
    error,
  } =
    await query
      .order(
        'updated_at',
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    return null
  }

  return data as ReceiptSettingsRow
}

export async function completeReturn(
  input: CompleteReturnInput,
): Promise<CompleteReturnResult> {
  if (!input.clientTransactionId) {
    throw new Error(
      'Client transaction ID is required.',
    )
  }

  if (
    !input.businessId ||
    !input.branchId ||
    !input.saleId
  ) {
    throw new Error(
      'Business, branch and sale are required.',
    )
  }

  if (input.items.length === 0) {
    throw new Error(
      'Select at least one item to return.',
    )
  }

  for (const item of input.items) {
    if (
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new Error(
        'Return quantity must be greater than zero.',
      )
    }
  }

  const { data, error } =
    await supabase.rpc(
      'complete_return',
      {
        p_client_transaction_id:
          input.clientTransactionId,

        p_business_id:
          input.businessId,

        p_branch_id:
          input.branchId,

        p_sale_id:
          input.saleId,

        p_items:
          input.items,

        p_refund_method:
          input.refundMethod,

        p_reason:
          input.reason,
      },
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    throw new Error(
      'Return result was not returned.',
    )
  }

  return data as CompleteReturnResult
}

export async function getReturnedQuantitiesForSale(
  saleId: string,
): Promise<ReturnedQuantityMap> {
  const {
    data: returnsData,
    error: returnsError,
  } = await supabase
    .from('returns')
    .select('id')
    .eq(
      'sale_id',
      saleId,
    )
    .eq(
      'status',
      'completed',
    )

  if (returnsError) {
    throw new Error(
      returnsError.message,
    )
  }

  const returnIds =
    (
      (returnsData ??
        []) as ReturnIdRow[]
    ).map(
      (row) => row.id,
    )

  if (
    returnIds.length === 0
  ) {
    return {}
  }

  const {
    data: itemData,
    error: itemError,
  } = await supabase
    .from('return_items')
    .select(
      'sale_item_id, quantity',
    )
    .in(
      'return_id',
      returnIds,
    )

  if (itemError) {
    throw new Error(
      itemError.message,
    )
  }

  const map:
    ReturnedQuantityMap = {}

  for (
    const row of
      (itemData ??
        []) as ReturnedItemRow[]
  ) {
    map[row.sale_item_id] =
      (
        map[
          row.sale_item_id
        ] ?? 0
      ) +
      Number(
        row.quantity,
      )
  }

  return map
}

export async function getReturnHistory(
  businessId: string,
  branchId?: string,
): Promise<ReturnHistoryItem[]> {
  let query =
    supabase
      .from('returns')
      .select(`
        id,
        return_no,
        refund_method,
        refund_amount,
        reason,
        status,
        created_at,

        sales (
          invoice_no,

          customers (
            name
          )
        ),

        staff (
          full_name
        )
      `)
      .eq(
        'business_id',
        businessId,
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      )

  if (branchId) {
    query =
      query.eq(
        'branch_id',
        branchId,
      )
  }

  const {
    data,
    error,
  } =
    await query

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    (data ??
      []) as ReturnHistoryRow[]
  ).map((row) => {
    const sale =
      firstRelation(
        row.sales,
      )

    const customer =
      firstRelation(
        sale?.customers ??
          null,
      )

    const staff =
      firstRelation(
        row.staff,
      )

    return {
      id:
        row.id,

      returnNo:
        row.return_no,

      invoiceNo:
        sale?.invoice_no ??
        '—',

      customerName:
        customer?.name ??
        null,

      staffName:
        staff?.full_name ??
        null,

      refundMethod:
        row.refund_method,

      refundAmount:
        Number(
          row.refund_amount,
        ),

      reason:
        row.reason,

      status:
        row.status,

      createdAt:
        row.created_at,
    }
  })
}

export async function getReturnReceipt(
  returnId: string,
): Promise<ReturnReceiptDetail> {
  const {
    data,
    error,
  } =
    await supabase
      .from('returns')
      .select(`
        id,
        business_id,
        branch_id,
        return_no,
        refund_method,
        refund_amount,
        reason,
        status,
        created_at,

        businesses (
          name
        ),

        branches (
          name,
          address,
          phone
        ),

        staff (
          full_name
        ),

        sales (
          invoice_no,

          customers (
            name
          )
        )
      `)
      .eq(
        'id',
        returnId,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    throw new Error(
      'Return receipt was not found.',
    )
  }

  const row =
    data as ReturnReceiptRow

  const [
    itemResult,
    receiptSettings,
  ] =
    await Promise.all([
      supabase
        .from(
          'return_items',
        )
        .select(`
          id,
          product_name,
          quantity,
          unit_price,
          discount_amount,
          line_refund
        `)
        .eq(
          'return_id',
          returnId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        ),

      getReceiptSettings(
        row.business_id,
        row.branch_id,
      ),
    ])

  if (itemResult.error) {
    throw new Error(
      itemResult.error.message,
    )
  }

  const business =
    firstRelation(
      row.businesses,
    )

  const branch =
    firstRelation(
      row.branches,
    )

  const staff =
    firstRelation(
      row.staff,
    )

  const sale =
    firstRelation(
      row.sales,
    )

  const customer =
    firstRelation(
      sale?.customers ??
        null,
    )

  const items:
    ReturnReceiptItem[] =
    (
      (itemResult.data ??
        []) as ReturnReceiptItemRow[]
    ).map(
      (item) => ({
        id:
          item.id,

        productName:
          item.product_name,

        quantity:
          Number(
            item.quantity,
          ),

        unitPrice:
          Number(
            item.unit_price,
          ),

        discountAmount:
          Number(
            item.discount_amount,
          ),

        lineRefund:
          Number(
            item.line_refund,
          ),
      }),
    )

  return {
    id:
      row.id,

    returnNo:
      row.return_no,

    invoiceNo:
      sale?.invoice_no ??
      '—',

    refundMethod:
      row.refund_method,

    refundAmount:
      Number(
        row.refund_amount,
      ),

    reason:
      row.reason,

    status:
      row.status,

    createdAt:
      row.created_at,

    customerName:
      customer?.name ??
      null,

    staffName:
      staff?.full_name ??
      null,

    businessName:
      receiptSettings
        ?.business_name ??
      business?.name ??
      'Deshan Textile',

    branchName:
      receiptSettings
        ?.branch_name ??
      branch?.name ??
      null,

    branchAddress:
      receiptSettings
        ?.business_address ??
      branch?.address ??
      null,

    branchPhone:
      receiptSettings
        ?.business_phone ??
      receiptSettings
        ?.branch_phone ??
      branch?.phone ??
      null,

    items,
  }
}