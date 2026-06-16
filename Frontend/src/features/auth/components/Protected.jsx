import { useAuth } from "../hooks/useAuth"
import { Navigate } from "react-router"
import React, { useContext, useEffect } from 'react'
import Sidebar from '../../../components/Sidebar'
import Toast from '../../../components/Toast'
import { AppContext } from '../../../app.context'
import { getProfile } from '../../../api'

const Protected = ({ children }) => {
    const { loading, user } = useAuth()
    const { toast, showToast, setProfile } = useContext(AppContext)

    // Load profile once user is authenticated
    useEffect(() => {
        if (user) {
            getProfile().then(d => setProfile(d.profile)).catch(() => { })
        }
    }, [user])

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', gap: 12, color: 'var(--text-secondary)'
            }}>
                <div style={{
                    width: 28, height: 28,
                    border: '3px solid rgba(124,58,237,0.2)',
                    borderTopColor: 'var(--violet)',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite'
                }} />
                Loading CareerOS...
            </div>
        )
    }

    if (!user) return <Navigate to="/login" />

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-content">
                {children}
            </main>
            <Toast toast={toast} onClose={() => showToast(null)} />
        </div>
    )
}

export default Protected