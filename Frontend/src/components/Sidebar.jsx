import React from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    LogOut,
    Zap,
    User
} from 'lucide-react'

const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Job Board' },
    { to: '/resume', icon: FileText, label: 'Resume Studio' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
]

const Sidebar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    return (
        <aside className="app-sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <Zap size={18} color="white" />
                </div>
                <span className="brand-name">CareerOS</span>
            </div>

            <nav className="sidebar-nav">
                <span className="sidebar-label">Navigation</span>
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
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
                <button className="sidebar-item" onClick={onLogout} style={{ color: 'var(--rose)' }}>
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
