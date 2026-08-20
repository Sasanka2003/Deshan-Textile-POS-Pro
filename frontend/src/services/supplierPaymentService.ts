import { supabase } from './supabase'

import type {
  RecordSupplierPaymentInput,
  SupplierPaymentMethod,
  SupplierPaymentReceipt,
  SupplierPaymentResult,
  SupplierStatementEntry,
} from '../types/supplierPayment'

/* =========================================================
   DATABASE ROW TYPES
========================================================= */

interface StatementRow {
  id: string

  entry_type:
    SupplierStatementEntry['entryType']

  amount:
    | number
    | string

  reference_type:
    | string
    | null

  reference_id:
    | string
    | null

  description:
    | string
    | null

  created_at: string

  running_balance:
    | number
    | string
}

interface SupplierPaymentRow {
  id: string

  receipt_no: string

  business_id: string
  branch_id: string
  supplier_id: string

  purchase_id:
    | string
    | null

  amount:
    | number
    | string

  payment_method: string

  reference_no:
    | string
    | null

  note:
    | string
    | null

  paid_by:
    | string
    | null

  paid_at: string
  created_at: string
}

interface SupplierRow {
  id: string

  name: string

  phone:
    | string
    | null
}

interface StaffRow {
  id: string

  full_name: string
}

interface BusinessRow {
  id: string

  name: string

  phone:
    | string
    | null

  address:
    | string
    | null
}

interface BranchRow {
  id: string

  name: string

  code:
    | string
    | null

  phone:
    | string
    | null

  address:
    | string
    | null
}

/* =========================================================
   HELPERS
========================================================= */

function numberValue(
  value:
    | number
    | string
    | null
    | undefined,
) {
  const parsed =
    Number(
      value ?? 0,
    )

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0
}

function mapPaymentMethod(
  value: string,
): SupplierPaymentMethod {
  switch (value) {
    case 'cash':
    case 'card':
    case 'qr':
    case 'bank_transfer':
    case 'cheque':
    case 'other':
      return value

    default:
      return 'other'
  }
}

/* =========================================================
   SUPPLIER BALANCE
========================================================= */

export async function getSupplierBalance(
  supplierId: string,
): Promise<number> {
  if (!supplierId) {
    return 0
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'get_supplier_balance',
      {
        p_supplier_id:
          supplierId,
      },
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return numberValue(
    data,
  )
}

/* =========================================================
   SUPPLIER STATEMENT
========================================================= */

export async function getSupplierStatement(
  supplierId: string,
): Promise<SupplierStatementEntry[]> {
  if (!supplierId) {
    return []
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'get_supplier_statement',
      {
        p_supplier_id:
          supplierId,
      },
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    (
      data ??
      []
    ) as StatementRow[]
  ).map(
    (row) => ({
      id:
        row.id,

      entryType:
        row.entry_type,

      amount:
        numberValue(
          row.amount,
        ),

      referenceType:
        row.reference_type,

      referenceId:
        row.reference_id,

      description:
        row.description,

      createdAt:
        row.created_at,

      runningBalance:
        numberValue(
          row.running_balance,
        ),
    }),
  )
}

/* =========================================================
   RECORD SUPPLIER PAYMENT
========================================================= */

export async function recordSupplierPayment(
  input: RecordSupplierPaymentInput,
): Promise<SupplierPaymentResult> {
  if (
    !input.businessId ||
    !input.branchId ||
    !input.supplierId
  ) {
    throw new Error(
      'Business, branch and supplier are required.',
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
      'Payment amount must be greater than zero.',
    )
  }

  const currentBalance =
    await getSupplierBalance(
      input.supplierId,
    )

  if (
    input.amount >
    currentBalance
  ) {
    throw new Error(
      'Payment amount cannot be greater than the supplier outstanding balance.',
    )
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'record_supplier_payment',
      {
        p_client_transaction_id:
          input.clientTransactionId,

        p_business_id:
          input.businessId,

        p_branch_id:
          input.branchId,

        p_supplier_id:
          input.supplierId,

        p_amount:
          input.amount,

        p_payment_method:
          input.paymentMethod,

        p_reference_no:
          input.referenceNo,

        p_note:
          input.note,
      },
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    throw new Error(
      'Supplier payment result was not returned.',
    )
  }

  return data as SupplierPaymentResult
}

/* =========================================================
   SUPPLIER PAYMENT RECEIPT
========================================================= */

export async function getSupplierPaymentReceipt(
  paymentId: string,
): Promise<SupplierPaymentReceipt> {
  if (!paymentId) {
    throw new Error(
      'Supplier payment ID is required.',
    )
  }

  const {
    data:
      paymentData,

    error:
      paymentError,
  } =
    await supabase
      .from(
        'supplier_payments',
      )
      .select(`
        id,
        receipt_no,
        business_id,
        branch_id,
        supplier_id,
        purchase_id,
        amount,
        payment_method,
        reference_no,
        note,
        paid_by,
        paid_at,
        created_at
      `)
      .eq(
        'id',
        paymentId,
      )
      .single()

  if (
    paymentError ||
    !paymentData
  ) {
    throw new Error(
      paymentError?.message ??
        'Supplier payment was not found.',
    )
  }

  const payment =
    paymentData as unknown as
      SupplierPaymentRow

  const [
    supplierResult,
    businessResult,
    branchResult,
    staffResult,
    statement,
  ] =
    await Promise.all([
      supabase
        .from(
          'suppliers',
        )
        .select(`
          id,
          name,
          phone
        `)
        .eq(
          'id',
          payment.supplier_id,
        )
        .maybeSingle(),

      supabase
        .from(
          'businesses',
        )
        .select(`
          id,
          name,
          phone,
          address
        `)
        .eq(
          'id',
          payment.business_id,
        )
        .maybeSingle(),

      supabase
        .from(
          'branches',
        )
        .select(`
          id,
          name,
          code,
          phone,
          address
        `)
        .eq(
          'id',
          payment.branch_id,
        )
        .maybeSingle(),

      payment.paid_by
        ? supabase
            .from(
              'staff',
            )
            .select(`
              id,
              full_name
            `)
            .eq(
              'id',
              payment.paid_by,
            )
            .maybeSingle()
        : Promise.resolve({
            data:
              null,

            error:
              null,
          }),

      getSupplierStatement(
        payment.supplier_id,
      ),
    ])

  if (
    supplierResult.error
  ) {
    throw new Error(
      supplierResult.error.message,
    )
  }

  if (
    businessResult.error
  ) {
    throw new Error(
      businessResult.error.message,
    )
  }

  if (
    branchResult.error
  ) {
    throw new Error(
      branchResult.error.message,
    )
  }

  if (
    staffResult.error
  ) {
    throw new Error(
      staffResult.error.message,
    )
  }

  const supplier =
    supplierResult.data
      ? supplierResult.data as
          SupplierRow
      : null

  const business =
    businessResult.data
      ? businessResult.data as
          BusinessRow
      : null

  const branch =
    branchResult.data
      ? branchResult.data as
          BranchRow
      : null

  const staff =
    staffResult.data
      ? staffResult.data as
          StaffRow
      : null

  /*
   * Find statement row for this payment.
   *
   * Usually reference_id points to supplier_payments.id.
   * We keep id fallback for compatibility with
   * existing statement RPC output.
   */
  const statementEntry =
    statement.find(
      (entry) =>
        entry.entryType ===
          'payment' &&
        (
          entry.referenceId ===
            payment.id ||
          entry.id ===
            payment.id
        ),
    )

  const amount =
    numberValue(
      payment.amount,
    )

  let remainingBalance =
    statementEntry
      ? numberValue(
          statementEntry.runningBalance,
        )
      : 0

  /*
   * Fallback for unmatched statement entry.
   */
  if (!statementEntry) {
    remainingBalance =
      await getSupplierBalance(
        payment.supplier_id,
      )
  }

  /*
   * Supplier payment reduces payable.
   *
   * Previous payable =
   * remaining payable + payment.
   */
  const previousBalance =
    remainingBalance +
    amount

  return {
    id:
      payment.id,

    receiptNo:
      payment.receipt_no,

    businessId:
      payment.business_id,

    branchId:
      payment.branch_id,

    supplierId:
      payment.supplier_id,

    paidBy:
      payment.paid_by,

    paymentMethod:
      mapPaymentMethod(
        payment.payment_method,
      ),

    amount,

    referenceNo:
      payment.reference_no,

    note:
      payment.note,

    paidAt:
      payment.paid_at ||
      payment.created_at,

    supplier:
      supplier
        ? {
            id:
              supplier.id,

            name:
              supplier.name,

            phone:
              supplier.phone,
          }
        : null,

    staff:
      staff
        ? {
            id:
              staff.id,

            fullName:
              staff.full_name,
          }
        : null,

    business:
      business
        ? {
            id:
              business.id,

            name:
              business.name,

            phone:
              business.phone,

            address:
              business.address,
          }
        : null,

    branch:
      branch
        ? {
            id:
              branch.id,

            name:
              branch.name,

            code:
              branch.code,

            phone:
              branch.phone,

            address:
              branch.address,
          }
        : null,

    previousBalance,

    remainingBalance,
  }
}