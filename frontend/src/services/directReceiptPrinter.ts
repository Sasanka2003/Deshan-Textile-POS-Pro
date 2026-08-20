import type { SaleInvoiceDetail } from '../types/salesHistory'
import type { BusinessSettings } from '../types/settings'
import type { CustomerPaymentReceipt } from '../types/customerPayment'
import type { SupplierPaymentReceipt } from '../types/supplierPayment'
import type { PurchaseDetail } from '../types/purchase'
import type { PurchaseReturnReceiptDetail } from '../types/purchaseReturn'
import type { ReturnReceiptDetail } from '../types/return'
import type { ShiftDetailSummary, ShiftHistoryItem } from './shiftService'

const BASE_URL = 'http://127.0.0.1:17858/print'

// This is not treated as a secret.
// The bridge also validates the browser Origin.
const PRINT_BRIDGE_CLIENT = 'deshan-textile-pos'

interface DirectPrintResponse {
  ok?: boolean
  error?: string
}

async function send(path: string, payload: unknown): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Deshan-POS-Client': PRINT_BRIDGE_CLIENT,
      },
      body: JSON.stringify(payload),
    })

    let result: DirectPrintResponse = {}

    try {
      result = (await response.json()) as DirectPrintResponse
    } catch {
      result = {}
    }

    if (!response.ok || result.ok !== true) {
      console.warn(
        'Direct receipt printing failed:',
        result.error ?? `HTTP ${response.status}`,
      )
      return false
    }

    return true
  } catch (error) {
    console.warn(
      'Direct receipt print bridge is unavailable:',
      error,
    )
    return false
  }
}

export const directPrintSaleReceipt = (
  invoice: SaleInvoiceDetail,
  settings: BusinessSettings | null,
) =>
  send('sale', { invoice, settings })

export const directPrintCustomerPaymentReceipt = (
  receipt: CustomerPaymentReceipt,
  settings: BusinessSettings | null,
) =>
  send('customer-payment', { receipt, settings })

export const directPrintSupplierPaymentReceipt = (
  receipt: SupplierPaymentReceipt,
  settings: BusinessSettings | null,
) =>
  send('supplier-payment', { receipt, settings })

export const directPrintPurchaseReceipt = (
  purchase: PurchaseDetail,
  settings: BusinessSettings | null,
) =>
  send('purchase', { purchase, settings })

export const directPrintPurchaseReturnReceipt = (
  receipt: PurchaseReturnReceiptDetail,
  settings: BusinessSettings | null = null,
) =>
  send('purchase-return', { receipt, settings })

export const directPrintReturnReceipt = (
  receipt: ReturnReceiptDetail,
  settings: BusinessSettings | null = null,
) =>
  send('return', { receipt, settings })

export const directPrintShiftReport = (
  shift: ShiftHistoryItem,
  detail: ShiftDetailSummary,
  settings: BusinessSettings | null = null,
) =>
  send('shift', { shift, detail, settings })