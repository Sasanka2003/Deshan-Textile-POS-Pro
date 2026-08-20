import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import {
  createCustomer,
  getCustomers,
  setCustomerActiveStatus,
  updateCustomer,
} from '../../services/customerService'

import type {
  Customer,
  CustomerInput,
} from '../../types/customer'

import '../../styles/customers.css'

const emptyForm: CustomerInput = {
  name: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  email: '',
  nic: '',
  tin: '',
  address: '',
  city: '',
  openingBalance: 0,
  creditLimit: 0,
  notes: '',
}

function customerToForm(
  customer: Customer,
): CustomerInput {
  return {
    name: customer.name,
    contactPerson:
      customer.contactPerson ?? '',
    phone: customer.phone ?? '',
    alternatePhone:
      customer.alternatePhone ?? '',
    email: customer.email ?? '',
    nic: customer.nic ?? '',
    tin: customer.tin ?? '',
    address: customer.address ?? '',
    city: customer.city ?? '',
    openingBalance:
      customer.openingBalance,
    creditLimit:
      customer.creditLimit,
    notes: customer.notes ?? '',
  }
}

function money(value: number) {
  return `Rs. ${value.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function CustomersPage() {
  const { staff } = useAuth()

  const businessId = staff?.businessId

  const isManager =
    staff?.role === 'manager'

  const [customers, setCustomers] =
    useState<Customer[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [modalOpen, setModalOpen] =
    useState(false)

  const [
    editingCustomer,
    setEditingCustomer,
  ] = useState<Customer | null>(null)

  const [form, setForm] =
    useState<CustomerInput>(emptyForm)

  async function loadCustomers() {
    if (!businessId) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const data =
        await getCustomers(businessId)

      setCustomers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load customers.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCustomers()
  }, [businessId])

  const filteredCustomers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      if (!query) {
        return customers
      }

      return customers.filter(
        (customer) =>
          [
            customer.name,
            customer.contactPerson,
            customer.phone,
            customer.alternatePhone,
            customer.email,
            customer.nic,
            customer.tin,
            customer.city,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query),
            ),
      )
    }, [customers, search])

  const activeCount =
    useMemo(
      () =>
        customers.filter(
          (customer) =>
            customer.isActive,
        ).length,
      [customers],
    )

  const totalOpeningBalance =
    useMemo(
      () =>
        customers.reduce(
          (total, customer) =>
            total +
            customer.openingBalance,
          0,
        ),
      [customers],
    )

  function openCreateModal() {
    setEditingCustomer(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEditModal(
    customer: Customer,
  ) {
    setEditingCustomer(customer)
    setForm(customerToForm(customer))
    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setModalOpen(false)
    setEditingCustomer(null)
    setForm(emptyForm)
  }

  function updateField<
    K extends keyof CustomerInput,
  >(
    field: K,
    value: CustomerInput[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSave() {
    if (!businessId) {
      setError(
        'Business information is unavailable.',
      )
      return
    }

    if (!form.name.trim()) {
      setError(
        'Customer name is required.',
      )
      return
    }

    if (
      !Number.isFinite(
        form.openingBalance,
      )
    ) {
      setError(
        'Enter a valid opening balance.',
      )
      return
    }

    if (
      !Number.isFinite(
        form.creditLimit,
      ) ||
      form.creditLimit < 0
    ) {
      setError(
        'Enter a valid credit limit.',
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      if (editingCustomer) {
        await updateCustomer(
          editingCustomer.id,
          businessId,
          form,
        )
      } else {
        await createCustomer(
          businessId,
          form,
        )
      }

      setModalOpen(false)
      setEditingCustomer(null)
      setForm(emptyForm)

      await loadCustomers()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save customer.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(
    customer: Customer,
  ) {
    if (!businessId) {
      return
    }

    if (!isManager) {
      setError(
        'Only managers can change customer account status.',
      )
      return
    }

    const action =
      customer.isActive
        ? 'disable'
        : 'activate'

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${customer.name}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await setCustomerActiveStatus(
        customer.id,
        businessId,
        !customer.isActive,
      )

      await loadCustomers()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update customer.',
      )
    }
  }

  return (
    <AppLayout>
      <section className="customers-heading">
        <div>
          <h1>Customers</h1>

          <p>
            Manage customer details,
            credit limits and account
            information.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Add Customer
        </button>
      </section>

      {error && (
        <div className="customers-error">
          {error}
        </div>
      )}

      <section className="customer-summary-grid">
        <article className="customer-summary-card">
          <div className="customer-summary-icon">
            <Users size={21} />
          </div>

          <div>
            <span>Total Customers</span>

            <strong>
              {customers.length}
            </strong>
          </div>
        </article>

        <article className="customer-summary-card">
          <div className="customer-summary-icon">
            <UserRound size={21} />
          </div>

          <div>
            <span>Active Customers</span>

            <strong>
              {activeCount}
            </strong>
          </div>
        </article>

        <article className="customer-summary-card">
          <div className="customer-summary-icon">
            Rs.
          </div>

          <div>
            <span>Opening Receivable</span>

            <strong>
              {money(
                totalOpeningBalance,
              )}
            </strong>
          </div>
        </article>
      </section>

      <section className="customers-panel">
        <div className="customers-toolbar">
          <div className="customer-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search customer, phone, NIC, email..."
            />
          </div>

          <span className="customer-count">
            {filteredCustomers.length}{' '}
            customer
            {filteredCustomers.length === 1
              ? ''
              : 's'}
          </span>
        </div>

        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>NIC / TIN</th>
                <th>Location</th>
                <th>
                  Opening Balance
                </th>
                <th>
                  Credit Limit
                </th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="customers-empty"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers
                  .length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="customers-empty"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(
                  (customer) => (
                    <tr
                      key={customer.id}
                    >
                      <td>
                        <div className="customer-name">
                          <strong>
                            {customer.name}
                          </strong>

                          {customer.email && (
                            <small>
                              <Mail
                                size={12}
                              />

                              {
                                customer.email
                              }
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        {customer.phone ? (
                          <span className="customer-phone">
                            <Phone
                              size={13}
                            />

                            {
                              customer.phone
                            }
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td>
                        <div className="customer-id-cell">
                          <span>
                            {customer.nic ??
                              'No NIC'}
                          </span>

                          <small>
                            {customer.tin ??
                              'No TIN'}
                          </small>
                        </div>
                      </td>

                      <td>
                        {customer.city ??
                          customer.address ??
                          '—'}
                      </td>

                      <td>
                        {money(
                          customer
                            .openingBalance,
                        )}
                      </td>

                      <td>
                        {money(
                          customer
                            .creditLimit,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            customer
                              .isActive
                              ? 'customer-active'
                              : 'customer-disabled'
                          }
                        >
                          {customer
                            .isActive
                            ? 'Active'
                            : 'Disabled'}
                        </span>
                      </td>

                      <td>
                        <div className="customer-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                customer,
                              )
                            }
                          >
                            <Edit3
                              size={13}
                            />
                            Edit
                          </button>

                          {isManager && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleStatusChange(
                                  customer,
                                )
                              }
                            >
                              {customer
                                .isActive
                                ? 'Disable'
                                : 'Activate'}
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

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="customer-modal">
            <div className="modal-heading">
              <div>
                <h2>
                  {editingCustomer
                    ? 'Edit Customer'
                    : 'Add Customer'}
                </h2>

                <p>
                  Add customer contact and
                  credit information.
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="customer-form">
              <div className="customer-form-grid">
                <label>
                  Customer Name *

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        'name',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Contact Person

                  <input
                    value={
                      form.contactPerson
                    }
                    onChange={(event) =>
                      updateField(
                        'contactPerson',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Phone

                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        'phone',
                        event.target.value,
                      )
                    }
                    placeholder="07X XXX XXXX"
                    disabled={saving}
                  />
                </label>

                <label>
                  Alternate Phone

                  <input
                    value={
                      form.alternatePhone
                    }
                    onChange={(event) =>
                      updateField(
                        'alternatePhone',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Email

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        'email',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  NIC

                  <input
                    value={form.nic}
                    onChange={(event) =>
                      updateField(
                        'nic',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  TIN

                  <input
                    value={form.tin}
                    onChange={(event) =>
                      updateField(
                        'tin',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  City

                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField(
                        'city',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label className="customer-full-field">
                  Address

                  <input
                    value={form.address}
                    onChange={(event) =>
                      updateField(
                        'address',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Opening Balance

                  <input
                    type="number"
                    step="0.01"
                    value={
                      form.openingBalance
                    }
                    onChange={(event) =>
                      updateField(
                        'openingBalance',
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Credit Limit

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.creditLimit
                    }
                    onChange={(event) =>
                      updateField(
                        'creditLimit',
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label className="customer-full-field">
                  Notes

                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(event) =>
                      updateField(
                        'notes',
                        event.target.value,
                      )
                    }
                    disabled={saving}
                  />
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  void handleSave()
                }
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingCustomer
                    ? 'Save Changes'
                    : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}