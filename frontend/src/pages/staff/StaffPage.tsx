import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  BadgeCheck,
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import {
  createStaffWithLogin,
  getStaff,
  setStaffActiveStatus,
  updateStaff,
  type CreateStaffWithLoginInput,
} from '../../services/staffService'

import type {
  Staff,
  StaffInput,
  StaffRole,
} from '../../types/staff'

import '../../styles/staff.css'

const EMPTY_CREATE_FORM:
  CreateStaffWithLoginInput = {
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'cashier',
  }

const EMPTY_EDIT_FORM:
  StaffInput = {
    fullName: '',
    username: '',
    phone: '',
    role: 'cashier',
    isActive: true,
  }

function roleLabel(
  role: StaffRole,
) {
  return role ===
    'manager'
    ? 'Manager'
    : 'Cashier'
}

function initials(
  value: string,
) {
  const parts =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)

  if (
    parts.length ===
    0
  ) {
    return 'U'
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .charAt(0)
      .toUpperCase()
  }

  return (
    parts[0]
      .charAt(0) +
    parts[
      parts.length - 1
    ].charAt(0)
  ).toUpperCase()
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—'
  }

  return date
    .toLocaleDateString(
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
      },
    )
}

export default function StaffPage() {
  const {
    staff: loggedInStaff,
  } =
    useAuth()

  const businessId =
    loggedInStaff?.businessId

  const branchId =
    loggedInStaff?.branchId

  const [
    staffList,
    setStaffList,
  ] =
    useState<Staff[]>([])

  const [
    search,
    setSearch,
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
    statusLoadingId,
    setStatusLoadingId,
  ] =
    useState<
      string | null
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
    formOpen,
    setFormOpen,
  ] =
    useState(false)

  const [
    editingStaff,
    setEditingStaff,
  ] =
    useState<
      Staff | null
    >(null)

  const [
    createForm,
    setCreateForm,
  ] =
    useState<
      CreateStaffWithLoginInput
    >({
      ...EMPTY_CREATE_FORM,
    })

  const [
    editForm,
    setEditForm,
  ] =
    useState<StaffInput>({
      ...EMPTY_EDIT_FORM,
    })

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  const isManager =
    loggedInStaff?.role ===
    'manager'

  const activeManagerCount =
    useMemo(
      () =>
        staffList.filter(
          (item) =>
            item.role === 'manager' &&
            item.isActive,
        ).length,
      [staffList],
    )

  async function loadStaff() {
    if (!businessId) {
      setStaffList([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const data =
        await getStaff(
          businessId,
          branchId ??
            undefined,
        )

      setStaffList(
        data,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load staff.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  useEffect(() => {
    void loadStaff()
  }, [
    businessId,
    branchId,
  ])

  const filteredStaff =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase()

        if (!query) {
          return staffList
        }

        return staffList.filter(
          (item) =>
            [
              item.fullName,
              item.username,
              item.role,
              item.phone,
              item.isActive
                ? 'active'
                : 'inactive',

              item.authUserId
                ? 'login active'
                : 'login pending',
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
        staffList,
        search,
      ],
    )

  const activeCount =
    useMemo(
      () =>
        staffList.filter(
          (item) =>
            item.isActive,
        ).length,
      [
        staffList,
      ],
    )

  const managerCount =
    useMemo(
      () =>
        staffList.filter(
          (item) =>
            item.role ===
            'manager',
        ).length,
      [
        staffList,
      ],
    )

  const cashierCount =
    useMemo(
      () =>
        staffList.filter(
          (item) =>
            item.role ===
            'cashier',
        ).length,
      [
        staffList,
      ],
    )

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  function openCreateForm() {
    clearMessages()

    setEditingStaff(
      null,
    )

    setCreateForm({
      ...EMPTY_CREATE_FORM,
    })

    setShowPassword(
      false,
    )

    setFormOpen(
      true,
    )
  }

  function openEditForm(
    item: Staff,
  ) {
    clearMessages()

    setEditingStaff(
      item,
    )

    setEditForm({
      fullName:
        item.fullName,

      username:
        item.username,

      phone:
        item.phone ??
        '',

      role:
        item.role,

      isActive:
        item.isActive,
    })

    setFormOpen(
      true,
    )
  }

  function closeForm() {
    if (saving) {
      return
    }

    setFormOpen(
      false,
    )

    setEditingStaff(
      null,
    )

    setCreateForm({
      ...EMPTY_CREATE_FORM,
    })

    setEditForm({
      ...EMPTY_EDIT_FORM,
    })

    setShowPassword(
      false,
    )
  }

  function updateCreateForm<
    K extends keyof CreateStaffWithLoginInput,
  >(
    key: K,
    value:
      CreateStaffWithLoginInput[K],
  ) {
    setCreateForm(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    )
  }

  function updateEditForm<
    K extends keyof StaffInput,
  >(
    key: K,
    value:
      StaffInput[K],
  ) {
    setEditForm(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    )
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (
      !businessId ||
      !branchId
    ) {
      setError(
        'Business or branch information is unavailable.',
      )

      return
    }

    if (!isManager) {
      setError(
        'Only managers can manage staff.',
      )

      return
    }

    if (
      editingStaff &&
      loggedInStaff?.id ===
        editingStaff.id &&
      !editForm.isActive
    ) {
      setError(
        'You cannot deactivate your own account while logged in.',
      )

      return
    }

    if (
      editingStaff &&
      loggedInStaff?.id === editingStaff.id &&
      editForm.role !== loggedInStaff.role
    ) {
      setError(
        'You cannot change your own role while logged in.',
      )

      return
    }

    if (
      editingStaff?.role === 'manager' &&
      editingStaff.isActive &&
      activeManagerCount <= 1 &&
      (
        editForm.role !== 'manager' ||
        !editForm.isActive
      )
    ) {
      setError(
        'At least one active manager account must remain.',
      )

      return
    }

    try {
      setSaving(
        true,
      )

      clearMessages()

      if (editingStaff) {
        const updated =
          await updateStaff(
            editingStaff.id,
            businessId,
            branchId,
            editForm,
          )

        setSuccess(
          `${updated.fullName} updated successfully.`,
        )
      } else {
        const created =
          await createStaffWithLogin(
            createForm,
          )

        setSuccess(
          `${created.fullName} account created successfully.`,
        )
      }

      setFormOpen(
        false,
      )

      setEditingStaff(
        null,
      )

      setCreateForm({
        ...EMPTY_CREATE_FORM,
      })

      setEditForm({
        ...EMPTY_EDIT_FORM,
      })

      setShowPassword(
        false,
      )

      await loadStaff()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save staff member.',
      )
    } finally {
      setSaving(
        false,
      )
    }
  }

  async function handleToggleStatus(
    item: Staff,
  ) {
    if (!businessId) {
      setError(
        'Business information is unavailable.',
      )

      return
    }

    if (!isManager) {
      setError(
        'Only managers can manage staff.',
      )

      return
    }

    if (
      loggedInStaff?.id ===
        item.id &&
      item.isActive
    ) {
      setError(
        'You cannot deactivate your own account while logged in.',
      )

      return
    }

    if (
      item.role === 'manager' &&
      item.isActive &&
      activeManagerCount <= 1
    ) {
      setError(
        'At least one active manager account must remain.',
      )

      return
    }

    const nextStatus =
      !item.isActive

    try {
      setStatusLoadingId(
        item.id,
      )

      clearMessages()

      const updatedStaff =
        await setStaffActiveStatus(
          item.id,
          businessId,
          nextStatus,
        )

      setStaffList(
        (
          current,
        ) =>
          current.map(
            (
              staffItem,
            ) =>
              staffItem.id ===
              updatedStaff.id
                ? updatedStaff
                : staffItem,
          ),
      )

      setSuccess(
        updatedStaff.isActive
          ? `${updatedStaff.fullName} activated successfully.`
          : `${updatedStaff.fullName} deactivated successfully.`,
      )

      await loadStaff()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update staff status.',
      )
    } finally {
      setStatusLoadingId(
        null,
      )
    }
  }

  if (!isManager) {
    return (
      <AppLayout>

        <div className="staff-page">

          <section className="staff-access-denied">

            <div className="staff-access-icon">

              <ShieldCheck
                size={28}
              />

            </div>

            <h1>
              Manager Access Required
            </h1>

            <p>
              Staff management is
              available only to manager
              accounts.
            </p>

          </section>

        </div>

      </AppLayout>
    )
  }

  return (
    <AppLayout>

      <div className="staff-page">

        <section className="staff-heading">

          <div>

            <h1>
              Staff Management
            </h1>

            <p>
              Manage staff accounts,
              roles and login access.
            </p>

          </div>

          <div className="staff-heading-actions">

            <button
              type="button"
              className="staff-refresh-button"
              onClick={() =>
                void loadStaff()
              }
              disabled={
                loading
              }
            >

              {loading ? (
                <Loader2
                  size={17}
                  className="staff-spin"
                />
              ) : (
                <RefreshCcw
                  size={17}
                />
              )}

              Refresh

            </button>

            <button
              type="button"
              className="staff-add-button"
              onClick={
                openCreateForm
              }
            >

              <Plus
                size={17}
              />

              Add Staff

            </button>

          </div>

        </section>

        {error && (
          <div className="staff-message error">

            <CircleX
              size={17}
            />

            {error}

          </div>
        )}

        {success && (
          <div className="staff-message success">

            <CircleCheck
              size={17}
            />

            {success}

          </div>
        )}

        <section className="staff-summary-grid">

          <article>

            <div className="staff-summary-icon">

              <Users
                size={20}
              />

            </div>

            <div>

              <span>
                Total Staff
              </span>

              <strong>
                {staffList.length}
              </strong>

            </div>

          </article>

          <article>

            <div className="staff-summary-icon">

              <BadgeCheck
                size={20}
              />

            </div>

            <div>

              <span>
                Active Staff
              </span>

              <strong>
                {activeCount}
              </strong>

            </div>

          </article>

          <article>

            <div className="staff-summary-icon">

              <ShieldCheck
                size={20}
              />

            </div>

            <div>

              <span>
                Managers
              </span>

              <strong>
                {managerCount}
              </strong>

            </div>

          </article>

          <article>

            <div className="staff-summary-icon">

              <UserRound
                size={20}
              />

            </div>

            <div>

              <span>
                Cashiers
              </span>

              <strong>
                {cashierCount}
              </strong>

            </div>

          </article>

        </section>

        <section className="staff-card">

          <div className="staff-card-heading">

            <div>

              <h2>
                Staff Accounts
              </h2>

              <p>
                {filteredStaff.length}{' '}
                account(s)
              </p>

            </div>

            <div className="staff-search">

              <Search
                size={16}
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
                placeholder="Search staff..."
              />

            </div>

          </div>

          <div className="staff-table-wrap">

            <table className="staff-table">

              <thead>

                <tr>

                  <th>
                    Staff
                  </th>

                  <th>
                    Username
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Login
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Status
                  </th>

                  <th className="staff-actions-column">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={8}
                    >

                      <div className="staff-table-empty">

                        <Loader2
                          size={20}
                          className="staff-spin"
                        />

                        Loading staff...

                      </div>

                    </td>

                  </tr>

                ) : filteredStaff.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan={8}
                    >

                      <div className="staff-table-empty">

                        <Users
                          size={24}
                        />

                        <strong>
                          No staff found
                        </strong>

                        <span>
                          Add a staff member
                          or change the search.
                        </span>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredStaff.map(
                    (
                      item,
                    ) => {
                      const isSelf =
                        loggedInStaff?.id ===
                        item.id

                      return (
                        <tr
                          key={
                            item.id
                          }
                        >

                          <td>

                            <div className="staff-person">

                              <div className="staff-avatar">

                                {initials(
                                  item.fullName,
                                )}

                              </div>

                              <div>

                                <strong>
                                  {item.fullName}
                                </strong>

                                <span>
                                  {isSelf
                                    ? 'Current user'
                                    : 'Staff member'}
                                </span>

                              </div>

                            </div>

                          </td>

                          <td>

                            <strong>
                              {item.username}
                            </strong>

                          </td>

                          <td>

                            <span
                              className={`staff-role ${item.role}`}
                            >
                              {roleLabel(
                                item.role,
                              )}
                            </span>

                          </td>

                          <td>
                            {item.phone ??
                              '—'}
                          </td>

                          <td>

                            <span
                              className={
                                item.authUserId
                                  ? 'staff-status active'
                                  : 'staff-status inactive'
                              }
                            >
                              {item.authUserId
                                ? 'Login Active'
                                : 'Login Pending'}
                            </span>

                          </td>

                          <td>

                            {formatDate(
                              item.createdAt,
                            )}

                          </td>

                          <td>

                            <span
                              className={
                                item.isActive
                                  ? 'staff-status active'
                                  : 'staff-status inactive'
                              }
                            >
                              {item.isActive
                                ? 'Active'
                                : 'Inactive'}
                            </span>

                          </td>

                          <td>

                            <div className="staff-row-actions">

                              <button
                                type="button"
                                className="staff-icon-button"
                                title="Edit staff"
                                onClick={() =>
                                  openEditForm(
                                    item,
                                  )
                                }
                              >

                                <Pencil
                                  size={15}
                                />

                              </button>

                              <button
                                type="button"
                                className={
                                  item.isActive
                                    ? 'staff-status-button deactivate'
                                    : 'staff-status-button activate'
                                }
                                disabled={
                                  statusLoadingId ===
                                    item.id
                                }
                                onClick={() =>
                                  void handleToggleStatus(
                                    item,
                                  )
                                }
                              >

                                {statusLoadingId ===
                                item.id ? (

                                  <Loader2
                                    size={14}
                                    className="staff-spin"
                                  />

                                ) : item.isActive ? (

                                  <CircleX
                                    size={14}
                                  />

                                ) : (

                                  <CircleCheck
                                    size={14}
                                  />

                                )}

                                {item.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}

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

        {formOpen && (

          <div
            className="staff-modal-backdrop"
            onMouseDown={
              closeForm
            }
          >

            <section
              className="staff-modal"
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
            >

              <div className="staff-modal-heading">

                <div>

                  <h2>
                    {editingStaff
                      ? 'Edit Staff'
                      : 'Add Staff'}
                  </h2>

                  <p>
                    {editingStaff
                      ? 'Update staff profile information.'
                      : 'Create a new staff account with secure login access.'}
                  </p>

                </div>

                <button
                  type="button"
                  className="staff-modal-close"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  aria-label="Close"
                >

                  <X
                    size={19}
                  />

                </button>

              </div>

              <form
                className="staff-form"
                onSubmit={
                  handleSubmit
                }
              >

                <label className="staff-field staff-field-full">

                  <span>
                    Full Name
                  </span>

                  <input
                    value={
                      editingStaff
                        ? editForm.fullName
                        : createForm.fullName
                    }
                    onChange={(
                      event,
                    ) =>
                      editingStaff
                        ? updateEditForm(
                            'fullName',
                            event.target
                              .value,
                          )
                        : updateCreateForm(
                            'fullName',
                            event.target
                              .value,
                          )
                    }
                    placeholder="Employee full name"
                    autoFocus
                  />

                </label>

                <label className="staff-field">

                  <span>
                    Username
                  </span>

                  <input
                    value={
                      editingStaff
                        ? editForm.username
                        : createForm.username
                    }
                    onChange={(
                      event,
                    ) =>
                      editingStaff
                        ? updateEditForm(
                            'username',
                            event.target
                              .value,
                          )
                        : updateCreateForm(
                            'username',
                            event.target
                              .value,
                          )
                    }
                    placeholder="e.g. cashier01"
                  />

                </label>

                <label className="staff-field">

                  <span>
                    Role
                  </span>

                  <select
                    value={
                      editingStaff
                        ? editForm.role
                        : createForm.role
                    }
                    onChange={(
                      event,
                    ) => {
                      const role =
                        event.target
                          .value as StaffRole

                      if (
                        editingStaff
                      ) {
                        updateEditForm(
                          'role',
                          role,
                        )
                      } else {
                        updateCreateForm(
                          'role',
                          role,
                        )
                      }
                    }}
                  >

                    <option value="cashier">
                      Cashier
                    </option>

                    <option value="manager">
                      Manager
                    </option>

                  </select>

                </label>

                <label className="staff-field">

                  <span>
                    Phone
                  </span>

                  <input
                    value={
                      editingStaff
                        ? editForm.phone
                        : createForm.phone
                    }
                    onChange={(
                      event,
                    ) =>
                      editingStaff
                        ? updateEditForm(
                            'phone',
                            event.target
                              .value,
                          )
                        : updateCreateForm(
                            'phone',
                            event.target
                              .value,
                          )
                    }
                    placeholder="07X XXX XXXX"
                  />

                </label>

                {editingStaff ? (

                  <label className="staff-field">

                    <span>
                      Status
                    </span>

                    <select
                      value={
                        editForm.isActive
                          ? 'active'
                          : 'inactive'
                      }
                      disabled={
                        editingStaff.id ===
                        loggedInStaff?.id
                      }
                      onChange={(
                        event,
                      ) =>
                        updateEditForm(
                          'isActive',
                          event.target
                            .value ===
                            'active',
                        )
                      }
                    >

                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>

                    </select>

                  </label>

                ) : (

                  <>

                    <label className="staff-field">

                      <span>
                        Login Email
                      </span>

                      <input
                        type="email"
                        value={
                          createForm.email
                        }
                        onChange={(
                          event,
                        ) =>
                          updateCreateForm(
                            'email',
                            event.target
                              .value,
                          )
                        }
                        placeholder="staff@example.com"
                        autoComplete="off"
                      />

                    </label>

                    <label className="staff-field staff-field-full">

                      <span>
                        Temporary Password
                      </span>

                      <div className="staff-pin-input">

                        <input
                          type={
                            showPassword
                              ? 'text'
                              : 'password'
                          }
                          value={
                            createForm.password
                          }
                          onChange={(
                            event,
                          ) =>
                            updateCreateForm(
                              'password',
                              event.target
                                .value,
                            )
                          }
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (
                                value,
                              ) =>
                                !value,
                            )
                          }
                        >

                          {showPassword ? (

                            <EyeOff
                              size={15}
                            />

                          ) : (

                            <Eye
                              size={15}
                            />

                          )}

                        </button>

                      </div>

                      <small>
                        Give this temporary
                        password to the staff
                        member securely.
                      </small>

                    </label>

                  </>

                )}

                <div className="staff-form-actions">

                  <button
                    type="button"
                    className="staff-cancel-button"
                    onClick={
                      closeForm
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="staff-save-button"
                    disabled={
                      saving
                    }
                  >

                    {saving ? (

                      <Loader2
                        size={16}
                        className="staff-spin"
                      />

                    ) : editingStaff ? (

                      <Pencil
                        size={16}
                      />

                    ) : (

                      <Plus
                        size={16}
                      />

                    )}

                    {saving
                      ? 'Saving...'
                      : editingStaff
                        ? 'Save Changes'
                        : 'Create Staff Account'}

                  </button>

                </div>

              </form>

            </section>

          </div>

        )}

      </div>

    </AppLayout>
  )
}