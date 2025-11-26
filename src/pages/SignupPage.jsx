import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { upsertProfile } from '../services/supabaseService.js'

const defaultForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  employmentType: '',
  incomeVariability: '',
  riskTolerance: ''
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUpWithEmail } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleStepOne = (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleStepTwo = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.employmentType || !form.incomeVariability || !form.riskTolerance) {
      setError('Please complete every field.')
      return
    }

    setLoading(true)

    try {
      const metadata = {
        full_name: form.name,
        employment_type: form.employmentType,
        income_variability: form.incomeVariability,
        risk_tolerance: form.riskTolerance
      }

      const { user, session } = await signUpWithEmail({
        email: form.email,
        password: form.password,
        metadata
      })

      const userId = session?.user?.id
      if (userId) {
        await upsertProfile(userId, {
          full_name: form.name,
          employment_type: form.employmentType,
          income_variability: form.incomeVariability,
          risk_tolerance: form.riskTolerance,
          onboarding_complete: true
        })
        navigate('/dashboard')
      } else {
        // Email confirmations disable automatic sessions, so send new members to login once verified.
        navigate('/login', { state: { message: 'Check your inbox to confirm your email, then sign in.' } })
      }
    } catch (signupError) {
      setError(signupError.message || 'Unable to create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-mark brand-mark--center">
          <TrendingUp size={28} />
          <span>RythmIQ</span>
        </div>
        <h1>Get started</h1>
        <p className="muted">Begin your journey to financial wellness.</p>

        {step === 1 ? (
          <form className="form" onSubmit={handleStepOne}>
            <label className="form-field">
              <span>Full name</span>
              <input
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="Alex Johnson"
                required
              />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => handleChange('password', event.target.value)}
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </label>
            <label className="form-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => handleChange('confirmPassword', event.target.value)}
                placeholder="Re-enter password"
                required
              />
            </label>
            {error && <p className="feedback feedback--error">{error}</p>}
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleStepTwo}>
            <label className="form-field">
              <span>Employment type</span>
              <select
                value={form.employmentType}
                onChange={(event) => handleChange('employmentType', event.target.value)}
                required
              >
                <option value="" disabled>
                  Select employment type
                </option>
                <option value="gig">Gig Work</option>
                <option value="informal">Informal Sector</option>
                <option value="formal">Formal Employment</option>
                <option value="self-employed">Self-Employed</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="form-field">
              <span>Income variability</span>
              <select
                value={form.incomeVariability}
                onChange={(event) => handleChange('incomeVariability', event.target.value)}
                required
              >
                <option value="" disabled>
                  Select variability
                </option>
                <option value="low">Consistent income</option>
                <option value="medium">Somewhat variable</option>
                <option value="high">Highly variable</option>
              </select>
            </label>
            <label className="form-field">
              <span>Risk tolerance</span>
              <select
                value={form.riskTolerance}
                onChange={(event) => handleChange('riskTolerance', event.target.value)}
                required
              >
                <option value="" disabled>
                  Select risk tolerance
                </option>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </label>
            {error && <p className="feedback feedback--error">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="muted">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
