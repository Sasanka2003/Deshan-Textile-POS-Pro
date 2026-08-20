export type SettingsSaleType =
  | 'retail'
  | 'wholesale'

export type SettingsPaymentMethod =
  | 'cash'
  | 'card'
  | 'qr'
  | 'bank_transfer'

export interface BusinessSettings {
  id: string
  businessId: string
  branchId: string | null
  businessName: string
  businessPhone: string | null
  businessEmail: string | null
  businessAddress: string | null
  branchName: string | null
  branchPhone: string | null
  terminalName: string
  defaultSaleType: SettingsSaleType
  defaultPaymentMethod: SettingsPaymentMethod
  receiptFooter: string | null
  showBusinessPhone: boolean
  showBusinessAddress: boolean
  lowStockWarningEnabled: boolean
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

export interface BusinessSettingsInput {
  businessName: string
  businessPhone: string
  businessEmail: string
  businessAddress: string
  branchName: string
  branchPhone: string
  terminalName: string
  defaultSaleType: SettingsSaleType
  defaultPaymentMethod: SettingsPaymentMethod
  receiptFooter: string
  showBusinessPhone: boolean
  showBusinessAddress: boolean
  lowStockWarningEnabled: boolean
  lowStockThreshold: number
}