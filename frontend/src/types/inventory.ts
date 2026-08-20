export type StockMovementType =
  | 'opening'
  | 'purchase'
  | 'sale'
  | 'sale_return'
  | 'purchase_return'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'damage'
  | 'transfer_in'
  | 'transfer_out'

export interface InventoryItem {
  productId: string
  productName: string
  sku: string | null
  barcode: string | null
  unit: string
  minimumStockQty: number
  quantity: number
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  movementType: StockMovementType
  quantity: number
  note: string | null
  createdAt: string
}