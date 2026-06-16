import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { Zap, User, Mail, Lock } from 'lucide-react'
import '../auth.form.scss'

const Register = () => {
    const { handleRegister } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ username: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.username || !form.email || !form.password) { setError('All fields are required.'); return }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setLoading(true)
        setError('')
        try {
            await handleRegister(form)
            navigate('/')
        } catch (err) {
            setError('Account already exists with this email or username.')
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

                <h1 className="auth-title">Start your job search</h1>
                <p className="auth-subtitle">Create your free career command center</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label className="input-label">Username</label>
                        <div className="input-icon-wrap">
                            <User size={15} className="input-icon" />
                            <input className="input input-with-icon" type="text" placeholder="johndoe"
                                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="input-label">Email</label>
                        <div className="input-icon-wrap">
                            <Mail size={15} className="input-icon" />
                            <input className="input input-with-icon" type="email" placeholder="you@example.com"
                                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                    </div>
                    <div className="auth-field">
                        <label className="input-label">Password</label>
                        <div className="input-icon-wrap">
                            <Lock size={15} className="input-icon" />
                            <input className="input input-with-icon" type="password" placeholder="Min 6 characters"
                                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        </div>
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create Free Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
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

export default Register