import { supabase } from './supabase'

import type {
  PurchaseDetail,
  PurchaseListItem,
  ReceivePurchaseInput,
  ReceivePurchaseResult,
} from '../types/purchase'

export async function receivePurchase(
  input: ReceivePurchaseInput,
): Promise<ReceivePurchaseResult> {
  if (!input.items.length) {
    throw new Error(
      'Purchase must contain at least one product.',
    )
  }

  const items =
    input.items.map(
      (item) => ({
        productId:
          item.productId,

        quantity:
          item.quantity,

        unitCost:
          item.unitCost,

        lineDiscount:
          item.lineDiscount,
      }),
    )

  const {
    data,
    error,
  } =
    await supabase.rpc(
      'receive_purchase',
      {
        p_client_transaction_id:
          input.clientTransactionId,

        p_business_id:
          input.businessId,

        p_branch_id:
          input.branchId,

        p_supplier_id:
          input.supplierId,

        p_supplier_invoice_no:
          input.supplierInvoiceNo,

        p_items:
          items,

        p_discount_amount:
          input.discountAmount,

        p_paid_amount:
          input.paidAmount,

        p_payment_method:
          input.paymentMethod,

        p_payment_reference:
          input.paymentReference,

        p_notes:
          input.notes,
      },
    )

  if (error) {
    console.error(
      'Receive purchase error:',
      error,
    )

    throw new Error(
      error.message ||
        'Unable to receive purchase.',
    )
  }

  if (!data) {
    throw new Error(
      'Purchase was completed but no result was returned.',
    )
  }

  return data as
    ReceivePurchaseResult
}

export async function getPurchases(
  businessId: string,
  branchId: string,
): Promise<
  PurchaseListItem[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        'purchases',
      )
      .select(`
        id,
        grn_no,
        supplier_invoice_no,
        subtotal,
        discount_amount,
        total,
        paid_amount,
        balance_due,
        payment_status,
        status,
        received_at,

        supplier:suppliers (
          id,
          name
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
        'received_at',
        {
          ascending:
            false,
        },
      )

  if (error) {
    console.error(
      'Load purchases error:',
      error,
    )

    throw new Error(
      error.message ||
        'Unable to load purchases.',
    )
  }

  return (
    data ?? []
  ) as unknown as
    PurchaseListItem[]
}

export async function getPurchaseById(
  purchaseId: string,
): Promise<PurchaseDetail> {
  if (!purchaseId) {
    throw new Error(
      'Purchase ID is required.',
    )
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'purchases',
      )
      .select(`
        id,
        client_transaction_id,
        business_id,
        branch_id,
        supplier_id,
        received_by,
        grn_no,
        supplier_invoice_no,
        subtotal,
        discount_amount,
        total,
        paid_amount,
        balance_due,
        payment_status,
        status,
        notes,
        received_at,
        created_at,

        supplier:suppliers (
          id,
          name,
          contact_person,
          phone,
          email,
          address,
          city
        ),

        staff:staff (
          id,
          full_name
        ),

        items:purchase_items (
          id,
          product_id,
          product_name,
          sku,
          barcode,
          unit,
          quantity,
          unit_cost,
          line_discount,
          line_total
        )
      `)
      .eq(
        'id',
        purchaseId,
      )
      .single()

  if (error) {
    console.error(
      'Load purchase details error:',
      error,
    )

    throw new Error(
      error.message ||
        'Unable to load purchase details.',
    )
  }

  if (!data) {
    throw new Error(
      'Purchase was not found.',
    )
  }

  const supplier =
    Array.isArray(
      data.supplier,
    )
      ? data.supplier[0] ??
        null
      : data.supplier

  const staff =
    Array.isArray(
      data.staff,
    )
      ? data.staff[0] ??
        null
      : data.staff

  return {
    id:
      data.id,

    client_transaction_id:
      data.client_transaction_id,

    business_id:
      data.business_id,

    branch_id:
      data.branch_id,

    supplier_id:
      data.supplier_id,

    received_by:
      data.received_by,

    grn_no:
      data.grn_no,

    supplier_invoice_no:
      data.supplier_invoice_no,

    subtotal:
      Number(
        data.subtotal,
      ),

    discount_amount:
      Number(
        data.discount_amount,
      ),

    total:
      Number(
        data.total,
      ),

    paid_amount:
      Number(
        data.paid_amount,
      ),

    balance_due:
      Number(
        data.balance_due,
      ),

    payment_status:
      data.payment_status,

    status:
      data.status,

    notes:
      data.notes,

    received_at:
      data.received_at,

    created_at:
      data.created_at,

    supplier:
      supplier
        ? {
            id:
              supplier.id,

            name:
              supplier.name,

            contact_person:
              supplier.contact_person,

            phone:
              supplier.phone,

            email:
              supplier.email,

            address:
              supplier.address,

            city:
              supplier.city,
          }
        : null,

    staff:
      staff
        ? {
            id:
              staff.id,

            full_name:
              staff.full_name,
          }
        : null,

    items:
      (
        data.items ??
        []
      ).map(
        (item: any) => ({
          id:
            item.id,

          product_id:
            item.product_id,

          product_name:
            item.product_name,

          sku:
            item.sku,

          barcode:
            item.barcode,

          unit:
            item.unit,

          quantity:
            Number(
              item.quantity,
            ),

          unit_cost:
            Number(
              item.unit_cost,
            ),

          line_discount:
            Number(
              item.line_discount,
            ),

          line_total:
            Number(
              item.line_total,
            ),
        }),
      ),
  }
}