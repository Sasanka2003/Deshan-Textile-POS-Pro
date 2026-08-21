import { supabase } from './supabase'
import type {
  Category,
  Product,
  ProductInput,
} from '../types/product'

interface CategoryRow {
  id: string
  business_id: string
  name: string
  description: string | null
  is_active: boolean
}

interface ProductRow {
  id: string
  business_id: string
  category_id: string | null
  supplier_id: string | null

  sku: string | null
  barcode: string | null

  name: string
  colour: string | null
  size: string | null
  unit: Product['unit']

  cost_price: number | string
  retail_price: number | string
  wholesale_price: number | string
  minimum_stock_qty: number | string

  is_active: boolean

  categories:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

function getRelationName(
  relation:
    | { name: string }
    | { name: string }[]
    | null,
) {
  if (!relation) return null

  return Array.isArray(relation)
    ? relation[0]?.name ?? null
    : relation.name
}

export async function getCategories(
  businessId: string,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      id,
      business_id,
      name,
      description,
      is_active
    `)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data as CategoryRow[]).map((row) => ({
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
  }))
}

export async function createCategory(
  businessId: string,
  name: string,
  description?: string,
) {
  const cleanName = name.trim()

  if (!cleanName) {
    throw new Error('Category name is required.')
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      business_id: businessId,
      name: cleanName,
      description: description?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('This category already exists.')
    }

    throw new Error(error.message)
  }

  return data
}

export async function getProducts(
  businessId: string,
): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      business_id,
      category_id,
      supplier_id,
      sku,
      barcode,
      name,
      colour,
      size,
      unit,
      cost_price,
      retail_price,
      wholesale_price,
      minimum_stock_qty,
      is_active,
      categories (
        name
      )
    `)
    .eq('business_id', businessId)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as ProductRow[]).map(
    (row) => ({
      id: row.id,
      businessId: row.business_id,
      categoryId: row.category_id,
      supplierId: row.supplier_id,

      sku: row.sku,
      barcode: row.barcode,

      name: row.name,
      colour: row.colour,
      size: row.size,
      unit: row.unit,

      costPrice: Number(row.cost_price),
      retailPrice: Number(row.retail_price),
      wholesalePrice: Number(row.wholesale_price),
      minimumStockQty: Number(
        row.minimum_stock_qty,
      ),

      isActive: row.is_active,

      categoryName: getRelationName(
        row.categories,
      ),
    }),
  )
}

function normalizeOptionalText(
  value: string | null,
) {
  const clean = value?.trim()

  return clean ? clean : null
}

function productPayload(
  businessId: string,
  input: ProductInput,
) {
  if (!input.name.trim()) {
    throw new Error('Product name is required.')
  }

  if (
    input.costPrice < 0 ||
    input.retailPrice < 0 ||
    input.wholesalePrice < 0 ||
    input.minimumStockQty < 0
  ) {
    throw new Error(
      'Price and stock values cannot be negative.',
    )
  }

  return {
    business_id: businessId,

    category_id: input.categoryId,
    supplier_id: input.supplierId ?? null,

    sku: normalizeOptionalText(input.sku),
    barcode: normalizeOptionalText(input.barcode),

    name: input.name.trim(),
    colour: normalizeOptionalText(input.colour),
    size: normalizeOptionalText(input.size),

    unit: input.unit,

    cost_price: input.costPrice,
    retail_price: input.retailPrice,
    wholesale_price: input.wholesalePrice,
    minimum_stock_qty: input.minimumStockQty,
  }
}

export async function createProduct(
  businessId: string,
  input: ProductInput,
) {
  const { data, error } = await supabase
    .from('products')
    .insert(productPayload(businessId, input))
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'SKU or barcode is already assigned to another product.',
      )
    }

    throw new Error(error.message)
  }

  return data
}

export async function updateProduct(
  productId: string,
  businessId: string,
  input: ProductInput,
) {
  const { data, error } = await supabase
    .from('products')
    .update(productPayload(businessId, input))
    .eq('id', productId)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'SKU or barcode is already assigned to another product.',
      )
    }

    throw new Error(error.message)
  }

  return data
}

export async function setProductActiveStatus(
  productId: string,
  businessId: string,
  isActive: boolean,
) {
  const { error } = await supabase
    .from('products')
    .update({
      is_active: isActive,
    })
    .eq('id', productId)
    .eq('business_id', businessId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function deleteUnusedProduct(
  productId: string,
  businessId: string,
) {
  const { data, error } = await supabase.rpc(
    'delete_unused_product',
    {
      p_business_id: businessId,
      p_product_id: productId,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function saveProductBarcode(
  productId: string,
  businessId: string,
  barcode: string,
): Promise<string> {
  const cleanBarcode = barcode.trim()

  if (!cleanBarcode) {
    throw new Error(
      'Barcode is required.',
    )
  }

  if (cleanBarcode.length < 4) {
    throw new Error(
      'Barcode is too short.',
    )
  }

  const {
    data: duplicate,
    error: duplicateError,
  } = await supabase
    .from('products')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('barcode', cleanBarcode)
    .neq('id', productId)
    .maybeSingle()

  if (duplicateError) {
    throw new Error(
      duplicateError.message,
    )
  }

  if (duplicate) {
    throw new Error(
      'This barcode is already assigned to another product.',
    )
  }

  const {
    data,
    error,
  } = await supabase
    .from('products')
    .update({
      barcode: cleanBarcode,
    })
    .eq('id', productId)
    .eq('business_id', businessId)
    .select('barcode')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'This barcode is already assigned to another product.',
      )
    }

    throw new Error(error.message)
  }

  if (!data?.barcode) {
    throw new Error(
      'Barcode was not saved.',
    )
  }

  return String(data.barcode)
}