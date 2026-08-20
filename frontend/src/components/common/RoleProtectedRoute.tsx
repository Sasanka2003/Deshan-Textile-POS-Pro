import type {
  ReactNode,
} from 'react'

import {
  Navigate,
} from 'react-router-dom'

import {
  useAuth,
} from '../../contexts/AuthContext'

import type {
  StaffRole,
} from '../../types/auth'

interface RoleProtectedRouteProps {
  children: ReactNode

  allowedRoles:
    StaffRole[]
}

export default function RoleProtectedRoute({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const {
    staff,
    loading,
  } = useAuth()

  if (loading) {
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
        Checking permissions...
      </div>
    )
  }

  if (!staff) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (
    !allowedRoles.includes(
      staff.role,
    )
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return children
}