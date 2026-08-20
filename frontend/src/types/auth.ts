export type StaffRole = 'manager' | 'cashier'

export interface StaffProfile {
  id: string
  authUserId: string
  businessId: string
  branchId: string | null

  fullName: string
  username: string
  phone: string | null

  role: StaffRole
  isActive: boolean
}