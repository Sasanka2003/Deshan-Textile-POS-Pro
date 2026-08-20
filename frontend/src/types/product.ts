export type ProductUnit =
  | 'piece'
  | 'meter'
  | 'yard'
  | 'roll'
  | 'bundle'
  | 'dozen'
  | 'pack'
  | 'kg'
  | 'box'

export interface Category {
  id: string
  businessId: string
  name: string
  description: string | null
  isActive: boolean
}

export interface Product {
  id: string
  businessId: string
  categoryId: string | null
  supplierId: string | null

  sku: string | null
  barcode: string | null

  name: string
  colour: string | null
  size: string | null
  unit: ProductUnit

  costPrice: number
  retailPrice: number
  wholesalePrice: number
  minimumStockQty: number

  isActive: boolean

  categoryName: string | null
}

export interface ProductInput {
  categoryId: string | null
  supplierId?: string | null

  sku: string | null
  barcode: string | null

  name: string
  colour: string | null
  size: string | null
  unit: ProductUnit

  costPrice: number
  retailPrice: number
  wholesalePrice: number
  minimumStockQty: number
}