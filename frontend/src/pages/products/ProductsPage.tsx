import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Plus,
  Search,
  Tags,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import {
  createCategory,
  createProduct,
  deleteUnusedProduct,
  getCategories,
  getProducts,
  setProductActiveStatus,
  updateProduct,
} from '../../services/productService'

import type {
  Category,
  Product,
  ProductInput,
  ProductUnit,
} from '../../types/product'

import '../../styles/products.css'

const units: ProductUnit[] = [
  'piece',
  'meter',
  'yard',
  'roll',
  'bundle',
  'dozen',
  'pack',
  'kg',
  'box',
]

const emptyForm: ProductInput = {
  categoryId: null,
  supplierId: null,
  sku: null,
  barcode: null,
  name: '',
  colour: null,
  size: null,
  unit: 'piece',
  costPrice: 0,
  retailPrice: 0,
  wholesalePrice: 0,
  minimumStockQty: 0,
}

export default function ProductsPage() {
  const { staff } = useAuth()

  const [products, setProducts] =
    useState<Product[]>([])

  const [categories, setCategories] =
    useState<Category[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    deletingProductId,
    setDeletingProductId,
  ] = useState<string | null>(null)

  const [search, setSearch] =
    useState('')

  const [error, setError] =
    useState('')

  const [formOpen, setFormOpen] =
    useState(false)

  const [categoryOpen, setCategoryOpen] =
    useState(false)

  const [
    editingProduct,
    setEditingProduct,
  ] = useState<Product | null>(null)

  const [form, setForm] =
    useState<ProductInput>(emptyForm)

  const [
    categoryName,
    setCategoryName,
  ] = useState('')

  const [
    categoryDescription,
    setCategoryDescription,
  ] = useState('')

  const businessId =
    staff?.businessId

  async function loadData() {
    if (!businessId) return

    try {
      setLoading(true)
      setError('')

      const [
        productData,
        categoryData,
      ] = await Promise.all([
        getProducts(businessId),
        getCategories(businessId),
      ])

      setProducts(productData)
      setCategories(categoryData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load products.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [businessId])

  const filteredProducts =
    useMemo(() => {
      const q =
        search.trim().toLowerCase()

      if (!q) {
        return products
      }

      return products.filter(
        (product) =>
          [
            product.name,
            product.sku,
            product.barcode,
            product.categoryName,
            product.colour,
            product.size,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(q),
            ),
      )
    }, [products, search])

  function openCreateForm() {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  function openEditForm(
    product: Product,
  ) {
    setEditingProduct(product)

    setForm({
      categoryId:
        product.categoryId,

      supplierId:
        product.supplierId,

      sku:
        product.sku,

      barcode:
        product.barcode,

      name:
        product.name,

      colour:
        product.colour,

      size:
        product.size,

      unit:
        product.unit,

      costPrice:
        product.costPrice,

      retailPrice:
        product.retailPrice,

      wholesalePrice:
        product.wholesalePrice,

      minimumStockQty:
        product.minimumStockQty,
    })

    setFormOpen(true)
  }

  async function handleProductSave() {
    if (!businessId) return

    try {
      setSaving(true)
      setError('')

      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          businessId,
          form,
        )
      } else {
        await createProduct(
          businessId,
          form,
        )
      }

      setFormOpen(false)
      setEditingProduct(null)
      setForm(emptyForm)

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save product.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleProduct(
    product: Product,
  ) {
    if (!businessId) return

    try {
      setError('')

      await setProductActiveStatus(
        product.id,
        businessId,
        !product.isActive,
      )

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update product.',
      )
    }
  }

  async function handleDeleteProduct(
    product: Product,
  ) {
    if (!businessId) return

    if (staff?.role !== 'manager') {
      setError(
        'Manager permission is required to delete products.',
      )
      return
    }

    const confirmed =
      window.confirm(
        `Permanently delete "${product.name}"?\n\n` +
          'This is only allowed when the product has never been used in sales, purchases, returns, stock movements or held bills.\n\n' +
          'This action cannot be undone.',
      )

    if (!confirmed) return

    try {
      setDeletingProductId(
        product.id,
      )

      setError('')

      await deleteUnusedProduct(
        product.id,
        businessId,
      )

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete product.',
      )
    } finally {
      setDeletingProductId(null)
    }
  }

  async function handleCreateCategory() {
    if (!businessId) return

    try {
      setSaving(true)
      setError('')

      await createCategory(
        businessId,
        categoryName,
        categoryDescription,
      )

      setCategoryName('')
      setCategoryDescription('')
      setCategoryOpen(false)

      await loadData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create category.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <section className="products-heading">
        <div>
          <h1>Products</h1>

          <p>
            Manage textile products,
            prices, barcodes,
            categories and selling units.
          </p>
        </div>

        <div className="products-actions">
          <button
            className="secondary-button"
            onClick={() =>
              setCategoryOpen(true)
            }
            type="button"
          >
            <Tags size={18} />
            Category
          </button>

          <button
            className="primary-button"
            onClick={openCreateForm}
            type="button"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </section>

      {error && (
        <div className="products-error">
          {error}
        </div>
      )}

      <section className="products-card">
        <div className="products-toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search product, barcode, SKU..."
            />
          </div>

          <div className="products-count">
            {filteredProducts.length}{' '}
            products
          </div>
        </div>

        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>SKU / Barcode</th>
                <th>Unit</th>
                <th>Cost</th>
                <th>Retail</th>
                <th>Wholesale</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="empty-row"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="empty-row"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(
                  (product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-name-cell">
                          <strong>
                            {product.name}
                          </strong>

                          {(product.colour ||
                            product.size) && (
                            <span>
                              {[
                                product.colour,
                                product.size,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {product.categoryName ??
                          '—'}
                      </td>

                      <td>
                        <div className="product-code-cell">
                          <span>
                            {product.sku ??
                              'No SKU'}
                          </span>

                          <small>
                            {product.barcode ??
                              'No barcode'}
                          </small>
                        </div>
                      </td>

                      <td>
                        {product.unit}
                      </td>

                      <td>
                        Rs.{' '}
                        {product.costPrice.toFixed(
                          2,
                        )}
                      </td>

                      <td>
                        Rs.{' '}
                        {product.retailPrice.toFixed(
                          2,
                        )}
                      </td>

                      <td>
                        Rs.{' '}
                        {product.wholesalePrice.toFixed(
                          2,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            product.isActive
                              ? 'status-active'
                              : 'status-inactive'
                          }
                        >
                          {product.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() =>
                              openEditForm(
                                product,
                              )
                            }
                            type="button"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              void handleToggleProduct(
                                product,
                              )
                            }
                            type="button"
                          >
                            {product.isActive
                              ? 'Disable'
                              : 'Enable'}
                          </button>

                          {staff?.role ===
                            'manager' && (
                            <button
                              className="danger-button"
                              onClick={() =>
                                void handleDeleteProduct(
                                  product,
                                )
                              }
                              disabled={
                                deletingProductId ===
                                product.id
                              }
                              type="button"
                            >
                              {deletingProductId ===
                              product.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {formOpen && (
        <div className="modal-backdrop">
          <div className="product-modal">
            <div className="modal-heading">
              <div>
                <h2>
                  {editingProduct
                    ? 'Edit Product'
                    : 'Add Product'}
                </h2>

                <p>
                  Product stock will be handled
                  separately through inventory
                  movements.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setFormOpen(false)
                }
                type="button"
              >
                ×
              </button>
            </div>

            <div className="product-form-grid">
              <label className="form-wide">
                Product Name

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Category

                <select
                  value={
                    form.categoryId ?? ''
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      categoryId:
                        event.target.value ||
                        null,
                    })
                  }
                >
                  <option value="">
                    No category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Unit

                <select
                  value={form.unit}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      unit:
                        event.target
                          .value as ProductUnit,
                    })
                  }
                >
                  {units.map((unit) => (
                    <option
                      key={unit}
                      value={unit}
                    >
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                SKU

                <input
                  value={form.sku ?? ''}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      sku:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Barcode

                <input
                  value={
                    form.barcode ?? ''
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      barcode:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Colour

                <input
                  value={
                    form.colour ?? ''
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      colour:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Size

                <input
                  value={form.size ?? ''}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      size:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Cost Price

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.costPrice
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      costPrice:
                        Number(
                          event.target
                            .value,
                        ),
                    })
                  }
                />
              </label>

              <label>
                Retail Price

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.retailPrice
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      retailPrice:
                        Number(
                          event.target
                            .value,
                        ),
                    })
                  }
                />
              </label>

              <label>
                Wholesale Price

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.wholesalePrice
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      wholesalePrice:
                        Number(
                          event.target
                            .value,
                        ),
                    })
                  }
                />
              </label>

              <label>
                Minimum Stock

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={
                    form.minimumStockQty
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      minimumStockQty:
                        Number(
                          event.target
                            .value,
                        ),
                    })
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setFormOpen(false)
                }
                disabled={saving}
                type="button"
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  void handleProductSave()
                }
                disabled={saving}
                type="button"
              >
                {saving
                  ? 'Saving...'
                  : editingProduct
                    ? 'Update Product'
                    : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryOpen && (
        <div className="modal-backdrop">
          <div className="category-modal">
            <div className="modal-heading">
              <div>
                <h2>
                  Add Category
                </h2>

                <p>
                  Create a product category
                  for Deshan Textile.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setCategoryOpen(false)
                }
                type="button"
              >
                ×
              </button>
            </div>

            <div className="category-form">
              <label>
                Category Name

                <input
                  value={
                    categoryName
                  }
                  onChange={(event) =>
                    setCategoryName(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Description

                <textarea
                  rows={4}
                  value={
                    categoryDescription
                  }
                  onChange={(event) =>
                    setCategoryDescription(
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setCategoryOpen(false)
                }
                disabled={saving}
                type="button"
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  void handleCreateCategory()
                }
                disabled={saving}
                type="button"
              >
                {saving
                  ? 'Saving...'
                  : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}