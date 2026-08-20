import {
  supabase,
} from './supabase'

export type CashDrawerMovementType =
  | 'cash_in'
  | 'cash_out'

export interface CashDrawerMovement {
  id: string

  businessId: string
  branchId: string

  shiftId: string
  staffId: string

  movementType:
    CashDrawerMovementType

  amount: number

  reason: string

  referenceNo:
    | string
    | null

  createdAt: string
}

export interface CreateCashDrawerMovementInput {
  businessId: string
  branchId: string

  shiftId: string
  staffId: string

  movementType:
    CashDrawerMovementType

  amount: number

  reason: string

  referenceNo?:
    | string
    | null
}

interface CashDrawerMovementRow {
  id: string

  business_id: string
  branch_id: string

  shift_id: string
  staff_id: string

  movement_type:
    CashDrawerMovementType

  amount:
    | number
    | string

  reason: string

  reference_no:
    | string
    | null

  created_at: string
}

function optionalText(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null
  }

  const clean =
    value.trim()

  return clean || null
}

function mapMovement(
  row: CashDrawerMovementRow,
): CashDrawerMovement {
  return {
    id:
      row.id,

    businessId:
      row.business_id,

    branchId:
      row.branch_id,

    shiftId:
      row.shift_id,

    staffId:
      row.staff_id,

    movementType:
      row.movement_type,

    amount:
      Number(
        row.amount,
      ),

    reason:
      row.reason,

    referenceNo:
      row.reference_no,

    createdAt:
      row.created_at,
  }
}

const movementSelect = `
  id,
  business_id,
  branch_id,
  shift_id,
  staff_id,
  movement_type,
  amount,
  reason,
  reference_no,
  created_at
`

export async function createCashDrawerMovement(
  input:
    CreateCashDrawerMovementInput,
): Promise<CashDrawerMovement> {
  if (
    !input.businessId ||
    !input.branchId ||
    !input.shiftId ||
    !input.staffId
  ) {
    throw new Error(
      'Business, branch, shift and staff are required.',
    )
  }

  if (
    input.movementType !==
      'cash_in' &&
    input.movementType !==
      'cash_out'
  ) {
    throw new Error(
      'Invalid cash movement type.',
    )
  }

  if (
    !Number.isFinite(
      input.amount,
    ) ||
    input.amount <=
      0
  ) {
    throw new Error(
      'Cash movement amount must be greater than zero.',
    )
  }

  const reason =
    input.reason.trim()

  if (!reason) {
    throw new Error(
      'Cash movement reason is required.',
    )
  }

  const {
    data:
      shift,

    error:
      shiftError,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .select(`
        id,
        status
      `)
      .eq(
        'id',
        input.shiftId,
      )
      .eq(
        'business_id',
        input.businessId,
      )
      .eq(
        'branch_id',
        input.branchId,
      )
      .single()

  if (
    shiftError ||
    !shift
  ) {
    throw new Error(
      shiftError?.message ??
        'Shift was not found.',
    )
  }

  if (
    shift.status !==
    'open'
  ) {
    throw new Error(
      'Cash movements can only be recorded for an open shift.',
    )
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'cash_drawer_movements',
      )
      .insert({
        business_id:
          input.businessId,

        branch_id:
          input.branchId,

        shift_id:
          input.shiftId,

        staff_id:
          input.staffId,

        movement_type:
          input.movementType,

        amount:
          input.amount,

        reason,

        reference_no:
          optionalText(
            input.referenceNo,
          ),
      })
      .select(
        movementSelect,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return mapMovement(
    data as CashDrawerMovementRow,
  )
}

export async function getShiftCashDrawerMovements(
  shiftId: string,
): Promise<CashDrawerMovement[]> {
  if (!shiftId) {
    return []
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'cash_drawer_movements',
      )
      .select(
        movementSelect,
      )
      .eq(
        'shift_id',
        shiftId,
      )
      .order(
        'created_at',
        {
          ascending:
            false,
        },
      )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    data ??
    []
  ).map(
    (row) =>
      mapMovement(
        row as CashDrawerMovementRow,
      ),
  )
}

export async function getShiftCashMovementTotals(
  shiftId: string,
): Promise<{
  cashIn: number
  cashOut: number
  netMovement: number
}> {
  const movements =
    await getShiftCashDrawerMovements(
      shiftId,
    )

  let cashIn =
    0

  let cashOut =
    0

  for (
    const movement of
      movements
  ) {
    if (
      movement.movementType ===
      'cash_in'
    ) {
      cashIn +=
        movement.amount
    } else {
      cashOut +=
        movement.amount
    }
  }

  return {
    cashIn,

    cashOut,

    netMovement:
      cashIn -
      cashOut,
  }
}