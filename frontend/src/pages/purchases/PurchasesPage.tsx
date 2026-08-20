import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CheckCircle2,
  Eye,
  Loader2,
  PackagePlus,
  Plus,
  Printer,
  Search,
  Trash2,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import {
  getPurchaseById,
  getPurchases,
  receivePurchase,
} from '../../services/purchaseService'

import {
  getSuppliers,
} from '../../services/supplierService'

import {
  getProducts,
} from '../../services/productService'

import {
  getBusinessSettings,
} from '../../services/settingsService'

import PurchaseReceiptModal from '../../components/purchases/PurchaseReceiptModal'

import {
  printPurchaseReceipt,
} from '../../utils/printPurchaseReceipt'

import {
  directPrintPurchaseReceipt,
} from '../../services/directReceiptPrinter'

import {
  createId,
} from '../../utils/createId'

import type {
  PaymentMethod,
  PurchaseDetail,
  PurchaseItemInput,
  PurchaseListItem,
} from '../../types/purchase'

import type {
  Supplier,
} from '../../types/supplier'

import type {
  Product,
} from '../../types/product'

import type {
  BusinessSettings,
} from '../../types/settings'

import '../../styles/purchases.css'


/* =========================================================
   HELPERS
========================================================= */

function money(
  value: number,
) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  )}`
}


function numberValue(
  value: string,
) {
  const parsed =
    Number(
      value,
    )

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0
}


/* =========================================================
   PAGE
========================================================= */

export default function PurchasesPage() {
  const {
    staff,
  } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId ??
    null


  /* =======================================================
     BUSINESS SETTINGS
  ======================================================= */

  const [
    businessSettings,
    setBusinessSettings,
  ] =
    useState<
      BusinessSettings | null
    >(null)


  /* =======================================================
     MASTER DATA
  ======================================================= */

  const [
    suppliers,
    setSuppliers,
  ] =
    useState<Supplier[]>([])

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([])

  const [
    purchases,
    setPurchases,
  ] =
    useState<PurchaseListItem[]>([])


  /* =======================================================
     PURCHASE DETAIL / RECEIPT
  ======================================================= */

  const [
    selectedPurchase,
    setSelectedPurchase,
  ] =
    useState<PurchaseDetail | null>(
      null,
    )

  const [
    detailLoadingId,
    setDetailLoadingId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    printLoadingId,
    setPrintLoadingId,
  ] =
    useState<string | null>(
      null,
    )


  /* =======================================================
     PURCHASE FORM
  ======================================================= */

  const [
    supplierId,
    setSupplierId,
  ] =
    useState('')

  const [
    supplierInvoiceNo,
    setSupplierInvoiceNo,
  ] =
    useState('')

  const [
    items,
    setItems,
  ] =
    useState<PurchaseItemInput[]>([])

  const [
    productSearch,
    setProductSearch,
  ] =
    useState('')

  const [
    purchaseDiscount,
    setPurchaseDiscount,
  ] =
    useState(0)

  const [
    paidAmount,
    setPaidAmount,
  ] =
    useState(0)

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<PaymentMethod>(
      'cash',
    )

  const [
    paymentReference,
    setPaymentReference,
  ] =
    useState('')

  const [
    notes,
    setNotes,
  ] =
    useState('')


  /* =======================================================
     UI STATE
  ======================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState('')

  const [
    success,
    setSuccess,
  ] =
    useState('')

  const [
    transactionId,
    setTransactionId,
  ] =
    useState(
      () =>
        createId(),
    )


  /* =======================================================
     LOAD BUSINESS SETTINGS
  ======================================================= */

  async function loadBusinessSettings() {
    if (!businessId) {
      setBusinessSettings(
        null,
      )

      return
    }

    try {
      const settings =
        await getBusinessSettings(
          businessId,
          branchId,
        )

      setBusinessSettings(
        settings,
      )
    } catch (err) {
      console.error(
        'Unable to load purchase receipt settings:',
        err,
      )

      setBusinessSettings(
        null,
      )
    }
  }


  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadData() {
    if (
      !businessId ||
      !branchId
    ) {
      setLoading(
        false,
      )

      return
    }

    try {
      setLoading(
        true,
      )

      setError('')

      const [
        supplierData,
        productData,
        purchaseData,
      ] =
        await Promise.all([
          getSuppliers(
            businessId,
          ),

          getProducts(
            businessId,
          ),

          getPurchases(
            businessId,
            branchId,
          ),
        ])

      setSuppliers(
        supplierData.filter(
          (
            supplier,
          ) =>
            supplier.isActive,
        ),
      )

      setProducts(
        productData.filter(
          (
            product,
          ) =>
            product.isActive,
        ),
      )

      setPurchases(
        purchaseData,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load purchases.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }


  useEffect(() => {
    void loadData()
  }, [
    businessId,
    branchId,
  ])


  useEffect(() => {
    void loadBusinessSettings()
  }, [
    businessId,
    branchId,
  ])


  /* =======================================================
     PRODUCT SEARCH
  ======================================================= */

  const filteredProducts =
    useMemo(
      () => {
        const query =
          productSearch
            .trim()
            .toLowerCase()

        if (!query) {
          return products
        }

        return products.filter(
          (
            product,
          ) =>
            [
              product.name,
              product.sku,
              product.barcode,
            ]
              .filter(
                Boolean,
              )
              .some(
                (
                  value,
                ) =>
                  String(
                    value,
                  )
                    .toLowerCase()
                    .includes(
                      query,
                    ),
              ),
        )
      },
      [
        products,
        productSearch,
      ],
    )


  /* =======================================================
     TOTALS
  ======================================================= */

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            currentTotal,
            item,
          ) => {
            const gross =
              item.quantity *
              item.unitCost

            const lineTotal =
              Math.max(
                0,
                gross -
                  item.lineDiscount,
              )

            return (
              currentTotal +
              lineTotal
            )
          },
          0,
        ),
      [
        items,
      ],
    )


  const total =
    Math.max(
      0,
      subtotal -
        purchaseDiscount,
    )


  const balanceDue =
    Math.max(
      0,
      total -
        paidAmount,
    )


  /* =======================================================
     ADD PRODUCT
  ======================================================= */

  function addProduct(
    product: Product,
  ) {
    setError('')
    setSuccess('')

    const exists =
      items.some(
        (
          item,
        ) =>
          item.productId ===
          product.id,
      )

    if (exists) {
      setError(
        `${product.name} is already in the GRN.`,
      )

      return
    }

    setItems(
      (
        current,
      ) => [
        ...current,

        {
          productId:
            product.id,

          productName:
            product.name,

          sku:
            product.sku,

          barcode:
            product.barcode,

          unit:
            product.unit,

          quantity:
            1,

          unitCost:
            0,

          lineDiscount:
            0,
        },
      ],
    )

    setProductSearch(
      '',
    )
  }


  /* =======================================================
     UPDATE PRODUCT
  ======================================================= */

  function updateItem(
    productId: string,
    field:
      | 'quantity'
      | 'unitCost'
      | 'lineDiscount',
    value: number,
  ) {
    setItems(
      (
        current,
      ) =>
        current.map(
          (
            item,
          ) =>
            item.productId ===
            productId
              ? {
                  ...item,

                  [field]:
                    Number.isFinite(
                      value,
                    )
                      ? value
                      : 0,
                }
              : item,
        ),
    )
  }


  /* =======================================================
     REMOVE PRODUCT
  ======================================================= */

  function removeItem(
    productId: string,
  ) {
    setItems(
      (
        current,
      ) =>
        current.filter(
          (
            item,
          ) =>
            item.productId !==
            productId,
        ),
    )
  }


  /* =======================================================
     RESET PURCHASE
  ======================================================= */

  function resetPurchase() {
    setSupplierId(
      '',
    )

    setSupplierInvoiceNo(
      '',
    )

    setItems([])

    setProductSearch(
      '',
    )

    setPurchaseDiscount(
      0,
    )

    setPaidAmount(
      0,
    )

    setPaymentMethod(
      'cash',
    )

    setPaymentReference(
      '',
    )

    setNotes(
      '',
    )

    setTransactionId(
      createId(),
    )
  }


  /* =======================================================
     RECEIVE GRN
  ======================================================= */

  async function handleReceive() {
    if (
      !businessId ||
      !branchId
    ) {
      setError(
        'Business or branch information is unavailable.',
      )

      return
    }


    if (!supplierId) {
      setError(
        'Please select a supplier.',
      )

      return
    }


    if (
      items.length ===
      0
    ) {
      setError(
        'Add at least one product to the GRN.',
      )

      return
    }


    for (
      const item of
        items
    ) {
      if (
        !Number.isFinite(
          item.quantity,
        ) ||
        item.quantity <=
          0
      ) {
        setError(
          `Enter a valid quantity for ${item.productName}.`,
        )

        return
      }


      if (
        !Number.isFinite(
          item.unitCost,
        ) ||
        item.unitCost <
          0
      ) {
        setError(
          `Enter a valid cost for ${item.productName}.`,
        )

        return
      }


      if (
        item.lineDiscount <
          0 ||
        item.lineDiscount >
          item.quantity *
            item.unitCost
      ) {
        setError(
          `Invalid discount for ${item.productName}.`,
        )

        return
      }
    }


    if (
      purchaseDiscount <
        0 ||
      purchaseDiscount >
        subtotal
    ) {
      setError(
        'Invalid purchase discount.',
      )

      return
    }


    if (
      paidAmount <
        0 ||
      paidAmount >
        total
    ) {
      setError(
        'Paid amount cannot exceed the purchase total.',
      )

      return
    }


    try {
      setSaving(
        true,
      )

      setError('')
      setSuccess('')


      const result =
        await receivePurchase({
          clientTransactionId:
            transactionId,

          businessId,

          branchId,

          supplierId,

          supplierInvoiceNo:
            supplierInvoiceNo
              .trim() ||
            null,

          items,

          discountAmount:
            purchaseDiscount,

          paidAmount,

          paymentMethod,

          paymentReference:
            paymentReference
              .trim() ||
            null,

          notes:
            notes.trim() ||
            null,
        })


      setSuccess(
        `${result.grn_no} received successfully. Total ${money(
          result.total,
        )}. Balance ${money(
          result.balance_due,
        )}.`,
      )


      resetPurchase()


      const purchaseData =
        await getPurchases(
          businessId,
          branchId,
        )


      setPurchases(
        purchaseData,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to receive purchase.',
      )
    } finally {
      setSaving(
        false,
      )
    }
  }


  /* =======================================================
     VIEW GRN
  ======================================================= */

  async function handleViewPurchase(
    purchaseId: string,
  ) {
    try {
      setDetailLoadingId(
        purchaseId,
      )

      setError('')

      const detail =
        await getPurchaseById(
          purchaseId,
        )

      setSelectedPurchase(
        detail,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load GRN details.',
      )
    } finally {
      setDetailLoadingId(
        null,
      )
    }
  }


  /* =======================================================
     PRINT GRN
  ======================================================= */

  async function handlePrintPurchase(
    purchaseId: string,
  ) {
    try {
      setPrintLoadingId(
        purchaseId,
      )

      setError('')

      const detail =
        await getPurchaseById(
          purchaseId,
        )

      const printed =
        await directPrintPurchaseReceipt(
          detail,
          businessSettings,
        )

      if (!printed) {
        printPurchaseReceipt(
          detail,
          businessSettings,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to print GRN.',
      )
    } finally {
      setPrintLoadingId(
        null,
      )
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AppLayout>

      <section className="purchase-heading">

        <div>

          <h1>
            Purchases / GRN
          </h1>

          <p>
            Receive supplier stock,
            record costs and update
            inventory automatically.
          </p>

        </div>


        <div className="purchase-heading-badge">

          <PackagePlus
            size={18}
          />

          Goods Receiving

        </div>

      </section>


      {error && (
        <div className="purchase-message error">
          {error}
        </div>
      )}


      {success && (
        <div className="purchase-message success">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>
      )}


      <div className="purchase-workspace">

        <div className="purchase-main">


          <section className="purchase-card">

            <div className="purchase-card-heading">

              <div>

                <h2>
                  Supplier Details
                </h2>

                <p>
                  Select the supplier
                  and enter invoice
                  information.
                </p>

              </div>

            </div>


            <div className="purchase-form-grid">

              <label>

                Supplier *

                <select
                  value={
                    supplierId
                  }
                  onChange={(
                    event,
                  ) =>
                    setSupplierId(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    saving
                  }
                >

                  <option value="">
                    Select supplier
                  </option>

                  {suppliers.map(
                    (
                      supplier,
                    ) => (
                      <option
                        key={
                          supplier.id
                        }
                        value={
                          supplier.id
                        }
                      >
                        {
                          supplier.name
                        }
                      </option>
                    ),
                  )}

                </select>

              </label>


              <label>

                Supplier Invoice No.

                <input
                  value={
                    supplierInvoiceNo
                  }
                  onChange={(
                    event,
                  ) =>
                    setSupplierInvoiceNo(
                      event.target
                        .value,
                    )
                  }
                  placeholder="INV-001"
                  disabled={
                    saving
                  }
                />

              </label>

            </div>

          </section>


          <section className="purchase-card">

            <div className="purchase-card-heading">

              <div>

                <h2>
                  GRN Items
                </h2>

                <p>
                  Add products with
                  received quantity and
                  purchase cost.
                </p>

              </div>


              <span>
                {items.length}{' '}
                item
                {items.length ===
                1
                  ? ''
                  : 's'}
              </span>

            </div>


            <div className="purchase-product-search">

              <Search
                size={17}
              />

              <input
                value={
                  productSearch
                }
                onChange={(
                  event,
                ) =>
                  setProductSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search product, SKU or barcode..."
                disabled={
                  saving
                }
              />

            </div>


            {productSearch.trim() && (

              <div className="purchase-search-results">

                {filteredProducts
                  .slice(
                    0,
                    8,
                  )
                  .map(
                    (
                      product,
                    ) => (

                      <button
                        key={
                          product.id
                        }
                        type="button"
                        onClick={() =>
                          addProduct(
                            product,
                          )
                        }
                      >

                        <div>

                          <strong>
                            {
                              product.name
                            }
                          </strong>

                          <span>
                            {product.sku ??
                              'No SKU'}
                            {' · '}
                            {
                              product.unit
                            }
                          </span>

                        </div>

                        <Plus
                          size={17}
                        />

                      </button>

                    ),
                  )}


                {filteredProducts.length ===
                  0 && (

                  <div className="purchase-no-results">
                    No products found.
                  </div>

                )}

              </div>

            )}


            <div className="purchase-items-wrap">

              <table className="purchase-items-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Unit
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Unit Cost
                    </th>

                    <th>
                      Line Discount
                    </th>

                    <th>
                      Line Total
                    </th>

                    <th />

                  </tr>

                </thead>


                <tbody>

                  {items.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan={
                          7
                        }
                        className="purchase-empty"
                      >
                        Search and add
                        products to this
                        GRN.
                      </td>

                    </tr>

                  ) : (

                    items.map(
                      (
                        item,
                      ) => {

                        const lineTotal =
                          Math.max(
                            0,

                            item.quantity *
                              item.unitCost -
                              item.lineDiscount,
                          )


                        return (

                          <tr
                            key={
                              item.productId
                            }
                          >

                            <td>

                              <div className="purchase-product-name">

                                <strong>
                                  {
                                    item.productName
                                  }
                                </strong>

                                <small>
                                  {item.sku ??
                                    item.barcode ??
                                    '—'}
                                </small>

                              </div>

                            </td>


                            <td>
                              {
                                item.unit
                              }
                            </td>


                            <td>

                              <input
                                className="purchase-number-input"
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={
                                  item.quantity
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateItem(
                                    item.productId,
                                    'quantity',
                                    numberValue(
                                      event
                                        .target
                                        .value,
                                    ),
                                  )
                                }
                                disabled={
                                  saving
                                }
                              />

                            </td>


                            <td>

                              <input
                                className="purchase-number-input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.unitCost
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateItem(
                                    item.productId,
                                    'unitCost',
                                    numberValue(
                                      event
                                        .target
                                        .value,
                                    ),
                                  )
                                }
                                disabled={
                                  saving
                                }
                              />

                            </td>


                            <td>

                              <input
                                className="purchase-number-input"
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  item.lineDiscount
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateItem(
                                    item.productId,
                                    'lineDiscount',
                                    numberValue(
                                      event
                                        .target
                                        .value,
                                    ),
                                  )
                                }
                                disabled={
                                  saving
                                }
                              />

                            </td>


                            <td>

                              <strong>
                                {money(
                                  lineTotal,
                                )}
                              </strong>

                            </td>


                            <td>

                              <button
                                className="purchase-remove"
                                type="button"
                                onClick={() =>
                                  removeItem(
                                    item.productId,
                                  )
                                }
                                disabled={
                                  saving
                                }
                                aria-label="Remove product"
                              >

                                <Trash2
                                  size={16}
                                />

                              </button>

                            </td>

                          </tr>

                        )
                      },
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>


          <section className="purchase-card">

            <div className="purchase-card-heading">

              <div>

                <h2>
                  Payment Details
                </h2>

                <p>
                  Record immediate
                  payment or leave the
                  balance as supplier
                  credit.
                </p>

              </div>

            </div>


            <div className="purchase-form-grid">

              <label>

                Paid Amount

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    paidAmount
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaidAmount(
                      numberValue(
                        event.target
                          .value,
                      ),
                    )
                  }
                  disabled={
                    saving
                  }
                />

              </label>


              <label>

                Payment Method

                <select
                  value={
                    paymentMethod
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentMethod(
                      event.target
                        .value as
                        PaymentMethod,
                    )
                  }
                  disabled={
                    saving ||
                    paidAmount <=
                      0
                  }
                >

                  <option value="cash">
                    Cash
                  </option>

                  <option value="bank_transfer">
                    Bank Transfer
                  </option>

                  <option value="cheque">
                    Cheque
                  </option>

                  <option value="card">
                    Card
                  </option>

                  <option value="qr">
                    QR
                  </option>

                  <option value="other">
                    Other
                  </option>

                </select>

              </label>


              <label>

                Payment Reference

                <input
                  value={
                    paymentReference
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaymentReference(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Cheque / bank / QR reference"
                  disabled={
                    saving ||
                    paidAmount <=
                      0
                  }
                />

              </label>


              <label>

                Purchase Discount

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    purchaseDiscount
                  }
                  onChange={(
                    event,
                  ) =>
                    setPurchaseDiscount(
                      numberValue(
                        event.target
                          .value,
                      ),
                    )
                  }
                  disabled={
                    saving
                  }
                />

              </label>


              <label className="purchase-full-field">

                Notes

                <textarea
                  rows={3}
                  value={
                    notes
                  }
                  onChange={(
                    event,
                  ) =>
                    setNotes(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional GRN notes"
                  disabled={
                    saving
                  }
                />

              </label>

            </div>

          </section>

        </div>


        <aside className="purchase-summary">

          <div className="purchase-summary-title">

            <h2>
              GRN Summary
            </h2>

            <span>
              Draft
            </span>

          </div>


          <div className="purchase-summary-row">

            <span>
              Subtotal
            </span>

            <strong>
              {money(
                subtotal,
              )}
            </strong>

          </div>


          <div className="purchase-summary-row">

            <span>
              Discount
            </span>

            <strong>
              -{' '}
              {money(
                purchaseDiscount,
              )}
            </strong>

          </div>


          <div className="purchase-summary-total">

            <span>
              Total
            </span>

            <strong>
              {money(
                total,
              )}
            </strong>

          </div>


          <div className="purchase-summary-row">

            <span>
              Paid
            </span>

            <strong>
              {money(
                paidAmount,
              )}
            </strong>

          </div>


          <div className="purchase-balance">

            <span>
              Supplier Credit
            </span>

            <strong>
              {money(
                balanceDue,
              )}
            </strong>

          </div>


          <button
            className="receive-grn-button"
            type="button"
            disabled={
              saving ||
              !supplierId ||
              items.length ===
                0
            }
            onClick={() =>
              void handleReceive()
            }
          >

            {saving ? (
              <Loader2
                size={18}
                className="spin"
              />
            ) : (
              <PackagePlus
                size={18}
              />
            )}

            {saving
              ? 'Receiving...'
              : 'Receive GRN'}

          </button>


          <p className="purchase-summary-note">
            Receiving this GRN
            updates stock and
            supplier accounts
            automatically.
          </p>

        </aside>

      </div>


      <section className="purchase-history-card">

        <div className="purchase-card-heading">

          <div>

            <h2>
              Purchase History
            </h2>

            <p>
              Recently received
              supplier GRNs.
            </p>

          </div>

        </div>


        <div className="purchase-history-wrap">

          <table className="purchase-history-table">

            <thead>

              <tr>

                <th>
                  GRN
                </th>

                <th>
                  Supplier
                </th>

                <th>
                  Supplier Invoice
                </th>

                <th>
                  Total
                </th>

                <th>
                  Paid
                </th>

                <th>
                  Balance
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={9}
                    className="purchase-empty"
                  >
                    Loading purchases...
                  </td>

                </tr>

              ) : purchases.length ===
                0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="purchase-empty"
                  >
                    No GRNs received yet.
                  </td>

                </tr>

              ) : (

                purchases.map(
                  (
                    purchase,
                  ) => {

                    const isViewing =
                      detailLoadingId ===
                      purchase.id

                    const isPrinting =
                      printLoadingId ===
                      purchase.id


                    return (

                      <tr
                        key={
                          purchase.id
                        }
                      >

                        <td>

                          <button
                            type="button"
                            className="purchase-grn-link"
                            disabled={
                              isViewing ||
                              isPrinting
                            }
                            onClick={() =>
                              void handleViewPurchase(
                                purchase.id,
                              )
                            }
                          >
                            {
                              purchase.grn_no
                            }
                          </button>

                        </td>


                        <td>
                          {purchase
                            .supplier
                            ?.name ??
                            '—'}
                        </td>


                        <td>
                          {purchase
                            .supplier_invoice_no ??
                            '—'}
                        </td>


                        <td>

                          <strong>
                            {money(
                              Number(
                                purchase.total,
                              ),
                            )}
                          </strong>

                        </td>


                        <td>
                          {money(
                            Number(
                              purchase
                                .paid_amount,
                            ),
                          )}
                        </td>


                        <td>
                          {money(
                            Number(
                              purchase
                                .balance_due,
                            ),
                          )}
                        </td>


                        <td>

                          <span
                            className={`purchase-status ${purchase.payment_status}`}
                          >
                            {
                              purchase
                                .payment_status
                            }
                          </span>

                        </td>


                        <td>
                          {new Date(
                            purchase.received_at,
                          ).toLocaleString(
                            'en-LK',
                            {
                              timeZone:
                                'Asia/Colombo',
                            },
                          )}
                        </td>


                        <td>

                          <div className="purchase-history-actions">

                            <button
                              type="button"
                              className="purchase-history-action"
                              title="View GRN"
                              aria-label={`View ${purchase.grn_no}`}
                              disabled={
                                isViewing ||
                                isPrinting
                              }
                              onClick={() =>
                                void handleViewPurchase(
                                  purchase.id,
                                )
                              }
                            >

                              {isViewing ? (

                                <Loader2
                                  size={16}
                                  className="spin"
                                />

                              ) : (

                                <Eye
                                  size={16}
                                />

                              )}

                            </button>


                            <button
                              type="button"
                              className="purchase-history-action primary"
                              title="Print GRN"
                              aria-label={`Print ${purchase.grn_no}`}
                              disabled={
                                isViewing ||
                                isPrinting
                              }
                              onClick={() =>
                                void handlePrintPurchase(
                                  purchase.id,
                                )
                              }
                            >

                              {isPrinting ? (

                                <Loader2
                                  size={16}
                                  className="spin"
                                />

                              ) : (

                                <Printer
                                  size={16}
                                />

                              )}

                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  },
                )

              )}

            </tbody>

          </table>

        </div>

      </section>


      {selectedPurchase && (

        <PurchaseReceiptModal
          purchase={
            selectedPurchase
          }
          settings={
            businessSettings
          }
          onClose={() =>
            setSelectedPurchase(
              null,
            )
          }
          onPrintError={(
            message: string,
          ) =>
            setError(
              message,
            )
          }
        />

      )}

    </AppLayout>
  )
}