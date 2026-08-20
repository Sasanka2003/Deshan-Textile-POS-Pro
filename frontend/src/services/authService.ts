import { supabase } from './supabase'
import type { StaffProfile, StaffRole } from '../types/auth'

interface StaffRow {
  id: string
  auth_user_id: string
  business_id: string
  branch_id: string | null
  full_name: string
  username: string
  phone: string | null
  is_active: boolean
  roles:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

function getRoleName(row: StaffRow): StaffRole {
  const role = Array.isArray(row.roles)
    ? row.roles[0]?.name
    : row.roles?.name

  if (role !== 'manager' && role !== 'cashier') {
    throw new Error('Invalid staff role.')
  }

  return role
}

export async function signIn(
  email: string,
  password: string,
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentStaff(): Promise<StaffProfile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('Authentication required.')
  }

  const { data, error } = await supabase
    .from('staff')
    .select(`
      id,
      auth_user_id,
      business_id,
      branch_id,
      full_name,
      username,
      phone,
      is_active,
      roles (
        name
      )
    `)
    .eq('auth_user_id', user.id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const row = data as unknown as StaffRow

  if (!row.is_active) {
    await supabase.auth.signOut()
    throw new Error('This staff account is disabled.')
  }

  return {
    id: row.id,
    authUserId: row.auth_user_id,
    businessId: row.business_id,
    branchId: row.branch_id,
    fullName: row.full_name,
    username: row.username,
    phone: row.phone,
    role: getRoleName(row),
    isActive: row.is_active,
  }
}