import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Banknote,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Printer,
  Search,
  Wallet,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import {
  getSuppliers,
} from '../../services/supplierService'

import {
  getSupplierBalance,
  getSupplierPaymentReceipt,
  getSupplierStatement,
  recordSupplierPayment,
} from '../../services/supplierPaymentService'

import {
  getBusinessSettings,
} from '../../services/settingsService'

import SupplierPaymentReceiptModal
  from './SupplierPaymentReceiptModal'

import {
  createId,
} from '../../utils/createId'

import type {
  Supplier,
} from '../../types/supplier'

import type {
  BusinessSettings,
} from '../../types/settings'

import type {
  SupplierPaymentMethod,
  SupplierPaymentReceipt,
  SupplierStatementEntry,
} from '../../types/supplierPayment'

import '../../styles/supplier-payments.css'

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

function formatDateTime(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString(
    'en-LK',
    {
      timeZone:
        'Asia/Colombo',
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

export default function SupplierPaymentsPage() {
  const {
    staff,
  } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId ??
    null

  const [
    businessSettings,
    setBusinessSettings,
  ] =
    useState<
      BusinessSettings | null
    >(null)

  const [
    suppliers,
    setSuppliers,
  ] =
    useState<Supplier[]>([])

  const [
    supplierId,
    setSupplierId,
  ] =
    useState('')

  const [
    statement,
    setStatement,
  ] =
    useState<
      SupplierStatementEntry[]
    >([])

  const [
    balance,
    setBalance,
  ] =
    useState(0)

  const [
    amount,
    setAmount,
  ] =
    useState('')

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<SupplierPaymentMethod>(
      'cash',
    )

  const [
    referenceNo,
    setReferenceNo,
  ] =
    useState('')

  const [
    note,
    setNote,
  ] =
    useState('')

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
    receiptLoadingId,
    setReceiptLoadingId,
  ] =
    useState<string | null>(
      null,
    )

  const [
    selectedReceipt,
    setSelectedReceipt,
  ] =
    useState<
      SupplierPaymentReceipt | null
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
    search,
    setSearch,
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

  async function loadBusinessSettings() {
    if (!businessId) {
      setBusinessSettings(
        null,
      )

      return
    }

    try {
      const data =
        await getBusinessSettings(
          businessId,
          branchId,
        )

      setBusinessSettings(
        data,
      )
    } catch (err) {
      console.error(
        'Unable to load supplier receipt settings:',
        err,
      )

      setBusinessSettings(
        null,
      )
    }
  }

  async function loadSuppliers() {
    if (!businessId) {
      setSuppliers([])
      setLoading(false)

      return
    }

    try {
      setLoading(
        true,
      )

      setError('')

      const data =
        await getSuppliers(
          businessId,
        )

      setSuppliers(
        data.filter(
          (supplier) =>
            supplier.isActive,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load suppliers.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  async function loadSupplierAccount(
    selectedSupplierId: string,
  ) {
    if (!selectedSupplierId) {
      setBalance(0)
      setStatement([])

      return
    }

    try {
      setError('')

      const [
        balanceData,
        statementData,
      ] =
        await Promise.all([
          getSupplierBalance(
            selectedSupplierId,
          ),

          getSupplierStatement(
            selectedSupplierId,
          ),
        ])

      setBalance(
        balanceData,
      )

      setStatement(
        statementData,
      )
    } catch (err) {
      setBalance(0)
      setStatement([])

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load supplier account.',
      )
    }
  }

  useEffect(() => {
    void loadSuppliers()
  }, [
    businessId,
  ])

  useEffect(() => {
    void loadBusinessSettings()
  }, [
    businessId,
    branchId,
  ])

  useEffect(() => {
    setSuccess('')
    setError('')
    setAmount('')
    setReferenceNo('')
    setNote('')
    setSearch('')

    void loadSupplierAccount(
      supplierId,
    )
  }, [
    supplierId,
  ])

  const selectedSupplier =
    useMemo(
      () =>
        suppliers.find(
          (supplier) =>
            supplier.id ===
            supplierId,
        ) ??
        null,
      [
        suppliers,
        supplierId,
      ],
    )

  const filteredStatement =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase()

        if (!query) {
          return statement
        }

        return statement.filter(
          (entry) =>
            [
              entry.entryType,
              entry.description,
              entry.referenceType,
              entry.referenceId,
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
        statement,
        search,
      ],
    )

  const totalPurchases =
    useMemo(
      () =>
        statement
          .filter(
            (entry) =>
              entry.entryType ===
              'purchase',
          )
          .reduce(
            (
              sum,
              entry,
            ) =>
              sum +
              Math.max(
                entry.amount,
                0,
              ),
            0,
          ),
      [
        statement,
      ],
    )

  const totalPayments =
    useMemo(
      () =>
        statement
          .filter(
            (entry) =>
              entry.entryType ===
              'payment',
          )
          .reduce(
            (
              sum,
              entry,
            ) =>
              sum +
              Math.abs(
                entry.amount,
              ),
            0,
          ),
      [
        statement,
      ],
    )

  async function handlePayment() {
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

    const numericAmount =
      Number(
        amount,
      )

    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <=
        0
    ) {
      setError(
        'Enter a valid payment amount.',
      )

      return
    }

    if (
      numericAmount >
      balance
    ) {
      setError(
        'Payment cannot exceed supplier outstanding balance.',
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
        await recordSupplierPayment({
          clientTransactionId:
            transactionId,

          businessId,

          branchId,

          supplierId,

          amount:
            numericAmount,

          paymentMethod,

          referenceNo:
            referenceNo.trim() ||
            null,

          note:
            note.trim() ||
            null,
        })

      setSuccess(
        `Payment recorded successfully. Remaining balance: ${money(
          result.balance,
        )}`,
      )

      if (
        result.payment_id
      ) {
        try {
          const receipt =
            await getSupplierPaymentReceipt(
              result.payment_id,
            )

          setSelectedReceipt(
            receipt,
          )
        } catch (receiptError) {
          console.error(
            'Unable to load supplier payment receipt:',
            receiptError,
          )

          setError(
            receiptError instanceof Error
              ? receiptError.message
              : 'Payment saved, but receipt could not be loaded.',
          )
        }
      } else {
        setError(
          'Payment saved, but supplier payment receipt ID was not returned.',
        )
      }

      setAmount('')
      setReferenceNo('')
      setNote('')

      setPaymentMethod(
        'cash',
      )

      setTransactionId(
        createId(),
      )

      await loadSupplierAccount(
        supplierId,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record supplier payment.',
      )
    } finally {
      setSaving(
        false,
      )
    }
  }

  async function handleViewPaymentReceipt(
    entry: SupplierStatementEntry,
  ) {
    const paymentId =
      entry.referenceId ||
      entry.id

    if (!paymentId) {
      setError(
        'Supplier payment reference is unavailable.',
      )

      return
    }

    try {
      setReceiptLoadingId(
        entry.id,
      )

      setError('')

      const receipt =
        await getSupplierPaymentReceipt(
          paymentId,
        )

      setSelectedReceipt(
        receipt,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load supplier payment receipt.',
      )
    } finally {
      setReceiptLoadingId(
        null,
      )
    }
  }

  return (
    <AppLayout>

      <section className="supplier-payments-heading">

        <div>

          <h1>
            Supplier Payments
          </h1>

          <p>
            Record supplier payments
            and review outstanding
            balances and account
            statements.
          </p>

        </div>

      </section>

      {error && (
        <div className="supplier-payment-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="supplier-payment-message success">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>
      )}

      <section className="supplier-account-card">

        <div className="supplier-account-top">

          <label>

            Supplier

            <select
              value={
                supplierId
              }
              onChange={(event) =>
                setSupplierId(
                  event.target
                    .value,
                )
              }
            >

              <option value="">
                Select supplier
              </option>

              {suppliers.map(
                (supplier) => (
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

          {selectedSupplier && (
            <div className="supplier-contact-info">

              <strong>
                {
                  selectedSupplier.name
                }
              </strong>

              <span>
                {selectedSupplier.phone ??
                  'No phone'}
              </span>

            </div>
          )}

        </div>

      </section>

      <section className="supplier-payment-summary">

        <article>

          <div className="supplier-payment-icon">

            <FileText
              size={20}
            />

          </div>

          <div>

            <span>
              Total Purchases
            </span>

            <strong>
              {money(
                totalPurchases,
              )}
            </strong>

          </div>

        </article>

        <article>

          <div className="supplier-payment-icon">

            <Wallet
              size={20}
            />

          </div>

          <div>

            <span>
              Total Payments
            </span>

            <strong>
              {money(
                totalPayments,
              )}
            </strong>

          </div>

        </article>

        <article>

          <div className="supplier-payment-icon highlight">

            <Banknote
              size={20}
            />

          </div>

          <div>

            <span>
              Outstanding
            </span>

            <strong>
              {money(
                balance,
              )}
            </strong>

          </div>

        </article>

      </section>

      <div className="supplier-payment-workspace">

        <section className="supplier-payment-form-card">

          <div className="supplier-payment-card-heading">

            <h2>
              Record Payment
            </h2>

            <p>
              Payments reduce the
              supplier outstanding
              balance.
            </p>

          </div>

          <div className="supplier-payment-form">

            <label>

              Amount

              <input
                type="number"
                min="0.01"
                step="0.01"
                max={
                  balance >
                  0
                    ? balance
                    : undefined
                }
                value={
                  amount
                }
                onChange={(event) =>
                  setAmount(
                    event.target
                      .value,
                  )
                }
                placeholder="0.00"
                disabled={
                  saving ||
                  !supplierId
                }
              />

            </label>

            <label>

              Payment Method

              <select
                value={
                  paymentMethod
                }
                onChange={(event) =>
                  setPaymentMethod(
                    event.target
                      .value as
                      SupplierPaymentMethod,
                  )
                }
                disabled={
                  saving ||
                  !supplierId
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

              Reference No.

              <input
                value={
                  referenceNo
                }
                onChange={(event) =>
                  setReferenceNo(
                    event.target
                      .value,
                  )
                }
                placeholder="Bank / cheque / card reference"
                disabled={
                  saving ||
                  !supplierId
                }
              />

            </label>

            <label>

              Note

              <textarea
                rows={3}
                value={
                  note
                }
                onChange={(event) =>
                  setNote(
                    event.target
                      .value,
                  )
                }
                placeholder="Optional payment note"
                disabled={
                  saving ||
                  !supplierId
                }
              />

            </label>

            <button
              className="supplier-payment-button"
              type="button"
              onClick={() =>
                void handlePayment()
              }
              disabled={
                saving ||
                !supplierId ||
                balance <=
                  0
              }
            >

              {saving ? (
                <Loader2
                  size={18}
                  className="spin"
                />
              ) : (
                <CreditCard
                  size={18}
                />
              )}

              {saving
                ? 'Saving...'
                : 'Record Payment'}

            </button>

          </div>

        </section>

        <section className="supplier-statement-card">

          <div className="supplier-payment-card-heading statement-heading">

            <div>

              <h2>
                Supplier Statement
              </h2>

              <p>
                Purchases, payments
                and running balance.
              </p>

            </div>

            <div className="supplier-statement-search">

              <Search
                size={16}
              />

              <input
                value={
                  search
                }
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value,
                  )
                }
                placeholder="Search statement..."
              />

            </div>

          </div>

          <div className="supplier-statement-wrap">

            <table className="supplier-statement-table">

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Debit
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Balance
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
                      colSpan={7}
                      className="supplier-statement-empty"
                    >
                      Loading statement...
                    </td>

                  </tr>

                ) : !supplierId ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="supplier-statement-empty"
                    >
                      Select a supplier
                      to view the account.
                    </td>

                  </tr>

                ) : filteredStatement.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="supplier-statement-empty"
                    >
                      No account entries
                      found.
                    </td>

                  </tr>

                ) : (

                  filteredStatement.map(
                    (entry) => (
                      <tr
                        key={
                          entry.id
                        }
                      >

                        <td>
                          {formatDateTime(
                            entry.createdAt,
                          )}
                        </td>

                        <td>

                          <span
                            className={`supplier-entry-type ${entry.entryType}`}
                          >
                            {labelText(
                              entry.entryType,
                            )}
                          </span>

                        </td>

                        <td>
                          {entry.description ??
                            '—'}
                        </td>

                        <td>
                          {entry.amount >
                          0
                            ? money(
                                entry.amount,
                              )
                            : '—'}
                        </td>

                        <td>
                          {entry.amount <
                          0
                            ? money(
                                Math.abs(
                                  entry.amount,
                                ),
                              )
                            : '—'}
                        </td>

                        <td>

                          <strong>
                            {money(
                              entry.runningBalance,
                            )}
                          </strong>

                        </td>

                        <td>

                          {entry.entryType ===
                          'payment' ? (

                            <button
                              type="button"
                              className="supplier-payment-reprint-button"
                              title="View supplier payment receipt"
                              aria-label="View supplier payment receipt"
                              onClick={() =>
                                void handleViewPaymentReceipt(
                                  entry,
                                )
                              }
                              disabled={
                                receiptLoadingId ===
                                entry.id
                              }
                            >

                              {receiptLoadingId ===
                              entry.id ? (
                                <Loader2
                                  size={15}
                                  className="spin"
                                />
                              ) : (
                                <Printer
                                  size={15}
                                />
                              )}

                            </button>

                          ) : (
                            <span>
                              —
                            </span>
                          )}

                        </td>

                      </tr>
                    ),
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

      {selectedReceipt && (
        <SupplierPaymentReceiptModal
          receipt={
            selectedReceipt
          }
          settings={
            businessSettings
          }
          onClose={() =>
            setSelectedReceipt(
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