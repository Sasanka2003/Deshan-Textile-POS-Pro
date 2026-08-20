import { supabase } from './supabase'

import type {
  CompleteSaleInput,
  CompleteSaleResult,
} from '../types/sale'

export interface SaleListItem {
  id: string
  invoiceNo: string

  saleType:
    | 'retail'
    | 'wholesale'

  subtotal: number
  discountAmount: number

  taxAmount: number

  total: number
  paidAmount: number
  balanceDue: number

  status:
    | 'completed'
    | 'partially_paid'
    | 'credit'

  createdAt: string

  customer: {
    id: string
    name: string
    phone: string | null
  } | null

  staff: {
    id: string
    fullName: string
  } | null
}

export interface SaleDetailItem {
  id: string

  productId: string

  productName: string
  barcode: string | null

  quantity: number

  unitPrice: number
  discountAmount: number

  costPrice: number

  lineTotal: number
}

export interface SalePayment {
  id: string

  paymentMethod: string

  amount: number

  referenceNo: string | null

  createdAt: string
}

export interface SaleDetail {
  id: string

  invoiceNo: string

  saleType:
    | 'retail'
    | 'wholesale'

  subtotal: number
  discountAmount: number

  taxRate: number
  taxAmount: number

  total: number
  paidAmount: number
  balanceDue: number

  status:
    | 'completed'
    | 'partially_paid'
    | 'credit'

  notes: string | null

  createdAt: string

  customer: {
    id: string
    name: string
    phone: string | null
    address: string | null
  } | null

  staff: {
    id: string
    fullName: string
  } | null

  items: SaleDetailItem[]

  payments: SalePayment[]
}

export async function completeSale(
  input: CompleteSaleInput,
): Promise<CompleteSaleResult> {
  if (input.items.length === 0) {
    throw new Error(
      'Sale must contain at least one product.',
    )
  }

  const { data, error } = await supabase.rpc(
    'complete_sale',
    {
      p_client_transaction_id:
        input.clientTransactionId,

      p_business_id:
        input.businessId,

      p_branch_id:
        input.branchId,

      p_terminal_id:
        input.terminalId,

      p_shift_id:
        input.shiftId,

      p_customer_id:
        input.customerId,

      p_sale_type:
        input.saleType,

      p_items:
        input.items,

      p_payments:
        input.payments.map(
          (payment) => ({
            method:
              payment.method,

            amount:
              payment.amount,

            referenceNo:
              payment.referenceNo,
          }),
        ),

      p_order_discount:
        input.orderDiscount,

      p_tax_rate:
        input.taxRate,

      p_notes:
        input.notes,
    },
  )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  if (!data) {
    throw new Error(
      'Sale completed but no result was returned.',
    )
  }

  return data as CompleteSaleResult
}

export async function getSales(
  businessId: string,
  branchId: string,
): Promise<SaleListItem[]> {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id,
      invoice_no,
      sale_type,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      paid_amount,
      balance_due,
      status,
      created_at,

      customer:customers (
        id,
        name,
        phone
      ),

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
      'created_at',
      {
        ascending: false,
      },
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }

  return (
    data ?? []
  ).map((row: any) => {
    const customer =
      Array.isArray(
        row.customer,
      )
        ? row.customer[0] ?? null
        : row.customer

    const staff =
      Array.isArray(
        row.staff,
      )
        ? row.staff[0] ?? null
        : row.staff

    return {
      id: row.id,

      invoiceNo:
        row.invoice_no,

      saleType:
        row.sale_type,

      subtotal:
        Number(
          row.subtotal,
        ),

      discountAmount:
        Number(
          row.discount_amount,
        ),

      taxAmount:
        Number(
          row.tax_amount,
        ),

      total:
        Number(
          row.total,
        ),

      paidAmount:
        Number(
          row.paid_amount,
        ),

      balanceDue:
        Number(
          row.balance_due,
        ),

      status:
        row.status,

      createdAt:
        row.created_at,

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
    }
  })
}

export async function getSaleById(
  saleId: string,
): Promise<SaleDetail> {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id,
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
      created_at,

      customer:customers (
        id,
        name,
        phone,
        address
      ),

      staff:staff (
        id,
        full_name
      ),

      items:sale_items (
        id,
        product_id,
        product_name,
        barcode,
        quantity,
        unit_price,
        discount_amount,
        cost_price,
        line_total
      ),

      payments:payments (
        id,
        payment_method,
        amount,
        reference_no,
        created_at
      )
    `)
    .eq(
      'id',
      saleId,
    )
    .single()

  if (error) {
    throw new Error(
      error.message,
    )
  }

  const customer =
    Array.isArray(
      data.customer,
    )
      ? data.customer[0] ?? null
      : data.customer

  const staff =
    Array.isArray(
      data.staff,
    )
      ? data.staff[0] ?? null
      : data.staff

  return {
    id:
      data.id,

    invoiceNo:
      data.invoice_no,

    saleType:
      data.sale_type,

    subtotal:
      Number(
        data.subtotal,
      ),

    discountAmount:
      Number(
        data.discount_amount,
      ),

    taxRate:
      Number(
        data.tax_rate,
      ),

    taxAmount:
      Number(
        data.tax_amount,
      ),

    total:
      Number(
        data.total,
      ),

    paidAmount:
      Number(
        data.paid_amount,
      ),

    balanceDue:
      Number(
        data.balance_due,
      ),

    status:
      data.status,

    notes:
      data.notes,

    createdAt:
      data.created_at,

    customer:
      customer
        ? {
            id:
              customer.id,

            name:
              customer.name,

            phone:
              customer.phone,

            address:
              customer.address,
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

    items:
      (
        data.items ?? []
      ).map(
        (item: any) => ({
          id:
            item.id,

          productId:
            item.product_id,

          productName:
            item.product_name,

          barcode:
            item.barcode,

          quantity:
            Number(
              item.quantity,
            ),

          unitPrice:
            Number(
              item.unit_price,
            ),

          discountAmount:
            Number(
              item.discount_amount,
            ),

          costPrice:
            Number(
              item.cost_price,
            ),

          lineTotal:
            Number(
              item.line_total,
            ),
        }),
      ),

    payments:
      (
        data.payments ?? []
      ).map(
        (payment: any) => ({
          id:
            payment.id,

          paymentMethod:
            payment.payment_method,

          amount:
            Number(
              payment.amount,
            ),

          referenceNo:
            payment.reference_no,

          createdAt:
            payment.created_at,
        }),
      ),
  }
}