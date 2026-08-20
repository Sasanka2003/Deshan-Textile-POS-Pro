import { supabase } from './supabase'

import {
  getReportData,
} from './reportService'

import {
  getInventory,
} from './inventoryService'

import {
  getCustomers,
} from './customerService'

import {
  getCustomerBalance,
} from './customerPaymentService'

import {
  getSuppliers,
} from './supplierService'

import {
  getSupplierBalance,
} from './supplierPaymentService'

export interface DashboardRecentSale {
  id: string

  invoiceNo: string
  customerName: string

  total: number
  paidAmount: number
  balanceDue: number

  status: string

  createdAt: string
}

export interface DashboardTopProduct {
  productId: string

  productName: string

  sku: string | null
  barcode: string | null

  quantitySold: number

  netSales: number
  grossProfit: number
}

export interface DashboardLowStockItem {
  productId: string

  productName: string

  sku: string | null
  barcode: string | null

  unit: string

  quantity: number
  minimumStockQty: number
}

export interface DashboardPaymentMethod {
  method: string

  amount: number
  transactionCount: number
}

export interface DashboardData {
  todaySales: number

  grossProfit: number
  operatingProfit: number

  expenses: number
  purchases: number

  transactions: number
  productsSold: number

  returns: number
  returnCount: number

  lowStockCount: number

  customerOutstanding: number
  supplierPayables: number

  recentSales:
    DashboardRecentSale[]

  topProducts:
    DashboardTopProduct[]

  lowStockItems:
    DashboardLowStockItem[]

  paymentMethods:
    DashboardPaymentMethod[]
}

interface SaleItemQuantityRow {
  quantity:
    | number
    | string
}

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

function colomboDate(
  value:
    | string
    | Date,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(
          value,
        )

  return date.toLocaleDateString(
    'en-CA',
    {
      timeZone:
        'Asia/Colombo',
    },
  )
}

function colomboToday() {
  return colomboDate(
    new Date(),
  )
}

/*
 * =========================================================
 * PRODUCTS SOLD
 *
 * Uses the same sale IDs returned by ReportService.
 *
 * This prevents Dashboard transaction totals and
 * product quantity totals from using different
 * sale filters.
 * =========================================================
 */
async function getProductsSoldToday(
  saleIds: string[],
) {
  if (
    saleIds.length === 0
  ) {
    return 0
  }

  const {
    data,
    error,
  } = await supabase
    .from('sale_items')
    .select(`
      quantity
    `)
    .in(
      'sale_id',
      saleIds,
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
    ) as SaleItemQuantityRow[]
  ).reduce(
    (
      total,
      item,
    ) =>
      total +
      numberValue(
        item.quantity,
      ),
    0,
  )
}

/*
 * =========================================================
 * CUSTOMER OUTSTANDING
 *
 * Business-wide customer receivable.
 *
 * Uses the canonical customer ledger balance RPC/service.
 * =========================================================
 */
async function getCustomerOutstanding(
  businessId: string,
) {
  const customers =
    await getCustomers(
      businessId,
    )

  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.isActive,
    )

  if (
    activeCustomers.length === 0
  ) {
    return 0
  }

  const balances =
    await Promise.all(
      activeCustomers.map(
        (customer) =>
          getCustomerBalance(
            customer.id,
          ),
      ),
    )

  return balances.reduce(
    (
      total,
      balance,
    ) =>
      total +
      Math.max(
        0,
        numberValue(
          balance,
        ),
      ),
    0,
  )
}

/*
 * =========================================================
 * SUPPLIER PAYABLES
 *
 * Business-wide supplier payable.
 *
 * Uses the canonical supplier ledger balance RPC/service.
 * =========================================================
 */
async function getSupplierPayables(
  businessId: string,
) {
  const suppliers =
    await getSuppliers(
      businessId,
    )

  const activeSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.isActive,
    )

  if (
    activeSuppliers.length === 0
  ) {
    return 0
  }

  const balances =
    await Promise.all(
      activeSuppliers.map(
        (supplier) =>
          getSupplierBalance(
            supplier.id,
          ),
      ),
    )

  return balances.reduce(
    (
      total,
      balance,
    ) =>
      total +
      Math.max(
        0,
        numberValue(
          balance,
        ),
      ),
    0,
  )
}

/*
 * =========================================================
 * DASHBOARD
 *
 * All daily financial figures are sourced from
 * ReportService so Dashboard and Reports always use
 * the same accounting rules.
 *
 * Today Sales
 *   = Gross Sales
 *     - Discounts
 *     - Merchandise Returns
 *
 * Net COGS
 *   = Original COGS
 *     - Returned COGS
 *
 * Gross Profit
 *   = Net Sales
 *     - Net COGS
 *
 * Operating Profit
 *   = Gross Profit
 *     - Completed Expenses
 * =========================================================
 */
export async function getDashboardData(
  businessId: string,
  branchId: string,
): Promise<DashboardData> {
  if (!businessId) {
    throw new Error(
      'Business information is unavailable.',
    )
  }

  if (!branchId) {
    throw new Error(
      'Branch information is unavailable.',
    )
  }

  const today =
    colomboToday()

  /*
   * Load independent dashboard areas in parallel.
   */
  const [
    report,
    inventory,
    customerOutstanding,
    supplierPayables,
  ] =
    await Promise.all([
      getReportData(
        businessId,
        branchId,
        {
          startDate:
            today,

          endDate:
            today,
        },
      ),

      getInventory(
        branchId,
      ),

      getCustomerOutstanding(
        businessId,
      ),

      getSupplierPayables(
        businessId,
      ),
    ])

  /*
   * =======================================================
   * PRODUCTS SOLD
   *
   * Use report sales IDs instead of calling getSales()
   * independently.
   * =======================================================
   */
  const reportSaleIds =
    report.sales.map(
      (sale) =>
        sale.saleId,
    )

  const productsSold =
    await getProductsSoldToday(
      reportSaleIds,
    )

  /*
   * =======================================================
   * LOW STOCK
   * =======================================================
   */
  const lowStockItems:
    DashboardLowStockItem[] =
    inventory
      .filter(
        (item) =>
          numberValue(
            item.quantity,
          ) <=
          numberValue(
            item.minimumStockQty,
          ),
      )
      .sort(
        (
          a,
          b,
        ) => {
          const aGap =
            numberValue(
              a.quantity,
            ) -
            numberValue(
              a.minimumStockQty,
            )

          const bGap =
            numberValue(
              b.quantity,
            ) -
            numberValue(
              b.minimumStockQty,
            )

          return (
            aGap -
            bGap
          )
        },
      )
      .map(
        (item) => ({
          productId:
            item.productId,

          productName:
            item.productName,

          sku:
            item.sku,

          barcode:
            item.barcode,

          unit:
            item.unit,

          quantity:
            numberValue(
              item.quantity,
            ),

          minimumStockQty:
            numberValue(
              item.minimumStockQty,
            ),
        }),
      )

  /*
   * =======================================================
   * RECENT SALES
   *
   * ReportService already:
   *
   * - scopes business
   * - scopes branch
   * - scopes Colombo day
   * - excludes cancelled sales
   * - sorts newest first
   *
   * Therefore no second sale query is required.
   * =======================================================
   */
  const recentSales:
    DashboardRecentSale[] =
    report.sales
      .slice(
        0,
        6,
      )
      .map(
        (sale) => ({
          id:
            sale.saleId,

          invoiceNo:
            sale.invoiceNo,

          customerName:
            sale.customerName ??
            'Walk-in Customer',

          total:
            numberValue(
              sale.total,
            ),

          paidAmount:
            numberValue(
              sale.paidAmount,
            ),

          balanceDue:
            numberValue(
              sale.balanceDue,
            ),

          status:
            sale.status,

          createdAt:
            sale.date,
        }),
      )

  /*
   * =======================================================
   * TOP PRODUCTS
   *
   * This inherits:
   *
   * - merchandise returns
   * - returned quantity
   * - returned COGS
   * - order discount allocation
   *
   * from ReportService.
   * =======================================================
   */
  const topProducts:
    DashboardTopProduct[] =
    report.topProducts
      .slice(
        0,
        5,
      )
      .map(
        (product) => ({
          productId:
            product.productId,

          productName:
            product.productName,

          sku:
            product.sku,

          barcode:
            product.barcode,

          quantitySold:
            numberValue(
              product.quantitySold,
            ),

          netSales:
            numberValue(
              product.netSales,
            ),

          grossProfit:
            numberValue(
              product.grossProfit,
            ),
        }),
      )

  /*
   * =======================================================
   * PAYMENT METHODS
   * =======================================================
   */
  const paymentMethods:
    DashboardPaymentMethod[] =
    report.paymentMethods.map(
      (payment) => ({
        method:
          payment.method,

        amount:
          numberValue(
            payment.amount,
          ),

        transactionCount:
          numberValue(
            payment.transactionCount,
          ),
      }),
    )

  /*
   * =======================================================
   * FINAL DASHBOARD RESULT
   * =======================================================
   */
  return {
    /*
     * Today's NET sales.
     */
    todaySales:
      numberValue(
        report.summary.netSales,
      ),

    grossProfit:
      numberValue(
        report.summary.grossProfit,
      ),

    operatingProfit:
      numberValue(
        report.summary.operatingProfit,
      ),

    expenses:
      numberValue(
        report.summary.expenses,
      ),

    purchases:
      numberValue(
        report.summary.purchases,
      ),

    transactions:
      numberValue(
        report.summary.transactionCount,
      ),

    productsSold,

    /*
     * Merchandise return value.
     *
     * Includes no_refund returns.
     */
    returns:
      numberValue(
        report.summary.returns,
      ),

    returnCount:
      numberValue(
        report.summary
          .returnedTransactionCount,
      ),

    lowStockCount:
      lowStockItems.length,

    customerOutstanding:
      numberValue(
        customerOutstanding,
      ),

    supplierPayables:
      numberValue(
        supplierPayables,
      ),

    recentSales,

    topProducts,

    lowStockItems:
      lowStockItems.slice(
        0,
        6,
      ),

    paymentMethods,
  }
}