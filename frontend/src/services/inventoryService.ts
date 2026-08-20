import { supabase } from './supabase'

import type {
  InventoryItem,
  StockMovement,
  StockMovementType,
} from '../types/inventory'

interface BranchStockRow {
  quantity: number | string

  products:
    | {
        id: string
        name: string
        sku: string | null
        barcode: string | null
        unit: string
        minimum_stock_qty: number | string
      }
    | {
        id: string
        name: string
        sku: string | null
        barcode: string | null
        unit: string
        minimum_stock_qty: number | string
      }[]
    | null
}

interface MovementRow {
  id: string
  product_id: string
  movement_type: StockMovementType
  quantity: number | string
  note: string | null
  created_at: string

  products:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

function getSingleRelation<T>(
  relation: T | T[] | null,
): T | null {
  if (!relation) return null

  return Array.isArray(relation)
    ? relation[0] ?? null
    : relation
}

export async function getInventory(
  branchId: string,
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('branch_stock')
    .select(`
      quantity,
      products (
        id,
        name,
        sku,
        barcode,
        unit,
        minimum_stock_qty
      )
    `)
    .eq('branch_id', branchId)

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as BranchStockRow[])
    .map((row) => {
      const product = getSingleRelation(row.products)

      if (!product) return null

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        unit: product.unit,
        minimumStockQty: Number(
          product.minimum_stock_qty,
        ),
        quantity: Number(row.quantity),
      }
    })
    .filter(
      (item): item is InventoryItem =>
        item !== null,
    )
}

export async function getStockMovements(
  branchId: string,
  limit = 50,
): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`
      id,
      product_id,
      movement_type,
      quantity,
      note,
      created_at,
      products (
        name
      )
    `)
    .eq('branch_id', branchId)
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as MovementRow[]).map(
    (row) => {
      const product = getSingleRelation(
        row.products,
      )

      return {
        id: row.id,
        productId: row.product_id,
        productName:
          product?.name ?? 'Unknown Product',
        movementType: row.movement_type,
        quantity: Number(row.quantity),
        note: row.note,
        createdAt: row.created_at,
      }
    },
  )
}

export async function createStockAdjustment(params: {
  businessId: string
  branchId: string
  productId: string
  staffId: string
  movementType:
    | 'opening'
    | 'adjustment_in'
    | 'adjustment_out'
    | 'damage'
  quantity: number
  note?: string
}) {
  const {
    businessId,
    branchId,
    productId,
    movementType,
    quantity,
    note,
  } = params

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      'Quantity must be greater than zero.',
    )
  }

  const { error } = await supabase.rpc(
    'adjust_stock',
    {
      p_business_id: businessId,
      p_branch_id: branchId,
      p_product_id: productId,
      p_movement_type: movementType,
      p_quantity: quantity,
      p_note: note?.trim() || null,
    },
  )

  if (error) {
    throw new Error(error.message)
  }
}