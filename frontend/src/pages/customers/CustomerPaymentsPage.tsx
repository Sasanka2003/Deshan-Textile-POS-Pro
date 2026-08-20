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
  getCustomers,
} from '../../services/customerService'

import {
  getCustomerBalance,
  getCustomerPaymentReceipt,
  getCustomerStatement,
  recordCustomerPayment,
} from '../../services/customerPaymentService'

import {
  getBusinessSettings,
} from '../../services/settingsService'

import CustomerPaymentReceiptModal from './CustomerPaymentReceiptModal'

import {
  createId,
} from '../../utils/createId'

import type {
  Customer,
} from '../../types/customer'

import type {
  BusinessSettings,
} from '../../types/settings'

import type {
  CustomerPaymentMethod,
  CustomerPaymentReceipt,
  CustomerStatementEntry,
} from '../../types/customerPayment'

import '../../styles/customer-payments.css'

function money(
  value: number,
) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

export default function CustomerPaymentsPage() {
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
    customers,
    setCustomers,
  ] =
    useState<Customer[]>([])

  const [
    customerId,
    setCustomerId,
  ] =
    useState('')

  const [
    statement,
    setStatement,
  ] =
    useState<
      CustomerStatementEntry[]
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
    useState<CustomerPaymentMethod>(
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
    useState<CustomerPaymentReceipt | null>(
      null,
    )

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
        'Unable to load customer receipt settings:',
        err,
      )

      setBusinessSettings(
        null,
      )
    }
  }

  async function loadCustomers() {
    if (!businessId) {
      setCustomers([])
      setLoading(false)

      return
    }

    try {
      setLoading(
        true,
      )

      setError('')

      const data =
        await getCustomers(
          businessId,
        )

      setCustomers(
        data.filter(
          (customer) =>
            customer.isActive,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load customers.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  async function loadCustomerAccount(
    selectedCustomerId: string,
  ) {
    if (!selectedCustomerId) {
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
          getCustomerBalance(
            selectedCustomerId,
          ),

          getCustomerStatement(
            selectedCustomerId,
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
          : 'Unable to load customer account.',
      )
    }
  }

  useEffect(() => {
    void loadCustomers()
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

    void loadCustomerAccount(
      customerId,
    )
  }, [
    customerId,
  ])

  const selectedCustomer =
    useMemo(
      () =>
        customers.find(
          (customer) =>
            customer.id ===
            customerId,
        ) ??
        null,
      [
        customers,
        customerId,
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

  const totalCreditSales =
    useMemo(
      () =>
        statement
          .filter(
            (entry) =>
              entry.entryType ===
              'sale',
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

    if (!customerId) {
      setError(
        'Please select a customer.',
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
        'Payment cannot exceed customer outstanding balance.',
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
        await recordCustomerPayment({
          clientTransactionId:
            transactionId,

          businessId,

          branchId,

          customerId,

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
            await getCustomerPaymentReceipt(
              result.payment_id,
            )

          setSelectedReceipt(
            receipt,
          )
        } catch (receiptError) {
          console.error(
            'Unable to load payment receipt:',
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
          'Payment saved, but payment receipt ID was not returned.',
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

      await loadCustomerAccount(
        customerId,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record customer payment.',
      )
    } finally {
      setSaving(
        false,
      )
    }
  }

  async function handleViewPaymentReceipt(
    entry: CustomerStatementEntry,
  ) {
    const paymentId =
      entry.referenceId ||
      entry.id

    if (!paymentId) {
      setError(
        'Payment reference is unavailable.',
      )

      return
    }

    try {
      setReceiptLoadingId(
        entry.id,
      )

      setError('')

      const receipt =
        await getCustomerPaymentReceipt(
          paymentId,
        )

      setSelectedReceipt(
        receipt,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load payment receipt.',
      )
    } finally {
      setReceiptLoadingId(
        null,
      )
    }
  }

  return (
    <AppLayout>

      <section className="customer-payments-heading">

        <div>

          <h1>
            Customer Payments
          </h1>

          <p>
            Record customer credit
            payments and review account
            statements.
          </p>

        </div>

      </section>

      {error && (
        <div className="customer-payment-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="customer-payment-message success">

          <CheckCircle2
            size={18}
          />

          {success}

        </div>
      )}

      <section className="customer-account-card">

        <div className="customer-account-top">

          <label>

            Customer

            <select
              value={
                customerId
              }
              onChange={(event) =>
                setCustomerId(
                  event.target
                    .value,
                )
              }
            >

              <option value="">
                Select customer
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={
                      customer.id
                    }
                    value={
                      customer.id
                    }
                  >
                    {
                      customer.name
                    }
                  </option>
                ),
              )}

            </select>

          </label>

          {selectedCustomer && (
            <div className="customer-contact-info">

              <strong>
                {
                  selectedCustomer.name
                }
              </strong>

              <span>
                {selectedCustomer.phone ??
                  'No phone'}
              </span>

              <small>
                Credit Limit:{' '}
                {money(
                  selectedCustomer.creditLimit,
                )}
              </small>

            </div>
          )}

        </div>

      </section>

      <section className="customer-payment-summary">

        <article>

          <div className="customer-payment-icon">

            <FileText
              size={20}
            />

          </div>

          <div>

            <span>
              Credit Sales
            </span>

            <strong>
              {money(
                totalCreditSales,
              )}
            </strong>

          </div>

        </article>

        <article>

          <div className="customer-payment-icon">

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

          <div className="customer-payment-icon highlight">

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

      <div className="customer-payment-workspace">

        <section className="customer-payment-form-card">

          <div className="customer-payment-card-heading">

            <h2>
              Record Payment
            </h2>

            <p>
              Customer payments reduce
              their outstanding balance.
            </p>

          </div>

          <div className="customer-payment-form">

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
                  !customerId
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
                      .value as CustomerPaymentMethod,
                  )
                }
                disabled={
                  saving ||
                  !customerId
                }
              >

                <option value="cash">
                  Cash
                </option>

                <option value="card">
                  Card
                </option>

                <option value="qr">
                  QR
                </option>

                <option value="bank_transfer">
                  Bank Transfer
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
                placeholder="Bank / QR / card reference"
                disabled={
                  saving ||
                  !customerId
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
                  !customerId
                }
              />

            </label>

            <button
              className="customer-payment-button"
              type="button"
              onClick={() =>
                void handlePayment()
              }
              disabled={
                saving ||
                !customerId ||
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

        <section className="customer-statement-card">

          <div className="customer-payment-card-heading statement-heading">

            <div>

              <h2>
                Customer Statement
              </h2>

              <p>
                Credit sales, payments
                and running balance.
              </p>

            </div>

            <div className="customer-statement-search">

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

          <div className="customer-statement-wrap">

            <table className="customer-statement-table">

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
                    Charge
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
                      className="customer-statement-empty"
                    >
                      Loading statement...
                    </td>

                  </tr>

                ) : !customerId ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="customer-statement-empty"
                    >
                      Select a customer
                      to view the account.
                    </td>

                  </tr>

                ) : filteredStatement.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="customer-statement-empty"
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
                            className={`customer-entry-type ${entry.entryType}`}
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
                              className="customer-payment-reprint-button"
                              title="View payment receipt"
                              aria-label="View payment receipt"
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
        <CustomerPaymentReceiptModal
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