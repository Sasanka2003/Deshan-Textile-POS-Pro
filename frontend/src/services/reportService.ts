import { supabase } from './supabase'

import type {
  DailyReportPoint,
  ExpenseReportRow,
  PaymentMethodSummary,
  ReportData,
  ReportDateRange,
  SalesReportRow,
  TopSellingProduct,
} from '../types/report'

interface SaleRow {
  id: string
  invoice_no: string

  subtotal: number | string
  discount_amount: number | string
  tax_amount: number | string

  total: number | string
  paid_amount: number | string
  balance_due: number | string

  status: string
  created_at: string

  customer:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null

  staff:
    | {
        full_name: string
      }
    | {
        full_name: string
      }[]
    | null
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

  payment_method: string

  amount: number | string

  created_at: string
}

interface ReturnRow {
  id: string
  sale_id: string

  refund_amount: number | string

  status: string
  created_at: string
}

interface ReturnItemRow {
  id: string

  return_id: string
  sale_item_id: string

  quantity: number | string
  line_refund: number | string
}

interface ExpenseRow {
  id: string

  expense_no: string
  expense_date: string

  amount: number | string

  payment_method: string

  description: string | null

  status: string

  category:
    | {
        name: string
      }
    | {
        name: string
      }[]
    | null

  staff:
    | {
        full_name: string
      }
    | {
        full_name: string
      }[]
    | null
}

interface PurchaseRow {
  id: string

  total: number | string

  status: string

  received_at: string
}

function firstRelation<T>(
  value: T | T[] | null,
): T | null {
  if (!value) {
    return null
  }

  return Array.isArray(value)
    ? value[0] ?? null
    : value
}

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

function colomboDateFromTimestamp(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleDateString(
    'en-CA',
    {
      timeZone:
        'Asia/Colombo',
    },
  )
}

function createDateList(
  startDate: string,
  endDate: string,
) {
  const dates: string[] = []

  const current =
    new Date(
      `${startDate}T00:00:00Z`,
    )

  const end =
    new Date(
      `${endDate}T00:00:00Z`,
    )

  while (
    current.getTime() <=
    end.getTime()
  ) {
    dates.push(
      current
        .toISOString()
        .slice(0, 10),
    )

    current.setUTCDate(
      current.getUTCDate() +
        1,
    )
  }

  return dates
}

export async function getReportData(
  businessId: string,
  branchId: string,
  range: ReportDateRange,
): Promise<ReportData> {
  if (!businessId) {
    throw new Error(
      'Business is required for reports.',
    )
  }

  if (!branchId) {
    throw new Error(
      'Branch is required for reports.',
    )
  }

  if (
    !range.startDate ||
    !range.endDate
  ) {
    throw new Error(
      'Report date range is required.',
    )
  }

  if (
    range.startDate >
    range.endDate
  ) {
    throw new Error(
      'Start date cannot be after end date.',
    )
  }

  const startTimestamp =
    colomboTimestampStart(
      range.startDate,
    )

  const endTimestamp =
    colomboTimestampEnd(
      range.endDate,
    )

  /*
   * =========================================================
   * SALES
   * =========================================================
   */
  const {
    data: salesData,
    error: salesError,
  } = await supabase
    .from('sales')
    .select(`
      id,
      invoice_no,
      subtotal,
      discount_amount,
      tax_amount,
      total,
      paid_amount,
      balance_due,
      status,
      created_at,

      customer:customers (
        name
      ),

      staff:staff (
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
    .neq(
      'status',
      'cancelled',
    )
    .gte(
      'created_at',
      startTimestamp,
    )
    .lte(
      'created_at',
      endTimestamp,
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    )

  if (salesError) {
    throw new Error(
      salesError.message,
    )
  }

  const sales =
    (
      salesData ??
      []
    ) as unknown as SaleRow[]

  const saleIds =
    sales.map(
      (sale) =>
        sale.id,
    )

  /*
   * =========================================================
   * SALE ITEMS
   * =========================================================
   */
  let saleItems:
    SaleItemRow[] = []

  if (
    saleIds.length >
    0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from('sale_items')
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
      .in(
        'sale_id',
        saleIds,
      )

    if (error) {
      throw new Error(
        error.message,
      )
    }

    saleItems =
      (
        data ??
        []
      ) as unknown as SaleItemRow[]
  }

  /*
   * =========================================================
   * PAYMENTS
   * =========================================================
   */
  const {
    data: paymentData,
    error: paymentError,
  } = await supabase
    .from('payments')
    .select(`
      id,
      sale_id,
      payment_method,
      amount,
      created_at
    `)
    .eq(
      'business_id',
      businessId,
    )
    .eq(
      'branch_id',
      branchId,
    )
    .gte(
      'created_at',
      startTimestamp,
    )
    .lte(
      'created_at',
      endTimestamp,
    )

  if (paymentError) {
    throw new Error(
      paymentError.message,
    )
  }

  const payments =
    (
      paymentData ??
      []
    ) as unknown as PaymentRow[]

  /*
   * =========================================================
   * RETURNS
   * =========================================================
   */
  const {
    data: returnData,
    error: returnError,
  } = await supabase
    .from('returns')
    .select(`
      id,
      sale_id,
      refund_amount,
      status,
      created_at
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
      'completed',
    )
    .gte(
      'created_at',
      startTimestamp,
    )
    .lte(
      'created_at',
      endTimestamp,
    )

  if (returnError) {
    throw new Error(
      returnError.message,
    )
  }

  const returns =
    (
      returnData ??
      []
    ) as unknown as ReturnRow[]

  const returnIds =
    returns.map(
      (item) =>
        item.id,
    )

  /*
   * =========================================================
   * RETURN ITEMS
   * =========================================================
   */
  let returnItems:
    ReturnItemRow[] = []

  if (
    returnIds.length >
    0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from('return_items')
      .select(`
        id,
        return_id,
        sale_item_id,
        quantity,
        line_refund
      `)
      .in(
        'return_id',
        returnIds,
      )

    if (error) {
      throw new Error(
        error.message,
      )
    }

    returnItems =
      (
        data ??
        []
      ) as unknown as ReturnItemRow[]
  }

  /*
   * =========================================================
   * ORIGINAL SALE ITEMS FOR RETURNS OUTSIDE REPORT SALE RANGE
   * =========================================================
   */
  const selectedSaleItemIds =
    new Set(
      saleItems.map(
        (item) =>
          item.id,
      ),
    )

  const missingSaleItemIds =
    Array.from(
      new Set(
        returnItems
          .map(
            (item) =>
              item.sale_item_id,
          )
          .filter(
            (saleItemId) =>
              !selectedSaleItemIds.has(
                saleItemId,
              ),
          ),
      ),
    )

  let additionalSaleItems:
    SaleItemRow[] = []

  if (
    missingSaleItemIds.length >
    0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from('sale_items')
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
      .in(
        'id',
        missingSaleItemIds,
      )

    if (error) {
      throw new Error(
        error.message,
      )
    }

    additionalSaleItems =
      (
        data ??
        []
      ) as unknown as SaleItemRow[]
  }

  /*
   * =========================================================
   * EXPENSES
   * =========================================================
   */
  const {
    data: expenseData,
    error: expenseError,
  } = await supabase
    .from('expenses')
    .select(`
      id,
      expense_no,
      expense_date,
      amount,
      payment_method,
      description,
      status,

      category:expense_categories (
        name
      ),

      staff:staff (
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
    .gte(
      'expense_date',
      range.startDate,
    )
    .lte(
      'expense_date',
      range.endDate,
    )
    .order(
      'expense_date',
      {
        ascending: false,
      },
    )

  if (expenseError) {
    throw new Error(
      expenseError.message,
    )
  }

  const expenses =
    (
      expenseData ??
      []
    ) as unknown as ExpenseRow[]

  /*
   * =========================================================
   * PURCHASES
   * =========================================================
   */
  const {
    data: purchaseData,
    error: purchaseError,
  } = await supabase
    .from('purchases')
    .select(`
      id,
      total,
      status,
      received_at
    `)
    .eq(
      'business_id',
      businessId,
    )
    .eq(
      'branch_id',
      branchId,
    )
    .neq(
      'status',
      'cancelled',
    )
    .gte(
      'received_at',
      startTimestamp,
    )
    .lte(
      'received_at',
      endTimestamp,
    )

  if (purchaseError) {
    throw new Error(
      purchaseError.message,
    )
  }

  const purchases =
    (
      purchaseData ??
      []
    ) as unknown as PurchaseRow[]

  /*
   * =========================================================
   * LOOKUP MAPS
   * =========================================================
   */
  const saleItemMap =
    new Map<
      string,
      SaleItemRow
    >()

  for (
    const item of
    [
      ...saleItems,
      ...additionalSaleItems,
    ]
  ) {
    saleItemMap.set(
      item.id,
      item,
    )
  }

  /*
   * Sale lookup is used to allocate header-level
   * order discounts to individual products.
   */
  const saleMap =
    new Map<
      string,
      SaleRow
    >()

  for (
    const sale of
    sales
  ) {
    saleMap.set(
      sale.id,
      sale,
    )
  }

  /*
   * Total sale-item value by sale.
   *
   * This is the allocation base for order discount.
   */
  const saleItemValueBySale =
    new Map<
      string,
      number
    >()

  for (
    const item of
    saleItems
  ) {
    const previous =
      saleItemValueBySale.get(
        item.sale_id,
      ) ?? 0

    saleItemValueBySale.set(
      item.sale_id,
      previous +
        numberValue(
          item.line_total,
        ),
    )
  }

  const returnedQuantityBySaleItem =
    new Map<
      string,
      number
    >()

  const returnedRefundBySaleItem =
    new Map<
      string,
      number
    >()

  const merchandiseReturnByReturnId =
    new Map<
      string,
      number
    >()

  for (
    const item of
    returnItems
  ) {
    const quantity =
      numberValue(
        item.quantity,
      )

    const merchandiseValue =
      numberValue(
        item.line_refund,
      )

    const previousQuantity =
      returnedQuantityBySaleItem.get(
        item.sale_item_id,
      ) ?? 0

    returnedQuantityBySaleItem.set(
      item.sale_item_id,
      previousQuantity +
        quantity,
    )

    const previousRefund =
      returnedRefundBySaleItem.get(
        item.sale_item_id,
      ) ?? 0

    returnedRefundBySaleItem.set(
      item.sale_item_id,
      previousRefund +
        merchandiseValue,
    )

    const previousReturnValue =
      merchandiseReturnByReturnId.get(
        item.return_id,
      ) ?? 0

    merchandiseReturnByReturnId.set(
      item.return_id,
      previousReturnValue +
        merchandiseValue,
    )
  }

  /*
   * =========================================================
   * FINANCIAL SUMMARY
   * =========================================================
   */

  const grossSales =
    sales.reduce(
      (
        sum,
        sale,
      ) =>
        sum +
        numberValue(
          sale.subtotal,
        ),
      0,
    )

  const discounts =
    sales.reduce(
      (
        sum,
        sale,
      ) =>
        sum +
        numberValue(
          sale.discount_amount,
        ),
      0,
    )

  const totalReturns =
    returnItems.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        numberValue(
          item.line_refund,
        ),
      0,
    )

  const netSales =
    Math.max(
      0,
      grossSales -
        discounts -
        totalReturns,
    )

  /*
   * =========================================================
   * COGS
   * =========================================================
   */

  const originalCostOfGoodsSold =
    saleItems.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        (
          numberValue(
            item.quantity,
          ) *
          numberValue(
            item.cost_price,
          )
        ),
      0,
    )

  let returnedCostOfGoodsSold =
    0

  for (
    const item of
    returnItems
  ) {
    const originalSaleItem =
      saleItemMap.get(
        item.sale_item_id,
      )

    if (!originalSaleItem) {
      continue
    }

    returnedCostOfGoodsSold +=
      numberValue(
        item.quantity,
      ) *
      numberValue(
        originalSaleItem.cost_price,
      )
  }

  const costOfGoodsSold =
    Math.max(
      0,
      originalCostOfGoodsSold -
        returnedCostOfGoodsSold,
    )

  const grossProfit =
    netSales -
    costOfGoodsSold

  /*
   * =========================================================
   * EXPENSES
   * =========================================================
   */
  const totalExpenses =
    expenses
      .filter(
        (expense) =>
          expense.status ===
          'completed',
      )
      .reduce(
        (
          sum,
          expense,
        ) =>
          sum +
          numberValue(
            expense.amount,
          ),
        0,
      )

  const operatingProfit =
    grossProfit -
    totalExpenses

  /*
   * =========================================================
   * PURCHASES
   * =========================================================
   */
  const totalPurchases =
    purchases.reduce(
      (
        sum,
        purchase,
      ) =>
        sum +
        numberValue(
          purchase.total,
        ),
      0,
    )

  /*
   * =========================================================
   * SALES REPORT ROWS
   * =========================================================
   */
  const salesRows:
    SalesReportRow[] =
    sales.map(
      (sale) => {
        const customer =
          firstRelation(
            sale.customer,
          )

        const staff =
          firstRelation(
            sale.staff,
          )

        return {
          saleId:
            sale.id,

          invoiceNo:
            sale.invoice_no,

          date:
            sale.created_at,

          customerName:
            customer?.name ??
            null,

          staffName:
            staff?.full_name ??
            null,

          subtotal:
            numberValue(
              sale.subtotal,
            ),

          discountAmount:
            numberValue(
              sale.discount_amount,
            ),

          taxAmount:
            numberValue(
              sale.tax_amount,
            ),

          total:
            numberValue(
              sale.total,
            ),

          paidAmount:
            numberValue(
              sale.paid_amount,
            ),

          balanceDue:
            numberValue(
              sale.balance_due,
            ),

          status:
            sale.status,
        }
      },
    )

  /*
   * =========================================================
   * EXPENSE REPORT ROWS
   * =========================================================
   */
  const expenseRows:
    ExpenseReportRow[] =
    expenses.map(
      (expense) => {
        const category =
          firstRelation(
            expense.category,
          )

        const staff =
          firstRelation(
            expense.staff,
          )

        return {
          expenseId:
            expense.id,

          expenseNo:
            expense.expense_no,

          date:
            expense.expense_date,

          categoryName:
            category?.name ??
            null,

          description:
            expense.description,

          paymentMethod:
            expense.payment_method,

          amount:
            numberValue(
              expense.amount,
            ),

          staffName:
            staff?.full_name ??
            null,

          status:
            expense.status,
        }
      },
    )

  /*
   * =========================================================
   * PAYMENT METHOD BREAKDOWN
   * =========================================================
   */
  const paymentMap =
    new Map<
      string,
      {
        amount: number
        transactionCount: number
      }
    >()

  for (
    const payment of
    payments
  ) {
    const method =
      payment.payment_method ||
      'other'

    const current =
      paymentMap.get(
        method,
      ) ?? {
        amount: 0,
        transactionCount: 0,
      }

    current.amount +=
      numberValue(
        payment.amount,
      )

    current.transactionCount +=
      1

    paymentMap.set(
      method,
      current,
    )
  }

  const paymentMethods:
    PaymentMethodSummary[] =
    Array.from(
      paymentMap.entries(),
    )
      .map(
        ([
          method,
          value,
        ]) => ({
          method,

          amount:
            value.amount,

          transactionCount:
            value.transactionCount,
        }),
      )
      .sort(
        (a, b) =>
          b.amount -
          a.amount,
      )

  /*
   * =========================================================
   * TOP SELLING PRODUCTS
   *
   * IMPORTANT FIX:
   *
   * Header-level sale discount is proportionally allocated
   * to products based on each item's line_total.
   *
   * Example:
   *
   * Sale line totals:
   *   Product A = 600
   *   Product B = 400
   *
   * Order discount = 100
   *
   * Allocation:
   *   Product A = 60
   *   Product B = 40
   *
   * This ensures:
   *
   * SUM(product net sales)
   * =
   * Report summary net sales
   * =========================================================
   */
  const productMap =
    new Map<
      string,
      TopSellingProduct
    >()

  for (
    const item of
    saleItems
  ) {
    const soldQuantity =
      numberValue(
        item.quantity,
      )

    const returnedQuantity =
      returnedQuantityBySaleItem.get(
        item.id,
      ) ?? 0

    const returnedRefund =
      returnedRefundBySaleItem.get(
        item.id,
      ) ?? 0

    const netQuantity =
      Math.max(
        0,
        soldQuantity -
          returnedQuantity,
      )

    const lineGross =
      soldQuantity *
      numberValue(
        item.unit_price,
      )

    const lineDiscount =
      numberValue(
        item.discount_amount,
      )

    const lineTotal =
      numberValue(
        item.line_total,
      )

    /*
     * Header / order-level discount allocation
     */
    const sale =
      saleMap.get(
        item.sale_id,
      )

    const saleOrderDiscount =
      numberValue(
        sale?.discount_amount,
      )

    const saleItemValue =
      saleItemValueBySale.get(
        item.sale_id,
      ) ?? 0

    let allocatedOrderDiscount =
      0

    if (
      saleOrderDiscount >
        0 &&
      saleItemValue >
        0
    ) {
      allocatedOrderDiscount =
        saleOrderDiscount *
        (
          lineTotal /
          saleItemValue
        )
    }

    /*
     * Total discount attributed to this product line:
     *
     * 1. item-level discount
     * 2. proportional order-level discount
     */
    const totalLineDiscount =
      lineDiscount +
      allocatedOrderDiscount

    /*
     * Net sales:
     *
     * line_total
     * - allocated order discount
     * - merchandise returns
     *
     * line_total already contains item-level discount,
     * therefore lineDiscount is NOT subtracted again here.
     */
    const lineNet =
      Math.max(
        0,
        lineTotal -
          allocatedOrderDiscount -
          returnedRefund,
      )

    const lineCost =
      netQuantity *
      numberValue(
        item.cost_price,
      )

    const current =
      productMap.get(
        item.product_id,
      ) ?? {
        productId:
          item.product_id,

        productName:
          item.product_name,

        sku:
          null,

        barcode:
          item.barcode,

        quantitySold:
          0,

        grossSales:
          0,

        discountAmount:
          0,

        netSales:
          0,

        costOfGoodsSold:
          0,

        grossProfit:
          0,
      }

    current.quantitySold +=
      netQuantity

    current.grossSales +=
      lineGross

    current.discountAmount +=
      totalLineDiscount

    current.netSales +=
      lineNet

    current.costOfGoodsSold +=
      lineCost

    current.grossProfit =
      current.netSales -
      current.costOfGoodsSold

    productMap.set(
      item.product_id,
      current,
    )
  }

  const topProducts =
    Array.from(
      productMap.values(),
    )
      .filter(
        (product) =>
          product.quantitySold >
          0,
      )
      .sort(
        (a, b) =>
          b.netSales -
          a.netSales,
      )
      .slice(
        0,
        10,
      )

  /*
   * =========================================================
   * DAILY REPORT
   * =========================================================
   */
  const dates =
    createDateList(
      range.startDate,
      range.endDate,
    )

  const dailyMap =
    new Map<
      string,
      DailyReportPoint
    >()

  for (
    const date of
    dates
  ) {
    dailyMap.set(
      date,
      {
        date,

        sales: 0,
        returns: 0,
        expenses: 0,
        profit: 0,
      },
    )
  }

  /*
   * =========================================================
   * DAILY SALES
   * =========================================================
   */
  const saleDateMap =
    new Map<
      string,
      string
    >()

  for (
    const sale of
    sales
  ) {
    const date =
      colomboDateFromTimestamp(
        sale.created_at,
      )

    saleDateMap.set(
      sale.id,
      date,
    )

    const point =
      dailyMap.get(
        date,
      )

    if (!point) {
      continue
    }

    const saleValue =
      numberValue(
        sale.subtotal,
      ) -
      numberValue(
        sale.discount_amount,
      )

    point.sales +=
      saleValue

    point.profit +=
      saleValue
  }

  /*
   * =========================================================
   * DAILY ORIGINAL COGS
   * =========================================================
   */
  for (
    const item of
    saleItems
  ) {
    const date =
      saleDateMap.get(
        item.sale_id,
      )

    if (!date) {
      continue
    }

    const point =
      dailyMap.get(
        date,
      )

    if (!point) {
      continue
    }

    point.profit -=
      numberValue(
        item.quantity,
      ) *
      numberValue(
        item.cost_price,
      )
  }

  /*
   * =========================================================
   * DAILY RETURNS
   * =========================================================
   */
  const returnDateMap =
    new Map<
      string,
      string
    >()

  for (
    const item of
    returns
  ) {
    const date =
      colomboDateFromTimestamp(
        item.created_at,
      )

    returnDateMap.set(
      item.id,
      date,
    )

    const point =
      dailyMap.get(
        date,
      )

    if (!point) {
      continue
    }

    const merchandiseReturn =
      merchandiseReturnByReturnId.get(
        item.id,
      ) ?? 0

    point.returns +=
      merchandiseReturn

    point.profit -=
      merchandiseReturn
  }

  /*
   * =========================================================
   * RESTORE RETURNED COGS
   * =========================================================
   */
  for (
    const item of
    returnItems
  ) {
    const date =
      returnDateMap.get(
        item.return_id,
      )

    const originalSaleItem =
      saleItemMap.get(
        item.sale_item_id,
      )

    if (
      !date ||
      !originalSaleItem
    ) {
      continue
    }

    const point =
      dailyMap.get(
        date,
      )

    if (!point) {
      continue
    }

    point.profit +=
      numberValue(
        item.quantity,
      ) *
      numberValue(
        originalSaleItem.cost_price,
      )
  }

  /*
   * =========================================================
   * DAILY EXPENSES
   * =========================================================
   */
  for (
    const expense of
    expenses
  ) {
    if (
      expense.status !==
      'completed'
    ) {
      continue
    }

    const point =
      dailyMap.get(
        expense.expense_date,
      )

    if (!point) {
      continue
    }

    const value =
      numberValue(
        expense.amount,
      )

    point.expenses +=
      value

    point.profit -=
      value
  }

  const daily =
    Array.from(
      dailyMap.values(),
    )

  /*
   * =========================================================
   * FINAL RESULT
   * =========================================================
   */
  return {
    summary: {
      grossSales,

      discounts,

      returns:
        totalReturns,

      netSales,

      costOfGoodsSold,

      grossProfit,

      expenses:
        totalExpenses,

      operatingProfit,

      purchases:
        totalPurchases,

      transactionCount:
        sales.length,

      returnedTransactionCount:
        returns.length,
    },

    paymentMethods,

    topProducts,

    sales:
      salesRows,

    expenses:
      expenseRows,

    daily,
  }
}

/* =========================================================
   BUSINESS CASH SUMMARY
========================================================= */

export interface BusinessCashSummary {
  salePayments: number
  cashSalePayments: number
  cardSalePayments: number
  qrSalePayments: number
  bankSalePayments: number

  customerPayments: number
  customerCashPayments: number

  creditCreated: number

  refunds: number
  cashRefunds: number

  cashIn: number
  cashOut: number

  closedShiftCount: number
  emergencyCloseCount: number

  shiftOpeningCash: number
  shiftExpectedCash: number
  shiftActualCash: number
  shiftDifference: number
}

interface BusinessSummaryPaymentRow {
  payment_method: string
  amount: number | string
}

interface BusinessSummaryCustomerPaymentRow {
  payment_method: string
  amount: number | string
}

interface BusinessSummarySaleRow {
  status: string
  balance_due: number | string
}

interface BusinessSummaryReturnRow {
  refund_method: string | null
  refund_amount: number | string
}

interface BusinessSummaryDrawerRow {
  movement_type: string
  amount: number | string
}

interface BusinessSummaryShiftRow {
  opening_cash: number | string
  expected_cash: number | string | null
  closing_cash: number | string | null
  cash_difference: number | string | null
  close_type: string | null
}

export async function getBusinessCashSummary(
  businessId: string,
  branchId: string,
  range: ReportDateRange,
): Promise<BusinessCashSummary> {
  if (!businessId) {
    throw new Error(
      'Business is required for cash summary.',
    )
  }

  if (!branchId) {
    throw new Error(
      'Branch is required for cash summary.',
    )
  }

  if (
    !range.startDate ||
    !range.endDate
  ) {
    throw new Error(
      'Report date range is required for cash summary.',
    )
  }

  if (
    range.startDate >
    range.endDate
  ) {
    throw new Error(
      'Start date cannot be after end date.',
    )
  }

  const startTimestamp =
    colomboTimestampStart(
      range.startDate,
    )

  const endTimestamp =
    colomboTimestampEnd(
      range.endDate,
    )

  const [
    salePaymentResult,
    customerPaymentResult,
    saleResult,
    returnResult,
    drawerResult,
    shiftResult,
  ] = await Promise.all([
    supabase
      .from('payments')
      .select(`
        payment_method,
        amount
      `)
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .gte(
        'created_at',
        startTimestamp,
      )
      .lte(
        'created_at',
        endTimestamp,
      ),

    supabase
      .from('customer_payments')
      .select(`
        payment_method,
        amount
      `)
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .gte(
        'received_at',
        startTimestamp,
      )
      .lte(
        'received_at',
        endTimestamp,
      ),

    supabase
      .from('sales')
      .select(`
        status,
        balance_due
      `)
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .neq(
        'status',
        'cancelled',
      )
      .gte(
        'created_at',
        startTimestamp,
      )
      .lte(
        'created_at',
        endTimestamp,
      ),

    supabase
      .from('returns')
      .select(`
        refund_method,
        refund_amount
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
        'completed',
      )
      .gte(
        'created_at',
        startTimestamp,
      )
      .lte(
        'created_at',
        endTimestamp,
      ),

    supabase
      .from('cash_drawer_movements')
      .select(`
        movement_type,
        amount
      `)
      .eq(
        'business_id',
        businessId,
      )
      .eq(
        'branch_id',
        branchId,
      )
      .gte(
        'created_at',
        startTimestamp,
      )
      .lte(
        'created_at',
        endTimestamp,
      ),

    supabase
      .from('cashier_shifts')
      .select(`
        opening_cash,
        expected_cash,
        closing_cash,
        cash_difference,
        close_type
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
        'closed',
      )
      .gte(
        'closed_at',
        startTimestamp,
      )
      .lte(
        'closed_at',
        endTimestamp,
      ),
  ])

  if (salePaymentResult.error) {
    throw new Error(
      salePaymentResult.error.message,
    )
  }

  if (customerPaymentResult.error) {
    throw new Error(
      customerPaymentResult.error.message,
    )
  }

  if (saleResult.error) {
    throw new Error(
      saleResult.error.message,
    )
  }

  if (returnResult.error) {
    throw new Error(
      returnResult.error.message,
    )
  }

  if (drawerResult.error) {
    throw new Error(
      drawerResult.error.message,
    )
  }

  if (shiftResult.error) {
    throw new Error(
      shiftResult.error.message,
    )
  }

  const salePayments =
    (
      salePaymentResult.data ??
      []
    ) as BusinessSummaryPaymentRow[]

  const customerPayments =
    (
      customerPaymentResult.data ??
      []
    ) as BusinessSummaryCustomerPaymentRow[]

  const sales =
    (
      saleResult.data ??
      []
    ) as BusinessSummarySaleRow[]

  const returns =
    (
      returnResult.data ??
      []
    ) as BusinessSummaryReturnRow[]

  const drawerMovements =
    (
      drawerResult.data ??
      []
    ) as BusinessSummaryDrawerRow[]

  const shifts =
    (
      shiftResult.data ??
      []
    ) as BusinessSummaryShiftRow[]

  let totalSalePayments = 0
  let cashSalePayments = 0
  let cardSalePayments = 0
  let qrSalePayments = 0
  let bankSalePayments = 0

  for (
    const payment of
    salePayments
  ) {
    const amount =
      numberValue(
        payment.amount,
      )

    totalSalePayments +=
      amount

    switch (
      payment.payment_method
    ) {
      case 'cash':
        cashSalePayments +=
          amount
        break

      case 'card':
        cardSalePayments +=
          amount
        break

      case 'qr':
        qrSalePayments +=
          amount
        break

      case 'bank':
      case 'bank_transfer':
        bankSalePayments +=
          amount
        break

      default:
        break
    }
  }

  const totalCustomerPayments =
    customerPayments.reduce(
      (
        total,
        payment,
      ) =>
        total +
        numberValue(
          payment.amount,
        ),
      0,
    )

  const customerCashPayments =
    customerPayments
      .filter(
        (payment) =>
          payment.payment_method ===
          'cash',
      )
      .reduce(
        (
          total,
          payment,
        ) =>
          total +
          numberValue(
            payment.amount,
          ),
        0,
      )

  const creditCreated =
    sales
      .filter(
        (sale) =>
          sale.status ===
            'credit' ||
          sale.status ===
            'partially_paid',
      )
      .reduce(
        (
          total,
          sale,
        ) =>
          total +
          numberValue(
            sale.balance_due,
          ),
        0,
      )

  const refunds =
    returns.reduce(
      (
        total,
        item,
      ) =>
        total +
        numberValue(
          item.refund_amount,
        ),
      0,
    )

  const cashRefunds =
    returns
      .filter(
        (item) =>
          item.refund_method ===
          'cash',
      )
      .reduce(
        (
          total,
          item,
        ) =>
          total +
          numberValue(
            item.refund_amount,
          ),
        0,
      )

  let cashIn = 0
  let cashOut = 0

  for (
    const movement of
    drawerMovements
  ) {
    const amount =
      numberValue(
        movement.amount,
      )

    if (
      movement.movement_type ===
      'cash_in'
    ) {
      cashIn +=
        amount
    } else if (
      movement.movement_type ===
      'cash_out'
    ) {
      cashOut +=
        amount
    }
  }

  const shiftOpeningCash =
    shifts.reduce(
      (
        total,
        shift,
      ) =>
        total +
        numberValue(
          shift.opening_cash,
        ),
      0,
    )

  const shiftExpectedCash =
    shifts.reduce(
      (
        total,
        shift,
      ) =>
        total +
        numberValue(
          shift.expected_cash,
        ),
      0,
    )

  const shiftActualCash =
    shifts.reduce(
      (
        total,
        shift,
      ) =>
        total +
        numberValue(
          shift.closing_cash,
        ),
      0,
    )

  const shiftDifference =
    shifts.reduce(
      (
        total,
        shift,
      ) =>
        total +
        numberValue(
          shift.cash_difference,
        ),
      0,
    )

  const emergencyCloseCount =
    shifts.filter(
      (shift) =>
        shift.close_type ===
        'emergency',
    ).length

  return {
    salePayments:
      totalSalePayments,

    cashSalePayments,

    cardSalePayments,

    qrSalePayments,

    bankSalePayments,

    customerPayments:
      totalCustomerPayments,

    customerCashPayments,

    creditCreated,

    refunds,

    cashRefunds,

    cashIn,

    cashOut,

    closedShiftCount:
      shifts.length,

    emergencyCloseCount,

    shiftOpeningCash,

    shiftExpectedCash,

    shiftActualCash,

    shiftDifference,
  }
}

/* =========================================================
   RECEIVABLES & PAYABLES SUMMARY
========================================================= */

export interface ReceivablesPayablesSummary {
  customerReceivables: number
  supplierPayables: number
  netCreditPosition: number

  creditCustomerCount: number
  payableSupplierCount: number
}

interface CustomerBalanceRow {
  outstanding_balance:
    | number
    | string

  is_active: boolean
}

interface SupplierBalanceRow {
  outstanding_balance:
    | number
    | string

  is_active: boolean
}

export async function getReceivablesPayablesSummary(
  businessId: string,
): Promise<ReceivablesPayablesSummary> {
  if (!businessId) {
    throw new Error(
      'Business is required for receivables and payables summary.',
    )
  }

  const [
    customerResult,
    supplierResult,
  ] = await Promise.all([
    supabase
      .from('customers')
      .select(`
        outstanding_balance,
        is_active
      `)
      .eq(
        'business_id',
        businessId,
      ),

    supabase
      .from('suppliers')
      .select(`
        outstanding_balance,
        is_active
      `)
      .eq(
        'business_id',
        businessId,
      ),
  ])

  if (customerResult.error) {
    throw new Error(
      customerResult.error.message,
    )
  }

  if (supplierResult.error) {
    throw new Error(
      supplierResult.error.message,
    )
  }

  const customers =
    (
      customerResult.data ??
      []
    ) as CustomerBalanceRow[]

  const suppliers =
    (
      supplierResult.data ??
      []
    ) as SupplierBalanceRow[]

  const customerReceivables =
    customers.reduce(
      (
        total,
        customer,
      ) =>
        total +
        Math.max(
          0,
          numberValue(
            customer.outstanding_balance,
          ),
        ),
      0,
    )

  const supplierPayables =
    suppliers.reduce(
      (
        total,
        supplier,
      ) =>
        total +
        Math.max(
          0,
          numberValue(
            supplier.outstanding_balance,
          ),
        ),
      0,
    )

  const creditCustomerCount =
    customers.filter(
      (customer) =>
        customer.is_active &&
        numberValue(
          customer.outstanding_balance,
        ) > 0,
    ).length

  const payableSupplierCount =
    suppliers.filter(
      (supplier) =>
        supplier.is_active &&
        numberValue(
          supplier.outstanding_balance,
        ) > 0,
    ).length

  const netCreditPosition =
    customerReceivables -
    supplierPayables

  return {
    customerReceivables,
    supplierPayables,
    netCreditPosition,
    creditCustomerCount,
    payableSupplierCount,
  }
}