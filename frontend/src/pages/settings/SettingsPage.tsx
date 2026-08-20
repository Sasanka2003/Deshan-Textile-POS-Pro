import {
  useEffect,
  useState,
} from 'react'

import {
  Building2,
  CircleCheck,
  CircleX,
  Loader2,
  MonitorCog,
  ReceiptText,
  Save,
  Settings2,
  Store,
  TriangleAlert,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'

import {
  useAuth,
} from '../../contexts/AuthContext'

import {
  getBusinessSettings,
  saveBusinessSettings,
} from '../../services/settingsService'

import type {
  BusinessSettings,
  BusinessSettingsInput,
  SettingsPaymentMethod,
  SettingsSaleType,
} from '../../types/settings'

import '../../styles/settings.css'

const DEFAULT_FORM:
  BusinessSettingsInput = {
    businessName:
      'Deshan Textile',

    businessPhone:
      '',

    businessEmail:
      '',

    businessAddress:
      '',

    branchName:
      'Main Branch',

    branchPhone:
      '',

    terminalName:
      'POS Terminal 01',

    defaultSaleType:
      'retail',

    defaultPaymentMethod:
      'cash',

    receiptFooter:
      'Thank you for shopping with Deshan Textile.',

    showBusinessPhone:
      true,

    showBusinessAddress:
      true,

    lowStockWarningEnabled:
      true,

    lowStockThreshold:
      5,
  }

function mapSettingsToForm(
  data: BusinessSettings,
): BusinessSettingsInput {
  return {
    businessName:
      data.businessName,

    businessPhone:
      data.businessPhone ??
      '',

    businessEmail:
      data.businessEmail ??
      '',

    businessAddress:
      data.businessAddress ??
      '',

    branchName:
      data.branchName ??
      '',

    branchPhone:
      data.branchPhone ??
      '',

    terminalName:
      data.terminalName,

    defaultSaleType:
      data.defaultSaleType,

    defaultPaymentMethod:
      data.defaultPaymentMethod,

    receiptFooter:
      data.receiptFooter ??
      '',

    showBusinessPhone:
      data.showBusinessPhone,

    showBusinessAddress:
      data.showBusinessAddress,

    lowStockWarningEnabled:
      data.lowStockWarningEnabled,

    lowStockThreshold:
      data.lowStockThreshold,
  }
}

export default function SettingsPage() {
  const {
    staff,
  } = useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId ??
    null

  const isManager =
    staff?.role ===
    'manager'

  const [
    form,
    setForm,
  ] =
    useState<BusinessSettingsInput>({
      ...DEFAULT_FORM,
    })

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

  useEffect(() => {
    if (
      !businessId ||
      !isManager
    ) {
      setLoading(false)
      return
    }

    const currentBusinessId =
      businessId

    const currentBranchId =
      branchId

    async function loadSettings() {
      try {
        setLoading(true)
        setError('')
        setSuccess('')

        const data =
          await getBusinessSettings(
            currentBusinessId,
            currentBranchId,
          )

        if (!data) {
          setForm({
            ...DEFAULT_FORM,
          })

          return
        }

        setForm(
          mapSettingsToForm(
            data,
          ),
        )
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load settings.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadSettings()
  }, [
    businessId,
    branchId,
    isManager,
  ])

  function updateField<
    K extends keyof BusinessSettingsInput,
  >(
    key: K,
    value:
      BusinessSettingsInput[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    )

    setSuccess('')
    setError('')
  }

  async function handleSave() {
    if (
      !businessId ||
      !isManager
    ) {
      setError(
        'Manager access is required.',
      )

      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const saved =
        await saveBusinessSettings(
          businessId,
          branchId,
          form,
        )

      setForm(
        mapSettingsToForm(
          saved,
        ),
      )

      setSuccess(
        'Settings saved successfully.',
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save settings.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!isManager) {
    return (
      <AppLayout>
        <div className="settings-page">

          <section className="settings-access-card">

            <TriangleAlert
              size={30}
            />

            <h1>
              Manager Access Required
            </h1>

            <p>
              System settings are
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
      <div className="settings-page">

        <section className="settings-heading">

          <div>

            <h1>
              Settings
            </h1>

            <p>
              Configure business,
              branch, POS, receipt and
              stock preferences.
            </p>

          </div>

          <button
            type="button"
            className="settings-save-button"
            onClick={() =>
              void handleSave()
            }
            disabled={
              loading ||
              saving ||
              !businessId
            }
          >
            {saving ? (
              <Loader2
                size={17}
                className="settings-spin"
              />
            ) : (
              <Save
                size={17}
              />
            )}

            {saving
              ? 'Saving...'
              : 'Save Settings'}
          </button>

        </section>

        {error && (
          <div className="settings-message error">

            <CircleX
              size={17}
            />

            {error}

          </div>
        )}

        {success && (
          <div className="settings-message success">

            <CircleCheck
              size={17}
            />

            {success}

          </div>
        )}

        {loading ? (

          <section className="settings-loading">

            <Loader2
              size={24}
              className="settings-spin"
            />

            Loading settings...

          </section>

        ) : (

          <div className="settings-grid">

            <section className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-card-icon">

                  <Building2
                    size={19}
                  />

                </div>

                <div>

                  <h2>
                    Business Information
                  </h2>

                  <p>
                    Details used across
                    the POS and printed
                    documents.
                  </p>

                </div>

              </div>

              <div className="settings-form-grid">

                <label className="settings-field settings-full-field">

                  <span>
                    Business Name
                  </span>

                  <input
                    value={
                      form.businessName
                    }
                    maxLength={120}
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'businessName',
                        event.target.value,
                      )
                    }
                    placeholder="Business name"
                  />

                </label>

                <label className="settings-field">

                  <span>
                    Phone
                  </span>

                  <input
                    value={
                      form.businessPhone
                    }
                    inputMode="tel"
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'businessPhone',
                        event.target.value,
                      )
                    }
                    placeholder="07X XXX XXXX"
                  />

                </label>

                <label className="settings-field">

                  <span>
                    Email
                  </span>

                  <input
                    type="email"
                    value={
                      form.businessEmail
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'businessEmail',
                        event.target.value,
                      )
                    }
                    placeholder="business@email.com"
                  />

                </label>

                <label className="settings-field settings-full-field">

                  <span>
                    Business Address
                  </span>

                  <textarea
                    rows={3}
                    value={
                      form.businessAddress
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'businessAddress',
                        event.target.value,
                      )
                    }
                    placeholder="Business address"
                  />

                </label>

              </div>

            </section>

            <section className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-card-icon">

                  <Store
                    size={19}
                  />

                </div>

                <div>

                  <h2>
                    Branch Information
                  </h2>

                  <p>
                    Details for the
                    currently configured
                    branch.
                  </p>

                </div>

              </div>

              <div className="settings-form-grid">

                <label className="settings-field">

                  <span>
                    Branch Name
                  </span>

                  <input
                    value={
                      form.branchName
                    }
                    maxLength={120}
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'branchName',
                        event.target.value,
                      )
                    }
                    placeholder="Main Branch"
                  />

                </label>

                <label className="settings-field">

                  <span>
                    Branch Phone
                  </span>

                  <input
                    value={
                      form.branchPhone
                    }
                    inputMode="tel"
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'branchPhone',
                        event.target.value,
                      )
                    }
                    placeholder="Branch contact"
                  />

                </label>

                <label className="settings-field settings-full-field">

                  <span>
                    Terminal Name
                  </span>

                  <input
                    value={
                      form.terminalName
                    }
                    maxLength={120}
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'terminalName',
                        event.target.value,
                      )
                    }
                    placeholder="POS Terminal 01"
                  />

                </label>

              </div>

            </section>

            <section className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-card-icon">

                  <MonitorCog
                    size={19}
                  />

                </div>

                <div>

                  <h2>
                    POS Defaults
                  </h2>

                  <p>
                    Default options when
                    starting a new sale.
                  </p>

                </div>

              </div>

              <div className="settings-form-grid">

                <label className="settings-field">

                  <span>
                    Default Sale Type
                  </span>

                  <select
                    value={
                      form.defaultSaleType
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'defaultSaleType',
                        event.target
                          .value as
                          SettingsSaleType,
                      )
                    }
                  >
                    <option value="retail">
                      Retail
                    </option>

                    <option value="wholesale">
                      Wholesale
                    </option>
                  </select>

                </label>

                <label className="settings-field">

                  <span>
                    Default Payment
                  </span>

                  <select
                    value={
                      form.defaultPaymentMethod
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'defaultPaymentMethod',
                        event.target
                          .value as
                          SettingsPaymentMethod,
                      )
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
                  </select>

                </label>

              </div>

            </section>

            <section className="settings-card">

              <div className="settings-card-heading">

                <div className="settings-card-icon">

                  <ReceiptText
                    size={19}
                  />

                </div>

                <div>

                  <h2>
                    Receipt Settings
                  </h2>

                  <p>
                    Control information
                    displayed on receipts.
                  </p>

                </div>

              </div>

              <div className="settings-form-grid">

                <label className="settings-field settings-full-field">

                  <span>
                    Receipt Footer
                  </span>

                  <textarea
                    rows={3}
                    maxLength={500}
                    value={
                      form.receiptFooter
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'receiptFooter',
                        event.target.value,
                      )
                    }
                    placeholder="Thank you message"
                  />

                </label>

              </div>

              <div className="settings-toggle-list">

                <label className="settings-toggle-row">

                  <div>

                    <strong>
                      Show Business Phone
                    </strong>

                    <span>
                      Display business
                      phone number on
                      receipts.
                    </span>

                  </div>

                  <input
                    type="checkbox"
                    checked={
                      form.showBusinessPhone
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'showBusinessPhone',
                        event.target.checked,
                      )
                    }
                  />

                </label>

                <label className="settings-toggle-row">

                  <div>

                    <strong>
                      Show Business Address
                    </strong>

                    <span>
                      Display business
                      address on receipts.
                    </span>

                  </div>

                  <input
                    type="checkbox"
                    checked={
                      form.showBusinessAddress
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'showBusinessAddress',
                        event.target.checked,
                      )
                    }
                  />

                </label>

              </div>

            </section>

            <section className="settings-card settings-card-wide">

              <div className="settings-card-heading">

                <div className="settings-card-icon">

                  <Settings2
                    size={19}
                  />

                </div>

                <div>

                  <h2>
                    Stock Warning Settings
                  </h2>

                  <p>
                    Configure low-stock
                    alerts used by the
                    system.
                  </p>

                </div>

              </div>

              <div className="settings-toggle-list">

                <label className="settings-toggle-row">

                  <div>

                    <strong>
                      Low Stock Warning
                    </strong>

                    <span>
                      Enable low-stock
                      alerts in the POS
                      system.
                    </span>

                  </div>

                  <input
                    type="checkbox"
                    checked={
                      form.lowStockWarningEnabled
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'lowStockWarningEnabled',
                        event.target.checked,
                      )
                    }
                  />

                </label>

              </div>

              <div className="settings-stock-threshold">

                <label className="settings-field">

                  <span>
                    Default Low Stock
                    Threshold
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.001"
                    value={
                      form.lowStockThreshold
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        'lowStockThreshold',
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    disabled={
                      !form.lowStockWarningEnabled
                    }
                  />

                </label>

                <div className="settings-stock-info">

                  <TriangleAlert
                    size={18}
                  />

                  <span>
                    Products at or below
                    this quantity can be
                    treated as low stock.
                  </span>

                </div>

              </div>

            </section>

          </div>

        )}

      </div>
    </AppLayout>
  )
}
