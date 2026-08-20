import type {
  CompleteSaleInput,
  CompleteSaleResult,
} from '../types/sale'

import {
  completeSale,
} from './saleService'

import {
  getPendingOfflineSales,
  markOfflineSaleFailed,
  markOfflineSaleSynced,
  markOfflineSaleSyncing,
  resetOfflineSaleToPending,
  saveOfflineSale,
  type OfflineSaleRecord,
} from './offlineDb'

export interface OfflineSaleExecutionResult {
  mode:
    | 'online'
    | 'offline'

  result:
    | CompleteSaleResult
    | null

  offlineRecord:
    | OfflineSaleRecord
    | null
}

export interface OfflineSyncResult {
  attempted: number
  synced: number
  failed: number
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message
  }

  if (
    typeof error === 'string'
  ) {
    return error
  }

  return 'Unknown error'
}

function isLikelyNetworkError(
  error: unknown,
): boolean {
  if (!navigator.onLine) {
    return true
  }

  const message =
    getErrorMessage(error)
      .toLowerCase()

  return (
    message.includes(
      'failed to fetch',
    ) ||
    message.includes(
      'network',
    ) ||
    message.includes(
      'fetch',
    ) ||
    message.includes(
      'connection',
    ) ||
    message.includes(
      'offline',
    ) ||
    message.includes(
      'timeout',
    )
  )
}

export async function completeSaleWithOfflineFallback(
  input: CompleteSaleInput,
): Promise<OfflineSaleExecutionResult> {
  if (
    input.items.length === 0
  ) {
    throw new Error(
      'Sale must contain at least one product.',
    )
  }

  if (
    !navigator.onLine
  ) {
    const offlineRecord =
      await saveOfflineSale(
        input,
      )

    return {
      mode: 'offline',
      result: null,
      offlineRecord,
    }
  }

  try {
    const result =
      await completeSale(
        input,
      )

    return {
      mode: 'online',
      result,
      offlineRecord: null,
    }
  } catch (error) {
    if (
      !isLikelyNetworkError(
        error,
      )
    ) {
      throw error
    }

    const offlineRecord =
      await saveOfflineSale(
        input,
      )

    return {
      mode: 'offline',
      result: null,
      offlineRecord,
    }
  }
}

export async function syncOfflineSale(
  record: OfflineSaleRecord,
): Promise<CompleteSaleResult> {
  if (
    record.id == null
  ) {
    throw new Error(
      'Offline sale record has no local ID.',
    )
  }

  await markOfflineSaleSyncing(
    record.id,
  )

  try {
    const result =
      await completeSale(
        record.input,
      )

    await markOfflineSaleSynced(
      record.id,
      result,
    )

    return result
  } catch (error) {
    const message =
      getErrorMessage(
        error,
      )

    await markOfflineSaleFailed(
      record.id,
      message,
    )

    throw error
  }
}

export async function syncPendingOfflineSales(
  businessId?: string,
  branchId?: string,
): Promise<OfflineSyncResult> {
  if (!navigator.onLine) {
    return {
      attempted: 0,
      synced: 0,
      failed: 0,
    }
  }

  const pendingSales =
    await getPendingOfflineSales(
      businessId,
      branchId,
    )

  let synced =
    0

  let failed =
    0

  for (
    const record of pendingSales
  ) {
    if (
      record.id == null
    ) {
      failed += 1
      continue
    }

    try {
      await resetOfflineSaleToPending(
        record.id,
      )

      await syncOfflineSale(
        record,
      )

      synced += 1
    } catch {
      failed += 1

      if (!navigator.onLine) {
        break
      }
    }
  }

  return {
    attempted:
      synced + failed,

    synced,
    failed,
  }
}

export async function retryOfflineSale(
  record: OfflineSaleRecord,
): Promise<CompleteSaleResult> {
  if (
    !navigator.onLine
  ) {
    throw new Error(
      'Internet connection is not available.',
    )
  }

  if (
    record.id == null
  ) {
    throw new Error(
      'Offline sale record has no local ID.',
    )
  }

  await resetOfflineSaleToPending(
    record.id,
  )

  return syncOfflineSale(
    record,
  )
}