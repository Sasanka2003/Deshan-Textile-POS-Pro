import { supabase } from './supabase'

export interface POSProduct {
  id: string

  name: string

  sku: string | null
  barcode: string | null

  unit: string

  retailPrice: number
  wholesalePrice: number

  quantity: number
}

interface StockRow {
  quantity: number | string

  products:
    | {
        id: string
        name: string
        sku: string | null
        barcode: string | null
        unit: string
        retail_price: number | string
        wholesale_price: number | string
        is_active: boolean
      }
    | {
        id: string
        name: string
        sku: string | null
        barcode: string | null
        unit: string
        retail_price: number | string
        wholesale_price: number | string
        is_active: boolean
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

export async function getPOSProducts(
  branchId: string,
): Promise<POSProduct[]> {
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
        retail_price,
        wholesale_price,
        is_active
      )
    `)
    .eq(
      'branch_id',
      branchId,
    )
    .gt(
      'quantity',
      0,
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    (data ?? []) as unknown as StockRow[]
  )
    .map((row) => {
      const product =
        singleRelation(
          row.products,
        )

      if (
        !product ||
        !product.is_active
      ) {
        return null
      }

      return {
        id: product.id,

        name:
          product.name,

        sku:
          product.sku,

        barcode:
          product.barcode,

        unit:
          product.unit,

        retailPrice:
          Number(
            product.retail_price,
          ),

        wholesalePrice:
          Number(
            product.wholesale_price,
          ),

        quantity:
          Number(
            row.quantity,
          ),
      }
    })
    .filter(
      (
        product,
      ): product is POSProduct =>
        product !== null,
    )
    .sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
        ),
    )
}