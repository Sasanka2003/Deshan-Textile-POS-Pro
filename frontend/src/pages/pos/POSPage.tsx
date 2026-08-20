import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Barcode,
  CheckCircle2,
  Clock,
  CreditCard,
  Landmark,
  LockKeyhole,
  ListRestart,
  Minus,
  Pause,
  Play,
  Plus,
  QrCode,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'

import AppLayout from '../../layouts/AppLayout'
import { useAuth } from '../../contexts/AuthContext'

import SaleReceiptModal from '../../components/sales/SaleReceiptModal'

import {
  getPOSProducts,
  type POSProduct,
} from '../../services/posService'

import {
  getSales,
} from '../../services/saleService'

import {
  completeSaleWithOfflineFallback,
} from '../../services/offlineSaleService'

import {
  deleteHeldBill,
  getHeldBills,
  saveHeldBill,
} from '../../services/heldBillService'

import type {
  HeldBill,
} from '../../types/heldBill'

import {
  getSaleInvoice,
} from '../../services/salesHistoryService'

import {
  getCustomers,
} from '../../services/customerService'

import {
  getCustomerBalance,
} from '../../services/customerPaymentService'

import {
  getBusinessSettings,
} from '../../services/settingsService'

import {
  closeShift,
  getCurrentShift,
  getShiftCashSummary,
  openShift,
} from '../../services/shiftService'

import {
  createCashDrawerMovement,
  getShiftCashDrawerMovements,
  type CashDrawerMovement,
  type CashDrawerMovementType,
} from '../../services/cashDrawerService'

import type {
  CashierShift,
  ShiftCashSummary,
} from '../../types/shift'

import { createId } from '../../utils/createId'

import type {
  Customer,
} from '../../types/customer'

import type {
  SaleCartItem,
  SalePaymentMethod,
  SaleType,
} from '../../types/sale'

import type {
  SaleInvoiceDetail,
} from '../../types/salesHistory'

import '../../styles/pos.css'

function money(value: number) {
  return `Rs. ${value.toLocaleString(
    'en-LK',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`
}

function safeNumber(value: string) {
  const parsed =
    Number(value)

  return Number.isFinite(parsed)
    ? parsed
    : 0
}

export default function POSPage() {
  const { staff } =
    useAuth()

  const businessId =
    staff?.businessId

  const branchId =
    staff?.branchId

  const [
    products,
    setProducts,
  ] = useState<POSProduct[]>([])

  const [
    customers,
    setCustomers,
  ] = useState<Customer[]>([])

  const [
    cart,
    setCart,
  ] = useState<SaleCartItem[]>([])

  const [
    defaultSaleType,
    setDefaultSaleType,
  ] =
    useState<SaleType>('retail')

  const [
    defaultPaymentMethod,
    setDefaultPaymentMethod,
  ] =
    useState<SalePaymentMethod>(
      'cash',
    )

  const [
    terminalName,
    setTerminalName,
  ] =
    useState(
      'POS Terminal 01',
    )

  const [
    currentShift,
    setCurrentShift,
  ] =
    useState<CashierShift | null>(
      null,
    )

  const [
    shiftLoading,
    setShiftLoading,
  ] =
    useState(false)

  const [
    openShiftOpen,
    setOpenShiftOpen,
  ] =
    useState(false)

  const [
    closeShiftOpen,
    setCloseShiftOpen,
  ] =
    useState(false)

  const [
    openingCash,
    setOpeningCash,
  ] =
    useState('0')

  const [
    openingNote,
    setOpeningNote,
  ] =
    useState('')

  const [
    closingCash,
    setClosingCash,
  ] =
    useState('')

  const [
    closingNote,
    setClosingNote,
  ] =
    useState('')

  const [
    shiftSummary,
    setShiftSummary,
  ] =
    useState<ShiftCashSummary | null>(
      null,
    )


  const [
    cashDrawerOpen,
    setCashDrawerOpen,
  ] = useState(false)

  const [
    cashMovementType,
    setCashMovementType,
  ] =
    useState<CashDrawerMovementType>(
      'cash_in',
    )

  const [
    cashMovementAmount,
    setCashMovementAmount,
  ] = useState('')

  const [
    cashMovementReason,
    setCashMovementReason,
  ] = useState('')

  const [
    cashMovementReference,
    setCashMovementReference,
  ] = useState('')

  const [
    cashMovementSaving,
    setCashMovementSaving,
  ] = useState(false)

  const [
    cashMovements,
    setCashMovements,
  ] = useState<CashDrawerMovement[]>([])

  const [
    saleType,
    setSaleType,
  ] =
    useState<SaleType>('retail')

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    customerId,
    setCustomerId,
  ] = useState('')

  const [
    customerBalance,
    setCustomerBalance,
  ] = useState(0)

  const [
    orderDiscount,
    setOrderDiscount,
  ] = useState(0)

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<SalePaymentMethod>(
      'cash',
    )

  const [
    paidAmount,
    setPaidAmount,
  ] = useState('')

  const [
    paymentReference,
    setPaymentReference,
  ] = useState('')

  const [
    notes,
    setNotes,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    receiptLoading,
    setReceiptLoading,
  ] = useState(false)

  const [
    receiptInvoice,
    setReceiptInvoice,
  ] =
    useState<
      SaleInvoiceDetail | null
    >(null)

  const [
    error,
    setError,
  ] = useState('')

  const [
    success,
    setSuccess,
  ] = useState('')

  const [
    transactionId,
    setTransactionId,
  ] = useState(
    () => createId(),
  )

  const [
    heldBills,
    setHeldBills,
  ] = useState<HeldBill[]>([])

  const [
    heldBillsOpen,
    setHeldBillsOpen,
  ] = useState(false)

  const [
    heldLoading,
    setHeldLoading,
  ] = useState(false)

  const [
    holding,
    setHolding,
  ] = useState(false)

  const [
    activeHeldBillId,
    setActiveHeldBillId,
  ] = useState<string | null>(
    null,
  )

  const availableHeldBills =
    useMemo(
      () =>
        heldBills.filter(
          (heldBill) =>
            heldBill.id !==
            activeHeldBillId,
        ),
      [
        heldBills,
        activeHeldBillId,
      ],
    )

  const searchRef =
    useRef<HTMLInputElement>(
      null,
    )

  async function loadPOSData() {
    if (
      !businessId ||
      !branchId
    ) {
      return
    }

    try {
      setLoading(true)
      setError('')

      const [
        productData,
        customerData,
        heldBillData,
        settingsData,
        shiftData,
      ] =
        await Promise.all([
          getPOSProducts(
            branchId,
          ),

          getCustomers(
            businessId,
          ),

          getHeldBills(
            businessId,
            branchId,
          ),

          getBusinessSettings(
            businessId,
            branchId,
          ),

          staff?.id
            ? getCurrentShift(
                businessId,
                branchId,
                staff.id,
              )
            : Promise.resolve(
                null,
              ),
        ])

      setProducts(
        productData,
      )

      setCustomers(
        customerData.filter(
          (customer) =>
            customer.isActive,
        ),
      )

      setHeldBills(
        heldBillData,
      )

      const nextDefaultSaleType:
        SaleType =
          settingsData?.defaultSaleType ??
          'retail'

      const nextDefaultPaymentMethod:
        SalePaymentMethod =
          settingsData?.defaultPaymentMethod ??
          'cash'

      setDefaultSaleType(
        nextDefaultSaleType,
      )

      setDefaultPaymentMethod(
        nextDefaultPaymentMethod,
      )

      setTerminalName(
        settingsData?.terminalName ??
          'POS Terminal 01',
      )

      setCurrentShift(
        shiftData,
      )

      if (
        cart.length ===
          0 &&
        !activeHeldBillId
      ) {
        setSaleType(
          nextDefaultSaleType,
        )

        setPaymentMethod(
          nextDefaultPaymentMethod,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load POS data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPOSData()
  }, [
    businessId,
    branchId,
    staff?.id,
  ])

  useEffect(() => {
    if (!customerId) {
      setCustomerBalance(0)
      return
    }

    async function loadBalance() {
      try {
        const balance =
          await getCustomerBalance(
            customerId,
          )

        setCustomerBalance(
          balance,
        )
      } catch {
        setCustomerBalance(
          0,
        )
      }
    }

    void loadBalance()
  }, [customerId])


  useEffect(() => {
    const currentShiftId =
      currentShift?.id

    if (!currentShiftId) {
      setCashMovements([])
      return
    }

    const shiftId: string =
      currentShiftId

    let active =
      true

    async function loadMovements() {
      try {
        const movements =
          await getShiftCashDrawerMovements(
            shiftId,
          )

        if (!active) {
          return
        }

        setCashMovements(
          movements,
        )
      } catch (err) {
        console.error(
          'Unable to load cash drawer movements:',
          err,
        )
      }
    }

    void loadMovements()

    return () => {
      active =
        false
    }
  }, [currentShift?.id])

  const cashMovementTotals =
    useMemo(
      () =>
        cashMovements.reduce(
          (
            totals,
            movement,
          ) => {
            if (
              movement.movementType ===
              'cash_in'
            ) {
              totals.cashIn +=
                movement.amount
            } else {
              totals.cashOut +=
                movement.amount
            }

            return totals
          },
          {
            cashIn: 0,
            cashOut: 0,
          },
        ),
      [cashMovements],
    )

  const selectedCustomer =
    useMemo(
      () =>
        customers.find(
          (customer) =>
            customer.id ===
            customerId,
        ) ?? null,
      [
        customers,
        customerId,
      ],
    )

  const filteredProducts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      if (!query) {
        return products.slice(
          0,
          12,
        )
      }

      return products.filter(
        (product) =>
          [
            product.name,
            product.sku,
            product.barcode,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  query,
                ),
            ),
      )
    }, [
      products,
      search,
    ])

  const subtotal =
    useMemo(
      () =>
        cart.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            Math.max(
              0,

              item.quantity *
                item.unitPrice -
                item.discountAmount,
            ),
          0,
        ),
      [cart],
    )

  const total =
    Math.max(
      0,
      subtotal -
        orderDiscount,
    )

  const numericPaid =
    safeNumber(
      paidAmount,
    )

  const effectivePaid =
    paymentMethod ===
    'cash'
      ? Math.min(
          numericPaid,
          total,
        )
      : numericPaid

  const balanceDue =
    Math.max(
      0,
      total -
        effectivePaid,
    )

  const changeAmount =
    paymentMethod ===
    'cash'
      ? Math.max(
          0,
          numericPaid -
            total,
        )
      : 0

  const creditAvailable =
    selectedCustomer
      ? Math.max(
          0,

          selectedCustomer.creditLimit -
            customerBalance,
        )
      : 0

  function getProductPrice(
    product: POSProduct,
  ) {
    return saleType ===
      'wholesale'
      ? product.wholesalePrice
      : product.retailPrice
  }

  function addProduct(
    product: POSProduct,
  ) {
    setError('')
    setSuccess('')

    setCart(
      (current) => {
        const existing =
          current.find(
            (item) =>
              item.productId ===
              product.id,
          )

        if (existing) {
          if (
            existing.quantity +
              1 >
            existing.availableStock
          ) {
            setError(
              `Not enough stock for ${product.name}.`,
            )

            return current
          }

          return current.map(
            (item) =>
              item.productId ===
              product.id
                ? {
                    ...item,

                    quantity:
                      item.quantity +
                      1,
                  }
                : item,
          )
        }

        if (
          product.quantity <=
          0
        ) {
          setError(
            `${product.name} is out of stock.`,
          )

          return current
        }

        return [
          ...current,

          {
            productId:
              product.id,

            productName:
              product.name,

            sku:
              product.sku,

            barcode:
              product.barcode,

            unit:
              product.unit,

            quantity: 1,

            unitPrice:
              getProductPrice(
                product,
              ),

            discountAmount:
              0,

            availableStock:
              product.quantity,
          },
        ]
      },
    )

    setSearch('')

    requestAnimationFrame(
      () => {
        searchRef.current?.focus()
      },
    )
  }

  function updateQuantity(
    productId: string,
    quantity: number,
  ) {
    if (
      !Number.isFinite(
        quantity,
      )
    ) {
      return
    }

    setCart(
      (current) =>
        current.map(
          (item) => {
            if (
              item.productId !==
              productId
            ) {
              return item
            }

            const safeQuantity =
              Math.min(
                Math.max(
                  quantity,
                  0.001,
                ),

                item.availableStock,
              )

            return {
              ...item,

              quantity:
                safeQuantity,
            }
          },
        ),
    )
  }

  function changeQuantity(
    productId: string,
    delta: number,
  ) {
    const item =
      cart.find(
        (cartItem) =>
          cartItem.productId ===
          productId,
      )

    if (!item) {
      return
    }

    const nextQuantity =
      item.quantity +
      delta

    if (
      nextQuantity <=
      0
    ) {
      removeProduct(
        productId,
      )

      return
    }

    updateQuantity(
      productId,
      nextQuantity,
    )
  }

  function updateDiscount(
    productId: string,
    discount: number,
  ) {
    if (
      !Number.isFinite(
        discount,
      )
    ) {
      return
    }

    setCart(
      (current) =>
        current.map(
          (item) => {
            if (
              item.productId !==
              productId
            ) {
              return item
            }

            const maxDiscount =
              item.quantity *
              item.unitPrice

            return {
              ...item,

              discountAmount:
                Math.min(
                  Math.max(
                    discount,
                    0,
                  ),

                  maxDiscount,
                ),
            }
          },
        ),
    )
  }

  function removeProduct(
    productId: string,
  ) {
    setCart(
      (current) =>
        current.filter(
          (item) =>
            item.productId !==
            productId,
        ),
    )
  }

  function clearSale() {
    setCart([])

    setCustomerId('')
    setCustomerBalance(0)

    setOrderDiscount(0)

    setPaidAmount('')

    setSaleType(
      defaultSaleType,
    )

    setPaymentMethod(
      defaultPaymentMethod,
    )

    setPaymentReference(
      '',
    )

    setNotes('')
    setSearch('')

    setTransactionId(
      createId(),
    )

    setActiveHeldBillId(
      null,
    )
  }

  async function handleHoldSale() {
    if (
      !businessId ||
      !branchId ||
      !staff?.id
    ) {
      setError(
        'Business, branch or staff information is unavailable.',
      )
      return
    }

    if (cart.length === 0) {
      setError(
        'Add products before holding the bill.',
      )
      return
    }

    try {
      setHolding(true)
      setError('')
      setSuccess('')

      const saved =
        await saveHeldBill(
          {
            businessId,
            branchId,
            staffId:
              staff.id,

            customerId:
              customerId ||
              null,

            saleType,

            items:
              cart.map(
                (item) => ({
                  productId:
                    item.productId,

                  quantity:
                    item.quantity,

                  discountAmount:
                    item.discountAmount,
                }),
              ),

            orderDiscount,

            paymentMethod,

            paidAmount:
              safeNumber(
                paidAmount,
              ),

            paymentReference:
              paymentReference
                .trim() ||
              null,

            notes:
              notes.trim() ||
              null,
          },
          activeHeldBillId,
        )

      setHeldBills(
        (current) => {
          const withoutSaved =
            current.filter(
              (item) =>
                item.id !==
                saved.id,
            )

          return [
            saved,
            ...withoutSaved,
          ]
        },
      )

      setSuccess(
        `${saved.holdNo} held successfully.`,
      )

      clearSale()

      requestAnimationFrame(
        () => {
          searchRef.current?.focus()
        },
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to hold bill.',
      )
    } finally {
      setHolding(false)
    }
  }

  async function handleResumeHeldBill(
    heldBill: HeldBill,
  ) {
    if (
      !businessId ||
      !branchId
    ) {
      return
    }

    try {
      setHeldLoading(true)
      setError('')
      setSuccess('')

      const [
        freshProducts,
        freshCustomers,
      ] =
        await Promise.all([
          getPOSProducts(
            branchId,
          ),

          getCustomers(
            businessId,
          ),
        ])

      const activeCustomers =
        freshCustomers.filter(
          (customer) =>
            customer.isActive,
        )

      const restoredCart:
        SaleCartItem[] = []

      const warnings:
        string[] = []

      for (
        const heldItem of
        heldBill.items
      ) {
        const product =
          freshProducts.find(
            (item) =>
              item.id ===
              heldItem.productId,
          )

        if (!product) {
          warnings.push(
            'A held product is no longer available.',
          )
          continue
        }

        if (
          product.quantity <=
          0
        ) {
          warnings.push(
            `${product.name} is now out of stock.`,
          )
          continue
        }

        const quantity =
          Math.min(
            heldItem.quantity,
            product.quantity,
          )

        if (
          quantity <
          heldItem.quantity
        ) {
          warnings.push(
            `${product.name} quantity was reduced to available stock.`,
          )
        }

        const unitPrice =
          heldBill.saleType ===
            'wholesale'
            ? product.wholesalePrice
            : product.retailPrice

        const maxDiscount =
          quantity *
          unitPrice

        restoredCart.push({
          productId:
            product.id,

          productName:
            product.name,

          sku:
            product.sku,

          barcode:
            product.barcode,

          unit:
            product.unit,

          quantity,

          unitPrice,

          discountAmount:
            Math.min(
              Math.max(
                heldItem.discountAmount,
                0,
              ),
              maxDiscount,
            ),

          availableStock:
            product.quantity,
        })
      }

      if (
        restoredCart.length ===
        0
      ) {
        throw new Error(
          'None of the held products are currently available.',
        )
      }

      setProducts(
        freshProducts,
      )

      setCustomers(
        activeCustomers,
      )

      setCart(
        restoredCart,
      )

      setSaleType(
        heldBill.saleType,
      )

      const customerStillActive =
        heldBill.customerId
          ? activeCustomers.some(
              (customer) =>
                customer.id ===
                heldBill.customerId,
            )
          : false

      setCustomerId(
        customerStillActive
          ? heldBill.customerId ??
              ''
          : '',
      )

      setOrderDiscount(
        heldBill.orderDiscount,
      )

      setPaymentMethod(
        heldBill.paymentMethod,
      )

      setPaidAmount(
        heldBill.paidAmount >
          0
          ? String(
              heldBill.paidAmount,
            )
          : '',
      )

      setPaymentReference(
        heldBill.paymentReference ??
          '',
      )

      setNotes(
        heldBill.notes ??
          '',
      )

      setTransactionId(
        createId(),
      )

      setActiveHeldBillId(
        heldBill.id,
      )

      setHeldBillsOpen(
        false,
      )

      setSuccess(
        warnings.length >
          0
          ? `${heldBill.holdNo} resumed. ${warnings.join(
              ' ',
            )}`
          : `${heldBill.holdNo} resumed successfully.`,
      )

      requestAnimationFrame(
        () => {
          searchRef.current?.focus()
        },
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to resume held bill.',
      )
    } finally {
      setHeldLoading(false)
    }
  }

  async function handleDeleteHeldBill(
    heldBill: HeldBill,
  ) {
    if (
      !businessId ||
      !branchId
    ) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete ${heldBill.holdNo}?`,
      )

    if (!confirmed) {
      return
    }

    try {
      setHeldLoading(true)
      setError('')

      await deleteHeldBill(
        heldBill.id,
        businessId,
        branchId,
      )

      setHeldBills(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              heldBill.id,
          ),
      )

      if (
        activeHeldBillId ===
        heldBill.id
      ) {
        setActiveHeldBillId(
          null,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete held bill.',
      )
    } finally {
      setHeldLoading(false)
    }
  }

  async function refreshCashDrawerData(
    shift: CashierShift,
  ) {
    const [
      movements,
      summary,
    ] = await Promise.all([
      getShiftCashDrawerMovements(
        shift.id,
      ),

      getShiftCashSummary(
        shift,
      ),
    ])

    setCashMovements(
      movements,
    )

    setShiftSummary(
      summary,
    )

    return summary
  }

  function openCashDrawerModal(
    movementType:
      CashDrawerMovementType,
  ) {
    if (!currentShift) {
      setError(
        'Open a cashier shift before recording a cash movement.',
      )
      return
    }

    setError('')
    setSuccess('')

    setCashMovementType(
      movementType,
    )

    setCashMovementAmount('')
    setCashMovementReason('')
    setCashMovementReference('')

    setCashDrawerOpen(
      true,
    )
  }

  async function handleSaveCashMovement() {
    if (
      !businessId ||
      !branchId ||
      !staff?.id ||
      !currentShift
    ) {
      setError(
        'Business, branch, staff or shift information is unavailable.',
      )
      return
    }

    const amount =
      safeNumber(
        cashMovementAmount,
      )

    if (amount <= 0) {
      setError(
        'Cash movement amount must be greater than zero.',
      )
      return
    }

    const reason =
      cashMovementReason.trim()

    if (!reason) {
      setError(
        'Enter a reason for this cash movement.',
      )
      return
    }

    try {
      setCashMovementSaving(
        true,
      )

      setError('')
      setSuccess('')

      const currentSummary =
        await getShiftCashSummary(
          currentShift,
        )

      if (
        cashMovementType ===
          'cash_out' &&
        amount >
          currentSummary.expectedCash
      ) {
        throw new Error(
          `Cash out cannot exceed the expected drawer cash of ${money(
            currentSummary.expectedCash,
          )}.`,
        )
      }

      await createCashDrawerMovement({
        businessId,
        branchId,

        shiftId:
          currentShift.id,

        staffId:
          staff.id,

        movementType:
          cashMovementType,

        amount,

        reason,

        referenceNo:
          cashMovementReference
            .trim() ||
          null,
      })

      const updatedSummary =
        await refreshCashDrawerData(
          currentShift,
        )

      setCashDrawerOpen(
        false,
      )

      setCashMovementAmount('')
      setCashMovementReason('')
      setCashMovementReference('')

      setSuccess(
        cashMovementType ===
          'cash_in'
          ? `${money(
              amount,
            )} cash added to the drawer. Expected cash is now ${money(
              updatedSummary.expectedCash,
            )}.`
          : `${money(
              amount,
            )} cash removed from the drawer. Expected cash is now ${money(
              updatedSummary.expectedCash,
            )}.`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to record cash movement.',
      )
    } finally {
      setCashMovementSaving(
        false,
      )
    }
  }

  async function handleOpenShift() {
    if (
      !businessId ||
      !branchId ||
      !staff?.id
    ) {
      setError(
        'Business, branch or staff information is unavailable.',
      )
      return
    }

    const amount =
      safeNumber(
        openingCash,
      )

    if (
      amount < 0
    ) {
      setError(
        'Opening cash cannot be negative.',
      )
      return
    }

    try {
      setShiftLoading(
        true,
      )

      setError('')
      setSuccess('')

      const shift =
        await openShift({
          businessId,
          branchId,
          staffId:
            staff.id,

          terminalName:
            terminalName ||
            null,

          openingCash:
            amount,

          openingNote:
            openingNote
              .trim() ||
            null,
        })

      setCurrentShift(
        shift,
      )

      setCashMovements([])
      setShiftSummary(null)

      setOpenShiftOpen(
        false,
      )

      setOpeningCash(
        '0',
      )

      setOpeningNote(
        '',
      )

      setSuccess(
        `Shift opened successfully with ${money(
          shift.openingCash,
        )} opening cash.`,
      )

      requestAnimationFrame(
        () => {
          searchRef.current?.focus()
        },
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to open shift.',
      )
    } finally {
      setShiftLoading(
        false,
      )
    }
  }

  async function openCloseShiftModal() {
    if (
      !currentShift
    ) {
      return
    }

    if (
      cart.length >
      0
    ) {
      setError(
        'Complete, hold or clear the current sale before closing the shift.',
      )
      return
    }

    if (
      heldBills.length >
      0
    ) {
      setError(
        'Resolve all held bills before closing the shift.',
      )
      return
    }

    try {
      setShiftLoading(
        true,
      )

      setError('')
      setSuccess('')

      const summary =
        await getShiftCashSummary(
          currentShift,
        )

      setShiftSummary(
        summary,
      )

      setClosingCash(
        String(
          summary.expectedCash,
        ),
      )

      setClosingNote(
        '',
      )

      setCloseShiftOpen(
        true,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load shift summary.',
      )
    } finally {
      setShiftLoading(
        false,
      )
    }
  }

  async function handleCloseShift() {
    if (
      !businessId ||
      !branchId ||
      !currentShift
    ) {
      setError(
        'Open shift information is unavailable.',
      )
      return
    }

    const amount =
      safeNumber(
        closingCash,
      )

    if (
      amount < 0
    ) {
      setError(
        'Closing cash cannot be negative.',
      )
      return
    }

    try {
      setShiftLoading(
        true,
      )

      setError('')
      setSuccess('')

      const closed =
        await closeShift({
          shiftId:
            currentShift.id,

          businessId,
          branchId,

          closingCash:
            amount,

          closingNote:
            closingNote
              .trim() ||
            null,
        })

      setCurrentShift(
        null,
      )

      setCashMovements([])

      setShiftSummary(
        null,
      )

      setCloseShiftOpen(
        false,
      )

      setClosingCash(
        '',
      )

      setClosingNote(
        '',
      )

      const difference =
        closed.cashDifference ??
        0

      const differenceText =
        difference ===
        0
          ? 'Cash matched expected amount.'
          : difference >
              0
            ? `Cash over by ${money(
                difference,
              )}.`
            : `Cash short by ${money(
                Math.abs(
                  difference,
                ),
              )}.`

      setSuccess(
        `Shift closed successfully. ${differenceText}`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to close shift.',
      )
    } finally {
      setShiftLoading(
        false,
      )
    }
  }

  function changeSaleType(
    nextSaleType: SaleType,
  ) {
    setSaleType(
      nextSaleType,
    )

    setCart(
      (current) =>
        current.map(
          (item) => {
            const product =
              products.find(
                (
                  productItem,
                ) =>
                  productItem.id ===
                  item.productId,
              )

            if (!product) {
              return item
            }

            return {
              ...item,

              unitPrice:
                nextSaleType ===
                'wholesale'
                  ? product.wholesalePrice
                  : product.retailPrice,

              discountAmount:
                0,
            }
          },
        ),
    )
  }

  function handleSearchKeyDown(
    event:
      React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (
      event.key !==
        'Enter' ||
      !search.trim()
    ) {
      return
    }

    const query =
      search.trim()

    const exactBarcode =
      products.find(
        (product) =>
          product.barcode ===
          query,
      )

    if (exactBarcode) {
      event.preventDefault()

      addProduct(
        exactBarcode,
      )

      return
    }

    const exactSku =
      products.find(
        (product) =>
          product.sku
            ?.toLowerCase() ===
          query.toLowerCase(),
      )

    if (exactSku) {
      event.preventDefault()

      addProduct(
        exactSku,
      )

      return
    }

    if (
      filteredProducts.length ===
      1
    ) {
      event.preventDefault()

      addProduct(
        filteredProducts[0],
      )
    }
  }

  async function loadCompletedSaleReceipt(
    invoiceNo: string,
  ) {
    if (
      !businessId ||
      !branchId
    ) {
      return
    }

    try {
      setReceiptLoading(
        true,
      )

      const sales =
        await getSales(
          businessId,
          branchId,
        )

      const completedSale =
        sales.find(
          (sale) =>
            sale.invoiceNo ===
            invoiceNo,
        )

      if (!completedSale) {
        throw new Error(
          `Sale ${invoiceNo} was saved, but receipt details could not be found.`,
        )
      }

      const invoice =
        await getSaleInvoice(
          completedSale.id,
        )

      setReceiptInvoice(
        invoice,
      )
    } finally {
      setReceiptLoading(
        false,
      )
    }
  }

  function closeReceipt() {
    setReceiptInvoice(
      null,
    )

    requestAnimationFrame(
      () => {
        searchRef.current?.focus()
      },
    )
  }

  async function handleCheckout() {
    if (
      !businessId ||
      !branchId
    ) {
      setError(
        'Business or branch information is unavailable.',
      )

      return
    }

    if (
      !currentShift
    ) {
      setError(
        'Open a cashier shift before completing a sale.',
      )

      setOpenShiftOpen(
        true,
      )

      return
    }

    if (
      cart.length ===
      0
    ) {
      setError(
        'Add products to the cart before checkout.',
      )

      return
    }

    for (
      const item of
      cart
    ) {
      if (
        !Number.isFinite(
          item.quantity,
        ) ||
        item.quantity <=
          0
      ) {
        setError(
          `Invalid quantity for ${item.productName}.`,
        )

        return
      }

      if (
        item.quantity >
        item.availableStock
      ) {
        setError(
          `Insufficient stock for ${item.productName}.`,
        )

        return
      }

      if (
        item.discountAmount <
          0 ||
        item.discountAmount >
          item.quantity *
            item.unitPrice
      ) {
        setError(
          `Invalid discount for ${item.productName}.`,
        )

        return
      }
    }

    if (
      !Number.isFinite(
        orderDiscount,
      ) ||
      orderDiscount <
        0 ||
      orderDiscount >
        subtotal
    ) {
      setError(
        'Invalid order discount.',
      )

      return
    }

    if (
      !Number.isFinite(
        numericPaid,
      ) ||
      numericPaid <
        0
    ) {
      setError(
        'Paid amount cannot be negative.',
      )

      return
    }

    if (
      paymentMethod !==
        'cash' &&
      numericPaid >
        total
    ) {
      setError(
        'Card or QR payment cannot exceed the sale total.',
      )

      return
    }

    if (
      balanceDue >
        0 &&
      !customerId
    ) {
      setError(
        'Select a customer for a credit or partially paid sale.',
      )

      return
    }

    if (
      balanceDue >
        0 &&
      balanceDue >
        creditAvailable
    ) {
      setError(
        'Customer credit limit is not enough for this sale.',
      )

      return
    }

    try {
      setSaving(true)

      setError('')
      setSuccess('')

      const amountToRecord =
        paymentMethod ===
        'cash'
          ? Math.min(
              numericPaid,
              total,
            )
          : numericPaid

      const payments =
        amountToRecord >
        0
          ? [
              {
                method:
                  paymentMethod,

                amount:
                  amountToRecord,

                referenceNo:
                  paymentReference
                    .trim() ||
                  null,
              },
            ]
          : []

      const execution =
        await completeSaleWithOfflineFallback({
          clientTransactionId:
            transactionId,

          businessId,

          branchId,

          terminalId:
            null,

          shiftId:
            currentShift.id,

          customerId:
            customerId ||
            null,

          saleType,

          items:
            cart.map(
              (item) => ({
                productId:
                  item.productId,

                quantity:
                  item.quantity,

                discountAmount:
                  item.discountAmount,
              }),
            ),

          payments,

          orderDiscount,

          taxRate:
            0,

          notes:
            notes.trim() ||
            null,
        })

      const completedHeldBillId =
        activeHeldBillId

      if (execution.mode === 'offline') {
        const localCreatedAt =
          new Date().toISOString()

        const localInvoiceNo =
          `OFF-${transactionId.slice(0, 8).toUpperCase()}`

        const localSaleId =
          `offline-${transactionId}`

        const localInvoice: SaleInvoiceDetail = {
          sale: {
            id: localSaleId,

            businessId,
            branchId,

            terminalId: null,
            shiftId: currentShift.id,
            customerId: customerId || null,
            staffId: staff?.id ?? 'offline-staff',

            clientTransactionId: transactionId,

            invoiceNo: localInvoiceNo,
            saleType,

            subtotal,
            discountAmount: orderDiscount,

            taxRate: 0,
            taxAmount: 0,

            total,
            paidAmount: amountToRecord,
            balanceDue,

            status:
              balanceDue > 0
                ? amountToRecord > 0
                  ? 'partially_paid'
                  : 'credit'
                : 'completed',

            notes: notes.trim() || null,

            createdAt: localCreatedAt,

            customerName:
              selectedCustomer?.name ?? null,

            staffName:
              staff?.fullName ?? null,
          },

          items: cart.map(
            (item, index) => ({
              id:
                `offline-item-${transactionId}-${index + 1}`,

              saleId: localSaleId,
              productId: item.productId,

              productName: item.productName,
              barcode: item.barcode,

              quantity: item.quantity,
              unitPrice: item.unitPrice,

              discountAmount:
                item.discountAmount,

              costPrice: 0,

              lineTotal: Math.max(
                0,
                item.quantity * item.unitPrice -
                  item.discountAmount,
              ),
            }),
          ),

          payments: payments.map(
            (payment, index) => ({
              id:
                `offline-payment-${transactionId}-${index + 1}`,

              saleId: localSaleId,

              businessId,
              branchId,

              paymentMethod:
                payment.method,

              amount: payment.amount,

              referenceNo:
                payment.referenceNo,

              receivedBy:
                staff?.id ?? null,

              createdAt:
                localCreatedAt,
            }),
          ),

          business: {
            id: businessId,

            name: 'Deshan Textile',
            legalName: null,

            phone: null,
            email: null,
            address: null,

            currencyCode: 'LKR',
            timezone: 'Asia/Colombo',
          },

          branch: {
            id: branchId,

            name: terminalName || 'Main Branch',
            code: 'OFFLINE',

            phone: null,
            address: null,
          },
        }

        setReceiptInvoice(
          localInvoice,
        )

        setSuccess(
          `${localInvoiceNo} saved offline safely. Receipt is ready to print. It will sync automatically when the internet returns.`,
        )

        clearSale()

        return
      }

      const result =
        execution.result

      if (!result) {
        throw new Error(
          'Sale completed without a valid result.',
        )
      }

      const completedInvoiceNo =
        result.invoice_no

      const completedTotal =
        Number(
          result.total,
        )

      const completedChange =
        changeAmount

      const changeText =
        completedChange >
        0
          ? ` Change: ${money(
              completedChange,
            )}.`
          : ''

      /*
       * Sale is already committed here.
       * From this point onward, receipt-loading
       * errors must NOT be treated as a failed sale.
       */
      setSuccess(
        `${completedInvoiceNo} completed successfully. Total ${money(
          completedTotal,
        )}.${changeText}`,
      )

      if (
        completedHeldBillId
      ) {
        try {
          await deleteHeldBill(
            completedHeldBillId,
            businessId,
            branchId,
          )

          setHeldBills(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  completedHeldBillId,
              ),
          )
        } catch (heldBillError) {
          console.error(
            'Sale completed but held bill cleanup failed:',
            heldBillError,
          )
        }
      }

      clearSale()

      await loadPOSData()

      try {
        await loadCompletedSaleReceipt(
          completedInvoiceNo,
        )
      } catch (receiptError) {
        setError(
          receiptError instanceof Error
            ? `${receiptError.message} You can reprint it from Sales History.`
            : 'Sale completed, but the receipt could not be loaded. You can reprint it from Sales History.',
        )
      }

      requestAnimationFrame(
        () => {
          searchRef.current?.focus()
        },
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to complete sale.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="pos-page">

        <section className="pos-topbar">

          <div>

            <h1>
              Point of Sale
            </h1>

            <p>
              Fast checkout for
              Deshan Textile
            </p>

          </div>

          <div className="pos-topbar-actions">

            {currentShift ? (
              <div className="pos-shift-status">

                <div className="pos-shift-status-text">

                  <span>
                    Shift Open
                  </span>

                  <strong>
                    {money(
                      currentShift.openingCash,
                    )} opening
                  </strong>

                </div>

                <div className="pos-shift-cash-actions">

                  <button
                    type="button"
                    className="pos-cash-in-button"
                    onClick={() =>
                      openCashDrawerModal(
                        'cash_in',
                      )
                    }
                    disabled={
                      saving ||
                      holding ||
                      shiftLoading ||
                      cashMovementSaving
                    }
                  >
                    <ArrowDownToLine
                      size={15}
                    />

                    Cash In
                  </button>

                  <button
                    type="button"
                    className="pos-cash-out-button"
                    onClick={() =>
                      openCashDrawerModal(
                        'cash_out',
                      )
                    }
                    disabled={
                      saving ||
                      holding ||
                      shiftLoading ||
                      cashMovementSaving
                    }
                  >
                    <ArrowUpFromLine
                      size={15}
                    />

                    Cash Out
                  </button>

                  <button
                    type="button"
                    className="pos-shift-close-button"
                    onClick={() =>
                      void openCloseShiftModal()
                    }
                    disabled={
                      saving ||
                      holding ||
                      shiftLoading ||
                      cashMovementSaving
                    }
                  >
                    <LockKeyhole
                      size={16}
                    />

                    Close Shift
                  </button>

                </div>

              </div>
            ) : (
              <button
                type="button"
                className="pos-shift-open-button"
                onClick={() =>
                  setOpenShiftOpen(
                    true,
                  )
                }
                disabled={
                  saving ||
                  holding ||
                  shiftLoading
                }
              >
                <Store
                  size={17}
                />

                Open Shift
              </button>
            )}

            <button
              type="button"
              className="pos-held-bills-button"
              onClick={() =>
                setHeldBillsOpen(
                  true,
                )
              }
              disabled={
                saving ||
                holding
              }
            >
              <Clock
                size={17}
              />

              Held Bills

              {availableHeldBills.length >
                0 && (
                <span>
                  {
                    availableHeldBills.length
                  }
                </span>
              )}
            </button>

            <div className="pos-sale-type">

              <button
                className={
                  saleType ===
                  'retail'
                    ? 'active'
                    : ''
                }
                type="button"
                onClick={() =>
                  changeSaleType(
                    'retail',
                  )
                }
                disabled={
                  saving ||
                  holding
                }
              >
                Retail
              </button>

              <button
                className={
                  saleType ===
                    'wholesale'
                    ? 'active'
                    : ''
                }
                type="button"
                onClick={() =>
                  changeSaleType(
                    'wholesale',
                  )
                }
                disabled={
                  saving ||
                  holding
                }
              >
                Wholesale
              </button>

            </div>

          </div>

        </section>

        {error && (
          <div className="pos-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="pos-message success">

            <CheckCircle2
              size={18}
            />

            {success}

          </div>
        )}

        {receiptLoading && (
          <div className="pos-message success">

            <CheckCircle2
              size={18}
            />

            Sale saved. Loading receipt...

          </div>
        )}

        <div className="pos-workspace">

          <section className="pos-main">

            <div className="pos-search-card">

              <div className="pos-search-box">

                <Barcode
                  size={22}
                />

                <input
                  ref={
                    searchRef
                  }
                  autoFocus
                  value={
                    search
                  }
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  onKeyDown={
                    handleSearchKeyDown
                  }
                  placeholder="Scan barcode or search product..."
                  disabled={
                    saving ||
                    receiptLoading
                  }
                />

                <Search
                  size={19}
                />

              </div>

              {search.trim() && (
                <div className="pos-search-results">

                  {filteredProducts
                    .slice(
                      0,
                      8,
                    )
                    .map(
                      (product) => (

                        <button
                          key={
                            product.id
                          }
                          type="button"
                          onClick={() =>
                            addProduct(
                              product,
                            )
                          }
                          disabled={
                            saving
                          }
                        >

                          <div>

                            <strong>
                              {
                                product.name
                              }
                            </strong>

                            <span>
                              {product.sku ??
                                product.barcode ??
                                'No code'}
                              {' · '}
                              {
                                product.quantity
                              }{' '}
                              {
                                product.unit
                              }
                            </span>

                          </div>

                          <div className="pos-result-price">

                            <strong>
                              {money(
                                getProductPrice(
                                  product,
                                ),
                              )}
                            </strong>

                            <Plus
                              size={17}
                            />

                          </div>

                        </button>

                      ),
                    )}

                  {filteredProducts.length ===
                    0 && (
                    <div
                      style={{
                        padding:
                          '16px',

                        textAlign:
                          'center',

                        color:
                          '#6b7280',

                        fontSize:
                          '12px',
                      }}
                    >
                      No products found.
                    </div>
                  )}

                </div>
              )}

            </div>

            <section className="pos-cart-card">

              <div className="pos-card-heading">

                <div>

                  <ShoppingCart
                    size={20}
                  />

                  <div>

                    <h2>
                      Current Sale
                    </h2>

                    <p>
                      {
                        cart.length
                      }{' '}
                      item
                      {cart.length ===
                      1
                        ? ''
                        : 's'}
                    </p>

                  </div>

                </div>

                {cart.length >
                  0 && (
                  <div className="pos-cart-actions">

                    <button
                      className="pos-hold-button"
                      type="button"
                      onClick={() =>
                        void handleHoldSale()
                      }
                      disabled={
                        saving ||
                        holding
                      }
                    >
                      <Pause
                        size={15}
                      />

                      {holding
                        ? 'Holding...'
                        : activeHeldBillId
                          ? 'Hold Again'
                          : 'Hold Bill'}
                    </button>

                    <button
                      className="pos-clear-button"
                      type="button"
                      onClick={
                        clearSale
                      }
                      disabled={
                        saving ||
                        holding
                      }
                    >
                      Clear Sale
                    </button>

                  </div>
                )}

              </div>

              <div className="pos-cart-table-wrap">

                <table className="pos-cart-table">

                  <thead>

                    <tr>

                      <th>
                        Product
                      </th>

                      <th>
                        Price
                      </th>

                      <th>
                        Qty
                      </th>

                      <th>
                        Discount
                      </th>

                      <th>
                        Total
                      </th>

                      <th />

                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (

                      <tr>

                        <td
                          colSpan={6}
                          className="pos-empty"
                        >
                          Loading POS...
                        </td>

                      </tr>

                    ) : cart.length ===
                      0 ? (

                      <tr>

                        <td
                          colSpan={6}
                          className="pos-empty"
                        >
                          Scan a barcode
                          or search for a
                          product to start
                          a sale.
                        </td>

                      </tr>

                    ) : (

                      cart.map(
                        (item) => {
                          const lineTotal =
                            Math.max(
                              0,

                              item.quantity *
                                item.unitPrice -
                                item.discountAmount,
                            )

                          return (
                            <tr
                              key={
                                item.productId
                              }
                            >

                              <td>

                                <div className="pos-product-name">

                                  <strong>
                                    {
                                      item.productName
                                    }
                                  </strong>

                                  <span>
                                    {item.sku ??
                                      item.barcode ??
                                      '—'}
                                    {' · '}
                                    Stock{' '}
                                    {
                                      item.availableStock
                                    }
                                  </span>

                                </div>

                              </td>

                              <td>

                                <strong>
                                  {money(
                                    item.unitPrice,
                                  )}
                                </strong>

                              </td>

                              <td>

                                <div className="pos-qty-control">

                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeQuantity(
                                        item.productId,
                                        -1,
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                  >
                                    <Minus
                                      size={14}
                                    />
                                  </button>

                                  <input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    max={
                                      item.availableStock
                                    }
                                    value={
                                      item.quantity
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      updateQuantity(
                                        item.productId,

                                        safeNumber(
                                          event.target
                                            .value,
                                        ),
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeQuantity(
                                        item.productId,
                                        1,
                                      )
                                    }
                                    disabled={
                                      saving
                                    }
                                  >
                                    <Plus
                                      size={14}
                                    />
                                  </button>

                                </div>

                              </td>

                              <td>

                                <input
                                  className="pos-discount-input"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={
                                    item.discountAmount
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    updateDiscount(
                                      item.productId,

                                      safeNumber(
                                        event.target
                                          .value,
                                      ),
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                />

                              </td>

                              <td>

                                <strong>
                                  {money(
                                    lineTotal,
                                  )}
                                </strong>

                              </td>

                              <td>

                                <button
                                  className="pos-remove-button"
                                  type="button"
                                  onClick={() =>
                                    removeProduct(
                                      item.productId,
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                >
                                  <Trash2
                                    size={16}
                                  />
                                </button>

                              </td>

                            </tr>
                          )
                        },
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </section>

          <aside className="pos-checkout">

            <section className="pos-customer-card">

              <div className="pos-section-title">

                <UserRound
                  size={18}
                />

                <div>

                  <strong>
                    Customer
                  </strong>

                  <span>
                    Optional for cash sales
                  </span>

                </div>

              </div>

              <select
                value={
                  customerId
                }
                onChange={(event) =>
                  setCustomerId(
                    event.target
                      .value,
                  )
                }
                disabled={
                  saving
                }
              >

                <option value="">
                  Walk-in Customer
                </option>

                {customers.map(
                  (customer) => (

                    <option
                      key={
                        customer.id
                      }
                      value={
                        customer.id
                      }
                    >
                      {
                        customer.name
                      }
                    </option>

                  ),
                )}

              </select>

              {selectedCustomer && (
                <div className="pos-credit-info">

                  <div>

                    <span>
                      Outstanding
                    </span>

                    <strong>
                      {money(
                        customerBalance,
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      Available Credit
                    </span>

                    <strong>
                      {money(
                        creditAvailable,
                      )}
                    </strong>

                  </div>

                </div>
              )}

            </section>

            <section className="pos-summary-card">

              <div className="pos-summary-row">

                <span>
                  Subtotal
                </span>

                <strong>
                  {money(
                    subtotal,
                  )}
                </strong>

              </div>

              <label className="pos-order-discount">

                <span>
                  Order Discount
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={
                    subtotal
                  }
                  value={
                    orderDiscount
                  }
                  onChange={(
                    event,
                  ) =>
                    setOrderDiscount(
                      safeNumber(
                        event.target
                          .value,
                      ),
                    )
                  }
                  disabled={
                    saving
                  }
                />

              </label>

              <div className="pos-grand-total">

                <span>
                  Total
                </span>

                <strong>
                  {money(
                    total,
                  )}
                </strong>

              </div>

            </section>

            <section className="pos-payment-card">

              <div className="pos-section-title">

                <WalletCards
                  size={18}
                />

                <div>

                  <strong>
                    Payment
                  </strong>

                  <span>
                    Choose payment method
                  </span>

                </div>

              </div>

              <div className="pos-payment-methods">

                <button
                  type="button"
                  className={
                    paymentMethod ===
                    'cash'
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setPaymentMethod(
                      'cash',
                    )

                    setPaymentReference(
                      '',
                    )
                  }}
                  disabled={
                    saving
                  }
                >
                  <Banknote
                    size={18}
                  />

                  Cash
                </button>

                <button
                  type="button"
                  className={
                    paymentMethod ===
                    'card'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setPaymentMethod(
                      'card',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <CreditCard
                    size={18}
                  />

                  Card
                </button>

                <button
                  type="button"
                  className={
                    paymentMethod ===
                    'qr'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setPaymentMethod(
                      'qr',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <QrCode
                    size={18}
                  />

                  QR
                </button>

                <button
                  type="button"
                  className={
                    paymentMethod ===
                    'bank_transfer'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setPaymentMethod(
                      'bank_transfer',
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  <Landmark
                    size={18}
                  />

                  Bank
                </button>

              </div>

              <label className="pos-payment-field">

                Paid Amount

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    paidAmount
                  }
                  onChange={(
                    event,
                  ) =>
                    setPaidAmount(
                      event.target
                        .value,
                    )
                  }
                  placeholder="0.00"
                  disabled={
                    saving
                  }
                />

              </label>

              {paymentMethod ===
                'cash' && (

                <div className="pos-quick-cash">

                  {[
                    500,
                    1000,
                    2000,
                    5000,
                  ].map(
                    (value) => (

                      <button
                        key={
                          value
                        }
                        type="button"
                        onClick={() =>
                          setPaidAmount(
                            String(
                              value,
                            ),
                          )
                        }
                        disabled={
                          saving
                        }
                      >
                        {money(
                          value,
                        )}
                      </button>

                    ),
                  )}

                  {total > 0 && (

                    <button
                      type="button"
                      onClick={() =>
                        setPaidAmount(
                          String(
                            total,
                          ),
                        )
                      }
                      disabled={
                        saving
                      }
                    >
                      Exact
                    </button>

                  )}

                </div>

              )}

              {paymentMethod !==
                'cash' && (

                <label className="pos-payment-field">

                  Reference

                  <input
                    value={
                      paymentReference
                    }
                    onChange={(
                      event,
                    ) =>
                      setPaymentReference(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Payment reference"
                    disabled={
                      saving
                    }
                  />

                </label>

              )}

              <div className="pos-payment-status">

                <div>

                  <span>
                    Balance / Credit
                  </span>

                  <strong>
                    {money(
                      balanceDue,
                    )}
                  </strong>

                </div>

                <div>

                  <span>
                    Change
                  </span>

                  <strong>
                    {money(
                      changeAmount,
                    )}
                  </strong>

                </div>

              </div>

              <label className="pos-notes-field">

                Notes

                <textarea
                  rows={2}
                  value={
                    notes
                  }
                  onChange={(
                    event,
                  ) =>
                    setNotes(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional sale note"
                  disabled={
                    saving
                  }
                />

              </label>

              <button
                className="pos-complete-button"
                type="button"
                disabled={
                  saving ||
                  receiptLoading ||
                  !currentShift ||
                  cart.length ===
                    0
                }
                onClick={() =>
                  void handleCheckout()
                }
              >

                <CheckCircle2
                  size={20}
                />

                {saving
                  ? 'Completing Sale...'
                  : receiptLoading
                    ? 'Loading Receipt...'
                    : !currentShift
                      ? 'Open Shift to Sell'
                      : 'Complete Sale'}

              </button>

            </section>

          </aside>

        </div>

        {openShiftOpen && (
          <div
            className="pos-shift-backdrop"
            onMouseDown={() =>
              !shiftLoading &&
              setOpenShiftOpen(
                false,
              )
            }
          >

            <section
              className="pos-shift-modal"
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
            >

              <div className="pos-shift-modal-heading">

                <div>

                  <h2>
                    Open Cashier Shift
                  </h2>

                  <p>
                    Enter the cash currently
                    available in the drawer.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpenShiftOpen(
                      false,
                    )
                  }
                  disabled={
                    shiftLoading
                  }
                >
                  <X
                    size={18}
                  />
                </button>

              </div>

              <div className="pos-shift-modal-body">

                <div className="pos-shift-info-row">

                  <span>
                    Cashier
                  </span>

                  <strong>
                    {staff?.fullName ??
                      '—'}
                  </strong>

                </div>

                <div className="pos-shift-info-row">

                  <span>
                    Terminal
                  </span>

                  <strong>
                    {terminalName}
                  </strong>

                </div>

                <label className="pos-shift-field">

                  Opening Cash

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      openingCash
                    }
                    onChange={(
                      event,
                    ) =>
                      setOpeningCash(
                        event.target.value,
                      )
                    }
                    disabled={
                      shiftLoading
                    }
                  />

                </label>

                <label className="pos-shift-field">

                  Opening Note

                  <textarea
                    rows={3}
                    value={
                      openingNote
                    }
                    onChange={(
                      event,
                    ) =>
                      setOpeningNote(
                        event.target.value,
                      )
                    }
                    placeholder="Optional note"
                    disabled={
                      shiftLoading
                    }
                  />

                </label>

              </div>

              <div className="pos-shift-modal-actions">

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setOpenShiftOpen(
                      false,
                    )
                  }
                  disabled={
                    shiftLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    void handleOpenShift()
                  }
                  disabled={
                    shiftLoading
                  }
                >
                  <Store
                    size={16}
                  />

                  {shiftLoading
                    ? 'Opening...'
                    : 'Open Shift'}
                </button>

              </div>

            </section>

          </div>
        )}

        {cashDrawerOpen &&
          currentShift && (
          <div
            className="pos-shift-backdrop"
            onMouseDown={() =>
              !cashMovementSaving &&
              setCashDrawerOpen(
                false,
              )
            }
          >

            <section
              className="pos-shift-modal pos-cash-drawer-modal"
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
            >

              <div className="pos-shift-modal-heading">

                <div>

                  <h2>
                    {cashMovementType ===
                    'cash_in'
                      ? 'Cash In'
                      : 'Cash Out'}
                  </h2>

                  <p>
                    {cashMovementType ===
                    'cash_in'
                      ? 'Record cash added to the current drawer.'
                      : 'Record cash removed from the current drawer.'}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCashDrawerOpen(
                      false,
                    )
                  }
                  disabled={
                    cashMovementSaving
                  }
                >
                  <X
                    size={18}
                  />
                </button>

              </div>

              <div className="pos-shift-modal-body">

                <div className="pos-cash-drawer-summary">

                  <div>
                    <span>
                      Opening
                    </span>
                    <strong>
                      {money(
                        currentShift.openingCash,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cash In
                    </span>
                    <strong className="positive">
                      +{money(
                        cashMovementTotals.cashIn,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cash Out
                    </span>
                    <strong className="negative">
                      -{money(
                        cashMovementTotals.cashOut,
                      )}
                    </strong>
                  </div>

                </div>

                <div className="pos-cash-movement-switch">

                  <button
                    type="button"
                    className={
                      cashMovementType ===
                      'cash_in'
                        ? 'active cash-in'
                        : ''
                    }
                    onClick={() =>
                      setCashMovementType(
                        'cash_in',
                      )
                    }
                    disabled={
                      cashMovementSaving
                    }
                  >
                    <ArrowDownToLine
                      size={15}
                    />
                    Cash In
                  </button>

                  <button
                    type="button"
                    className={
                      cashMovementType ===
                      'cash_out'
                        ? 'active cash-out'
                        : ''
                    }
                    onClick={() =>
                      setCashMovementType(
                        'cash_out',
                      )
                    }
                    disabled={
                      cashMovementSaving
                    }
                  >
                    <ArrowUpFromLine
                      size={15}
                    />
                    Cash Out
                  </button>

                </div>

                <label className="pos-shift-field">
                  Amount

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      cashMovementAmount
                    }
                    onChange={(
                      event,
                    ) =>
                      setCashMovementAmount(
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                    disabled={
                      cashMovementSaving
                    }
                  />
                </label>

                <label className="pos-shift-field">
                  Reason

                  <textarea
                    rows={3}
                    value={
                      cashMovementReason
                    }
                    onChange={(
                      event,
                    ) =>
                      setCashMovementReason(
                        event.target.value,
                      )
                    }
                    placeholder={
                      cashMovementType ===
                      'cash_in'
                        ? 'Example: Extra float added by manager'
                        : 'Example: Petty cash / bank deposit'
                    }
                    disabled={
                      cashMovementSaving
                    }
                  />
                </label>

                <label className="pos-shift-field">
                  Reference No.

                  <input
                    value={
                      cashMovementReference
                    }
                    onChange={(
                      event,
                    ) =>
                      setCashMovementReference(
                        event.target.value,
                      )
                    }
                    placeholder="Optional reference"
                    disabled={
                      cashMovementSaving
                    }
                  />
                </label>

                <div className="pos-cash-movement-history">

                  <div className="pos-cash-movement-history-heading">
                    <ListRestart
                      size={16}
                    />
                    <strong>
                      Current Shift Movements
                    </strong>
                  </div>

                  {cashMovements.length ===
                  0 ? (
                    <div className="pos-cash-movement-empty">
                      No cash movements recorded yet.
                    </div>
                  ) : (
                    <div className="pos-cash-movement-list">
                      {cashMovements.map(
                        (movement) => (
                          <div
                            key={
                              movement.id
                            }
                            className="pos-cash-movement-row"
                          >
                            <div>
                              <strong>
                                {movement.reason}
                              </strong>
                              <span>
                                {new Date(
                                  movement.createdAt,
                                ).toLocaleString(
                                  'en-LK',
                                  {
                                    timeZone:
                                      'Asia/Colombo',
                                  },
                                )}
                                {movement.referenceNo
                                  ? ` · ${movement.referenceNo}`
                                  : ''}
                              </span>
                            </div>

                            <strong
                              className={
                                movement.movementType ===
                                'cash_in'
                                  ? 'positive'
                                  : 'negative'
                              }
                            >
                              {movement.movementType ===
                              'cash_in'
                                ? '+'
                                : '-'}
                              {money(
                                movement.amount,
                              )}
                            </strong>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                </div>

              </div>

              <div className="pos-shift-modal-actions">

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setCashDrawerOpen(
                      false,
                    )
                  }
                  disabled={
                    cashMovementSaving
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className={
                    cashMovementType ===
                    'cash_in'
                      ? 'primary'
                      : 'danger'
                  }
                  onClick={() =>
                    void handleSaveCashMovement()
                  }
                  disabled={
                    cashMovementSaving
                  }
                >
                  {cashMovementType ===
                  'cash_in' ? (
                    <ArrowDownToLine
                      size={16}
                    />
                  ) : (
                    <ArrowUpFromLine
                      size={16}
                    />
                  )}

                  {cashMovementSaving
                    ? 'Saving...'
                    : cashMovementType ===
                        'cash_in'
                      ? 'Record Cash In'
                      : 'Record Cash Out'}
                </button>

              </div>

            </section>

          </div>
        )}

        {closeShiftOpen &&
          currentShift &&
          shiftSummary && (
          <div
            className="pos-shift-backdrop"
            onMouseDown={() =>
              !shiftLoading &&
              setCloseShiftOpen(
                false,
              )
            }
          >

            <section
              className="pos-shift-modal"
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
            >

              <div className="pos-shift-modal-heading">

                <div>

                  <h2>
                    Close Cashier Shift
                  </h2>

                  <p>
                    Count the cash drawer and
                    confirm the closing amount.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCloseShiftOpen(
                      false,
                    )
                  }
                  disabled={
                    shiftLoading
                  }
                >
                  <X
                    size={18}
                  />
                </button>

              </div>

              <div className="pos-shift-modal-body">

                <div className="pos-shift-summary-grid">

                  <div>
                    <span>
                      Opening Cash
                    </span>

                    <strong>
                      {money(
                        shiftSummary.openingCash,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cash Sales
                    </span>

                    <strong>
                      {money(
                        shiftSummary.cashSales,
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Cash In
                    </span>

                    <strong className="positive">
                      +{money(
                        cashMovementTotals.cashIn,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Cash Out
                    </span>

                    <strong className="negative">
                      -{money(
                        cashMovementTotals.cashOut,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Expected Cash
                    </span>

                    <strong>
                      {money(
                        shiftSummary.expectedCash,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Difference
                    </span>

                    <strong>
                      {money(
                        safeNumber(
                          closingCash,
                        ) -
                          shiftSummary.expectedCash,
                      )}
                    </strong>
                  </div>

                </div>

                <label className="pos-shift-field">

                  Actual Closing Cash

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      closingCash
                    }
                    onChange={(
                      event,
                    ) =>
                      setClosingCash(
                        event.target.value,
                      )
                    }
                    disabled={
                      shiftLoading
                    }
                  />

                </label>

                <label className="pos-shift-field">

                  Closing Note

                  <textarea
                    rows={3}
                    value={
                      closingNote
                    }
                    onChange={(
                      event,
                    ) =>
                      setClosingNote(
                        event.target.value,
                      )
                    }
                    placeholder="Optional note"
                    disabled={
                      shiftLoading
                    }
                  />

                </label>

              </div>

              <div className="pos-shift-modal-actions">

                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setCloseShiftOpen(
                      false,
                    )
                  }
                  disabled={
                    shiftLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    void handleCloseShift()
                  }
                  disabled={
                    shiftLoading
                  }
                >
                  <LockKeyhole
                    size={16}
                  />

                  {shiftLoading
                    ? 'Closing...'
                    : 'Close Shift'}
                </button>

              </div>

            </section>

          </div>
        )}

        {heldBillsOpen && (
          <div
            className="pos-held-backdrop"
            onMouseDown={() =>
              !heldLoading &&
              setHeldBillsOpen(
                false,
              )
            }
          >

            <section
              className="pos-held-modal"
              onMouseDown={(
                event,
              ) =>
                event.stopPropagation()
              }
            >

              <div className="pos-held-heading">

                <div>

                  <h2>
                    Held Bills
                  </h2>

                  <p>
                    Resume or remove bills
                    saved before checkout.
                  </p>

                </div>

                <button
                  type="button"
                  className="pos-held-close"
                  onClick={() =>
                    setHeldBillsOpen(
                      false,
                    )
                  }
                  disabled={
                    heldLoading
                  }
                >
                  <X
                    size={18}
                  />
                </button>

              </div>

              <div className="pos-held-list">

                {availableHeldBills.length ===
                0 ? (

                  <div className="pos-held-empty">

                    <Clock
                      size={28}
                    />

                    <strong>
                      No held bills
                    </strong>

                    <span>
                      Bills you hold will
                      appear here.
                    </span>

                  </div>

                ) : (

                  availableHeldBills.map(
                    (heldBill) => (

                      <article
                        key={
                          heldBill.id
                        }
                        className={
                          activeHeldBillId ===
                          heldBill.id
                            ? 'pos-held-item active'
                            : 'pos-held-item'
                        }
                      >

                        <div className="pos-held-item-main">

                          <div>

                            <strong>
                              {
                                heldBill.holdNo
                              }
                            </strong>

                            <span>
                              {
                                heldBill.customerName ??
                                'Walk-in Customer'
                              }
                              {' · '}
                              {
                                heldBill.saleType ===
                                'wholesale'
                                  ? 'Wholesale'
                                  : 'Retail'
                              }
                            </span>

                          </div>

                          <div className="pos-held-meta">

                            <span>
                              {
                                heldBill.items.length
                              }{' '}
                              item(s)
                            </span>

                            <span>
                              {new Date(
                                heldBill.updatedAt,
                              ).toLocaleString(
                                'en-LK',
                                {
                                  timeZone:
                                    'Asia/Colombo',
                                },
                              )}
                            </span>

                          </div>

                        </div>

                        <div className="pos-held-actions">

                          <button
                            type="button"
                            className="resume"
                            onClick={() =>
                              void handleResumeHeldBill(
                                heldBill,
                              )
                            }
                            disabled={
                              heldLoading
                            }
                          >
                            <Play
                              size={15}
                            />

                            Resume
                          </button>

                          <button
                            type="button"
                            className="delete"
                            onClick={() =>
                              void handleDeleteHeldBill(
                                heldBill,
                              )
                            }
                            disabled={
                              heldLoading
                            }
                          >
                            <Trash2
                              size={15}
                            />

                            Delete
                          </button>

                        </div>

                      </article>

                    ),
                  )

                )}

              </div>

            </section>

          </div>
        )}

        {receiptInvoice && (
          <SaleReceiptModal
            invoice={
              receiptInvoice
            }
            onClose={
              closeReceipt
            }
            onPrintError={(
              message,
            ) =>
              setError(
                message,
              )
            }
          />
        )}

      </div>
    </AppLayout>
  )
}