import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Zap, Mail, Lock } from 'lucide-react'
import '../auth.form.scss'

const Login = () => {
    const { handleLogin } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email || !password) { setError('Please fill in all fields.'); return }
        setLoading(true)
        setError('')
        try {
            await handleLogin({ email, password })
            navigate('/')
        } catch {
            setError('Invalid email or password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-glow auth-glow--1" />
                <div className="auth-glow auth-glow--2" />
            </div>

            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-brand-icon"><Zap size={22} color="white" /></div>
                    <span className="auth-brand-name">CareerOS</span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your career command center</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label className="input-label">Email</label>
                        <div className="input-icon-wrap">
                            <Mail size={15} className="input-icon" />
                            <input className="input input-with-icon" type="email" placeholder="you@example.com"
                                value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="input-label">Password</label>
                        <div className="input-icon-wrap">
                            <Lock size={15} className="input-icon" />
                            <input className="input input-with-icon" type="password" placeholder="••••••••"
                                value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Create one free</Link>
                </p>

                <div className="auth-features">
                    {['Kanban Job Tracker', 'Mock Interview Grader', 'ATS Resume Audit', 'Negotiation Coach'].map(f => (
                        <span key={f} className="auth-feature-chip">✓ {f}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Login