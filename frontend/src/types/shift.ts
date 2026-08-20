export type ShiftStatus =
  | 'open'
  | 'closed'

export interface CashierShift {
  id: string

  businessId: string
  branchId: string
  staffId: string

  terminalName:
    | string
    | null

  openingCash: number

  closingCash:
    | number
    | null

  expectedCash:
    | number
    | null

  cashDifference:
    | number
    | null

  status: ShiftStatus

  openingNote:
    | string
    | null

  closingNote:
    | string
    | null

  openedAt: string

  closedAt:
    | string
    | null

  createdAt: string
  updatedAt: string
}

export interface OpenShiftInput {
  businessId: string
  branchId: string
  staffId: string

  terminalName:
    | string
    | null

  openingCash: number

  openingNote:
    | string
    | null
}

export interface CloseShiftInput {
  shiftId: string

  businessId: string
  branchId: string

  closingCash: number

  closingNote:
    | string
    | null
}

export interface ShiftCashSummary {
  openingCash: number

  cashSales: number

  expectedCash: number

  closingCash:
    | number
    | null

  difference:
    | number
    | null
}