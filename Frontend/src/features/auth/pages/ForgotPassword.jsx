import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router'
import { Zap, Mail, ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react'
import { sendOtp, verifyOtpReset } from '../../../api'
import '../auth.form.scss'

// ── OTP Input — 6 individual digit boxes ──────────────────────────────────────
const OtpInput = ({ value, onChange }) => {
    const refs = useRef([])

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace') {
            const digits = value.split('')
            if (digits[i]) {
                digits[i] = ''
                onChange(digits.join(''))
            } else if (i > 0) {
                refs.current[i - 1]?.focus()
            }
        }
    }

    const handleChange = (i, e) => {
        const ch = e.target.value.replace(/\D/g, '').slice(-1)
        const digits = value.padEnd(6, '').split('')
        digits[i] = ch
        onChange(digits.join('').trim())
        if (ch && i < 5) refs.current[i + 1]?.focus()
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        onChange(pasted)
        if (pasted.length > 0) refs.current[Math.min(pasted.length, 5)]?.focus()
    }

    return (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {[...Array(6)].map((_, i) => (
                <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] || ''}
                    onChange={e => handleChange(i, e)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    style={{
                        width: 48, height: 56,
                        textAlign: 'center',
                        fontSize: 24, fontWeight: 800,
                        background: 'rgba(255,255,255,0.05)',
                        border: `2px solid ${value[i] ? 'var(--violet)' : 'var(--border)'}`,
                        borderRadius: 12,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                        fontFamily: 'JetBrains Mono, monospace',
                        caretColor: 'transparent',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--violet)'}
                    onBlur={e => e.target.style.borderColor = value[i] ? 'var(--violet)' : 'var(--border)'}
                />
            ))}
        </div>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────────
const ForgotPassword = () => {
    const navigate = useNavigate()
    // step: 'email' → 'otp' → 'password' → 'done'
    const [step, setStep] = useState('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)

    // Resend countdown timer
    useEffect(() => {
        if (resendCooldown <= 0) return
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [resendCooldown])

    const handleSendOtp = async (e) => {
        e?.preventDefault()
        if (!email) { setError('Please enter your email address.'); return }
        setLoading(true); setError('')
        try {
            await sendOtp({ email })
            setStep('otp')
            setResendCooldown(60)
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to send OTP. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (resendCooldown > 0) return
        setError('')
        setLoading(true)
        try {
            await sendOtp({ email })
            setOtp('')
            setResendCooldown(60)
        } catch (err) {
            setError('Failed to resend OTP. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = (e) => {
        e.preventDefault()
        if (otp.length < 6) { setError('Please enter the complete 6-digit code.'); return }
        setError('')
        setStep('password')
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!newPassword || !confirmPassword) { setError('Please fill in all fields.'); return }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }
        setLoading(true); setError('')
        try {
            await verifyOtpReset({ email, otp, newPassword })
            setStep('done')
        } catch (err) {
            setError(err?.response?.data?.message || 'Reset failed. The OTP may have expired.')
            // Go back to OTP step if OTP is invalid/expired
            if (err?.response?.status === 400) setStep('otp')
        } finally {
            setLoading(false)
        }
    }

    const stepIndex = { email: 0, otp: 1, password: 2, done: 3 }[step]

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-glow auth-glow--1" />
                <div className="auth-glow auth-glow--2" />
            </div>

            <div className="auth-card" style={{ maxWidth: 440 }}>
                <div className="auth-brand">
                    <div className="auth-brand-icon"><Zap size={22} color="white" /></div>
                    <span className="auth-brand-name">CareerOS</span>
                </div>

                {/* Step Progress */}
                {step !== 'done' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28, marginTop: 4 }}>
                        {['Email', 'Verify OTP', 'New Password'].map((label, i) => (
                            <React.Fragment key={i}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: i <= stepIndex ? 'var(--violet)' : 'var(--bg-card)',
                                        border: `2px solid ${i <= stepIndex ? 'var(--violet)' : 'var(--border)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 700, color: i <= stepIndex ? '#fff' : 'var(--text-muted)',
                                        transition: 'all 0.3s ease', flexShrink: 0
                                    }}>
                                        {i < stepIndex ? '✓' : i + 1}
                                    </div>
                                    <span style={{ fontSize: 10, color: i <= stepIndex ? 'var(--violet-light)' : 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                        {label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div style={{
                                        flex: 1, height: 2, marginBottom: 18,
                                        background: i < stepIndex ? 'var(--violet)' : 'var(--border)',
                                        transition: 'background 0.3s ease', minWidth: 20
                                    }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* ── Step 1: Enter Email ── */}
                {step === 'email' && (
                    <>
                        <h1 className="auth-title">Reset Password</h1>
                        <p className="auth-subtitle">Enter your account email and we'll send you a one-time code.</p>
                        <form onSubmit={handleSendOtp} className="auth-form">
                            <div className="auth-field">
                                <label className="input-label">Email Address</label>
                                <div className="input-icon-wrap">
                                    <Mail size={15} className="input-icon" />
                                    <input
                                        className="input input-with-icon"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {error && <p className="auth-error">{error}</p>}
                            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Sending OTP…</> : 'Send OTP Code'}
                            </button>
                        </form>
                        <p className="auth-switch">
                            Remember your password? <Link to="/login">Sign in</Link>
                        </p>
                    </>
                )}

                {/* ── Step 2: Enter OTP ── */}
                {step === 'otp' && (
                    <>
                        <h1 className="auth-title">Check your email</h1>
                        <p className="auth-subtitle">
                            We sent a 6-digit code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
                            It expires in 10 minutes.
                        </p>
                        <form onSubmit={handleVerifyOtp} className="auth-form">
                            <div style={{ marginBottom: 8 }}>
                                <OtpInput value={otp} onChange={setOtp} />
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: 8 }}>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0 || loading}
                                    style={{
                                        background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer',
                                        color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--violet-light)',
                                        fontSize: 13, fontFamily: 'Inter, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 5
                                    }}
                                >
                                    <RefreshCw size={12} />
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                                </button>
                            </div>

                            {error && <p className="auth-error">{error}</p>}

                            <button type="submit" className="btn-primary auth-submit" disabled={otp.length < 6 || loading}>
                                Verify Code →
                            </button>
                        </form>
                        <button
                            onClick={() => { setStep('email'); setOtp(''); setError('') }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, marginTop: 12, fontFamily: 'Inter, sans-serif' }}
                        >
                            <ArrowLeft size={13} /> Change email
                        </button>
                    </>
                )}

                {/* ── Step 3: New Password ── */}
                {step === 'password' && (
                    <>
                        <h1 className="auth-title">Set new password</h1>
                        <p className="auth-subtitle">Choose a strong password for your account.</p>
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="auth-field">
                                <label className="input-label">New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input"
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        style={{ paddingRight: 42 }}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}
                                    >
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {newPassword && (
                                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                        {[...Array(4)].map((_, i) => {
                                            const strength = newPassword.length >= 6 ? (newPassword.length >= 10 ? 3 : (newPassword.length >= 8 ? 2 : 1)) : 0
                                            const colors = ['var(--rose)', 'var(--amber)', 'var(--cyan)', 'var(--emerald)']
                                            return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? colors[strength - 1] : 'var(--border)', transition: 'all 0.2s' }} />
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="auth-field">
                                <label className="input-label">Confirm New Password</label>
                                <input
                                    className="input"
                                    type="password"
                                    placeholder="Repeat password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    style={{ borderColor: confirmPassword && newPassword !== confirmPassword ? 'var(--rose)' : undefined }}
                                />
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 4 }}>Passwords do not match</p>
                                )}
                            </div>

                            {error && <p className="auth-error">{error}</p>}
                            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                                {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Resetting…</> : <><KeyRound size={14} /> Reset Password</>}
                            </button>
                        </form>
                    </>
                )}

                {/* ── Step 4: Success ── */}
                {step === 'done' && (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                        <CheckCircle size={48} color="var(--emerald)" style={{ marginBottom: 16 }} />
                        <h1 className="auth-title" style={{ marginBottom: 8 }}>Password Reset!</h1>
                        <p className="auth-subtitle" style={{ marginBottom: 28 }}>
                            Your password has been updated successfully. You can now sign in with your new password.
                        </p>
                        <button className="btn-primary auth-submit" onClick={() => navigate('/login')}>
                            Go to Sign In →
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ForgotPassword
