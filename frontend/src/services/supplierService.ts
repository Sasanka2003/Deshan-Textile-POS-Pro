import { supabase } from './supabase'

import type {
  Supplier,
  SupplierInput,
} from '../types/supplier'

interface SupplierRow {
  id: string
  business_id: string

  name: string
  contact_person: string | null

  phone: string | null
  alternate_phone: string | null
  email: string | null

  address: string | null
  city: string | null

  tax_number: string | null

  opening_balance: number | string
  credit_limit: number | string

  notes: string | null

  is_active: boolean

  created_at: string
  updated_at: string
}

function mapSupplier(
  row: SupplierRow,
): Supplier {
  return {
    id: row.id,
    businessId: row.business_id,

    name: row.name,
    contactPerson: row.contact_person,

    phone: row.phone,
    alternatePhone: row.alternate_phone,
    email: row.email,

    address: row.address,
    city: row.city,

    taxNumber: row.tax_number,

    openingBalance: Number(
      row.opening_balance,
    ),

    creditLimit: Number(
      row.credit_limit,
    ),

    notes: row.notes,

    isActive: row.is_active,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function optionalText(value: string) {
  const clean = value.trim()

  return clean || null
}

function createPayload(
  businessId: string,
  input: SupplierInput,
) {
  const name = input.name.trim()

  if (!name) {
    throw new Error(
      'Supplier name is required.',
    )
  }

  if (
    !Number.isFinite(input.openingBalance) ||
    !Number.isFinite(input.creditLimit)
  ) {
    throw new Error(
      'Invalid supplier balance.',
    )
  }

  if (input.creditLimit < 0) {
    throw new Error(
      'Credit limit cannot be negative.',
    )
  }

  return {
    business_id: businessId,

    name,

    contact_person:
      optionalText(input.contactPerson),

    phone:
      optionalText(input.phone),

    alternate_phone:
      optionalText(input.alternatePhone),

    email:
      optionalText(input.email),

    address:
      optionalText(input.address),

    city:
      optionalText(input.city),

    tax_number:
      optionalText(input.taxNumber),

    opening_balance:
      input.openingBalance,

    credit_limit:
      input.creditLimit,

    notes:
      optionalText(input.notes),
  }
}

export async function getSuppliers(
  businessId: string,
): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('business_id', businessId)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (
    data as SupplierRow[]
  ).map(mapSupplier)
}

export async function createSupplier(
  businessId: string,
  input: SupplierInput,
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(
      createPayload(
        businessId,
        input,
      ),
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapSupplier(
    data as SupplierRow,
  )
}

export async function updateSupplier(
  supplierId: string,
  businessId: string,
  input: SupplierInput,
): Promise<Supplier> {
  const payload =
    createPayload(
      businessId,
      input,
    )

  const { data, error } = await supabase
    .from('suppliers')
    .update({
      ...payload,
      updated_at:
        new Date().toISOString(),
    })
    .eq('id', supplierId)
    .eq('business_id', businessId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapSupplier(
    data as SupplierRow,
  )
}

export async function setSupplierActiveStatus(
  supplierId: string,
  businessId: string,
  isActive: boolean,
) {
  const { error } = await supabase
    .from('suppliers')
    .update({
      is_active: isActive,
      updated_at:
        new Date().toISOString(),
    })
    .eq('id', supplierId)
    .eq('business_id', businessId)

  if (error) {
    throw new Error(error.message)
  }
}