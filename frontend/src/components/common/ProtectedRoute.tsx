import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode
}) {
  const { session, staff, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        Loading Deshan Textile POS...
      </div>
    )
  }

  if (!session || !staff) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}