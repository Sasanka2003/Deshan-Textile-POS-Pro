export interface Customer {
  id: string
  businessId: string

  name: string
  contactPerson: string | null

  phone: string | null
  alternatePhone: string | null

  email: string | null
  nic: string | null
  tin: string | null

  address: string | null
  city: string | null

  openingBalance: number
  creditLimit: number

  notes: string | null

  isActive: boolean

  createdAt: string
  updatedAt: string
}

export interface CustomerInput {
  name: string
  contactPerson: string

  phone: string
  alternatePhone: string

  email: string
  nic: string
  tin: string

  address: string
  city: string

  openingBalance: number
  creditLimit: number

  notes: string
}