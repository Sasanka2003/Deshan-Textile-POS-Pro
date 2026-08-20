import {
  supabase,
} from './supabase'

import type {
  CompletePurchaseReturnInput,
  CompletePurchaseReturnResult,
  PurchaseReturnHistoryItem,
  PurchaseReturnReceiptDetail,
  PurchaseReturnReceiptItem,
  PurchaseReturnSource,
  PurchaseReturnSourceItem,
} from '../types/purchaseReturn'

interface PurchaseRow {
  id: string

  grn_no: string

  supplier_id: string

  supplier_invoice_no:
    | string
    | null

  received_at: string

  subtotal:
    | number
    | string

  discount_amount:
    | number
    | string

  total:
    | number
    | string

  status: string

  suppliers:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

interface PurchaseItemRow {
  id: string

  product_id: string

  product_name: string

  sku:
    | string
    | null

  barcode:
    | string
    | null

  unit: string

  quantity:
    | number
    | string

  unit_cost:
    | number
    | string

  line_discount:
    | number
    | string

  line_total:
    | number
    | string
}

interface ReturnedQuantityRow {
  purchase_item_id: string

  quantity:
    | number
    | string

  purchase_returns:
    | {
        status: string
      }
    | {
        status: string
      }[]
    | null
}

interface PurchaseReturnHistoryRow {
  id: string

  return_no: string

  refund_amount:
    | number
    | string

  reason:
    | string
    | null

  status: string

  created_at: string

  purchases:
    | {
        grn_no: string
      }
    | {
        grn_no: string
      }[]
    | null

  suppliers:
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

interface PurchaseReturnReceiptRow {
  id: string

  business_id: string
  branch_id: string

  return_no: string

  refund_amount:
    | number
    | string

  reason:
    | string
    | null

  status: string

  created_at: string

  purchases:
    | {
        grn_no: string

        supplier_invoice_no:
          | string
          | null
      }
    | {
        grn_no: string

        supplier_invoice_no:
          | string
          | null
      }[]
    | null

  suppliers:
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

        address:
          | string
          | null

        phone:
          | string
          | null
      }
    | {
        name: string

        address:
          | string
          | null

        phone:
          | string
          | null
      }[]
    | null
}

interface PurchaseReturnReceiptItemRow {
  id: string

  product_name: string

  sku:
    | string
    | null

  barcode:
    | string
    | null

  unit:
    | string
    | null

  quantity:
    | number
    | string

  unit_cost:
    | number
    | string

  line_discount:
    | number
    | string

  line_refund:
    | number
    | string
}

interface ReceiptSettingsRow {
  business_name: string

  business_phone:
    | string
    | null

  business_address:
    | string
    | null

  branch_name:
    | string
    | null

  branch_phone:
    | string
    | null
}

interface CompletePurchaseReturnRpcRow {
  duplicate?: boolean

  purchase_return_id?: string
  return_no?: string

  purchase_id?: string
  grn_no?: string

  supplier_id?: string

  refund_amount?:
    | number
    | string

  supplier_balance?:
    | number
    | string
}

function firstRelation<T>(
  value:
    | T
    | T[]
    | null,
): T | null {
  if (!value) {
    return null
  }

  return Array.isArray(
    value,
  )
    ? value[0] ??
        null
    : value
}

async function getReceiptSettings(
  businessId: string,
  branchId: string,
): Promise<
  ReceiptSettingsRow | null
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'business_settings',
      )
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

  return data as
    ReceiptSettingsRow
}

export async function getPurchaseReturnSource(
  purchaseId: string,
): Promise<PurchaseReturnSource> {
  if (!purchaseId) {
    throw new Error(
      'Purchase is required.',
    )
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'purchases',
      )
      .select(`
        id,
        grn_no,
        supplier_id,
        supplier_invoice_no,
        received_at,
        subtotal,
        discount_amount,
        total,
        status,

        suppliers (
          name
        )
      `)
      .eq(
        'id',
        purchaseId,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    throw new Error(
      'Purchase was not found.',
    )
  }

  const purchase =
    data as unknown as
      PurchaseRow

  if (
    purchase.status !==
    'received'
  ) {
    throw new Error(
      'Only received purchases can be returned.',
    )
  }

  const {
    data: itemData,
    error: itemError,
  } =
    await supabase
      .from(
        'purchase_items',
      )
      .select(`
        id,
        product_id,
        product_name,
        sku,
        barcode,
        unit,
        quantity,
        unit_cost,
        line_discount,
        line_total
      `)
      .eq(
        'purchase_id',
        purchaseId,
      )
      .order(
        'created_at',
        {
          ascending:
            true,
        },
      )

  if (itemError) {
    throw new Error(
      itemError.message,
    )
  }

  const purchaseItems =
    (
      itemData ??
      []
    ) as PurchaseItemRow[]

  const purchaseItemIds =
    purchaseItems.map(
      (item) =>
        item.id,
    )

  const returnedByItem =
    new Map<
      string,
      number
    >()

  if (
    purchaseItemIds.length >
    0
  ) {
    const {
      data:
        returnedData,
      error:
        returnedError,
    } =
      await supabase
        .from(
          'purchase_return_items',
        )
        .select(`
          purchase_item_id,
          quantity,

          purchase_returns!inner (
            status
          )
        `)
        .in(
          'purchase_item_id',
          purchaseItemIds,
        )
        .eq(
          'purchase_returns.status',
          'completed',
        )

    if (returnedError) {
      throw new Error(
        returnedError.message,
      )
    }

    for (
      const row of
        (
          returnedData ??
          []
        ) as unknown as
          ReturnedQuantityRow[]
    ) {
      const parent =
        firstRelation(
          row.purchase_returns,
        )

      if (
        parent?.status !==
        'completed'
      ) {
        continue
      }

      returnedByItem.set(
        row.purchase_item_id,
        (
          returnedByItem.get(
            row.purchase_item_id,
          ) ?? 0
        ) +
          Number(
            row.quantity,
          ),
      )
    }
  }

  const items:
    PurchaseReturnSourceItem[] =
    purchaseItems.map(
      (item) => {
        const purchasedQuantity =
          Number(
            item.quantity,
          )

        const alreadyReturnedQuantity =
          returnedByItem.get(
            item.id,
          ) ?? 0

        return {
          id:
            item.id,

          productId:
            item.product_id,

          productName:
            item.product_name,

          sku:
            item.sku,

          barcode:
            item.barcode,

          unit:
            item.unit,

          purchasedQuantity,

          alreadyReturnedQuantity,

          returnableQuantity:
            Math.max(
              0,
              purchasedQuantity -
                alreadyReturnedQuantity,
            ),

          unitCost:
            Number(
              item.unit_cost,
            ),

          lineDiscount:
            Number(
              item.line_discount,
            ),

          lineTotal:
            Number(
              item.line_total,
            ),
        }
      },
    )

  const supplier =
    firstRelation(
      purchase.suppliers,
    )

  return {
    purchaseId:
      purchase.id,

    grnNo:
      purchase.grn_no,

    supplierId:
      purchase.supplier_id,

    supplierName:
      supplier?.name ??
      'Unknown Supplier',

    supplierInvoiceNo:
      purchase.supplier_invoice_no,

    receivedAt:
      purchase.received_at,

    subtotal:
      Number(
        purchase.subtotal,
      ),

    discountAmount:
      Number(
        purchase.discount_amount,
      ),

    total:
      Number(
        purchase.total,
      ),

    items,
  }
}

export async function completePurchaseReturn(
  input: CompletePurchaseReturnInput,
): Promise<CompletePurchaseReturnResult> {
  if (
    !input.clientTransactionId
  ) {
    throw new Error(
      'Client transaction ID is required.',
    )
  }

  if (
    !input.businessId ||
    !input.branchId ||
    !input.purchaseId
  ) {
    throw new Error(
      'Business, branch and purchase are required.',
    )
  }

  if (
    input.items.length ===
    0
  ) {
    throw new Error(
      'Select at least one item to return.',
    )
  }

  for (
    const item of
      input.items
  ) {
    if (
      !item.purchaseItemId
    ) {
      throw new Error(
        'Purchase item is required.',
      )
    }

    if (
      !Number.isFinite(
        item.quantity,
      ) ||
      item.quantity <= 0
    ) {
      throw new Error(
        'Return quantity must be greater than zero.',
      )
    }
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'complete_purchase_return',
      {
        p_client_transaction_id:
          input.clientTransactionId,

        p_business_id:
          input.businessId,

        p_branch_id:
          input.branchId,

        p_purchase_id:
          input.purchaseId,

        p_items:
          input.items,

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
      'Purchase return result was not returned.',
    )
  }

  const result =
    data as
      CompletePurchaseReturnRpcRow

  if (
    !result.purchase_return_id ||
    !result.return_no ||
    !result.purchase_id ||
    !result.grn_no ||
    !result.supplier_id
  ) {
    throw new Error(
      'Purchase return result is incomplete.',
    )
  }

  return {
    duplicate:
      Boolean(
        result.duplicate,
      ),

    purchaseReturnId:
      result.purchase_return_id,

    returnNo:
      result.return_no,

    purchaseId:
      result.purchase_id,

    grnNo:
      result.grn_no,

    supplierId:
      result.supplier_id,

    refundAmount:
      Number(
        result.refund_amount ??
          0,
      ),

    supplierBalance:
      Number(
        result.supplier_balance ??
          0,
      ),
  }
}

export async function getPurchaseReturnHistory(
  businessId: string,
  branchId?: string,
): Promise<
  PurchaseReturnHistoryItem[]
> {
  let query =
    supabase
      .from(
        'purchase_returns',
      )
      .select(`
        id,
        return_no,
        refund_amount,
        reason,
        status,
        created_at,

        purchases (
          grn_no
        ),

        suppliers (
          name
        ),

        staff:returned_by (
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
          ascending:
            false,
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
    (
      data ??
      []
    ) as unknown as
      PurchaseReturnHistoryRow[]
  ).map(
    (row) => {
      const purchase =
        firstRelation(
          row.purchases,
        )

      const supplier =
        firstRelation(
          row.suppliers,
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

        grnNo:
          purchase?.grn_no ??
          '—',

        supplierName:
          supplier?.name ??
          'Unknown Supplier',

        refundAmount:
          Number(
            row.refund_amount,
          ),

        reason:
          row.reason,

        status:
          row.status,

        staffName:
          staff?.full_name ??
          null,

        createdAt:
          row.created_at,
      }
    },
  )
}

export async function getPurchaseReturnReceipt(
  purchaseReturnId: string,
): Promise<
  PurchaseReturnReceiptDetail
> {
  if (!purchaseReturnId) {
    throw new Error(
      'Purchase return is required.',
    )
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'purchase_returns',
      )
      .select(`
        id,
        business_id,
        branch_id,
        return_no,
        refund_amount,
        reason,
        status,
        created_at,

        purchases (
          grn_no,
          supplier_invoice_no
        ),

        suppliers (
          name
        ),

        staff:returned_by (
          full_name
        ),

        businesses (
          name
        ),

        branches (
          name,
          address,
          phone
        )
      `)
      .eq(
        'id',
        purchaseReturnId,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    throw new Error(
      'Purchase return receipt was not found.',
    )
  }

  const row =
    data as unknown as
      PurchaseReturnReceiptRow

  const [
    itemResult,
    settings,
  ] =
    await Promise.all([
      supabase
        .from(
          'purchase_return_items',
        )
        .select(`
          id,
          product_name,
          sku,
          barcode,
          unit,
          quantity,
          unit_cost,
          line_discount,
          line_refund
        `)
        .eq(
          'purchase_return_id',
          purchaseReturnId,
        )
        .order(
          'created_at',
          {
            ascending:
              true,
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

  const purchase =
    firstRelation(
      row.purchases,
    )

  const supplier =
    firstRelation(
      row.suppliers,
    )

  const staff =
    firstRelation(
      row.staff,
    )

  const business =
    firstRelation(
      row.businesses,
    )

  const branch =
    firstRelation(
      row.branches,
    )

  const items:
    PurchaseReturnReceiptItem[] =
    (
      itemResult.data ??
      []
    ).map(
      (rawItem) => {
        const item =
          rawItem as
            PurchaseReturnReceiptItemRow

        return {
          id:
            item.id,

          productName:
            item.product_name,

          sku:
            item.sku,

          barcode:
            item.barcode,

          unit:
            item.unit,

          quantity:
            Number(
              item.quantity,
            ),

          unitCost:
            Number(
              item.unit_cost,
            ),

          lineDiscount:
            Number(
              item.line_discount,
            ),

          lineRefund:
            Number(
              item.line_refund,
            ),
        }
      },
    )

  return {
    id:
      row.id,

    returnNo:
      row.return_no,

    grnNo:
      purchase?.grn_no ??
      '—',

    supplierName:
      supplier?.name ??
      'Unknown Supplier',

    supplierInvoiceNo:
      purchase
        ?.supplier_invoice_no ??
      null,

    businessName:
      settings
        ?.business_name ??
      business?.name ??
      'Deshan Textile',

    branchName:
      settings
        ?.branch_name ??
      branch?.name ??
      null,

    branchAddress:
      settings
        ?.business_address ??
      branch?.address ??
      null,

    branchPhone:
      settings
        ?.business_phone ??
      settings
        ?.branch_phone ??
      branch?.phone ??
      null,

    staffName:
      staff?.full_name ??
      null,

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

    items,
  }
}