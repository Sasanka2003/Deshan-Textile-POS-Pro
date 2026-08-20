import { supabase } from './supabase'

import type {
  SaleBranchInfo,
  SaleBusinessInfo,
  SaleInvoiceDetail,
  SaleInvoiceItem,
  SalePayment,
  SalesHistoryItem,
  SaleType,
} from '../types/salesHistory'

/* =========================================================
   TYPES
========================================================= */

interface SaleRow {
  id: string

  business_id: string
  branch_id: string

  terminal_id: string | null
  shift_id: string | null
  customer_id: string | null
  staff_id: string

  client_transaction_id: string

  invoice_no: string
  sale_type: string

  subtotal: number | string
  discount_amount: number | string

  tax_rate: number | string
  tax_amount: number | string

  total: number | string
  paid_amount: number | string
  balance_due: number | string

  status: string

  notes: string | null

  created_at: string
}

interface SaleItemRow {
  id: string

  sale_id: string
  product_id: string

  product_name: string
  barcode: string | null

  quantity: number | string
  unit_price: number | string

  discount_amount: number | string
  cost_price: number | string

  line_total: number | string
}

interface PaymentRow {
  id: string

  sale_id: string | null

  business_id: string
  branch_id: string

  payment_method: string

  amount: number | string

  reference_no: string | null
  received_by: string | null

  created_at: string
}

interface BusinessRow {
  id: string

  name: string
  legal_name: string | null

  phone: string | null
  email: string | null
  address: string | null

  currency_code: string
  timezone: string
}

interface BranchRow {
  id: string

  name: string
  code: string

  phone: string | null
  address: string | null
}

interface CustomerRow {
  id: string
  name: string
}

interface StaffRow {
  id: string
  full_name: string
}

export type SalesHistoryStatus =
  | 'all'
  | 'completed'
  | 'partially_paid'
  | 'credit'
  | 'cancelled'

export interface SalesHistoryQuery {
  businessId: string

  branchId?: string

  search?: string

  saleType?:
    | 'all'
    | SaleType

  status?:
    SalesHistoryStatus

  startDate?: string
  endDate?: string

  page?: number
  pageSize?: number
}

export interface SalesHistoryPageResult {
  sales:
    SalesHistoryItem[]

  totalCount: number

  page: number
  pageSize: number

  totalPages: number

  hasPreviousPage: boolean
  hasNextPage: boolean
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
    Number(value ?? 0)

  return Number.isFinite(parsed)
    ? parsed
    : 0
}

function colomboTimestampStart(
  date: string,
) {
  return `${date}T00:00:00+05:30`
}

function colomboTimestampEnd(
  date: string,
) {
  return `${date}T23:59:59.999+05:30`
}

function cleanSearchValue(
  value?: string,
) {
  return (
    value
      ?.trim()
      .replaceAll(
        ',',
        ' ',
      ) ?? ''
  )
}

function mapSale(
  row: SaleRow,
  customerName: string | null = null,
  staffName: string | null = null,
): SalesHistoryItem {
  return {
    id:
      row.id,

    businessId:
      row.business_id,

    branchId:
      row.branch_id,

    terminalId:
      row.terminal_id,

    shiftId:
      row.shift_id,

    customerId:
      row.customer_id,

    staffId:
      row.staff_id,

    clientTransactionId:
      row.client_transaction_id,

    invoiceNo:
      row.invoice_no,

    saleType:
      row.sale_type as SaleType,

    subtotal:
      numberValue(
        row.subtotal,
      ),

    discountAmount:
      numberValue(
        row.discount_amount,
      ),

    taxRate:
      numberValue(
        row.tax_rate,
      ),

    taxAmount:
      numberValue(
        row.tax_amount,
      ),

    total:
      numberValue(
        row.total,
      ),

    paidAmount:
      numberValue(
        row.paid_amount,
      ),

    balanceDue:
      numberValue(
        row.balance_due,
      ),

    status:
      row.status,

    notes:
      row.notes,

    createdAt:
      row.created_at,

    customerName,

    staffName,
  }
}

function mapSaleItem(
  row: SaleItemRow,
): SaleInvoiceItem {
  return {
    id:
      row.id,

    saleId:
      row.sale_id,

    productId:
      row.product_id,

    productName:
      row.product_name,

    barcode:
      row.barcode,

    quantity:
      numberValue(
        row.quantity,
      ),

    unitPrice:
      numberValue(
        row.unit_price,
      ),

    discountAmount:
      numberValue(
        row.discount_amount,
      ),

    costPrice:
      numberValue(
        row.cost_price,
      ),

    lineTotal:
      numberValue(
        row.line_total,
      ),
  }
}

function mapPayment(
  row: PaymentRow,
): SalePayment {
  return {
    id:
      row.id,

    saleId:
      row.sale_id,

    businessId:
      row.business_id,

    branchId:
      row.branch_id,

    paymentMethod:
      row.payment_method,

    amount:
      numberValue(
        row.amount,
      ),

    referenceNo:
      row.reference_no,

    receivedBy:
      row.received_by,

    createdAt:
      row.created_at,
  }
}

function mapBusiness(
  row: BusinessRow,
): SaleBusinessInfo {
  return {
    id:
      row.id,

    name:
      row.name,

    legalName:
      row.legal_name,

    phone:
      row.phone,

    email:
      row.email,

    address:
      row.address,

    currencyCode:
      row.currency_code,

    timezone:
      row.timezone,
  }
}

function mapBranch(
  row: BranchRow,
): SaleBranchInfo {
  return {
    id:
      row.id,

    name:
      row.name,

    code:
      row.code,

    phone:
      row.phone,

    address:
      row.address,
  }
}

/* =========================================================
   RELATION LOOKUPS
========================================================= */

async function loadSaleRelationNames(
  sales: SaleRow[],
) {
  const customerIds =
    Array.from(
      new Set(
        sales
          .map(
            (sale) =>
              sale.customer_id,
          )
          .filter(
            (
              value,
            ): value is string =>
              Boolean(value),
          ),
      ),
    )

  const staffIds =
    Array.from(
      new Set(
        sales
          .map(
            (sale) =>
              sale.staff_id,
          )
          .filter(Boolean),
      ),
    )

  const customerMap =
    new Map<
      string,
      string
    >()

  const staffMap =
    new Map<
      string,
      string
    >()

  const [
    customerResult,
    staffResult,
  ] =
    await Promise.all([
      customerIds.length >
      0
        ? supabase
            .from(
              'customers',
            )
            .select(
              'id, name',
            )
            .in(
              'id',
              customerIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),

      staffIds.length >
      0
        ? supabase
            .from(
              'staff',
            )
            .select(
              'id, full_name',
            )
            .in(
              'id',
              staffIds,
            )
        : Promise.resolve({
            data: [],
            error: null,
          }),
    ])

  if (
    customerResult.error
  ) {
    throw new Error(
      customerResult
        .error.message,
    )
  }

  if (
    staffResult.error
  ) {
    throw new Error(
      staffResult
        .error.message,
    )
  }

  for (
    const customer of
      (
        customerResult.data ??
        []
      ) as CustomerRow[]
  ) {
    customerMap.set(
      customer.id,
      customer.name,
    )
  }

  for (
    const staff of
      (
        staffResult.data ??
        []
      ) as StaffRow[]
  ) {
    staffMap.set(
      staff.id,
      staff.full_name,
    )
  }

  return {
    customerMap,
    staffMap,
  }
}

/* =========================================================
   PAGINATED SALES HISTORY
========================================================= */

export async function getSalesHistoryPage(
  input: SalesHistoryQuery,
): Promise<SalesHistoryPageResult> {
  if (!input.businessId) {
    throw new Error(
      'Business is required.',
    )
  }

  if (
    input.startDate &&
    input.endDate &&
    input.startDate >
      input.endDate
  ) {
    throw new Error(
      'Start date cannot be after end date.',
    )
  }

  const page =
    Math.max(
      1,
      Math.floor(
        input.page ?? 1,
      ),
    )

  const requestedPageSize =
    Math.floor(
      input.pageSize ??
        25,
    )

  const pageSize =
    Math.min(
      100,
      Math.max(
        1,
        requestedPageSize,
      ),
    )

  const from =
    (page - 1) *
    pageSize

  const to =
    from +
    pageSize -
    1

  const search =
    cleanSearchValue(
      input.search,
    )

  /*
   * For now the direct database search
   * applies to fields available in sales.
   *
   * Invoice/status/type filtering is fully
   * server-side.
   */
  let query =
    supabase
      .from('sales')
      .select(
        `
          id,
          business_id,
          branch_id,
          terminal_id,
          shift_id,
          customer_id,
          staff_id,
          client_transaction_id,
          invoice_no,
          sale_type,
          subtotal,
          discount_amount,
          tax_rate,
          tax_amount,
          total,
          paid_amount,
          balance_due,
          status,
          notes,
          created_at
        `,
        {
          count:
            'exact',
        },
      )
      .eq(
        'business_id',
        input.businessId,
      )

  if (input.branchId) {
    query =
      query.eq(
        'branch_id',
        input.branchId,
      )
  }

  if (
    input.saleType &&
    input.saleType !==
      'all'
  ) {
    query =
      query.eq(
        'sale_type',
        input.saleType,
      )
  }

  if (
    input.status &&
    input.status !==
      'all'
  ) {
    query =
      query.eq(
        'status',
        input.status,
      )
  }

  if (input.startDate) {
    query =
      query.gte(
        'created_at',
        colomboTimestampStart(
          input.startDate,
        ),
      )
  }

  if (input.endDate) {
    query =
      query.lte(
        'created_at',
        colomboTimestampEnd(
          input.endDate,
        ),
      )
  }

  if (search) {
    query =
      query.ilike(
        'invoice_no',
        `%${search}%`,
      )
  }

  const {
    data,
    error,
    count,
  } =
    await query
      .order(
        'created_at',
        {
          ascending:
            false,
        },
      )
      .range(
        from,
        to,
      )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  const rows =
    (
      data ??
      []
    ) as unknown as
      SaleRow[]

  const {
    customerMap,
    staffMap,
  } =
    await loadSaleRelationNames(
      rows,
    )

  const sales =
    rows.map(
      (sale) =>
        mapSale(
          sale,

          sale.customer_id
            ? customerMap.get(
                sale.customer_id,
              ) ??
              null
            : null,

          staffMap.get(
            sale.staff_id,
          ) ??
            null,
        ),
    )

  const totalCount =
    count ?? 0

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
          pageSize,
      ),
    )

  return {
    sales,

    totalCount,

    page,

    pageSize,

    totalPages,

    hasPreviousPage:
      page >
      1,

    hasNextPage:
      page <
      totalPages,
  }
}

/* =========================================================
   LEGACY GET SALES HISTORY
========================================================= */

/*
 * Keep this function so existing pages/services
 * do not break immediately.
 *
 * We limit it to 5000 records.
 */
export async function getSalesHistory(
  businessId: string,
  branchId?: string,
): Promise<SalesHistoryItem[]> {
  if (!businessId) {
    return []
  }

  let query =
    supabase
      .from('sales')
      .select(`
        id,
        business_id,
        branch_id,
        terminal_id,
        shift_id,
        customer_id,
        staff_id,
        client_transaction_id,
        invoice_no,
        sale_type,
        subtotal,
        discount_amount,
        tax_rate,
        tax_amount,
        total,
        paid_amount,
        balance_due,
        status,
        notes,
        created_at
      `)
      .eq(
        'business_id',
        businessId,
      )
      .order(
        'created_at',
        {
          ascending:
            false,
        },
      )
      .limit(
        5000,
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

  const sales =
    (
      data ??
      []
    ) as unknown as
      SaleRow[]

  if (
    sales.length ===
    0
  ) {
    return []
  }

  const {
    customerMap,
    staffMap,
  } =
    await loadSaleRelationNames(
      sales,
    )

  return sales.map(
    (sale) =>
      mapSale(
        sale,

        sale.customer_id
          ? customerMap.get(
              sale.customer_id,
            ) ??
            null
          : null,

        staffMap.get(
          sale.staff_id,
        ) ??
          null,
      ),
  )
}

/* =========================================================
   COMPLETE INVOICE
========================================================= */

export async function getSaleInvoice(
  saleId: string,
): Promise<SaleInvoiceDetail> {
  if (!saleId) {
    throw new Error(
      'Sale ID is required.',
    )
  }

  const {
    data: saleData,
    error: saleError,
  } =
    await supabase
      .from('sales')
      .select(`
        id,
        business_id,
        branch_id,
        terminal_id,
        shift_id,
        customer_id,
        staff_id,
        client_transaction_id,
        invoice_no,
        sale_type,
        subtotal,
        discount_amount,
        tax_rate,
        tax_amount,
        total,
        paid_amount,
        balance_due,
        status,
        notes,
        created_at
      `)
      .eq(
        'id',
        saleId,
      )
      .single()

  if (saleError) {
    throw new Error(
      saleError.message,
    )
  }

  if (!saleData) {
    throw new Error(
      'Sale was not found.',
    )
  }

  const saleRow =
    saleData as unknown as
      SaleRow

  const [
    itemsResult,
    paymentsResult,
    businessResult,
    branchResult,
    staffResult,
    customerResult,
  ] =
    await Promise.all([
      supabase
        .from(
          'sale_items',
        )
        .select(`
          id,
          sale_id,
          product_id,
          product_name,
          barcode,
          quantity,
          unit_price,
          discount_amount,
          cost_price,
          line_total
        `)
        .eq(
          'sale_id',
          saleId,
        )
        .order(
          'id',
          {
            ascending:
              true,
          },
        ),

      supabase
        .from(
          'payments',
        )
        .select(`
          id,
          sale_id,
          business_id,
          branch_id,
          payment_method,
          amount,
          reference_no,
          received_by,
          created_at
        `)
        .eq(
          'sale_id',
          saleId,
        )
        .order(
          'created_at',
          {
            ascending:
              true,
          },
        ),

      supabase
        .from(
          'businesses',
        )
        .select(`
          id,
          name,
          legal_name,
          phone,
          email,
          address,
          currency_code,
          timezone
        `)
        .eq(
          'id',
          saleRow.business_id,
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
          saleRow.branch_id,
        )
        .maybeSingle(),

      supabase
        .from(
          'staff',
        )
        .select(`
          id,
          full_name
        `)
        .eq(
          'id',
          saleRow.staff_id,
        )
        .maybeSingle(),

      saleRow.customer_id
        ? supabase
            .from(
              'customers',
            )
            .select(`
              id,
              name
            `)
            .eq(
              'id',
              saleRow.customer_id,
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),
    ])

  if (itemsResult.error) {
    throw new Error(
      itemsResult
        .error.message,
    )
  }

  if (
    paymentsResult.error
  ) {
    throw new Error(
      paymentsResult
        .error.message,
    )
  }

  if (
    businessResult.error
  ) {
    throw new Error(
      businessResult
        .error.message,
    )
  }

  if (
    branchResult.error
  ) {
    throw new Error(
      branchResult
        .error.message,
    )
  }

  if (
    staffResult.error
  ) {
    throw new Error(
      staffResult
        .error.message,
    )
  }

  if (
    customerResult.error
  ) {
    throw new Error(
      customerResult
        .error.message,
    )
  }

  const customerName =
    customerResult.data
      ? (
          customerResult.data as
            CustomerRow
        ).name
      : null

  const staffName =
    staffResult.data
      ? (
          staffResult.data as
            StaffRow
        ).full_name
      : null

  return {
    sale:
      mapSale(
        saleRow,
        customerName,
        staffName,
      ),

    items:
      (
        itemsResult.data ??
        []
      )
        .map(
          (item) =>
            mapSaleItem(
              item as unknown as
                SaleItemRow,
            ),
        ),

    payments:
      (
        paymentsResult.data ??
        []
      )
        .map(
          (payment) =>
            mapPayment(
              payment as unknown as
                PaymentRow,
            ),
        ),

    business:
      businessResult.data
        ? mapBusiness(
            businessResult.data as unknown as
              BusinessRow,
          )
        : null,

    branch:
      branchResult.data
        ? mapBranch(
            branchResult.data as unknown as
              BranchRow,
          )
        : null,
  }
}

/* =========================================================
   FIND BY INVOICE NO
========================================================= */

export async function getSaleByInvoiceNo(
  businessId: string,
  invoiceNo: string,
): Promise<SalesHistoryItem | null> {
  if (!businessId) {
    throw new Error(
      'Business is required.',
    )
  }

  const cleanInvoiceNo =
    invoiceNo.trim()

  if (!cleanInvoiceNo) {
    return null
  }

  const {
    data,
    error,
  } =
    await supabase
      .from('sales')
      .select(`
        id,
        business_id,
        branch_id,
        terminal_id,
        shift_id,
        customer_id,
        staff_id,
        client_transaction_id,
        invoice_no,
        sale_type,
        subtotal,
        discount_amount,
        tax_rate,
        tax_amount,
        total,
        paid_amount,
        balance_due,
        status,
        notes,
        created_at
      `)
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'invoice_no',
        cleanInvoiceNo,
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

  const row =
    data as unknown as
      SaleRow

  const {
    customerMap,
    staffMap,
  } =
    await loadSaleRelationNames(
      [row],
    )

  return mapSale(
    row,

    row.customer_id
      ? customerMap.get(
          row.customer_id,
        ) ??
        null
      : null,

    staffMap.get(
      row.staff_id,
    ) ??
      null,
  )
}