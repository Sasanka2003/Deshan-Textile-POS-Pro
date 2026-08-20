import Dexie, {
  type EntityTable,
} from 'dexie'

import type {
  CompleteSaleInput,
  CompleteSaleResult,
} from '../types/sale'

export type OfflineSaleStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'failed'

export interface OfflineSaleRecord {
  id?: number

  clientTransactionId: string

  businessId: string
  branchId: string

  input: CompleteSaleInput

  status: OfflineSaleStatus

  attempts: number

  lastError: string | null

  createdAt: string
  updatedAt: string

  syncedAt: string | null

  result: CompleteSaleResult | null
}

class DeshanPOSOfflineDatabase extends Dexie {
  offlineSales!: EntityTable<
    OfflineSaleRecord,
    'id'
  >

  constructor() {
    super(
      'DeshanTextilePOSPro',
    )

    this.version(1).stores({
      offlineSales:
        '++id, &clientTransactionId, businessId, branchId, status, createdAt, updatedAt',
    })
  }
}

export const offlineDb =
  new DeshanPOSOfflineDatabase()

export async function saveOfflineSale(
  input: CompleteSaleInput,
): Promise<OfflineSaleRecord> {
  const existing =
    await offlineDb.offlineSales
      .where(
        'clientTransactionId',
      )
      .equals(
        input.clientTransactionId,
      )
      .first()

  if (existing) {
    return existing
  }

  const now =
    new Date().toISOString()

  const record: OfflineSaleRecord =
    {
      clientTransactionId:
        input.clientTransactionId,

      businessId:
        input.businessId,

      branchId:
        input.branchId,

      input,

      status:
        'pending',

      attempts:
        0,

      lastError:
        null,

      createdAt:
        now,

      updatedAt:
        now,

      syncedAt:
        null,

      result:
        null,
    }

  const id =
    await offlineDb.offlineSales.add(
      record,
    )

  return {
    ...record,
    id,
  }
}

export async function getOfflineSale(
  clientTransactionId: string,
): Promise<
  OfflineSaleRecord | undefined
> {
  return offlineDb.offlineSales
    .where(
      'clientTransactionId',
    )
    .equals(
      clientTransactionId,
    )
    .first()
}

export async function getPendingOfflineSales(
  businessId?: string,
  branchId?: string,
): Promise<OfflineSaleRecord[]> {
  let records =
    await offlineDb.offlineSales
      .where('status')
      .anyOf(
        'pending',
        'failed',
      )
      .toArray()

  if (businessId) {
    records =
      records.filter(
        (record) =>
          record.businessId ===
          businessId,
      )
  }

  if (branchId) {
    records =
      records.filter(
        (record) =>
          record.branchId ===
          branchId,
      )
  }

  return records.sort(
    (a, b) =>
      new Date(
        a.createdAt,
      ).getTime() -
      new Date(
        b.createdAt,
      ).getTime(),
  )
}

export async function getUnsyncedOfflineSaleCount(
  businessId?: string,
  branchId?: string,
): Promise<number> {
  const records =
    await getPendingOfflineSales(
      businessId,
      branchId,
    )

  return records.length
}

export async function markOfflineSaleSyncing(
  id: number,
): Promise<void> {
  await offlineDb.offlineSales.update(
    id,
    {
      status:
        'syncing',

      updatedAt:
        new Date().toISOString(),
    },
  )
}

export async function markOfflineSaleSynced(
  id: number,
  result: CompleteSaleResult,
): Promise<void> {
  const now =
    new Date().toISOString()

  await offlineDb.offlineSales.update(
    id,
    {
      status:
        'synced',

      result,

      lastError:
        null,

      syncedAt:
        now,

      updatedAt:
        now,
    },
  )
}

export async function markOfflineSaleFailed(
  id: number,
  errorMessage: string,
): Promise<void> {
  const existing =
    await offlineDb.offlineSales.get(
      id,
    )

  await offlineDb.offlineSales.update(
    id,
    {
      status:
        'failed',

      attempts:
        (existing?.attempts ?? 0) +
        1,

      lastError:
        errorMessage,

      updatedAt:
        new Date().toISOString(),
    },
  )
}

export async function resetOfflineSaleToPending(
  id: number,
): Promise<void> {
  await offlineDb.offlineSales.update(
    id,
    {
      status:
        'pending',

      lastError:
        null,

      updatedAt:
        new Date().toISOString(),
    },
  )
}

export async function deleteOfflineSale(
  id: number,
): Promise<void> {
  await offlineDb.offlineSales.delete(
    id,
  )
}

export async function deleteSyncedOfflineSales(): Promise<void> {
  await offlineDb.offlineSales
    .where('status')
    .equals('synced')
    .delete()
}