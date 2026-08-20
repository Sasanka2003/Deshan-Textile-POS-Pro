import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import { Navigate, useNavigate } from 'react-router-dom'

import '../../styles/auth.css'

import { useAuth } from '../../contexts/AuthContext'
import '../../styles/auth.css'

export default function LoginPage() {
  const navigate = useNavigate()

  const {
    login,
    session,
    staff,
    loading,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (session && staff) {
      navigate('/dashboard', { replace: true })
    }
  }, [session, staff, navigate])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in.',
      )
    }
  }

  if (!loading && session && staff) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-block">
          <div className="brand-mark">
            DT
          </div>

          <h1>Deshan Textile</h1>
          <p>Point of Sale System</p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter email"
              autoComplete="username"
              disabled={loading}
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="shop-info">
          <span>Deshan, Nadugala Wella / Nadugala</span>
          <span>072 415 3963</span>
        </div>
      </div>
    </div>
  )
}