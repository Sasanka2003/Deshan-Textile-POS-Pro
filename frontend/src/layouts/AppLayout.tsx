import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  NavLink,
  useNavigate,
} from 'react-router-dom'

import {
  AlertTriangle,
  BarChart3,
  Barcode,
  Boxes,
  Cloud,
  CloudOff,
  RadioTower,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  History,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  ReceiptText,
  RotateCcw,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  UserRound,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

import {
  useAuth,
} from '../contexts/AuthContext'

import {
  getUnsyncedOfflineSaleCount,
} from '../services/offlineDb'

import {
  syncPendingOfflineSales,
} from '../services/offlineSaleService'

import {
  getNetworkStatus,
  subscribeToNetworkStatus,
} from '../services/networkStatusService'

import {
  getBusinessSettings,
} from '../services/settingsService'

import {
  getCurrentShift,
} from '../services/shiftService'

import type {
  StaffRole,
} from '../types/auth'

import '../styles/app-layout.css'

interface AppLayoutProps {
  children: ReactNode
}

interface MenuItem {
  label: string
  path: string

  icon:
    typeof LayoutDashboard

  roles:
    StaffRole[]
}

const menuItems:
  MenuItem[] = [
    {
      label:
        'Dashboard',

      path:
        '/dashboard',

      icon:
        LayoutDashboard,

      roles: [
        'manager',
        'cashier',
      ],
    },

    {
      label:
        'POS',

      path:
        '/pos',

      icon:
        ShoppingCart,

      roles: [
        'manager',
        'cashier',
      ],
    },

    {
      label:
        'Sales History',

      path:
        '/sales-history',

      icon:
        ReceiptText,

      roles: [
        'manager',
        'cashier',
      ],
    },

    {
      label:
        'Products',

      path:
        '/products',

      icon:
        PackageSearch,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Barcodes',

      path:
        '/barcodes',

      icon:
        Barcode,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Inventory',

      path:
        '/inventory',

      icon:
        Boxes,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Customers',

      path:
        '/customers',

      icon:
        Users,

      roles: [
        'manager',
        'cashier',
      ],
    },

    {
      label:
        'Customer Payments',

      path:
        '/customer-payments',

      icon:
        WalletCards,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Suppliers',

      path:
        '/suppliers',

      icon:
        Truck,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Supplier Payments',

      path:
        '/supplier-payments',

      icon:
        WalletCards,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Purchases',

      path:
        '/purchases',

      icon:
        Store,

      roles: [
        'manager',
      ],
    },
    {
      label:
       'Purchase Returns',

      path:
       '/purchase-returns',

      icon:
       RotateCcw,

      roles: [
       'manager',
     ],
    },

    {
      label:
        'Returns',

      path:
        '/returns',

      icon:
        RotateCcw,

      roles: [
        'manager',
        'cashier',
      ],
    },

    {
      label:
        'Expenses',

      path:
        '/expenses',

      icon:
        CircleDollarSign,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Reports',

      path:
        '/reports',

      icon:
        BarChart3,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Open Shifts',

      path:
        '/open-shifts',

      icon:
        RadioTower,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Shift History',

      path:
        '/shift-history',

      icon:
        History,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Staff',

      path:
        '/staff',

      icon:
        UserRound,

      roles: [
        'manager',
      ],
    },

    {
      label:
        'Settings',

      path:
        '/settings',

      icon:
        Settings,

      roles: [
        'manager',
      ],
    },
  ]

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const navigate =
    useNavigate()

  const {
    staff,
    logout,
  } = useAuth()

  const [
    collapsed,
    setCollapsed,
  ] =
    useState(false)

  const [
    businessName,
    setBusinessName,
  ] =
    useState(
      'Deshan Textile',
    )

  const [
    terminalName,
    setTerminalName,
  ] =
    useState(
      'POS Terminal 01',
    )

  const [
    logoutChecking,
    setLogoutChecking,
  ] =
    useState(false)

  const [
    logoutWarningOpen,
    setLogoutWarningOpen,
  ] =
    useState(false)

  const [
    logoutError,
    setLogoutError,
  ] =
    useState('')

  const [
    networkStatus,
    setNetworkStatus,
  ] = useState(
    getNetworkStatus(),
  )

  const [
    pendingOfflineSales,
    setPendingOfflineSales,
  ] = useState(0)

  const [
    syncingOfflineSales,
    setSyncingOfflineSales,
  ] = useState(false)

  const syncInProgressRef =
    useRef(false)

  const refreshPendingOfflineSales =
    useCallback(async () => {
      if (
        !staff?.businessId ||
        !staff.branchId
      ) {
        setPendingOfflineSales(0)
        return 0
      }

      try {
        const count =
          await getUnsyncedOfflineSaleCount(
            staff.businessId,
            staff.branchId,
          )

        setPendingOfflineSales(
          count,
        )

        return count
      } catch (error) {
        console.error(
          'Unable to read offline sale queue:',
          error,
        )

        return 0
      }
    }, [
      staff?.businessId,
      staff?.branchId,
    ])

  const runOfflineSync =
    useCallback(async () => {
      if (
        syncInProgressRef.current ||
        !navigator.onLine ||
        !staff?.businessId ||
        !staff.branchId
      ) {
        return
      }

      const pendingCount =
        await refreshPendingOfflineSales()

      if (pendingCount === 0) {
        return
      }

      syncInProgressRef.current =
        true

      setSyncingOfflineSales(
        true,
      )

      try {
        const result =
          await syncPendingOfflineSales(
            staff.businessId,
            staff.branchId,
          )

        if (result.failed > 0) {
          console.warn(
            `${result.failed} offline sale(s) could not be synced.`,
          )
        }
      } catch (error) {
        console.error(
          'Offline sale sync failed:',
          error,
        )
      } finally {
        syncInProgressRef.current =
          false

        setSyncingOfflineSales(
          false,
        )

        await refreshPendingOfflineSales()
      }
    }, [
      staff?.businessId,
      staff?.branchId,
      refreshPendingOfflineSales,
    ])

  useEffect(() => {
    void refreshPendingOfflineSales()

    const unsubscribe =
      subscribeToNetworkStatus(
        (status) => {
          setNetworkStatus(
            status,
          )

          if (
            status ===
            'online'
          ) {
            window.setTimeout(
              () => {
                void runOfflineSync()
              },
              750,
            )
          }
        },
      )

    const queueRefreshTimer =
      window.setInterval(
        () => {
          void refreshPendingOfflineSales()
        },
        2000,
      )

    const retrySyncTimer =
      window.setInterval(
        () => {
          if (navigator.onLine) {
            void runOfflineSync()
          }
        },
        30000,
      )

    if (navigator.onLine) {
      void runOfflineSync()
    }

    return () => {
      unsubscribe()
      window.clearInterval(
        queueRefreshTimer,
      )
      window.clearInterval(
        retrySyncTimer,
      )
    }
  }, [
    refreshPendingOfflineSales,
    runOfflineSync,
  ])

  useEffect(() => {
    const businessId =
      staff?.businessId

    if (!businessId) {
      setBusinessName(
        'Deshan Textile',
      )

      setTerminalName(
        'POS Terminal 01',
      )

      return
    }

    const currentBusinessId =
      businessId

    let active =
      true

    async function loadLayoutSettings() {
      try {
        const settings =
          await getBusinessSettings(
            currentBusinessId,
          )

        if (!active) {
          return
        }

        if (!settings) {
          setBusinessName(
            'Deshan Textile',
          )

          setTerminalName(
            'POS Terminal 01',
          )

          return
        }

        setBusinessName(
          settings.businessName
            .trim() ||
            'Deshan Textile',
        )

        setTerminalName(
          settings.terminalName
            .trim() ||
            'POS Terminal 01',
        )
      } catch (error) {
        console.error(
          'Unable to load layout settings:',
          error,
        )

        if (!active) {
          return
        }

        setBusinessName(
          'Deshan Textile',
        )

        setTerminalName(
          'POS Terminal 01',
        )
      }
    }

    void loadLayoutSettings()

    return () => {
      active =
        false
    }
  }, [
    staff?.businessId,
  ])

  const menu =
    menuItems.filter(
      (item) =>
        staff
          ? item.roles.includes(
              staff.role,
            )
          : false,
    )

  async function performLogout() {
    await logout()

    navigate(
      '/login',
      {
        replace:
          true,
      },
    )
  }

  async function handleLogout() {
    if (
      !staff?.businessId ||
      !staff.branchId ||
      !staff.id
    ) {
      await performLogout()

      return
    }

    try {
      setLogoutChecking(
        true,
      )

      setLogoutError(
        '',
      )

      const currentShift =
        await getCurrentShift(
          staff.businessId,
          staff.branchId,
          staff.id,
        )

      if (currentShift) {
        setLogoutWarningOpen(
          true,
        )

        return
      }

      await performLogout()
    } catch (err) {
      setLogoutError(
        err instanceof Error
          ? err.message
          : 'Unable to check the current shift.',
      )
    } finally {
      setLogoutChecking(
        false,
      )
    }
  }

  function handleGoToPOS() {
    setLogoutWarningOpen(
      false,
    )

    navigate(
      '/pos',
    )
  }

  return (
    <div
      className={`app-shell ${
        collapsed
          ? 'sidebar-collapsed'
          : ''
      }`}
    >

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            DT
          </div>

          {!collapsed && (
            <div className="sidebar-brand-text">

              <strong>
                {businessName}
              </strong>

              <span>
                Point of Sale
              </span>

            </div>
          )}

        </div>

        <nav className="sidebar-nav">

          {menu.map(
            (item) => {
              const Icon =
                item.icon

              return (
                <NavLink
                  key={
                    item.path
                  }
                  to={
                    item.path
                  }
                  title={
                    collapsed
                      ? item.label
                      : undefined
                  }
                  className={({
                    isActive,
                  }) =>
                    `sidebar-link ${
                      isActive
                        ? 'active'
                        : ''
                    }`
                  }
                >

                  <Icon
                    size={20}
                  />

                  {!collapsed && (
                    <span>
                      {
                        item.label
                      }
                    </span>
                  )}

                </NavLink>
              )
            },
          )}

        </nav>

        <div className="sidebar-footer">

          <button
            className="sidebar-link logout-button"
            onClick={() =>
              void handleLogout()
            }
            type="button"
            title={
              collapsed
                ? 'Logout'
                : undefined
            }
            disabled={
              logoutChecking
            }
          >

            <LogOut
              size={20}
            />

            {!collapsed && (
              <span>
                {logoutChecking
                  ? 'Checking...'
                  : 'Logout'}
              </span>
            )}

          </button>

          {!collapsed &&
            logoutError && (
            <div className="sidebar-logout-error">
              {logoutError}
            </div>
          )}

        </div>

      </aside>

      <section className="app-main">

        <header className="topbar">

          <button
            className="sidebar-toggle"
            onClick={() =>
              setCollapsed(
                (value) =>
                  !value,
              )
            }
            type="button"
            aria-label="Toggle sidebar"
          >

            {collapsed ? (
              <ChevronRight
                size={20}
              />
            ) : (
              <ChevronLeft
                size={20}
              />
            )}

          </button>

          <div className="topbar-spacer" />

          <div
            className={`network-status ${
              syncingOfflineSales
                ? 'syncing'
                : networkStatus
            }`}
            title={
              pendingOfflineSales > 0
                ? `${pendingOfflineSales} offline sale(s) waiting to sync`
                : networkStatus === 'offline'
                  ? 'Internet connection is unavailable'
                  : 'Cloud connection is available'
            }
          >
            {syncingOfflineSales ? (
              <RefreshCw
                size={16}
                className="network-status-spin"
              />
            ) : networkStatus ===
              'online' ? (
              <Cloud size={16} />
            ) : (
              <CloudOff size={16} />
            )}

            <span>
              {syncingOfflineSales
                ? 'SYNCING'
                : networkStatus ===
                    'online'
                  ? 'ONLINE'
                  : 'OFFLINE'}

              {pendingOfflineSales > 0 &&
                ` · ${pendingOfflineSales} pending`}
            </span>
          </div>

          <div className="topbar-status">

            <WalletCards
              size={18}
            />

            <span>
              {terminalName}
            </span>

          </div>

          <div className="user-profile">

            <div className="user-avatar">
              {staff?.fullName
                ?.charAt(0)
                .toUpperCase() ??
                'U'}
            </div>

            <div className="user-details">

              <strong>
                {
                  staff?.fullName
                }
              </strong>

              <span>
                {
                  staff?.role
                }
              </span>

            </div>

          </div>

        </header>

        <main className="app-content">
          {children}
        </main>

      </section>

      {logoutWarningOpen && (
        <div
          className="logout-shift-backdrop"
          onMouseDown={() =>
            setLogoutWarningOpen(
              false,
            )
          }
        >

          <section
            className="logout-shift-modal"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >

            <div className="logout-shift-heading">

              <div className="logout-shift-icon">

                <AlertTriangle
                  size={22}
                />

              </div>

              <div>

                <h2>
                  Shift Still Open
                </h2>

                <p>
                  You cannot logout while
                  your cashier shift is open.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setLogoutWarningOpen(
                    false,
                  )
                }
                aria-label="Close warning"
              >

                <X
                  size={18}
                />

              </button>

            </div>

            <div className="logout-shift-body">

              <p>
                Go to the POS and close your
                current shift before logging
                out. This keeps the cash
                reconciliation and drawer
                balance accurate.
              </p>

            </div>

            <div className="logout-shift-actions">

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setLogoutWarningOpen(
                    false,
                  )
                }
              >
                Stay Logged In
              </button>

              <button
                type="button"
                className="primary"
                onClick={
                  handleGoToPOS
                }
              >

                <ShoppingCart
                  size={16}
                />

                Go to POS

              </button>

            </div>

          </section>

        </div>
      )}

    </div>
  )
}