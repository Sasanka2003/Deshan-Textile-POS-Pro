import {
  supabase,
} from './supabase'

import type {
  BusinessSettings,
  BusinessSettingsInput,
} from '../types/settings'

interface BusinessSettingsRow {
  id: string
  business_id: string
  branch_id: string | null
  business_name: string
  business_phone: string | null
  business_email: string | null
  business_address: string | null
  branch_name: string | null
  branch_phone: string | null
  terminal_name: string
  default_sale_type:
    BusinessSettings['defaultSaleType']
  default_payment_method:
    BusinessSettings['defaultPaymentMethod']
  receipt_footer: string | null
  show_business_phone: boolean
  show_business_address: boolean
  low_stock_warning_enabled: boolean
  low_stock_threshold:
    number | string
  created_at: string
  updated_at: string
}

const SETTINGS_SELECT = `
  id,
  business_id,
  branch_id,
  business_name,
  business_phone,
  business_email,
  business_address,
  branch_name,
  branch_phone,
  terminal_name,
  default_sale_type,
  default_payment_method,
  receipt_footer,
  show_business_phone,
  show_business_address,
  low_stock_warning_enabled,
  low_stock_threshold,
  created_at,
  updated_at
`

function optionalText(
  value: string,
) {
  const clean =
    value.trim()

  return clean || null
}

function normalizePhone(
  value: string,
) {
  return value
    .trim()
    .replace(
      /\s+/g,
      ' ',
    )
}

function validateOptionalPhone(
  value: string,
  label: string,
) {
  const clean =
    value.trim()

  if (!clean) {
    return
  }

  const digits =
    clean.replace(
      /\D/g,
      '',
    )

  if (
    digits.length < 7 ||
    digits.length > 15
  ) {
    throw new Error(
      `${label} must contain between 7 and 15 digits.`,
    )
  }
}

function validateOptionalEmail(
  value: string,
) {
  const clean =
    value.trim()

  if (!clean) {
    return
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (
    !emailPattern.test(
      clean,
    )
  ) {
    throw new Error(
      'Enter a valid business email address.',
    )
  }
}

function mapSettings(
  row: BusinessSettingsRow,
): BusinessSettings {
  return {
    id:
      row.id,
    businessId:
      row.business_id,
    branchId:
      row.branch_id,
    businessName:
      row.business_name,
    businessPhone:
      row.business_phone,
    businessEmail:
      row.business_email,
    businessAddress:
      row.business_address,
    branchName:
      row.branch_name,
    branchPhone:
      row.branch_phone,
    terminalName:
      row.terminal_name,
    defaultSaleType:
      row.default_sale_type,
    defaultPaymentMethod:
      row.default_payment_method,
    receiptFooter:
      row.receipt_footer,
    showBusinessPhone:
      row.show_business_phone,
    showBusinessAddress:
      row.show_business_address,
    lowStockWarningEnabled:
      row.low_stock_warning_enabled,
    lowStockThreshold:
      Number(
        row.low_stock_threshold,
      ),
    createdAt:
      row.created_at,
    updatedAt:
      row.updated_at,
  }
}

function validateSettings(
  branchId: string | null,
  input: BusinessSettingsInput,
) {
  const businessName =
    input.businessName.trim()

  const branchName =
    input.branchName.trim()

  const terminalName =
    input.terminalName.trim()

  if (!businessName) {
    throw new Error(
      'Business name is required.',
    )
  }

  if (
    businessName.length >
    120
  ) {
    throw new Error(
      'Business name is too long.',
    )
  }

  if (
    branchId &&
    !branchName
  ) {
    throw new Error(
      'Branch name is required.',
    )
  }

  if (
    branchName.length >
    120
  ) {
    throw new Error(
      'Branch name is too long.',
    )
  }

  if (!terminalName) {
    throw new Error(
      'Terminal name is required.',
    )
  }

  if (
    terminalName.length >
    120
  ) {
    throw new Error(
      'Terminal name is too long.',
    )
  }

  validateOptionalPhone(
    input.businessPhone,
    'Business phone',
  )

  validateOptionalPhone(
    input.branchPhone,
    'Branch phone',
  )

  validateOptionalEmail(
    input.businessEmail,
  )

  if (
    input.defaultSaleType !==
      'retail' &&
    input.defaultSaleType !==
      'wholesale'
  ) {
    throw new Error(
      'Invalid default sale type.',
    )
  }

  if (
    ![
      'cash',
      'card',
      'qr',
      'bank_transfer',
    ].includes(
      input.defaultPaymentMethod,
    )
  ) {
    throw new Error(
      'Invalid default payment method.',
    )
  }

  if (
    !Number.isFinite(
      input.lowStockThreshold,
    ) ||
    input.lowStockThreshold <
      0
  ) {
    throw new Error(
      'Low stock threshold cannot be negative.',
    )
  }

  if (
    input.lowStockThreshold >
    1_000_000
  ) {
    throw new Error(
      'Low stock threshold is too large.',
    )
  }

  if (
    input.receiptFooter.length >
    500
  ) {
    throw new Error(
      'Receipt footer cannot exceed 500 characters.',
    )
  }
}

function createPayload(
  businessId: string,
  branchId: string | null,
  input: BusinessSettingsInput,
) {
  validateSettings(
    branchId,
    input,
  )

  return {
    business_id:
      businessId,
    branch_id:
      branchId,
    business_name:
      input.businessName
        .trim(),
    business_phone:
      optionalText(
        normalizePhone(
          input.businessPhone,
        ),
      ),
    business_email:
      optionalText(
        input.businessEmail
          .trim()
          .toLowerCase(),
      ),
    business_address:
      optionalText(
        input.businessAddress,
      ),
    branch_name:
      optionalText(
        input.branchName,
      ),
    branch_phone:
      optionalText(
        normalizePhone(
          input.branchPhone,
        ),
      ),
    terminal_name:
      input.terminalName
        .trim(),
    default_sale_type:
      input.defaultSaleType,
    default_payment_method:
      input.defaultPaymentMethod,
    receipt_footer:
      optionalText(
        input.receiptFooter,
      ),
    show_business_phone:
      input.showBusinessPhone,
    show_business_address:
      input.showBusinessAddress,
    low_stock_warning_enabled:
      input.lowStockWarningEnabled,
    low_stock_threshold:
      input.lowStockThreshold,
    updated_at:
      new Date()
        .toISOString(),
  }
}

async function findBusinessSettingsRow(
  businessId: string,
  branchId: string | null,
): Promise<BusinessSettingsRow | null> {
  let query =
    supabase
      .from(
        'business_settings',
      )
      .select(
        SETTINGS_SELECT,
      )
      .eq(
        'business_id',
        businessId,
      )

  if (branchId) {
    query =
      query.eq(
        'branch_id',
        branchId,
      )
  } else {
    query =
      query.is(
        'branch_id',
        null,
      )
  }

  const {
    data,
    error,
  } =
    await query
      .order(
        'updated_at',
        {
          ascending:
            false,
        },
      )
      .limit(1)
      .maybeSingle()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    return null
  }

  return data as BusinessSettingsRow
}

export async function getBusinessSettings(
  businessId: string,
  branchId: string | null = null,
): Promise<BusinessSettings | null> {
  if (!businessId) {
    throw new Error(
      'Business is required.',
    )
  }

  const row =
    await findBusinessSettingsRow(
      businessId,
      branchId,
    )

  if (!row) {
    return null
  }

  return mapSettings(
    row,
  )
}

export async function saveBusinessSettings(
  businessId: string,
  branchId: string | null,
  input: BusinessSettingsInput,
): Promise<BusinessSettings> {
  if (!businessId) {
    throw new Error(
      'Business is required.',
    )
  }

  const payload =
    createPayload(
      businessId,
      branchId,
      input,
    )

  const existing =
    await findBusinessSettingsRow(
      businessId,
      branchId,
    )

  if (existing) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'business_settings',
        )
        .update(
          payload,
        )
        .eq(
          'id',
          existing.id,
        )
        .eq(
          'business_id',
          businessId,
        )
        .select(
          SETTINGS_SELECT,
        )
        .single()

    if (error) {
      throw new Error(
        error.message,
      )
    }

    return mapSettings(
      data as BusinessSettingsRow,
    )
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'business_settings',
      )
      .insert(
        payload,
      )
      .select(
        SETTINGS_SELECT,
      )
      .single()

  if (error) {
    if (
      error.code ===
      '23505'
    ) {
      const latest =
        await findBusinessSettingsRow(
          businessId,
          branchId,
        )

      if (latest) {
        return mapSettings(
          latest,
        )
      }
    }

    throw new Error(
      error.message,
    )
  }

  return mapSettings(
    data as BusinessSettingsRow,
  )
}