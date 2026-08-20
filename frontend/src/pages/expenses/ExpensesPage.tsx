import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Loader2,
  Plus,
  QrCode,
  Search,
  Trash2,
  WalletCards,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import {
  cancelExpense,
  createExpense,
  getExpenseCategories,
  getExpenses,
} from '../../services/expenseService'

import type {
  Expense,
  ExpenseCategory,
  ExpensePaymentMethod,
} from '../../types/expense'

import '../../styles/expenses.css'

function money(value: number) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function todayDate() {
  return new Date()
    .toLocaleDateString(
      'en-CA',
      {
        timeZone:
          'Asia/Colombo',
      },
    )
}

function formatDate(
  value: string,
) {
  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString(
    'en-LK',
    {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
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

export default function ExpensesPage() {
  const { staff } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const [
    expenses,
    setExpenses,
  ] =
    useState<Expense[]>([])

  const [
    categories,
    setCategories,
  ] =
    useState<
      ExpenseCategory[]
    >([])

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    categoryId,
    setCategoryId,
  ] =
    useState('')

  const [
    expenseDate,
    setExpenseDate,
  ] =
    useState(
      () => todayDate(),
    )

  const [
    amount,
    setAmount,
  ] =
    useState('')

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<ExpensePaymentMethod>(
      'cash',
    )

  const [
    referenceNo,
    setReferenceNo,
  ] =
    useState('')

  const [
    description,
    setDescription,
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
    cancellingId,
    setCancellingId,
  ] =
    useState<string | null>(
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

  async function loadPageData() {
    if (!businessId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const [
        expenseData,
        categoryData,
      ] =
        await Promise.all([
          getExpenses(
            businessId,
            branchId ??
              undefined,
          ),

          getExpenseCategories(
            businessId,
          ),
        ])

      setExpenses(
        expenseData,
      )

      setCategories(
        categoryData,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load expenses.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [
    businessId,
    branchId,
  ])

  const activeExpenses =
    useMemo(
      () =>
        expenses.filter(
          (expense) =>
            expense.status ===
            'completed',
        ),
      [expenses],
    )

  const todayTotal =
    useMemo(() => {
      const today =
        todayDate()

      return activeExpenses
        .filter(
          (expense) =>
            expense.expenseDate ===
            today,
        )
        .reduce(
          (
            sum,
            expense,
          ) =>
            sum +
            expense.amount,
          0,
        )
    }, [activeExpenses])

  const monthTotal =
    useMemo(() => {
      const month =
        todayDate().slice(
          0,
          7,
        )

      return activeExpenses
        .filter(
          (expense) =>
            expense.expenseDate.startsWith(
              month,
            ),
        )
        .reduce(
          (
            sum,
            expense,
          ) =>
            sum +
            expense.amount,
          0,
        )
    }, [activeExpenses])

  const totalExpenses =
    useMemo(
      () =>
        activeExpenses.reduce(
          (
            sum,
            expense,
          ) =>
            sum +
            expense.amount,
          0,
        ),
      [activeExpenses],
    )

  const filteredExpenses =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return expenses
      }

      return expenses.filter(
        (expense) =>
          [
            expense.expenseNo,
            expense.categoryName,
            expense.description,
            expense.referenceNo,
            expense.paymentMethod,
            expense.staffName,
            expense.status,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  query,
                ),
            ),
      )
    }, [
      expenses,
      search,
    ])

  function resetForm() {
    setCategoryId('')
    setExpenseDate(
      todayDate(),
    )

    setAmount('')

    setPaymentMethod(
      'cash',
    )

    setReferenceNo('')
    setDescription('')
  }

  async function handleCreateExpense() {
    if (
      !businessId ||
      !branchId
    ) {
      setError(
        'Business or branch information is unavailable.',
      )

      return
    }

    if (!categoryId) {
      setError(
        'Select an expense category.',
      )

      return
    }

    const numericAmount =
      Number(amount)

    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <= 0
    ) {
      setError(
        'Enter a valid expense amount.',
      )

      return
    }

    if (!expenseDate) {
      setError(
        'Select the expense date.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      await createExpense({
        businessId,
        branchId,

        categoryId,

        staffId:
          staff?.id ??
          null,

        expenseDate,

        amount:
          numericAmount,

        paymentMethod,

        referenceNo:
          referenceNo.trim() ||
          null,

        description:
          description.trim() ||
          null,
      })

      setSuccess(
        `Expense ${money(
          numericAmount,
        )} recorded successfully.`,
      )

      resetForm()

      await loadPageData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record expense.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(
    expense: Expense,
  ) {
    if (!businessId) {
      return
    }

    if (
      expense.status ===
      'cancelled'
    ) {
      return
    }

    const confirmed =
      window.confirm(
        `Cancel ${expense.expenseNo} for ${money(
          expense.amount,
        )}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setCancellingId(
        expense.id,
      )

      setError('')
      setSuccess('')

      await cancelExpense(
        expense.id,
        businessId,
      )

      setSuccess(
        `${expense.expenseNo} cancelled successfully.`,
      )

      await loadPageData()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to cancel expense.',
      )
    } finally {
      setCancellingId(
        null,
      )
    }
  }

  return (
    <AppLayout>
      <div className="expenses-page">

        <section className="expenses-heading">

          <div>
            <h1>
              Expenses
            </h1>

            <p>
              Record and monitor
              business operating
              expenses.
            </p>
          </div>

          <div className="expenses-heading-badge">

            <CircleDollarSign
              size={18}
            />

            Expense Management

          </div>

        </section>

        {error && (
          <div className="expenses-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="expenses-message success">

            <CheckCircle2
              size={18}
            />

            {success}

          </div>
        )}

        <section className="expenses-summary-grid">

          <article>

            <div className="expenses-summary-icon">
              <CalendarDays
                size={20}
              />
            </div>

            <div>
              <span>
                Today
              </span>

              <strong>
                {money(
                  todayTotal,
                )}
              </strong>
            </div>

          </article>

          <article>

            <div className="expenses-summary-icon">
              <WalletCards
                size={20}
              />
            </div>

            <div>
              <span>
                This Month
              </span>

              <strong>
                {money(
                  monthTotal,
                )}
              </strong>
            </div>

          </article>

          <article>

            <div className="expenses-summary-icon">
              <Banknote
                size={20}
              />
            </div>

            <div>
              <span>
                Total Expenses
              </span>

              <strong>
                {money(
                  totalExpenses,
                )}
              </strong>
            </div>

          </article>

          <article>

            <div className="expenses-summary-icon">
              <CircleDollarSign
                size={20}
              />
            </div>

            <div>
              <span>
                Active Records
              </span>

              <strong>
                {
                  activeExpenses.length
                }
              </strong>
            </div>

          </article>

        </section>

        <div className="expenses-workspace">

          <section className="expenses-form-card">

            <div className="expenses-card-heading">

              <div>
                <h2>
                  Record Expense
                </h2>

                <p>
                  Add a new business
                  expense.
                </p>
              </div>

              <Plus
                size={20}
              />

            </div>

            <div className="expenses-form">

              <label>
                Category

                <select
                  value={
                    categoryId
                  }
                  onChange={(
                    event,
                  ) =>
                    setCategoryId(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <option value="">
                    Select category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                Expense Date

                <input
                  type="date"
                  value={
                    expenseDate
                  }
                  onChange={(
                    event,
                  ) =>
                    setExpenseDate(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    saving
                  }
                />
              </label>

              <label>
                Amount

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={
                    amount
                  }
                  onChange={(
                    event,
                  ) =>
                    setAmount(
                      event.target
                        .value,
                    )
                  }
                  placeholder="0.00"
                  disabled={
                    saving
                  }
                />
              </label>

              <div className="expenses-payment-section">

                <span>
                  Payment Method
                </span>

                <div className="expenses-payment-methods">

                  <button
                    type="button"
                    className={
                      paymentMethod ===
                      'cash'
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setPaymentMethod(
                        'cash',
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    <Banknote
                      size={17}
                    />

                    Cash
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod ===
                      'card'
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setPaymentMethod(
                        'card',
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    <CreditCard
                      size={17}
                    />

                    Card
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod ===
                      'qr'
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setPaymentMethod(
                        'qr',
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    <QrCode
                      size={17}
                    />

                    QR
                  </button>

                  <button
                    type="button"
                    className={
                      paymentMethod ===
                      'bank_transfer'
                        ? 'active'
                        : ''
                    }
                    onClick={() =>
                      setPaymentMethod(
                        'bank_transfer',
                      )
                    }
                    disabled={
                      saving
                    }
                  >
                    <WalletCards
                      size={17}
                    />

                    Bank
                  </button>

                </div>

              </div>

              <label>
                Reference No.

                <input
                  value={
                    referenceNo
                  }
                  onChange={(
                    event,
                  ) =>
                    setReferenceNo(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional reference"
                  disabled={
                    saving
                  }
                />
              </label>

              <label>
                Description / Note

                <textarea
                  rows={4}
                  value={
                    description
                  }
                  onChange={(
                    event,
                  ) =>
                    setDescription(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Electricity bill, delivery charge..."
                  disabled={
                    saving
                  }
                />
              </label>

              <button
                type="button"
                className="expenses-save-button"
                onClick={() =>
                  void handleCreateExpense()
                }
                disabled={
                  saving
                }
              >

                {saving ? (
                  <Loader2
                    size={18}
                    className="expenses-spin"
                  />
                ) : (
                  <Plus
                    size={18}
                  />
                )}

                {saving
                  ? 'Recording...'
                  : 'Record Expense'}

              </button>

            </div>

          </section>

          <section className="expenses-history-card">

            <div className="expenses-history-heading">

              <div>
                <h2>
                  Expense History
                </h2>

                <p>
                  Recent operating
                  expenses.
                </p>
              </div>

              <div className="expenses-search">

                <Search
                  size={17}
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search expenses..."
                />

              </div>

            </div>

            <div className="expenses-table-wrap">

              <table className="expenses-table">

                <thead>
                  <tr>
                    <th>
                      Expense
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Description
                    </th>

                    <th>
                      Method
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Staff
                    </th>

                    <th>
                      Status
                    </th>

                    <th />
                  </tr>
                </thead>

                <tbody>

                  {loading ? (

                    <tr>
                      <td
                        colSpan={9}
                        className="expenses-empty"
                      >
                        <Loader2
                          size={20}
                          className="expenses-spin"
                        />

                        Loading expenses...
                      </td>
                    </tr>

                  ) : filteredExpenses.length ===
                    0 ? (

                    <tr>
                      <td
                        colSpan={9}
                        className="expenses-empty"
                      >
                        No expenses found.
                      </td>
                    </tr>

                  ) : (

                    filteredExpenses.map(
                      (expense) => (

                        <tr
                          key={
                            expense.id
                          }
                          className={
                            expense.status ===
                            'cancelled'
                              ? 'cancelled'
                              : ''
                          }
                        >

                          <td>
                            <strong className="expense-number">
                              {
                                expense.expenseNo
                              }
                            </strong>
                          </td>

                          <td>
                            {formatDate(
                              expense.expenseDate,
                            )}
                          </td>

                          <td>
                            {expense.categoryName ??
                              'Uncategorized'}
                          </td>

                          <td>
                            <div className="expense-description">
                              {expense.description ??
                                '—'}

                              {expense.referenceNo && (
                                <small>
                                  Ref:{' '}
                                  {
                                    expense.referenceNo
                                  }
                                </small>
                              )}
                            </div>
                          </td>

                          <td>
                            <span className="expense-method-badge">
                              {labelText(
                                expense.paymentMethod,
                              )}
                            </span>
                          </td>

                          <td>
                            <strong>
                              {money(
                                expense.amount,
                              )}
                            </strong>
                          </td>

                          <td>
                            {expense.staffName ??
                              '—'}
                          </td>

                          <td>
                            <span
                              className={`expense-status ${expense.status}`}
                            >
                              {
                                expense.status
                              }
                            </span>
                          </td>

                          <td>
                            {expense.status ===
                              'completed' && (

                              <button
                                type="button"
                                className="expense-cancel-button"
                                title="Cancel expense"
                                onClick={() =>
                                  void handleCancel(
                                    expense,
                                  )
                                }
                                disabled={
                                  cancellingId ===
                                  expense.id
                                }
                              >

                                {cancellingId ===
                                expense.id ? (
                                  <Loader2
                                    size={15}
                                    className="expenses-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={15}
                                  />
                                )}

                              </button>

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

      </div>
    </AppLayout>
  )
}