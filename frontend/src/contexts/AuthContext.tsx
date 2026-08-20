import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Session } from '@supabase/supabase-js'

import { supabase } from '../services/supabase'
import {
  getCurrentStaff,
  signIn as authSignIn,
  signOut as authSignOut,
} from '../services/authService'

import type { StaffProfile } from '../types/auth'

interface AuthContextValue {
  session: Session | null
  staff: StaffProfile | null
  loading: boolean

  login: (
    email: string,
    password: string,
  ) => Promise<void>

  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [staff, setStaff] = useState<StaffProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStaff = useCallback(async (currentSession: Session) => {
    setSession(currentSession)

    try {
      const profile = await getCurrentStaff()
      setStaff(profile)
    } catch (error) {
      console.error('Unable to load staff profile:', error)

      setStaff(null)
      setSession(null)

      await supabase.auth.signOut()
      throw error
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (currentSession) {
          await loadStaff(currentSession)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)

        if (mounted) {
          setSession(null)
          setStaff(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return

        if (!newSession) {
          setSession(null)
          setStaff(null)
        }
      },
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadStaff])

  async function login(
    email: string,
    password: string,
  ) {
    setLoading(true)

    try {
      const data = await authSignIn(email, password)

      if (!data.session) {
        throw new Error('Unable to create login session.')
      }

      await loadStaff(data.session)
    } catch (error) {
      setSession(null)
      setStaff(null)

      await supabase.auth.signOut()

      throw error
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    setLoading(true)

    try {
      await authSignOut()
    } finally {
      setSession(null)
      setStaff(null)
      setLoading(false)
    }
  }

  const value = useMemo(
    () => ({
      session,
      staff,
      loading,
      login,
      logout,
    }),
    [session, staff, loading],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.',
    )
  }

  return context
}