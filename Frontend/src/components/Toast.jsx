import React from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const icons = {
    success: <CheckCircle size={16} color="var(--emerald)" />,
    error: <AlertCircle size={16} color="var(--rose)" />,
    info: <Info size={16} color="var(--cyan)" />
}

const Toast = ({ toast, onClose }) => {
    if (!toast) return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-hover)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideUp 0.2s ease',
            maxWidth: 360,
            fontSize: 14,
            color: 'var(--text-primary)',
        }}>
            {icons[toast.type] || icons.info}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                <X size={14} />
            </button>
        </div>
    )
}

export default Toast
