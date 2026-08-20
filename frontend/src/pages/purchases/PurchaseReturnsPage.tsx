import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CheckCircle2,
  Eye,
  Loader2,
  PackageMinus,
  RefreshCcw,
  RotateCcw,
  Search,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import {
  getPurchases,
} from '../../services/purchaseService'

import {
  completePurchaseReturn,
  getPurchaseReturnHistory,
  getPurchaseReturnReceipt,
  getPurchaseReturnSource,
} from '../../services/purchaseReturnService'

import {
  createId,
} from '../../utils/createId'

import PurchaseReturnReceiptModal
  from '../../components/purchases/PurchaseReturnReceiptModal'

import type {
  PurchaseListItem,
} from '../../types/purchase'

import type {
  PurchaseReturnHistoryItem,
  PurchaseReturnReceiptDetail,
  PurchaseReturnSource,
} from '../../types/purchaseReturn'

import '../../styles/purchase-returns.css'

function money(
  value: number,
) {
  return `Rs. ${Number(
    value ?? 0,
  ).toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function formatDate(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString(
    'en-LK',
    {
      timeZone:
        'Asia/Colombo',

      year:
        'numeric',

      month:
        'short',

      day:
        '2-digit',

      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  )
}

function labelText(
  value: string,
) {
  return value
    .replaceAll(
      '_',
      ' ',
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    )
}

export default function PurchaseReturnsPage() {
  const {
    staff,
  } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const [
    purchases,
    setPurchases,
  ] =
    useState<
      PurchaseListItem[]
    >([])

  const [
    history,
    setHistory,
  ] =
    useState<
      PurchaseReturnHistoryItem[]
    >([])

  const [
    selectedPurchaseId,
    setSelectedPurchaseId,
  ] =
    useState('')

  const [
    source,
    setSource,
  ] =
    useState<
      PurchaseReturnSource | null
    >(null)

  const [
    quantities,
    setQuantities,
  ] =
    useState<
      Record<string, string>
    >({})

  const [
    reason,
    setReason,
  ] =
    useState('')

  const [
    purchaseSearch,
    setPurchaseSearch,
  ] =
    useState('')

  const [
    historySearch,
    setHistorySearch,
  ] =
    useState('')

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    sourceLoading,
    setSourceLoading,
  ] =
    useState(false)

  const [
    saving,
    setSaving,
  ] =
    useState(false)

  const [
    receiptLoadingId,
    setReceiptLoadingId,
  ] =
    useState<
      string | null
    >(null)

  const [
    selectedReceipt,
    setSelectedReceipt,
  ] =
    useState<
      PurchaseReturnReceiptDetail | null
    >(null)

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

  async function loadPageData() {
    if (
      !businessId ||
      !branchId
    ) {
      setPurchases([])
      setHistory([])
      setLoading(false)

      return
    }

    try {
      setLoading(
        true,
      )

      setError('')

      const [
        purchaseData,
        historyData,
      ] =
        await Promise.all([
          getPurchases(
            businessId,
            branchId,
          ),

          getPurchaseReturnHistory(
            businessId,
            branchId,
          ),
        ])

      setPurchases(
        purchaseData,
      )

      setHistory(
        historyData,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load purchase returns.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [
    businessId,
    branchId,
  ])

  useEffect(() => {
    if (
      !selectedPurchaseId
    ) {
      setSource(
        null,
      )

      setQuantities(
        {},
      )

      return
    }

    let active =
      true

    async function loadSource() {
      try {
        setSourceLoading(
          true,
        )

        setError('')
        setSuccess('')

        const data =
          await getPurchaseReturnSource(
            selectedPurchaseId,
          )

        if (!active) {
          return
        }

        setSource(
          data,
        )

        setQuantities(
          {},
        )
      } catch (err) {
        if (!active) {
          return
        }

        setSource(
          null,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load GRN return details.',
        )
      } finally {
        if (active) {
          setSourceLoading(
            false,
          )
        }
      }
    }

    void loadSource()

    return () => {
      active =
        false
    }
  }, [
    selectedPurchaseId,
  ])

  const filteredPurchases =
    useMemo(
      () => {
        const query =
          purchaseSearch
            .trim()
            .toLowerCase()

        if (!query) {
          return purchases
        }

        return purchases.filter(
          (purchase) =>
            [
              purchase.grn_no,

              purchase
                .supplier
                ?.name,

              purchase
                .supplier_invoice_no,
            ]
              .filter(Boolean)
              .some(
                (value) =>
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
        purchases,
        purchaseSearch,
      ],
    )

  const filteredHistory =
    useMemo(
      () => {
        const query =
          historySearch
            .trim()
            .toLowerCase()

        if (!query) {
          return history
        }

        return history.filter(
          (item) =>
            [
              item.returnNo,
              item.grnNo,
              item.supplierName,
              item.reason,
              item.status,
            ]
              .filter(Boolean)
              .some(
                (value) =>
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
        history,
        historySearch,
      ],
    )

  const selectedItems =
    useMemo(
      () => {
        if (!source) {
          return []
        }

        return source.items
          .map(
            (item) => {
              const quantity =
                Number(
                  quantities[
                    item.id
                  ] ?? 0,
                )

              return {
                item,
                quantity,
              }
            },
          )
          .filter(
            ({
              quantity,
            }) =>
              Number.isFinite(
                quantity,
              ) &&
              quantity >
                0,
          )
      },
      [
        source,
        quantities,
      ],
    )

  const estimatedRefund =
    useMemo(
      () => {
        if (!source) {
          return 0
        }

        return selectedItems.reduce(
          (
            currentTotal,
            {
              item,
              quantity,
            },
          ) => {
            if (
              item.purchasedQuantity <=
              0
            ) {
              return currentTotal
            }

            const itemDiscountShare =
              item.lineDiscount *
              (
                quantity /
                item.purchasedQuantity
              )

            const beforePurchaseDiscount =
              Math.max(
                0,

                quantity *
                  item.unitCost -
                  itemDiscountShare,
              )

            let purchaseDiscountShare =
              0

            if (
              source.subtotal >
                0 &&
              source.discountAmount >
                0
            ) {
              purchaseDiscountShare =
                source.discountAmount *
                (
                  beforePurchaseDiscount /
                  source.subtotal
                )
            }

            return (
              currentTotal +
              Math.max(
                0,

                beforePurchaseDiscount -
                  purchaseDiscountShare,
              )
            )
          },
          0,
        )
      },
      [
        source,
        selectedItems,
      ],
    )

  const totalReturnQuantity =
    useMemo(
      () =>
        selectedItems.reduce(
          (
            currentTotal,
            item,
          ) =>
            currentTotal +
            item.quantity,
          0,
        ),
      [
        selectedItems,
      ],
    )

  function updateQuantity(
    itemId: string,
    value: string,
  ) {
    setQuantities(
      (current) => ({
        ...current,

        [itemId]:
          value,
      }),
    )
  }

  function clearDraft() {
    setSelectedPurchaseId(
      '',
    )

    setSource(
      null,
    )

    setQuantities(
      {},
    )

    setReason(
      '',
    )

    setPurchaseSearch(
      '',
    )

    setTransactionId(
      createId(),
    )
  }

  async function handleCompleteReturn() {
    if (
      !businessId ||
      !branchId
    ) {
      setError(
        'Business or branch information is unavailable.',
      )

      return
    }

    if (!source) {
      setError(
        'Select a GRN first.',
      )

      return
    }

    if (
      selectedItems.length ===
      0
    ) {
      setError(
        'Enter at least one return quantity.',
      )

      return
    }

    for (
      const {
        item,
        quantity,
      } of selectedItems
    ) {
      if (
        quantity >
        item.returnableQuantity
      ) {
        setError(
          `Return quantity for ${item.productName} cannot exceed ${item.returnableQuantity}.`,
        )

        return
      }
    }

    try {
      setSaving(
        true,
      )

      setError('')
      setSuccess('')

      const result =
        await completePurchaseReturn({
          clientTransactionId:
            transactionId,

          businessId,

          branchId,

          purchaseId:
            source.purchaseId,

          items:
            selectedItems.map(
              ({
                item,
                quantity,
              }) => ({
                purchaseItemId:
                  item.id,

                quantity,
              }),
            ),

          reason:
            reason
              .trim() ||
            null,
        })

      setSuccess(
        `${result.returnNo} completed successfully. Supplier payable reduced by ${money(
          result.refundAmount,
        )}.`,
      )

      try {
        const receipt =
          await getPurchaseReturnReceipt(
            result.purchaseReturnId,
          )

        setSelectedReceipt(
          receipt,
        )
      } catch (receiptError) {
        console.error(
          'Unable to load purchase return receipt:',
          receiptError,
        )

        setError(
          receiptError instanceof Error
            ? receiptError.message
            : 'Purchase return completed, but receipt could not be loaded.',
        )
      }

      setTransactionId(
        createId(),
      )

      setQuantities(
        {},
      )

      setReason(
        '',
      )

      const [
        refreshedSource,
        refreshedHistory,
      ] =
        await Promise.all([
          getPurchaseReturnSource(
            source.purchaseId,
          ),

          getPurchaseReturnHistory(
            businessId,
            branchId,
          ),
        ])

      setSource(
        refreshedSource,
      )

      setHistory(
        refreshedHistory,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete purchase return.',
      )
    } finally {
      setSaving(
        false,
      )
    }
  }

  async function handleViewReceipt(
    purchaseReturnId: string,
  ) {
    try {
      setReceiptLoadingId(
        purchaseReturnId,
      )

      setError('')

      const receipt =
        await getPurchaseReturnReceipt(
          purchaseReturnId,
        )

      setSelectedReceipt(
        receipt,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load purchase return receipt.',
      )
    } finally {
      setReceiptLoadingId(
        null,
      )
    }
  }

  return (
    <AppLayout>

      <section className="purchase-return-heading">

        <div>

          <h1>
            Purchase Returns
          </h1>

          <p>
            Return goods to suppliers,
            reduce stock and update
            supplier payable balances.
          </p>

        </div>

        <div className="purchase-return-heading-actions">

          <button
            type="button"
            className="purchase-return-refresh"
            onClick={() =>
              void loadPageData()
            }
            disabled={
              loading
            }
          >

            {loading ? (
              <Loader2
                size={17}
                className="spin"
              />
            ) : (
              <RefreshCcw
                size={17}
              />
            )}

            Refresh

          </button>

          <div className="purchase-return-heading-badge">

            <PackageMinus
              size={18}
            />

            Supplier Returns

          </div>

        </div>

      </section>

      {error && (
        <div className="purchase-return-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="purchase-return-message success">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>
      )}

      <div className="purchase-return-workspace">

        <div className="purchase-return-main">

          <section className="purchase-return-card">

            <div className="purchase-return-card-heading">

              <div>

                <h2>
                  Select Original GRN
                </h2>

                <p>
                  Choose the supplier
                  purchase being returned.
                </p>

              </div>

            </div>

            <div className="purchase-return-search">

              <Search
                size={16}
              />

              <input
                value={
                  purchaseSearch
                }
                onChange={(event) =>
                  setPurchaseSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search GRN, supplier or invoice..."
              />

            </div>

            <label className="purchase-return-field">

              <span>
                Goods Received Note
              </span>

              <select
                value={
                  selectedPurchaseId
                }
                onChange={(event) =>
                  setSelectedPurchaseId(
                    event.target
                      .value,
                  )
                }
                disabled={
                  saving ||
                  loading
                }
              >

                <option value="">
                  Select GRN
                </option>

                {filteredPurchases.map(
                  (purchase) => (
                    <option
                      key={
                        purchase.id
                      }
                      value={
                        purchase.id
                      }
                    >
                      {
                        purchase.grn_no
                      }
                      {' · '}
                      {purchase
                        .supplier
                        ?.name ??
                        'Unknown Supplier'}
                      {' · '}
                      {money(
                        Number(
                          purchase.total,
                        ),
                      )}
                    </option>
                  ),
                )}

              </select>

            </label>

          </section>

          {sourceLoading ? (

            <section className="purchase-return-card purchase-return-loading">

              <Loader2
                size={22}
                className="spin"
              />

              Loading GRN details...

            </section>

          ) : source ? (

            <>

              <section className="purchase-return-card">

                <div className="purchase-return-card-heading">

                  <div>

                    <h2>
                      GRN Details
                    </h2>

                    <p>
                      Original purchase
                      information.
                    </p>

                  </div>

                  <span className="purchase-return-grn-badge">
                    {source.grnNo}
                  </span>

                </div>

                <div className="purchase-return-meta-grid">

                  <div>
                    <span>
                      Supplier
                    </span>

                    <strong>
                      {source.supplierName}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Supplier Invoice
                    </span>

                    <strong>
                      {source.supplierInvoiceNo ??
                        '—'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Received
                    </span>

                    <strong>
                      {formatDate(
                        source.receivedAt,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      GRN Total
                    </span>

                    <strong>
                      {money(
                        source.total,
                      )}
                    </strong>
                  </div>

                </div>

              </section>

              <section className="purchase-return-card">

                <div className="purchase-return-card-heading">

                  <div>

                    <h2>
                      Return Items
                    </h2>

                    <p>
                      Enter only the
                      quantity being sent
                      back to the supplier.
                    </p>

                  </div>

                </div>

                <div className="purchase-return-items-wrap">

                  <table className="purchase-return-items">

                    <thead>

                      <tr>

                        <th>
                          Product
                        </th>

                        <th>
                          Purchased
                        </th>

                        <th>
                          Returned
                        </th>

                        <th>
                          Available
                        </th>

                        <th>
                          Unit Cost
                        </th>

                        <th>
                          Return Qty
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {source.items.map(
                        (item) => (

                          <tr
                            key={
                              item.id
                            }
                          >

                            <td>

                              <div className="purchase-return-product">

                                <strong>
                                  {
                                    item.productName
                                  }
                                </strong>

                                <small>
                                  {item.sku ??
                                    item.barcode ??
                                    '—'}
                                  {' · '}
                                  {item.unit}
                                </small>

                              </div>

                            </td>

                            <td>
                              {
                                item.purchasedQuantity
                              }
                            </td>

                            <td>
                              {
                                item.alreadyReturnedQuantity
                              }
                            </td>

                            <td>

                              <strong>
                                {
                                  item.returnableQuantity
                                }
                              </strong>

                            </td>

                            <td>
                              {money(
                                item.unitCost,
                              )}
                            </td>

                            <td>

                              <input
                                className="purchase-return-qty"
                                type="number"
                                min="0"
                                step="0.001"
                                max={
                                  item.returnableQuantity
                                }
                                value={
                                  quantities[
                                    item.id
                                  ] ??
                                  ''
                                }
                                onChange={(event) =>
                                  updateQuantity(
                                    item.id,
                                    event.target
                                      .value,
                                  )
                                }
                                placeholder="0"
                                disabled={
                                  saving ||
                                  item.returnableQuantity <=
                                    0
                                }
                              />

                            </td>

                          </tr>

                        ),
                      )}

                    </tbody>

                  </table>

                </div>

                {source.items.every(
                  (item) =>
                    item.returnableQuantity <=
                    0,
                ) && (
                  <div className="purchase-return-all-returned">
                    This GRN has already
                    been fully returned.
                  </div>
                )}

              </section>

              <section className="purchase-return-card">

                <div className="purchase-return-card-heading">

                  <div>

                    <h2>
                      Return Reason
                    </h2>

                    <p>
                      Add a clear reason
                      for the supplier
                      return.
                    </p>

                  </div>

                </div>

                <label className="purchase-return-field">

                  <span>
                    Reason
                  </span>

                  <textarea
                    rows={4}
                    value={
                      reason
                    }
                    onChange={(event) =>
                      setReason(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Damaged goods, incorrect items, quality issue..."
                    disabled={
                      saving
                    }
                  />

                </label>

              </section>

            </>

          ) : null}

        </div>

        <aside className="purchase-return-summary">

          <div className="purchase-return-summary-heading">

            <h2>
              Return Summary
            </h2>

            <span>
              Draft
            </span>

          </div>

          <div className="purchase-return-summary-row">

            <span>
              GRN
            </span>

            <strong>
              {source?.grnNo ??
                '—'}
            </strong>

          </div>

          <div className="purchase-return-summary-row">

            <span>
              Selected Items
            </span>

            <strong>
              {
                selectedItems.length
              }
            </strong>

          </div>

          <div className="purchase-return-summary-row">

            <span>
              Return Quantity
            </span>

            <strong>
              {
                totalReturnQuantity
              }
            </strong>

          </div>

          <div className="purchase-return-summary-total">

            <span>
              Estimated Refund
            </span>

            <strong>
              {money(
                estimatedRefund,
              )}
            </strong>

          </div>

          <button
            type="button"
            className="purchase-return-submit"
            onClick={() =>
              void handleCompleteReturn()
            }
            disabled={
              saving ||
              !source ||
              selectedItems.length ===
                0
            }
          >

            {saving ? (
              <Loader2
                size={18}
                className="spin"
              />
            ) : (
              <RotateCcw
                size={18}
              />
            )}

            {saving
              ? 'Processing...'
              : 'Complete Purchase Return'}

          </button>

          <button
            type="button"
            className="purchase-return-clear"
            onClick={
              clearDraft
            }
            disabled={
              saving
            }
          >
            Clear Draft
          </button>

          <p>
            Completing the return reduces
            branch stock and supplier
            payable automatically.
          </p>

        </aside>

      </div>

      <section className="purchase-return-history-card">

        <div className="purchase-return-card-heading history">

          <div>

            <h2>
              Purchase Return History
            </h2>

            <p>
              Completed supplier return
              notes and audit history.
            </p>

          </div>

          <div className="purchase-return-search history-search">

            <Search
              size={16}
            />

            <input
              value={
                historySearch
              }
              onChange={(event) =>
                setHistorySearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search returns..."
            />

          </div>

        </div>

        <div className="purchase-return-history-wrap">

          <table className="purchase-return-history">

            <thead>

              <tr>

                <th>
                  PRN
                </th>

                <th>
                  Original GRN
                </th>

                <th>
                  Supplier
                </th>

                <th>
                  Refund
                </th>

                <th>
                  Reason
                </th>

                <th>
                  Returned By
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={9}
                    className="purchase-return-empty"
                  >
                    Loading purchase returns...
                  </td>

                </tr>

              ) : filteredHistory.length ===
                0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="purchase-return-empty"
                  >
                    No purchase returns found.
                  </td>

                </tr>

              ) : (

                filteredHistory.map(
                  (item) => (

                    <tr
                      key={
                        item.id
                      }
                    >

                      <td>

                        <strong>
                          {item.returnNo}
                        </strong>

                      </td>

                      <td>
                        {item.grnNo}
                      </td>

                      <td>
                        {item.supplierName}
                      </td>

                      <td>

                        <strong>
                          {money(
                            item.refundAmount,
                          )}
                        </strong>

                      </td>

                      <td>
                        {item.reason ??
                          '—'}
                      </td>

                      <td>
                        {item.staffName ??
                          '—'}
                      </td>

                      <td>

                        <span
                          className={`purchase-return-status ${item.status}`}
                        >
                          {labelText(
                            item.status,
                          )}
                        </span>

                      </td>

                      <td>
                        {formatDate(
                          item.createdAt,
                        )}
                      </td>

                      <td>

                        <button
                          type="button"
                          className="purchase-return-view"
                          title="View purchase return receipt"
                          aria-label={`View ${item.returnNo}`}
                          disabled={
                            receiptLoadingId ===
                            item.id
                          }
                          onClick={() =>
                            void handleViewReceipt(
                              item.id,
                            )
                          }
                        >

                          {receiptLoadingId ===
                          item.id ? (
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

                      </td>

                    </tr>

                  ),
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

      {selectedReceipt && (
        <PurchaseReturnReceiptModal
          receipt={
            selectedReceipt
          }
          onClose={() =>
            setSelectedReceipt(
              null,
            )
          }
          onPrintError={(
            message,
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