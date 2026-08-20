export type StaffRole =
  | 'manager'
  | 'cashier'

export interface Staff {
  id: string

  authUserId: string | null

  businessId: string
  branchId: string | null

  roleId: string
  role: StaffRole

  fullName: string
  username: string

  phone: string | null

  isActive: boolean

  createdAt: string
  updatedAt: string
}

export interface StaffInput {
  fullName: string

  username: string

  phone: string

  role: StaffRole

  isActive: boolean
}