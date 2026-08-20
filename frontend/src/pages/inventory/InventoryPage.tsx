import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Boxes,
  History,
  Plus,
  Search,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import {
  createStockAdjustment,
  getInventory,
  getStockMovements,
} from '../../services/inventoryService'

import { getProducts } from '../../services/productService'

import type {
  InventoryItem,
  StockMovement,
} from '../../types/inventory'

import type { Product } from '../../types/product'

import '../../styles/inventory.css'

type AdjustmentType =
  | 'opening'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'damage'

export default function InventoryPage() {
  const { staff } = useAuth()

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)

  const [selectedProductId, setSelectedProductId] =
    useState('')

  const [movementType, setMovementType] =
    useState<AdjustmentType>('opening')

  const [quantity, setQuantity] = useState('')
  const [note, setNote] = useState('')

  const branchId = staff?.branchId
  const businessId = staff?.businessId
  const staffId = staff?.id

  async function loadData() {
    if (!branchId || !businessId) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const [
        inventoryData,
        movementData,
        productData,
      ] = await Promise.all([
        getInventory(branchId),
        getStockMovements(branchId),
        getProducts(businessId),
      ])

      setInventory(inventoryData)
      setMovements(movementData)

      setProducts(
        productData.filter(
          (product) => product.isActive,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load inventory.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [branchId, businessId])

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return inventory
    }

    return inventory.filter((item) =>
      [
        item.productName,
        item.sku,
        item.barcode,
        item.unit,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        ),
    )
  }, [inventory, search])

  const lowStockCount = useMemo(
    () =>
      inventory.filter(
        (item) =>
          item.quantity <= item.minimumStockQty,
      ).length,
    [inventory],
  )

  function resetAdjustmentForm() {
    setSelectedProductId('')
    setMovementType('opening')
    setQuantity('')
    setNote('')
  }

  function openAdjustmentModal() {
    setError('')
    resetAdjustmentForm()
    setModalOpen(true)
  }

  function closeAdjustmentModal() {
    if (saving) {
      return
    }

    setModalOpen(false)
    resetAdjustmentForm()
  }

  async function handleAdjustment() {
    if (!businessId) {
      setError('Business information is unavailable.')
      return
    }

    if (!branchId) {
      setError('Branch information is unavailable.')
      return
    }

    if (!staffId) {
      setError('Staff information is unavailable.')
      return
    }

    if (!selectedProductId) {
      setError('Please select a product.')
      return
    }

    const numericQuantity = Number(quantity)

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      setError(
        'Quantity must be greater than zero.',
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      await createStockAdjustment({
        businessId,
        branchId,
        productId: selectedProductId,
        staffId,
        movementType,
        quantity: numericQuantity,
        note,
      })

      setModalOpen(false)
      resetAdjustmentForm()

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update stock.',
      )
    } finally {
      setSaving(false)
    }
  }

  function formatMovementType(type: string) {
    return type
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (character) =>
        character.toUpperCase(),
      )
  }

  function formatQuantity(value: number) {
    return value.toLocaleString('en-LK', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString(
      'en-LK',
      {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
    )
  }

  return (
    <AppLayout>
      <section className="inventory-heading">
        <div>
          <h1>Inventory</h1>

          <p>
            Manage branch stock, opening balances,
            adjustments and stock movement history.
          </p>
        </div>

        {staff?.role === 'manager' && (
          <button
            className="primary-button"
            onClick={openAdjustmentModal}
            type="button"
          >
            <Plus size={18} />
            Stock Adjustment
          </button>
        )}
      </section>

      {error && (
        <div className="inventory-error">
          {error}
        </div>
      )}

      <section className="inventory-summary-grid">
        <article className="inventory-summary-card">
          <div className="summary-icon">
            <Boxes size={21} />
          </div>

          <div>
            <span>Tracked Products</span>
            <strong>{inventory.length}</strong>
          </div>
        </article>

        <article className="inventory-summary-card">
          <div className="summary-icon warning">
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>Low Stock</span>
            <strong>{lowStockCount}</strong>
          </div>
        </article>

        <article className="inventory-summary-card">
          <div className="summary-icon">
            <History size={21} />
          </div>

          <div>
            <span>Recent Movements</span>
            <strong>{movements.length}</strong>
          </div>
        </article>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-header">
          <div>
            <h2>Current Stock</h2>
            <p>Main Branch stock balances</p>
          </div>

          <div className="inventory-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product, SKU, barcode..."
            />
          </div>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / Barcode</th>
                <th>Unit</th>
                <th>Current Stock</th>
                <th>Minimum</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="inventory-empty"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="inventory-empty"
                  >
                    No stock records yet.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLowStock =
                    item.quantity <=
                    item.minimumStockQty

                  return (
                    <tr key={item.productId}>
                      <td>
                        <strong>
                          {item.productName}
                        </strong>
                      </td>

                      <td>
                        <div className="inventory-code">
                          <span>
                            {item.sku ?? 'No SKU'}
                          </span>

                          <small>
                            {item.barcode ??
                              'No barcode'}
                          </small>
                        </div>
                      </td>

                      <td>
                        {item.unit}
                      </td>

                      <td>
                        <strong>
                          {formatQuantity(
                            item.quantity,
                          )}
                        </strong>
                      </td>

                      <td>
                        {formatQuantity(
                          item.minimumStockQty,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            isLowStock
                              ? 'stock-low'
                              : 'stock-good'
                          }
                        >
                          {isLowStock
                            ? 'Low Stock'
                            : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="inventory-panel">
        <div className="inventory-panel-header">
          <div>
            <h2>Stock Movement History</h2>

            <p>
              Latest inventory changes recorded for
              this branch.
            </p>
          </div>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="inventory-empty"
                  >
                    Loading movements...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="inventory-empty"
                  >
                    No stock movements recorded.
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>
                      <strong>
                        {movement.productName}
                      </strong>
                    </td>

                    <td>
                      {formatMovementType(
                        movement.movementType,
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          movement.quantity >= 0
                            ? 'movement-in'
                            : 'movement-out'
                        }
                      >
                        {movement.quantity >= 0
                          ? '+'
                          : ''}

                        {formatQuantity(
                          movement.quantity,
                        )}
                      </span>
                    </td>

                    <td>
                      {movement.note ?? '—'}
                    </td>

                    <td>
                      {formatDate(
                        movement.createdAt,
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="inventory-modal">
            <div className="modal-heading">
              <div>
                <h2>Stock Adjustment</h2>

                <p>
                  Every stock change will be recorded
                  in the inventory ledger.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeAdjustmentModal}
                disabled={saving}
                type="button"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="inventory-form">
              <label>
                Product

                <select
                  value={selectedProductId}
                  onChange={(event) =>
                    setSelectedProductId(
                      event.target.value,
                    )
                  }
                  disabled={saving}
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                      {product.sku
                        ? ` — ${product.sku}`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Adjustment Type

                <select
                  value={movementType}
                  onChange={(event) =>
                    setMovementType(
                      event.target
                        .value as AdjustmentType,
                    )
                  }
                  disabled={saving}
                >
                  <option value="opening">
                    Opening Stock
                  </option>

                  <option value="adjustment_in">
                    Stock Increase
                  </option>

                  <option value="adjustment_out">
                    Stock Decrease
                  </option>

                  <option value="damage">
                    Damaged Stock
                  </option>
                </select>
              </label>

              <label>
                Quantity

                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  placeholder="0.000"
                  disabled={saving}
                />
              </label>

              <label>
                Reason / Note

                <textarea
                  rows={4}
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  placeholder="Enter reason for this stock adjustment"
                  disabled={saving}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={closeAdjustmentModal}
                disabled={saving}
                type="button"
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  void handleAdjustment()
                }
                disabled={saving}
                type="button"
              >
                {saving
                  ? 'Saving...'
                  : 'Save Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}