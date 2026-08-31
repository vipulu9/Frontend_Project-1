import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './auth.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Minimum 8 chars, at least 1 uppercase, 1 digit, 1 special character
const PASSWORD_RE = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

function validate({ name, email, password, confirmPassword }) {
  const errors = {}

  const trimmedName = name.trim()
  if (!trimmedName) {
    errors.name = 'Full name is required.'
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  } else if (trimmedName.length > 50) {
    errors.name = 'Name must be 50 characters or fewer.'
  }

  if (!email.trim()) {
    errors.email = 'Email is required.'
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (!PASSWORD_RE.test(password)) {
    errors.password =
      'Minimum 8 characters with at least one uppercase letter, number, and special character.'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validation = validate(fields)
    if (Object.keys(validation).length) {
      setErrors(validation)
      return
    }
    setIsSubmitting(true)
    try {
      await register({
        name: fields.name.trim(),
        email: fields.email.trim(),
        password: fields.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Sign up to get started.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="auth-alert" role="alert">
              {serverError}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="name" className="auth-label">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className={`auth-input${errors.name ? ' auth-input--error' : ''}`}
              value={fields.name}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <span id="name-error" className="auth-field-error" role="alert">
                {errors.name}
              </span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">
              Email address
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              className={`auth-input${errors.email ? ' auth-input--error' : ''}`}
              value={fields.email}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
            />
            {errors.email && (
              <span id="reg-email-error" className="auth-field-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              className={`auth-input${errors.password ? ' auth-input--error' : ''}`}
              value={fields.password}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-describedby={errors.password ? 'reg-password-error' : undefined}
            />
            {errors.password && (
              <span id="reg-password-error" className="auth-field-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              className={`auth-input${errors.confirmPassword ? ' auth-input--error' : ''}`}
              value={fields.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
            />
            {errors.confirmPassword && (
              <span id="confirm-error" className="auth-field-error" role="alert">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting && <span className="auth-spinner" aria-hidden="true" />}
            {isSubmitting ? 'Creating account\u2026' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
