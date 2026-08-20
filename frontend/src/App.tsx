import {
  lazy,
  Suspense,
} from 'react'

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import ProtectedRoute from './components/common/ProtectedRoute'
import RoleProtectedRoute from './components/common/RoleProtectedRoute'

const LoginPage = lazy(
  () =>
    import(
      './pages/auth/LoginPage'
    ),
)

const DashboardPage = lazy(
  () =>
    import(
      './pages/dashboard/DashboardPage'
    ),
)

const POSPage = lazy(
  () =>
    import(
      './pages/pos/POSPage'
    ),
)

const SalesHistoryPage = lazy(
  () =>
    import(
      './pages/sales/SalesHistoryPage'
    ),
)

const ProductsPage = lazy(
  () =>
    import(
      './pages/products/ProductsPage'
    ),
)

const BarcodeGeneratorPage = lazy(
  () =>
    import(
      './pages/barcodes/BarcodeGeneratorPage'
    ),
)

const InventoryPage = lazy(
  () =>
    import(
      './pages/inventory/InventoryPage'
    ),
)

const CustomersPage = lazy(
  () =>
    import(
      './pages/customers/CustomersPage'
    ),
)

const CustomerPaymentsPage = lazy(
  () =>
    import(
      './pages/customers/CustomerPaymentsPage'
    ),
)

const SuppliersPage = lazy(
  () =>
    import(
      './pages/suppliers/SuppliersPage'
    ),
)

const SupplierPaymentsPage = lazy(
  () =>
    import(
      './pages/suppliers/SupplierPaymentsPage'
    ),
)

const PurchasesPage = lazy(
  () =>
    import(
      './pages/purchases/PurchasesPage'
    ),
)

const ReturnsPage = lazy(
  () =>
    import(
      './pages/returns/ReturnsPage'
    ),
)

const ExpensesPage = lazy(
  () =>
    import(
      './pages/expenses/ExpensesPage'
    ),
)

const ReportsPage = lazy(
  () =>
    import(
      './pages/reports/ReportsPage'
    ),
)

const StaffPage = lazy(
  () =>
    import(
      './pages/staff/StaffPage'
    ),
)

const ShiftHistoryPage = lazy(
  () =>
    import(
      './pages/shifts/ShiftHistoryPage'
    ),
)

const SettingsPage = lazy(
  () =>
    import(
      './pages/settings/SettingsPage'
    ),
)
const OpenShiftsPage = lazy(
  () =>
    import(
      './pages/shifts/OpenShiftsPage'
    ),
)
const PurchaseReturnsPage = lazy(
  () =>
    import(
      './pages/purchases/PurchaseReturnsPage'
    ),
)

function PageLoader() {
  return (
    <div
      style={{
        minHeight:
          '100vh',

        display:
          'grid',

        placeItems:
          'center',

        background:
          '#f6f7f9',

        color:
          '#374151',

        fontSize:
          14,

        fontWeight:
          600,
      }}
    >
      Loading Deshan Textile POS...
    </div>
  )
}

const managerOnly = [
  'manager',
] as const

const managerAndCashier = [
  'manager',
  'cashier',
] as const

function App() {
  return (
    <BrowserRouter>

      <Suspense
        fallback={
          <PageLoader />
        }
      >

        <Routes>

          {/* PUBLIC */}

          <Route
            path="/login"
            element={
              <LoginPage />
            }
          />

          {/* SHARED */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerAndCashier,
                  ]}
                >
                  <DashboardPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerAndCashier,
                  ]}
                >
                  <POSPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales-history"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerAndCashier,
                  ]}
                >
                  <SalesHistoryPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerAndCashier,
                  ]}
                >
                  <CustomersPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/returns"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerAndCashier,
                  ]}
                >
                  <ReturnsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* MANAGER ONLY */}

          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <ProductsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/barcodes"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <BarcodeGeneratorPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <InventoryPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-payments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <CustomerPaymentsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <SuppliersPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/supplier-payments"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <SupplierPaymentsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <PurchasesPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchase-returns"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <PurchaseReturnsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <ExpensesPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <ReportsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/shift-history"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <ShiftHistoryPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <StaffPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute
                  allowedRoles={[
                    ...managerOnly,
                  ]}
                >
                  <SettingsPage />
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />

          {/* DEFAULT */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
          <Route
             path="/open-shifts"
             element={
              <ProtectedRoute>
                   <RoleProtectedRoute
                      allowedRoles={[
                         ...managerOnly,
                     ]}
                    >
                       <OpenShiftsPage />
                     </RoleProtectedRoute>
                   </ProtectedRoute>
              }
           />

        </Routes>

      </Suspense>

    </BrowserRouter>
  )
}

export default App