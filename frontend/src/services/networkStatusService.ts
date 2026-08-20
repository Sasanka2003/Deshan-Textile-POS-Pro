export type NetworkStatus =
  | 'online'
  | 'offline'

export type NetworkStatusListener = (
  status: NetworkStatus,
) => void

export function getNetworkStatus(): NetworkStatus {
  return navigator.onLine
    ? 'online'
    : 'offline'
}

export function isOnline(): boolean {
  return navigator.onLine
}

export function isOffline(): boolean {
  return !navigator.onLine
}

export function subscribeToNetworkStatus(
  listener: NetworkStatusListener,
): () => void {
  const handleOnline = () => {
    listener('online')
  }

  const handleOffline = () => {
    listener('offline')
  }

  window.addEventListener(
    'online',
    handleOnline,
  )

  window.addEventListener(
    'offline',
    handleOffline,
  )

  return () => {
    window.removeEventListener(
      'online',
      handleOnline,
    )

    window.removeEventListener(
      'offline',
      handleOffline,
    )
  }
}