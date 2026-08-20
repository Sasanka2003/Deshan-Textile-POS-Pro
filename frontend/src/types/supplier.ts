export interface Supplier {
  id: string
  businessId: string

  name: string
  contactPerson: string | null

  phone: string | null
  alternatePhone: string | null
  email: string | null

  address: string | null
  city: string | null

  taxNumber: string | null

  openingBalance: number
  creditLimit: number

  notes: string | null

  isActive: boolean

  createdAt: string
  updatedAt: string
}

export interface SupplierInput {
  name: string
  contactPerson: string

  phone: string
  alternatePhone: string
  email: string

  address: string
  city: string

  taxNumber: string

  openingBalance: number
  creditLimit: number

  notes: string
}