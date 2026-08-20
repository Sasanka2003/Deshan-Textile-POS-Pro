import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Building2,
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  UserRound,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import {
  createSupplier,
  getSuppliers,
  setSupplierActiveStatus,
  updateSupplier,
} from '../../services/supplierService'

import type {
  Supplier,
  SupplierInput,
} from '../../types/supplier'

import '../../styles/suppliers.css'

const emptyForm: SupplierInput = {
  name: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  email: '',
  address: '',
  city: '',
  taxNumber: '',
  openingBalance: 0,
  creditLimit: 0,
  notes: '',
}

function supplierToForm(
  supplier: Supplier,
): SupplierInput {
  return {
    name: supplier.name,
    contactPerson:
      supplier.contactPerson ?? '',
    phone: supplier.phone ?? '',
    alternatePhone:
      supplier.alternatePhone ?? '',
    email: supplier.email ?? '',
    address: supplier.address ?? '',
    city: supplier.city ?? '',
    taxNumber: supplier.taxNumber ?? '',
    openingBalance:
      supplier.openingBalance,
    creditLimit:
      supplier.creditLimit,
    notes: supplier.notes ?? '',
  }
}

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

export default function SuppliersPage() {
  const { staff } = useAuth()

  const businessId = staff?.businessId

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([])

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
    editingSupplier,
    setEditingSupplier,
  ] = useState<Supplier | null>(null)

  const [form, setForm] =
    useState<SupplierInput>(emptyForm)

  async function loadSuppliers() {
    if (!businessId) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const data =
        await getSuppliers(businessId)

      setSuppliers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load suppliers.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSuppliers()
  }, [businessId])

  const filteredSuppliers =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      if (!query) {
        return suppliers
      }

      return suppliers.filter(
        (supplier) =>
          [
            supplier.name,
            supplier.contactPerson,
            supplier.phone,
            supplier.alternatePhone,
            supplier.email,
            supplier.city,
            supplier.taxNumber,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query),
            ),
      )
    }, [suppliers, search])

  const activeCount =
    useMemo(
      () =>
        suppliers.filter(
          (supplier) =>
            supplier.isActive,
        ).length,
      [suppliers],
    )

  const totalOpeningBalance =
    useMemo(
      () =>
        suppliers.reduce(
          (total, supplier) =>
            total +
            supplier.openingBalance,
          0,
        ),
      [suppliers],
    )

  function openCreateModal() {
    setEditingSupplier(null)
    setForm(emptyForm)
    setError('')
    setModalOpen(true)
  }

  function openEditModal(
    supplier: Supplier,
  ) {
    setEditingSupplier(supplier)

    setForm(
      supplierToForm(supplier),
    )

    setError('')
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) {
      return
    }

    setModalOpen(false)
    setEditingSupplier(null)
    setForm(emptyForm)
  }

  function updateField<
    K extends keyof SupplierInput,
  >(
    field: K,
    value: SupplierInput[K],
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
        'Supplier name is required.',
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

      if (editingSupplier) {
        await updateSupplier(
          editingSupplier.id,
          businessId,
          form,
        )
      } else {
        await createSupplier(
          businessId,
          form,
        )
      }

      setModalOpen(false)
      setEditingSupplier(null)
      setForm(emptyForm)

      await loadSuppliers()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save supplier.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(
    supplier: Supplier,
  ) {
    if (!businessId) {
      return
    }

    const action =
      supplier.isActive
        ? 'disable'
        : 'activate'

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${supplier.name}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      await setSupplierActiveStatus(
        supplier.id,
        businessId,
        !supplier.isActive,
      )

      await loadSuppliers()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update supplier.',
      )
    }
  }

  return (
    <AppLayout>
      <section className="suppliers-heading">
        <div>
          <h1>Suppliers</h1>

          <p>
            Manage textile suppliers,
            contact information and
            purchasing credit details.
          </p>
        </div>

        {staff?.role === 'manager' && (
          <button
            className="primary-button"
            type="button"
            onClick={openCreateModal}
          >
            <Plus size={18} />
            Add Supplier
          </button>
        )}
      </section>

      {error && (
        <div className="suppliers-error">
          {error}
        </div>
      )}

      <section className="supplier-summary-grid">
        <article className="supplier-summary-card">
          <div className="supplier-summary-icon">
            <Building2 size={21} />
          </div>

          <div>
            <span>
              Total Suppliers
            </span>

            <strong>
              {suppliers.length}
            </strong>
          </div>
        </article>

        <article className="supplier-summary-card">
          <div className="supplier-summary-icon">
            <UserRound size={21} />
          </div>

          <div>
            <span>
              Active Suppliers
            </span>

            <strong>
              {activeCount}
            </strong>
          </div>
        </article>

        <article className="supplier-summary-card">
          <div className="supplier-summary-icon">
            Rs.
          </div>

          <div>
            <span>
              Opening Payable
            </span>

            <strong>
              {formatMoney(
                totalOpeningBalance,
              )}
            </strong>
          </div>
        </article>
      </section>

      <section className="suppliers-panel">
        <div className="suppliers-toolbar">
          <div className="supplier-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search supplier, phone, email..."
            />
          </div>

          <span className="supplier-count">
            {filteredSuppliers.length}
            {' '}
            supplier
            {filteredSuppliers.length === 1
              ? ''
              : 's'}
          </span>
        </div>

        <div className="suppliers-table-wrap">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Phone</th>
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
                    className="suppliers-empty"
                  >
                    Loading suppliers...
                  </td>
                </tr>
              ) : filteredSuppliers
                  .length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="suppliers-empty"
                  >
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(
                  (supplier) => (
                    <tr
                      key={supplier.id}
                    >
                      <td>
                        <div className="supplier-name">
                          <strong>
                            {supplier.name}
                          </strong>

                          {supplier.email && (
                            <small>
                              <Mail
                                size={12}
                              />

                              {
                                supplier.email
                              }
                            </small>
                          )}
                        </div>
                      </td>

                      <td>
                        {supplier
                          .contactPerson ??
                          '—'}
                      </td>

                      <td>
                        {supplier.phone ? (
                          <span className="supplier-phone">
                            <Phone
                              size={13}
                            />

                            {
                              supplier.phone
                            }
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td>
                        {supplier.city ??
                          supplier.address ??
                          '—'}
                      </td>

                      <td>
                        {formatMoney(
                          supplier
                            .openingBalance,
                        )}
                      </td>

                      <td>
                        {formatMoney(
                          supplier
                            .creditLimit,
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            supplier
                              .isActive
                              ? 'supplier-active'
                              : 'supplier-disabled'
                          }
                        >
                          {supplier
                            .isActive
                            ? 'Active'
                            : 'Disabled'}
                        </span>
                      </td>

                      <td>
                        {staff?.role ===
                          'manager' && (
                          <div className="supplier-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  supplier,
                                )
                              }
                            >
                              <Edit3
                                size={13}
                              />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleStatusChange(
                                  supplier,
                                )
                              }
                            >
                              {supplier
                                .isActive
                                ? 'Disable'
                                : 'Activate'}
                            </button>
                          </div>
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

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="supplier-modal">
            <div className="modal-heading">
              <div>
                <h2>
                  {editingSupplier
                    ? 'Edit Supplier'
                    : 'Add Supplier'}
                </h2>

                <p>
                  Add supplier and
                  purchasing credit
                  information.
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="supplier-form">
              <div className="supplier-form-grid">
                <label>
                  Supplier Name *

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        'name',
                        event.target.value,
                      )
                    }
                    placeholder="Supplier name"
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
                    placeholder="Contact person"
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
                    placeholder="Optional"
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
                    placeholder="supplier@example.com"
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
                    placeholder="Matara"
                    disabled={saving}
                  />
                </label>

                <label className="supplier-full-field">
                  Address

                  <input
                    value={form.address}
                    onChange={(event) =>
                      updateField(
                        'address',
                        event.target.value,
                      )
                    }
                    placeholder="Supplier address"
                    disabled={saving}
                  />
                </label>

                <label>
                  Tax / VAT Number

                  <input
                    value={
                      form.taxNumber
                    }
                    onChange={(event) =>
                      updateField(
                        'taxNumber',
                        event.target.value,
                      )
                    }
                    placeholder="Optional"
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
                          event.target
                            .value,
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
                          event.target
                            .value,
                        ),
                      )
                    }
                    disabled={saving}
                  />
                </label>

                <label className="supplier-full-field">
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
                    placeholder="Optional supplier notes"
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
                  : editingSupplier
                    ? 'Save Changes'
                    : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}