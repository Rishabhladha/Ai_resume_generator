import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../app.context'
import { getAnalytics } from '../../api'
import { TrendingUp, Send, MessageSquare, Award, AlertTriangle } from 'lucide-react'
import './analytics.scss'

const StatCard = ({ label, value, sub, color = 'var(--violet-light)', icon: Icon }) => (
    <div className="stat-card glass-card">
        <div className="stat-card__icon" style={{ background: `${color}22`, color }}>
            <Icon size={20} />
        </div>
        <div className="stat-card__body">
            <p className="stat-card__value" style={{ color }}>{value ?? '—'}</p>
            <p className="stat-card__label">{label}</p>
            {sub && <p className="stat-card__sub">{sub}</p>}
        </div>
    </div>
)

const Analytics = () => {
    const { analytics, setAnalytics, showToast } = useContext(AppContext)
    const [loading, setLoading] = useState(!analytics)

    useEffect(() => {
        if (!analytics) {
            getAnalytics()
                .then(d => setAnalytics(d.analytics))
                .catch(() => showToast('Failed to load analytics', 'error'))
                .finally(() => setLoading(false))
        }
    }, [])

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 16 }} />)}
            </div>
        </div>
    )

    if (!analytics) return null

    const { total, byStatus, avgAtsScore, interviewRate, offerRate, topSkillGaps, weeklyApplications } = analytics

    const maxWeekly = Math.max(...(weeklyApplications?.map(w => w.count) || [1]))

    return (
        <div className="analytics-page">
            <div className="page-header">
                <h1>Career Analytics</h1>
                <p>Track your job search performance over time</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <StatCard label="Total Applications" value={total} icon={Send} color="var(--cyan)" />
                <StatCard label="Avg ATS Score" value={avgAtsScore ? `${avgAtsScore}%` : null} sub="Across all audited resumes" icon={TrendingUp} color="var(--emerald)" />
                <StatCard label="Interview Rate" value={`${interviewRate}%`} sub="Applied → Interview" icon={MessageSquare} color="var(--violet-light)" />
                <StatCard label="Offer Rate" value={`${offerRate}%`} sub="Applied → Offer" icon={Award} color="var(--amber)" />
            </div>

            <div className="analytics-grid">
                {/* Funnel */}
                <div className="glass-card analytics-card">
                    <h3 className="analytics-card__title">Application Funnel</h3>
                    <div className="funnel">
                        {[
                            { label: 'Saved', key: 'saved', color: 'var(--text-secondary)' },
                            { label: 'Applied', key: 'applied', color: 'var(--cyan)' },
                            { label: 'Interviewing', key: 'interviewing', color: 'var(--violet-light)' },
                            { label: 'Offers', key: 'offer', color: 'var(--emerald)' },
                            { label: 'Rejected', key: 'rejected', color: 'var(--rose)' },
                        ].map(({ label, key, color }) => (
                            <div key={key} className="funnel-row">
                                <span className="funnel-label" style={{ color }}>{label}</span>
                                <div className="funnel-bar-wrap">
                                    <div className="funnel-bar" style={{
                                        width: total > 0 ? `${Math.max(4, ((byStatus[key] || 0) / total) * 100)}%` : '4%',
                                        background: color
                                    }} />
                                </div>
                                <span className="funnel-count">{byStatus[key] || 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weekly chart */}
                <div className="glass-card analytics-card">
                    <h3 className="analytics-card__title">Applications per Week</h3>
                    <div className="bar-chart">
                        {weeklyApplications?.map((w, i) => (
                            <div key={i} className="bar-col">
                                <div className="bar-track">
                                    <div className="bar-fill"
                                        style={{ height: maxWeekly > 0 ? `${(w.count / maxWeekly) * 100}%` : '0%' }} />
                                </div>
                                <span className="bar-label">{w.week}</span>
                                <span className="bar-val">{w.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Skill Gaps */}
                <div className="glass-card analytics-card analytics-card--full">
                    <h3 className="analytics-card__title">
                        <AlertTriangle size={16} style={{ color: 'var(--amber)' }} />
                        Most Common Skill Gaps (across all applications)
                    </h3>
                    {topSkillGaps?.length > 0 ? (
                        <div className="skill-gap-list">
                            {topSkillGaps.map((g, i) => (
                                <div key={i} className="skill-gap-row">
                                    <span className="skill-gap-rank">#{i + 1}</span>
                                    <span className="skill-gap-name">{g.skill}</span>
                                    <div className="progress-bar-wrap" style={{ flex: 1, maxWidth: 200 }}>
                                        <div className="progress-fill" style={{
                                            width: `${(g.count / (topSkillGaps[0]?.count || 1)) * 100}%`,
                                            background: 'var(--amber)'
                                        }} />
                                    </div>
                                    <span className="skill-gap-count">{g.count} job{g.count !== 1 ? 's' : ''}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>Generate interview prep for your applications to see skill gap analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Analytics
