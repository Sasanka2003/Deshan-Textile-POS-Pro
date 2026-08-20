import {
  supabase,
} from './supabase'

import {
  getShiftCashDrawerMovements,
  getShiftCashMovementTotals,
  type CashDrawerMovement,
} from './cashDrawerService'

import type {
  CashierShift,
  CloseShiftInput,
  OpenShiftInput,
  ShiftCashSummary,
  ShiftStatus,
} from '../types/shift'

interface ShiftRow {
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

  closing_cash:
    | number
    | string
    | null

  expected_cash:
    | number
    | string
    | null

  cash_difference:
    | number
    | string
    | null

  status:
    ShiftStatus

  opening_note:
    | string
    | null

  closing_note:
    | string
    | null

  opened_at: string

  closed_at:
    | string
    | null

  created_at: string
  updated_at: string
}

interface CustomerCashPaymentRow {
  shift_id:
    | string
    | null

  amount:
    | number
    | string
}

function optionalText(
  value:
    | string
    | null,
) {
  if (!value) {
    return null
  }

  const clean =
    value.trim()

  return clean || null
}

function mapShift(
  row: ShiftRow,
): CashierShift {
  return {
    id:
      row.id,

    businessId:
      row.business_id,

    branchId:
      row.branch_id,

    staffId:
      row.staff_id,

    terminalName:
      row.terminal_name,

    openingCash:
      Number(
        row.opening_cash,
      ),

    closingCash:
      row.closing_cash ===
      null
        ? null
        : Number(
            row.closing_cash,
          ),

    expectedCash:
      row.expected_cash ===
      null
        ? null
        : Number(
            row.expected_cash,
          ),

    cashDifference:
      row.cash_difference ===
      null
        ? null
        : Number(
            row.cash_difference,
          ),

    status:
      row.status,

    openingNote:
      row.opening_note,

    closingNote:
      row.closing_note,

    openedAt:
      row.opened_at,

    closedAt:
      row.closed_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

const shiftSelect = `
  id,
  business_id,
  branch_id,
  staff_id,
  terminal_name,
  opening_cash,
  closing_cash,
  expected_cash,
  cash_difference,
  status,
  opening_note,
  closing_note,
  opened_at,
  closed_at,
  created_at,
  updated_at
`

/* =========================================================
   CUSTOMER CASH PAYMENTS
========================================================= */

async function getShiftCustomerCashPayments(
  shiftId: string,
): Promise<number> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'customer_payments',
      )
      .select(`
        amount
      `)
      .eq(
        'shift_id',
        shiftId,
      )
      .eq(
        'payment_method',
        'cash',
      )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    data ?? []
  ).reduce(
    (
      total,
      payment,
    ) =>
      total +
      Number(
        payment.amount,
      ),
    0,
  )
}

async function getCustomerCashPaymentsByShift(
  shiftIds: string[],
): Promise<Map<string, number>> {
  const result =
    new Map<
      string,
      number
    >()

  if (
    shiftIds.length ===
    0
  ) {
    return result
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'customer_payments',
      )
      .select(`
        shift_id,
        amount
      `)
      .eq(
        'payment_method',
        'cash',
      )
      .in(
        'shift_id',
        shiftIds,
      )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  for (
    const row of
      (
        data ?? []
      ) as CustomerCashPaymentRow[]
  ) {
    if (!row.shift_id) {
      continue
    }

    result.set(
      row.shift_id,
      (
        result.get(
          row.shift_id,
        ) ?? 0
      ) +
        Number(
          row.amount,
        ),
    )
  }

  return result
}

/* =========================================================
   CURRENT SHIFT
========================================================= */

export async function getCurrentShift(
  businessId: string,
  branchId: string,
  staffId: string,
): Promise<CashierShift | null> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .select(
        shiftSelect,
      )
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .eq(
        'staff_id',
        staffId,
      )
      .eq(
        'status',
        'open',
      )
      .maybeSingle()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    return null
  }

  return mapShift(
    data as ShiftRow,
  )
}

/* =========================================================
   OPEN SHIFT
========================================================= */

export async function openShift(
  input: OpenShiftInput,
): Promise<CashierShift> {
  if (
    !input.businessId ||
    !input.branchId ||
    !input.staffId
  ) {
    throw new Error(
      'Business, branch and staff are required.',
    )
  }

  if (
    !Number.isFinite(
      input.openingCash,
    ) ||
    input.openingCash <
      0
  ) {
    throw new Error(
      'Opening cash cannot be negative.',
    )
  }

  const existing =
    await getCurrentShift(
      input.businessId,
      input.branchId,
      input.staffId,
    )

  if (existing) {
    throw new Error(
      'You already have an open shift.',
    )
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .insert({
        business_id:
          input.businessId,

        branch_id:
          input.branchId,

        staff_id:
          input.staffId,

        terminal_name:
          optionalText(
            input.terminalName,
          ),

        opening_cash:
          input.openingCash,

        opening_note:
          optionalText(
            input.openingNote,
          ),

        close_type:
          'normal',

        status:
          'open',
      })
      .select(
        shiftSelect,
      )
      .single()

  if (error) {
    if (
      error.code ===
      '23505'
    ) {
      throw new Error(
        'You already have an open shift or this terminal already has an open shift.',
      )
    }

    throw new Error(
      error.message,
    )
  }

  return mapShift(
    data as ShiftRow,
  )
}

/* =========================================================
   CASH SUMMARY
========================================================= */

export async function getShiftCashSummary(
  shift: CashierShift,
): Promise<ShiftCashSummary> {
  const [
    salePaymentResult,
    customerCashPayments,
    movementTotals,
  ] =
    await Promise.all([
      supabase
        .from(
          'payments',
        )
        .select(`
          amount,
          payment_method,

          sales!inner (
            shift_id
          )
        `)
        .eq(
          'sales.shift_id',
          shift.id,
        )
        .eq(
          'payment_method',
          'cash',
        ),

      getShiftCustomerCashPayments(
        shift.id,
      ),

      getShiftCashMovementTotals(
        shift.id,
      ),
    ])

  if (
    salePaymentResult.error
  ) {
    throw new Error(
      salePaymentResult.error.message,
    )
  }

  const cashSales =
    (
      salePaymentResult.data ??
      []
    ).reduce(
      (
        total,
        payment,
      ) =>
        total +
        Number(
          payment.amount,
        ),
      0,
    )

  const expectedCash =
    shift.openingCash +
    cashSales +
    customerCashPayments +
    movementTotals.cashIn -
    movementTotals.cashOut

  const difference =
    shift.closingCash ===
    null
      ? null
      : shift.closingCash -
        expectedCash

  return {
    openingCash:
      shift.openingCash,

    cashSales,

    expectedCash,

    closingCash:
      shift.closingCash,

    difference,
  }
}

/* =========================================================
   NORMAL CLOSE SHIFT
========================================================= */

export async function closeShift(
  input: CloseShiftInput,
): Promise<CashierShift> {
  if (
    !Number.isFinite(
      input.closingCash,
    ) ||
    input.closingCash <
      0
  ) {
    throw new Error(
      'Closing cash cannot be negative.',
    )
  }

  const {
    data:
      currentData,

    error:
      currentError,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .select(
        shiftSelect,
      )
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
      .eq(
        'status',
        'open',
      )
      .single()

  if (
    currentError ||
    !currentData
  ) {
    throw new Error(
      currentError?.message ??
        'Open shift was not found.',
    )
  }

  const shift =
    mapShift(
      currentData as ShiftRow,
    )

  const summary =
    await getShiftCashSummary(
      shift,
    )

  const expectedCash =
    summary.expectedCash

  const cashDifference =
    input.closingCash -
    expectedCash

  const now =
    new Date()
      .toISOString()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .update({
        closing_cash:
          input.closingCash,

        actual_cash:
          input.closingCash,

        expected_cash:
          expectedCash,

        cash_difference:
          cashDifference,

        difference:
          cashDifference,

        closing_note:
          optionalText(
            input.closingNote,
          ),

        closed_by:
          shift.staffId,

        close_type:
          'normal',

        emergency_close_reason:
          null,

        status:
          'closed',

        closed_at:
          now,

        updated_at:
          now,
      })
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
      .eq(
        'status',
        'open',
      )
      .select(
        shiftSelect,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return mapShift(
    data as ShiftRow,
  )
}

/* =========================================================
   SHIFT HISTORY
========================================================= */

export type ShiftCloseType =
  | 'normal'
  | 'emergency'

export interface ShiftHistoryItem {
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

  customerCashPayments: number

  cashIn: number
  cashOut: number

  netCashMovement: number

  expectedCash:
    | number
    | null

  closingCash:
    | number
    | null

  cashDifference:
    | number
    | null

  status:
    ShiftStatus

  openedAt: string

  closedAt:
    | string
    | null

  openingNote:
    | string
    | null

  closingNote:
    | string
    | null

  closeType:
    ShiftCloseType

  closedBy:
    | string
    | null

  closedByName:
    | string
    | null

  emergencyCloseReason:
    | string
    | null
}

interface ShiftHistoryRow {
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

  closing_cash:
    | number
    | string
    | null

  expected_cash:
    | number
    | string
    | null

  cash_difference:
    | number
    | string
    | null

  status:
    ShiftStatus

  opening_note:
    | string
    | null

  closing_note:
    | string
    | null

  opened_at: string

  closed_at:
    | string
    | null

  close_type:
    | ShiftCloseType
    | null

  closed_by:
    | string
    | null

  emergency_close_reason:
    | string
    | null

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
}

interface ShiftCashPaymentRow {
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
}

interface StaffNameRow {
  id: string
  full_name: string
}

export async function getShiftHistory(
  businessId: string,
  branchId: string,
): Promise<ShiftHistoryItem[]> {
  if (
    !businessId ||
    !branchId
  ) {
    return []
  }

  const {
    data:
      shiftData,

    error:
      shiftError,
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
        closing_cash,
        expected_cash,
        cash_difference,
        status,
        opening_note,
        closing_note,
        opened_at,
        closed_at,
        close_type,
        closed_by,
        emergency_close_reason,

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
    ) as unknown as
      ShiftHistoryRow[]

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
    data:
      paymentData,

    error:
      paymentError,
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
      ) as unknown as
        ShiftCashPaymentRow[]
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

    cashByShift.set(
      shiftId,
      (
        cashByShift.get(
          shiftId,
        ) ?? 0
      ) +
        Number(
          payment.amount,
        ),
    )
  }

  const customerCashByShift =
    await getCustomerCashPaymentsByShift(
      shiftIds,
    )

  const closedByIds =
    Array.from(
      new Set(
        rows
          .map(
            (row) =>
              row.closed_by,
          )
          .filter(
            (
              id,
            ): id is string =>
              Boolean(id),
          ),
      ),
    )

  const closedByNames =
    new Map<
      string,
      string
    >()

  if (
    closedByIds.length >
    0
  ) {
    const {
      data:
        staffData,

      error:
        staffError,
    } =
      await supabase
        .from(
          'staff',
        )
        .select(`
          id,
          full_name
        `)
        .in(
          'id',
          closedByIds,
        )

    if (staffError) {
      throw new Error(
        staffError.message,
      )
    }

    for (
      const staffRow of
        (
          staffData ??
          []
        ) as StaffNameRow[]
    ) {
      closedByNames.set(
        staffRow.id,
        staffRow.full_name,
      )
    }
  }

  return Promise.all(
    rows.map(
      async (
        row,
      ): Promise<ShiftHistoryItem> => {
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
          ) ??
          0

        const customerCashPayments =
          customerCashByShift.get(
            row.id,
          ) ?? 0

        const movementTotals =
          await getShiftCashMovementTotals(
            row.id,
          )

        const netCashMovement =
          movementTotals.cashIn -
          movementTotals.cashOut

        const calculatedExpectedCash =
          openingCash +
          cashSales +
          customerCashPayments +
          netCashMovement

        const closeType:
          ShiftCloseType =
          row.close_type ===
          'emergency'
            ? 'emergency'
            : 'normal'

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

          customerCashPayments,

          cashIn:
            movementTotals.cashIn,

          cashOut:
            movementTotals.cashOut,

          netCashMovement,

          expectedCash:
            row.status ===
            'open'
              ? calculatedExpectedCash
              : row.expected_cash ===
                  null
                ? calculatedExpectedCash
                : Number(
                    row.expected_cash,
                  ),

          closingCash:
            row.closing_cash ===
            null
              ? null
              : Number(
                  row.closing_cash,
                ),

          cashDifference:
            row.cash_difference ===
            null
              ? null
              : Number(
                  row.cash_difference,
                ),

          status:
            row.status,

          openedAt:
            row.opened_at,

          closedAt:
            row.closed_at,

          openingNote:
            row.opening_note,

          closingNote:
            row.closing_note,

          closeType,

          closedBy:
            row.closed_by,

          closedByName:
            row.closed_by
              ? closedByNames.get(
                  row.closed_by,
                ) ??
                null
              : null,

          emergencyCloseReason:
            row.emergency_close_reason,
        }
      },
    ),
  )
}

/* =========================================================
   SHIFT DETAIL SUMMARY
========================================================= */

export interface ShiftPaymentBreakdown {
  cash: number
  card: number
  qr: number
  bankTransfer: number
  other: number
}

export interface ShiftDetailSummary {
  shiftId: string

  transactionCount: number

  totalSales: number

  payments:
    ShiftPaymentBreakdown

  cashIn: number
  cashOut: number

  netCashMovement: number

  movements:
    CashDrawerMovement[]
}

interface ShiftSaleRow {
  id: string

  total:
    | number
    | string
}

interface ShiftDetailPaymentRow {
  amount:
    | number
    | string

  payment_method:
    string
}

export async function getShiftDetailSummary(
  shiftId: string,
): Promise<ShiftDetailSummary> {
  if (!shiftId) {
    throw new Error(
      'Shift ID is required.',
    )
  }

  const [
    saleResult,
    paymentResult,
    movements,
  ] =
    await Promise.all([
      supabase
        .from(
          'sales',
        )
        .select(`
          id,
          total
        `)
        .eq(
          'shift_id',
          shiftId,
        ),

      supabase
        .from(
          'payments',
        )
        .select(`
          amount,
          payment_method,

          sales!inner (
            shift_id
          )
        `)
        .eq(
          'sales.shift_id',
          shiftId,
        ),

      getShiftCashDrawerMovements(
        shiftId,
      ),
    ])

  if (
    saleResult.error
  ) {
    throw new Error(
      saleResult.error.message,
    )
  }

  if (
    paymentResult.error
  ) {
    throw new Error(
      paymentResult.error.message,
    )
  }

  const sales =
    (
      saleResult.data ??
      []
    ) as unknown as
      ShiftSaleRow[]

  const transactionCount =
    sales.length

  const totalSales =
    sales.reduce(
      (
        total,
        sale,
      ) =>
        total +
        Number(
          sale.total,
        ),
      0,
    )

  const payments:
    ShiftPaymentBreakdown = {
      cash:
        0,

      card:
        0,

      qr:
        0,

      bankTransfer:
        0,

      other:
        0,
    }

  for (
    const payment of
      (
        paymentResult.data ??
        []
      ) as unknown as
        ShiftDetailPaymentRow[]
  ) {
    const amount =
      Number(
        payment.amount,
      )

    switch (
      payment.payment_method
    ) {
      case 'cash':
        payments.cash +=
          amount
        break

      case 'card':
        payments.card +=
          amount
        break

      case 'qr':
        payments.qr +=
          amount
        break

      case 'bank_transfer':
        payments.bankTransfer +=
          amount
        break

      default:
        payments.other +=
          amount
        break
    }
  }

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

  const netCashMovement =
    cashIn -
    cashOut

  return {
    shiftId,

    transactionCount,

    totalSales,

    payments,

    cashIn,

    cashOut,

    netCashMovement,

    movements,
  }
}

/* =========================================================
   OPEN SHIFTS
========================================================= */

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

  customerCashPayments: number

  cashIn: number
  cashOut: number

  netCashMovement: number

  expectedCash: number

  openedAt: string

  openingNote:
    | string
    | null
}

interface OpenShiftRow {
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
}

interface OpenShiftPaymentRow {
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
    data:
      shiftData,

    error:
      shiftError,
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
    ) as unknown as
      OpenShiftRow[]

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
    data:
      paymentData,

    error:
      paymentError,
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
      ) as unknown as
        OpenShiftPaymentRow[]
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

    const currentCash =
      cashByShift.get(
        shiftId,
      ) ??
      0

    cashByShift.set(
      shiftId,
      currentCash +
        Number(
          payment.amount,
        ),
    )
  }

  const customerCashByShift =
    await getCustomerCashPaymentsByShift(
      shiftIds,
    )

  return Promise.all(
    rows.map(
      async (
        row,
      ): Promise<OpenShiftItem> => {
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
          ) ??
          0

        const customerCashPayments =
          customerCashByShift.get(
            row.id,
          ) ?? 0

        const movementTotals =
          await getShiftCashMovementTotals(
            row.id,
          )

        const netCashMovement =
          movementTotals.cashIn -
          movementTotals.cashOut

        const expectedCash =
          openingCash +
          cashSales +
          customerCashPayments +
          netCashMovement

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

          customerCashPayments,

          cashIn:
            movementTotals.cashIn,

          cashOut:
            movementTotals.cashOut,

          netCashMovement,

          expectedCash,

          openedAt:
            row.opened_at,

          openingNote:
            row.opening_note,
        }
      },
    ),
  )
}

/* =========================================================
   MANAGER EMERGENCY CLOSE
========================================================= */

export interface EmergencyCloseShiftInput {
  shiftId: string

  businessId: string
  branchId: string

  managerStaffId: string

  closingCash: number

  reason: string
}

export async function emergencyCloseShift(
  input: EmergencyCloseShiftInput,
): Promise<CashierShift> {
  if (
    !input.shiftId ||
    !input.businessId ||
    !input.branchId ||
    !input.managerStaffId
  ) {
    throw new Error(
      'Shift, business, branch and manager are required.',
    )
  }

  if (
    !Number.isFinite(
      input.closingCash,
    ) ||
    input.closingCash <
      0
  ) {
    throw new Error(
      'Closing cash cannot be negative.',
    )
  }

  const reason =
    input.reason.trim()

  if (!reason) {
    throw new Error(
      'Emergency close reason is required.',
    )
  }

  const {
    data:
      currentData,

    error:
      currentError,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .select(
        shiftSelect,
      )
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
      .eq(
        'status',
        'open',
      )
      .single()

  if (
    currentError ||
    !currentData
  ) {
    throw new Error(
      currentError?.message ??
        'Open shift was not found.',
    )
  }

  const shift =
    mapShift(
      currentData as ShiftRow,
    )

  const summary =
    await getShiftCashSummary(
      shift,
    )

  const expectedCash =
    summary.expectedCash

  const cashDifference =
    input.closingCash -
    expectedCash

  const now =
    new Date()
      .toISOString()

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'cashier_shifts',
      )
      .update({
        closing_cash:
          input.closingCash,

        actual_cash:
          input.closingCash,

        expected_cash:
          expectedCash,

        cash_difference:
          cashDifference,

        difference:
          cashDifference,

        closing_note:
          `Emergency close: ${reason}`,

        closed_by:
          input.managerStaffId,

        close_type:
          'emergency',

        emergency_close_reason:
          reason,

        status:
          'closed',

        closed_at:
          now,

        updated_at:
          now,
      })
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
      .eq(
        'status',
        'open',
      )
      .select(
        shiftSelect,
      )
      .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return mapShift(
    data as ShiftRow,
  )
}