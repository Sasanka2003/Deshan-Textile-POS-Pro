import { supabase } from './supabase'

import type {
  Customer,
  CustomerInput,
} from '../types/customer'

interface CustomerRow {
  id: string
  business_id: string

  name: string
  contact_person: string | null

  phone: string | null
  alternate_phone: string | null

  email: string | null
  nic: string | null
  tin: string | null

  address: string | null
  city: string | null

  opening_balance: number | string
  credit_limit: number | string

  notes: string | null

  is_active: boolean

  created_at: string
  updated_at: string
}

function optionalText(value: string) {
  const clean = value.trim()

  return clean || null
}

function mapCustomer(
  row: CustomerRow,
): Customer {
  return {
    id: row.id,
    businessId: row.business_id,

    name: row.name,
    contactPerson:
      row.contact_person,

    phone: row.phone,
    alternatePhone:
      row.alternate_phone,

    email: row.email,
    nic: row.nic,
    tin: row.tin,

    address: row.address,
    city: row.city,

    openingBalance:
      Number(row.opening_balance),

    creditLimit:
      Number(row.credit_limit),

    notes: row.notes,

    isActive: row.is_active,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function customerPayload(
  businessId: string,
  input: CustomerInput,
) {
  const name = input.name.trim()

  if (!name) {
    throw new Error(
      'Customer name is required.',
    )
  }

  if (
    !Number.isFinite(
      input.openingBalance,
    )
  ) {
    throw new Error(
      'Invalid opening balance.',
    )
  }

  if (
    !Number.isFinite(
      input.creditLimit,
    ) ||
    input.creditLimit < 0
  ) {
    throw new Error(
      'Credit limit cannot be negative.',
    )
  }

  return {
    business_id: businessId,

    name,

    contact_person:
      optionalText(
        input.contactPerson,
      ),

    phone:
      optionalText(
        input.phone,
      ),

    alternate_phone:
      optionalText(
        input.alternatePhone,
      ),

    email:
      optionalText(
        input.email,
      ),

    nic:
      optionalText(
        input.nic,
      ),

    tin:
      optionalText(
        input.tin,
      ),

    address:
      optionalText(
        input.address,
      ),

    city:
      optionalText(
        input.city,
      ),

    opening_balance:
      input.openingBalance,

    credit_limit:
      input.creditLimit,

    notes:
      optionalText(
        input.notes,
      ),
  }
}

export async function getCustomers(
  businessId: string,
): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      id,
      business_id,
      name,
      contact_person,
      phone,
      alternate_phone,
      email,
      nic,
      tin,
      address,
      city,
      opening_balance,
      credit_limit,
      notes,
      is_active,
      created_at,
      updated_at
    `)
    .eq('business_id', businessId)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (
    (data ?? []) as CustomerRow[]
  ).map(mapCustomer)
}

export async function createCustomer(
  businessId: string,
  input: CustomerInput,
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert(
      customerPayload(
        businessId,
        input,
      ),
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapCustomer(
    data as CustomerRow,
  )
}

export async function updateCustomer(
  customerId: string,
  businessId: string,
  input: CustomerInput,
): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      ...customerPayload(
        businessId,
        input,
      ),

      updated_at:
        new Date().toISOString(),
    })
    .eq('id', customerId)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapCustomer(
    data as CustomerRow,
  )
}

export async function setCustomerActiveStatus(
  customerId: string,
  businessId: string,
  isActive: boolean,
) {
  const { error } = await supabase
    .from('customers')
    .update({
      is_active: isActive,

      updated_at:
        new Date().toISOString(),
    })
    .eq('id', customerId)
    .eq('business_id', businessId)

  if (error) {
    throw new Error(error.message)
  }
}