import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    LogOut,
    Zap,
    User,
    Lock,
    X,
    Eye,
    EyeOff,
    KeyRound
} from 'lucide-react'
import { changePassword } from '../api'

const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Job Board' },
    { to: '/resume', icon: FileText, label: 'Resume Studio' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

// ── Change Password Modal ──────────────────────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            setError('All fields are required.')
            return
        }
        if (form.newPassword.length < 6) {
            setError('New password must be at least 6 characters.')
            return
        }
        if (form.newPassword !== form.confirmPassword) {
            setError('New passwords do not match.')
            return
        }
        if (form.currentPassword === form.newPassword) {
            setError('New password must be different from your current password.')
            return
        }

        setLoading(true)
        try {
            await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
            setSuccess(true)
            setTimeout(onClose, 2000)
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to change password. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(10,10,12,0.85)',
                backdropFilter: 'blur(10px)', zIndex: 300,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24, animation: 'fadeIn 0.25s ease'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-hover)',
                    borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 420,
                    padding: 32, animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    boxShadow: 'var(--shadow-lg)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'var(--accent-cybervolt-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid var(--accent-cybervolt)'
                        }}>
                            <KeyRound size={16} color="var(--accent-cybervolt)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Change Password</h2>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Enter your current password to continue</p>
                        </div>
                    </div>
                    <button className="btn-icon" onClick={onClose}><X size={15} /></button>
                </div>

                {success ? (
                    <div style={{
                        marginTop: 24, padding: '20px', background: 'var(--emerald-dim)',
                        border: '1px solid rgba(90,135,103,0.3)', borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                        <p style={{ color: 'var(--emerald)', fontWeight: 600, margin: 0 }}>Password changed successfully!</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Closing in a moment…</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
                        {/* Current Password */}
                        <div>
                            <label className="input-label">Current Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="input"
                                    type={showCurrent ? 'text' : 'password'}
                                    placeholder="Your current password"
                                    value={form.currentPassword}
                                    onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', padding: 0, display: 'flex'
                                    }}
                                >
                                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="input-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    className="input"
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="Min 6 characters"
                                    value={form.newPassword}
                                    onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', padding: 0, display: 'flex'
                                    }}
                                >
                                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {form.newPassword && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                    {[...Array(4)].map((_, i) => {
                                        const strength = form.newPassword.length >= 6
                                            ? (form.newPassword.length >= 10 ? 3 : (form.newPassword.length >= 8 ? 2 : 1))
                                            : 0
                                        const colors = ['var(--rose)', 'var(--amber)', 'var(--cyan)', 'var(--emerald)']
                                        return (
                                            <div key={i} style={{
                                                flex: 1, height: 4, borderRadius: 4,
                                                background: i < strength ? colors[strength - 1] : 'var(--border)',
                                                transition: 'all 0.2s ease'
                                            }} />
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="input-label">Confirm New Password</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="Repeat new password"
                                value={form.confirmPassword}
                                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                style={{
                                    borderColor: form.confirmPassword && form.newPassword !== form.confirmPassword
                                        ? 'var(--rose)' : undefined
                                }}
                            />
                            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                                <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>Passwords do not match</p>
                            )}
                        </div>

                        {error && (
                            <div style={{
                                padding: '10px 14px', background: 'var(--rose-dim)',
                                border: '1px solid rgba(166,63,63,0.3)', borderRadius: 8,
                                fontSize: 13, color: 'var(--rose)'
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading
                                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Updating…</>
                                    : <><Lock size={13} /> Update Password</>
                                }
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
const Sidebar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()
    const [showChangePassword, setShowChangePassword] = useState(false)

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <Zap size={18} color="var(--accent-cybervolt)" />
                </div>
                <span className="brand-name">CareerOS</span>
            </div>

            <nav className="sidebar-nav">
                <span className="sidebar-label">Navigation</span>
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/dashboard'}
                        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={16} />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-item" style={{ marginBottom: 4, cursor: 'default', pointerEvents: 'none', opacity: 0.7 }}>
                    <User size={16} />
                    <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.username || user?.email}
                    </span>
                </div>
                <button
                    className="sidebar-item"
                    onClick={() => setShowChangePassword(true)}
                    style={{ color: 'var(--text-secondary)' }}
                    id="sidebar-change-password"
                >
                    <KeyRound size={16} />
                    Change Password
                </button>
                <button className="sidebar-item" onClick={onLogout} style={{ color: 'var(--rose)' }}>
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>

            {showChangePassword && (
                <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
            )}
        </aside>
    )
}

export default Sidebar
