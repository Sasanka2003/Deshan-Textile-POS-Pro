import {
  supabase,
} from './supabase'

import type {
  Staff,
  StaffInput,
  StaffRole,
} from '../types/staff'

interface StaffRow {
  id: string

  auth_user_id: string | null

  business_id: string
  branch_id: string | null

  role_id: string

  full_name: string
  username: string

  phone: string | null

  is_active: boolean

  created_at: string
  updated_at: string

  roles:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null
}

interface RoleRow {
  id: string
  name: string
}

export interface CreateStaffWithLoginInput {
  fullName: string

  username: string
  email: string

  phone: string

  password: string

  role: StaffRole
}

interface CreateStaffFunctionResponse {
  success?: boolean
  message?: string

  error?: string

  staff?: StaffRow
}

function optionalText(
  value: string,
) {
  const clean =
    value.trim()

  return clean || null
}

function getRoleName(
  row: StaffRow,
): StaffRole {
  const role =
    Array.isArray(
      row.roles,
    )
      ? row.roles[0]?.name
      : row.roles?.name

  if (
    role !== 'manager' &&
    role !== 'cashier'
  ) {
    throw new Error(
      'Invalid staff role.',
    )
  }

  return role
}

function mapStaff(
  row: StaffRow,
): Staff {
  return {
    id:
      row.id,

    authUserId:
      row.auth_user_id,

    businessId:
      row.business_id,

    branchId:
      row.branch_id,

    roleId:
      row.role_id,

    role:
      getRoleName(
        row,
      ),

    fullName:
      row.full_name,

    username:
      row.username,

    phone:
      row.phone,

    isActive:
      row.is_active,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

function validateInput(
  input: StaffInput,
) {
  const fullName =
    input.fullName.trim()

  const username =
    input.username
      .trim()
      .toLowerCase()

  if (!fullName) {
    throw new Error(
      'Staff name is required.',
    )
  }

  if (!username) {
    throw new Error(
      'Username is required.',
    )
  }

  if (
    username.length <
    3
  ) {
    throw new Error(
      'Username must contain at least 3 characters.',
    )
  }

  if (
    !/^[a-z0-9._-]+$/.test(
      username,
    )
  ) {
    throw new Error(
      'Username can contain only letters, numbers, dots, underscores and hyphens.',
    )
  }

  if (
    input.role !==
      'manager' &&
    input.role !==
      'cashier'
  ) {
    throw new Error(
      'Invalid staff role.',
    )
  }
}

function validateCreateLoginInput(
  input: CreateStaffWithLoginInput,
) {
  const fullName =
    input.fullName.trim()

  const username =
    input.username
      .trim()
      .toLowerCase()

  const email =
    input.email
      .trim()
      .toLowerCase()

  if (!fullName) {
    throw new Error(
      'Staff name is required.',
    )
  }

  if (
    username.length <
    3
  ) {
    throw new Error(
      'Username must contain at least 3 characters.',
    )
  }

  if (
    !/^[a-z0-9._-]+$/.test(
      username,
    )
  ) {
    throw new Error(
      'Username can contain only letters, numbers, dots, underscores and hyphens.',
    )
  }

  if (
    !email ||
    !email.includes('@')
  ) {
    throw new Error(
      'A valid email address is required.',
    )
  }

  if (
    input.password.length <
    8
  ) {
    throw new Error(
      'Password must contain at least 8 characters.',
    )
  }

  if (
    input.role !==
      'manager' &&
    input.role !==
      'cashier'
  ) {
    throw new Error(
      'Invalid staff role.',
    )
  }
}

async function getRoleId(
  role: StaffRole,
) {
  const {
    data,
    error,
  } =
    await supabase
      .from('roles')
      .select(
        'id, name',
      )
      .eq(
        'name',
        role,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  const row =
    data as RoleRow

  if (!row?.id) {
    throw new Error(
      `Role "${role}" was not found.`,
    )
  }

  return row.id
}

export async function getStaff(
  businessId: string,
  branchId?: string,
): Promise<Staff[]> {
  let query =
    supabase
      .from('staff')
      .select(`
        id,
        auth_user_id,
        business_id,
        branch_id,
        role_id,
        full_name,
        username,
        phone,
        is_active,
        created_at,
        updated_at,

        roles (
          name
        )
      `)
      .eq(
        'business_id',
        businessId,
      )
      .order(
        'full_name',
        {
          ascending:
            true,
        },
      )

  if (branchId) {
    query =
      query.eq(
        'branch_id',
        branchId,
      )
  }

  const {
    data,
    error,
  } =
    await query

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    (data ?? []) as unknown as
      StaffRow[]
  ).map(
    mapStaff,
  )
}

export async function createStaff(
  businessId: string,
  branchId: string,
  input: StaffInput,
): Promise<Staff> {
  validateInput(
    input,
  )

  const roleId =
    await getRoleId(
      input.role,
    )

  const {
    data,
    error,
  } =
    await supabase
      .from('staff')
      .insert({
        auth_user_id:
          null,

        business_id:
          businessId,

        branch_id:
          branchId,

        role_id:
          roleId,

        full_name:
          input.fullName
            .trim(),

        username:
          input.username
            .trim()
            .toLowerCase(),

        phone:
          optionalText(
            input.phone,
          ),

        is_active:
          input.isActive,
      })
      .select(`
        id,
        auth_user_id,
        business_id,
        branch_id,
        role_id,
        full_name,
        username,
        phone,
        is_active,
        created_at,
        updated_at,

        roles (
          name
        )
      `)
      .single()

  if (error) {
    if (
      error.code ===
      '23505'
    ) {
      throw new Error(
        'This username is already in use.',
      )
    }

    throw new Error(
      error.message,
    )
  }

  return mapStaff(
    data as unknown as StaffRow,
  )
}

export async function createStaffWithLogin(
  input: CreateStaffWithLoginInput,
): Promise<Staff> {
  validateCreateLoginInput(
    input,
  )

  const {
    data,
    error,
  } =
    await supabase
      .functions
      .invoke(
        'create-staff-user',
        {
          body: {
            fullName:
              input.fullName
                .trim(),

            username:
              input.username
                .trim()
                .toLowerCase(),

            email:
              input.email
                .trim()
                .toLowerCase(),

            phone:
              optionalText(
                input.phone,
              ),

            password:
              input.password,

            role:
              input.role,
          },
        },
      )

  if (error) {
    throw new Error(
      error.message ||
        'Unable to create staff login account.',
    )
  }

  const result =
    data as
      | CreateStaffFunctionResponse
      | null

  if (!result) {
    throw new Error(
      'Staff creation result was not returned.',
    )
  }

  if (
    result.error
  ) {
    throw new Error(
      result.error,
    )
  }

  if (
    !result.staff
  ) {
    throw new Error(
      result.message ||
        'Staff account was created but no staff profile was returned.',
    )
  }

  return mapStaff(
    result.staff,
  )
}

export async function updateStaff(
  staffId: string,
  businessId: string,
  branchId: string,
  input: StaffInput,
): Promise<Staff> {
  validateInput(
    input,
  )

  const roleId =
    await getRoleId(
      input.role,
    )

  const {
    data,
    error,
  } =
    await supabase
      .from('staff')
      .update({
        branch_id:
          branchId,

        role_id:
          roleId,

        full_name:
          input.fullName
            .trim(),

        username:
          input.username
            .trim()
            .toLowerCase(),

        phone:
          optionalText(
            input.phone,
          ),

        is_active:
          input.isActive,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        staffId,
      )
      .eq(
        'business_id',
        businessId,
      )
      .select(`
        id,
        auth_user_id,
        business_id,
        branch_id,
        role_id,
        full_name,
        username,
        phone,
        is_active,
        created_at,
        updated_at,

        roles (
          name
        )
      `)
      .single()

  if (error) {
    if (
      error.code ===
      '23505'
    ) {
      throw new Error(
        'This username is already in use.',
      )
    }

    throw new Error(
      error.message,
    )
  }

  return mapStaff(
    data as unknown as StaffRow,
  )
}

export async function setStaffActiveStatus(
  staffId: string,
  businessId: string,
  isActive: boolean,
): Promise<Staff> {
  const {
    data: existingRows,
    error: existingError,
  } =
    await supabase
      .from('staff')
      .select(`
        id,
        auth_user_id,
        business_id,
        branch_id,
        role_id,
        full_name,
        username,
        phone,
        is_active,
        created_at,
        updated_at,

        roles (
          name
        )
      `)
      .eq(
        'id',
        staffId,
      )
      .eq(
        'business_id',
        businessId,
      )

  if (existingError) {
    throw new Error(
      existingError.message ||
        'Unable to find staff record.',
    )
  }

  if (
    !existingRows ||
    existingRows.length ===
      0
  ) {
    throw new Error(
      'Staff record was not found or access is not allowed.',
    )
  }

  const {
    error: updateError,
  } =
    await supabase
      .from('staff')
      .update({
        is_active:
          isActive,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        'id',
        staffId,
      )
      .eq(
        'business_id',
        businessId,
      )

  if (updateError) {
    throw new Error(
      updateError.message ||
        'Unable to update staff status.',
    )
  }

  const {
    data: verifiedRows,
    error: verifyError,
  } =
    await supabase
      .from('staff')
      .select(`
        id,
        auth_user_id,
        business_id,
        branch_id,
        role_id,
        full_name,
        username,
        phone,
        is_active,
        created_at,
        updated_at,

        roles (
          name
        )
      `)
      .eq(
        'id',
        staffId,
      )
      .eq(
        'business_id',
        businessId,
      )

  if (verifyError) {
    throw new Error(
      verifyError.message ||
        'Unable to verify staff status.',
    )
  }

  if (
    !verifiedRows ||
    verifiedRows.length ===
      0
  ) {
    throw new Error(
      'Staff status update could not be verified.',
    )
  }

  const updatedStaff =
    mapStaff(
      verifiedRows[0] as unknown as StaffRow,
    )

  if (
    updatedStaff.isActive !==
    isActive
  ) {
    throw new Error(
      'Database did not apply the staff status change. Check the staff UPDATE RLS policy.',
    )
  }

  return updatedStaff
}

export interface OpenShiftItem {
  id: string

  businessId: string
  branchId: string
  staffId: string

  cashierName: string

  terminalName:
    | string
    | null

  openingCash: number

  cashSales: number

  expectedCash: number

  openedAt: string

  openingNote:
    | string
    | null
}

export async function getOpenShifts(
  businessId: string,
  branchId: string,
): Promise<OpenShiftItem[]> {
  if (
    !businessId ||
    !branchId
  ) {
    return []
  }

  const {
    data: shiftData,
    error: shiftError,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .select(`
        id,
        business_id,
        branch_id,
        staff_id,
        terminal_name,
        opening_cash,
        opening_note,
        opened_at,

        staff:staff (
          id,
          full_name
        )
      `)
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .eq(
        'status',
        'open',
      )
      .order(
        'opened_at',
        {
          ascending:
            false,
        },
      )

  if (shiftError) {
    throw new Error(
      shiftError.message,
    )
  }

  const rows =
    (
      shiftData ??
      []
    ) as unknown as {
      id: string

      business_id: string
      branch_id: string
      staff_id: string

      terminal_name:
        | string
        | null

      opening_cash:
        | number
        | string

      opening_note:
        | string
        | null

      opened_at: string

      staff:
        | {
            id: string
            full_name: string
          }
        | {
            id: string
            full_name: string
          }[]
        | null
    }[]

  if (
    rows.length ===
    0
  ) {
    return []
  }

  const shiftIds =
    rows.map(
      (row) =>
        row.id,
    )

  const {
    data: paymentData,
    error: paymentError,
  } =
    await supabase
      .from(
        'payments',
      )
      .select(`
        amount,

        sales!inner (
          shift_id
        )
      `)
      .eq(
        'payment_method',
        'cash',
      )
      .in(
        'sales.shift_id',
        shiftIds,
      )

  if (paymentError) {
    throw new Error(
      paymentError.message,
    )
  }

  const cashByShift =
    new Map<
      string,
      number
    >()

  for (
    const payment of
      (
        paymentData ??
        []
      ) as unknown as {
        amount:
          | number
          | string

        sales:
          | {
              shift_id:
                | string
                | null
            }
          | {
              shift_id:
                | string
                | null
            }[]
          | null
      }[]
  ) {
    const sale =
      Array.isArray(
        payment.sales,
      )
        ? payment.sales[0] ??
          null
        : payment.sales

    const shiftId =
      sale?.shift_id

    if (!shiftId) {
      continue
    }

    const amount =
      Number(
        payment.amount,
      )

    cashByShift.set(
      shiftId,
      (
        cashByShift.get(
          shiftId,
        ) ?? 0
      ) + amount,
    )
  }

  return rows.map(
    (row) => {
      const staff =
        Array.isArray(
          row.staff,
        )
          ? row.staff[0] ??
            null
          : row.staff

      const openingCash =
        Number(
          row.opening_cash,
        )

      const cashSales =
        cashByShift.get(
          row.id,
        ) ?? 0

      return {
        id:
          row.id,

        businessId:
          row.business_id,

        branchId:
          row.branch_id,

        staffId:
          row.staff_id,

        cashierName:
          staff?.full_name ??
          'Unknown Staff',

        terminalName:
          row.terminal_name,

        openingCash,

        cashSales,

        expectedCash:
          openingCash +
          cashSales,

        openedAt:
          row.opened_at,

        openingNote:
          row.opening_note,
      }
    },
  )
}