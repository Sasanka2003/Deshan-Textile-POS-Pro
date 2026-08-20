import { supabase } from './supabase'

import type {
  CustomerPaymentMethod,
  CustomerPaymentReceipt,
  CustomerPaymentResult,
  CustomerStatementEntry,
  RecordCustomerPaymentInput,
} from '../types/customerPayment'

/* =========================================================
   DATABASE ROW TYPES
========================================================= */

interface StatementRow {
  id: string

  entry_type:
    CustomerStatementEntry['entryType']

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

interface CustomerPaymentRow {
  id: string

  receipt_no: string

  business_id: string
  branch_id: string
  customer_id: string

  received_by:
    | string
    | null

  client_transaction_id:
    | string
    | null

  payment_method: string

  amount:
    | number
    | string

  reference_no:
    | string
    | null

  note:
    | string
    | null

  received_at: string
  created_at: string
}

interface CustomerRow {
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
): CustomerPaymentMethod {
  switch (value) {
    case 'cash':
    case 'card':
    case 'qr':
    case 'bank_transfer':
    case 'other':
      return value

    default:
      return 'other'
  }
}

/* =========================================================
   CUSTOMER BALANCE
========================================================= */

export async function getCustomerBalance(
  customerId: string,
): Promise<number> {
  if (!customerId) {
    return 0
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'get_customer_balance',
      {
        p_customer_id:
          customerId,
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
   CUSTOMER STATEMENT
========================================================= */

export async function getCustomerStatement(
  customerId: string,
): Promise<CustomerStatementEntry[]> {
  if (!customerId) {
    return []
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'get_customer_statement',
      {
        p_customer_id:
          customerId,
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
   RECORD PAYMENT
========================================================= */

export async function recordCustomerPayment(
  input: RecordCustomerPaymentInput,
): Promise<CustomerPaymentResult> {
  if (
    !input.businessId ||
    !input.branchId ||
    !input.customerId
  ) {
    throw new Error(
      'Business, branch and customer are required.',
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
    await getCustomerBalance(
      input.customerId,
    )

  if (
    input.amount >
    currentBalance
  ) {
    throw new Error(
      'Payment amount cannot be greater than the outstanding balance.',
    )
  }

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'record_customer_payment',
      {
        p_client_transaction_id:
          input.clientTransactionId,

        p_business_id:
          input.businessId,

        p_branch_id:
          input.branchId,

        p_customer_id:
          input.customerId,

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
      'Customer payment result was not returned.',
    )
  }

  return data as CustomerPaymentResult
}

/* =========================================================
   PAYMENT RECEIPT
========================================================= */

export async function getCustomerPaymentReceipt(
  paymentId: string,
): Promise<CustomerPaymentReceipt> {
  if (!paymentId) {
    throw new Error(
      'Payment ID is required.',
    )
  }

  /*
   * First load payment.
   */
  const {
    data:
      paymentData,

    error:
      paymentError,
  } =
    await supabase
      .from(
        'customer_payments',
      )
      .select(`
        id,
        receipt_no,
        business_id,
        branch_id,
        customer_id,
        received_by,
        client_transaction_id,
        payment_method,
        amount,
        reference_no,
        note,
        received_at,
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
        'Customer payment was not found.',
    )
  }

  const payment =
    paymentData as unknown as
      CustomerPaymentRow

  /*
   * Load related information.
   */
  const [
    customerResult,
    businessResult,
    branchResult,
    staffResult,
    statement,
  ] =
    await Promise.all([
      supabase
        .from(
          'customers',
        )
        .select(`
          id,
          name,
          phone
        `)
        .eq(
          'id',
          payment.customer_id,
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

      payment.received_by
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
              payment.received_by,
            )
            .maybeSingle()
        : Promise.resolve({
            data:
              null,

            error:
              null,
          }),

      getCustomerStatement(
        payment.customer_id,
      ),
    ])

  if (
    customerResult.error
  ) {
    throw new Error(
      customerResult.error.message,
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

  const customer =
    customerResult.data
      ? customerResult.data as
          CustomerRow
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
   * =======================================================
   * FIND STATEMENT ENTRY FOR THIS PAYMENT
   * =======================================================
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
   * Fallback if statement entry
   * cannot be matched.
   */
  if (!statementEntry) {
    remainingBalance =
      await getCustomerBalance(
        payment.customer_id,
      )
  }

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

    customerId:
      payment.customer_id,

    receivedBy:
      payment.received_by,

    clientTransactionId:
      payment.client_transaction_id,

    paymentMethod:
      mapPaymentMethod(
        payment.payment_method,
      ),

    amount,

    referenceNo:
      payment.reference_no,

    note:
      payment.note,

    createdAt:
      payment.received_at ||
      payment.created_at,

    customer:
      customer
        ? {
            id:
              customer.id,

            name:
              customer.name,

            phone:
              customer.phone,
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