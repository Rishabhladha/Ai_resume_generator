import React, { useState, useContext, useEffect } from 'react'
import { AppContext } from '../../app.context'
import { updateProfile, getProfile, getResumeVersions } from '../../api'
import { Upload, CheckCircle, FileText, Sparkles, TrendingUp, BarChart2, Clock, X, Info } from 'lucide-react'
import './resumestudio.scss'

const ResumeStudio = () => {
    const { profile, setProfile, showToast } = useContext(AppContext)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const [versions, setVersions] = useState([])
    const [loadingVersions, setLoadingVersions] = useState(true)
    const [selectedVersion, setSelectedVersion] = useState(null)

    const fetchVersions = async () => {
        try {
            const data = await getResumeVersions()
            setVersions(data.versions || [])
        } catch (err) {
            showToast('Failed to load resume versions', 'error')
        } finally {
            setLoadingVersions(false)
        }
    }

    useEffect(() => {
        fetchVersions()
    }, [])

    const handleUpload = async (file) => {
        if (!file || !file.type.includes('pdf')) {
            showToast('Please upload a PDF file', 'error')
            return
        }
        setUploading(true)
        try {
            const fd = new FormData()
            fd.append('resume', file)
            const data = await updateProfile(fd)
            setProfile(data.profile)
            showToast('Master resume uploaded and analyzed!', 'success')
            fetchVersions() // Reload version list
        } catch (err) {
            showToast('Upload failed. Please try again.', 'error')
        } finally {
            setUploading(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        handleUpload(file)
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="resume-studio">
            <div className="page-header">
                <h1>Resume Studio</h1>
                <p>Manage multiple CV variants, view target A/B performance metrics, and audit resume version histories.</p>
            </div>

            <div className="studio-layout">
                {/* Left Side: Upload & Core Details */}
                <div className="studio-left">
                    <div className="studio-upload-section glass-card">
                        <h2 style={{ fontSize: 16, marginBottom: 6 }}>Master Resume</h2>
                        <p style={{ fontSize: 13, marginBottom: 20, color: 'var(--text-secondary)' }}>
                            This is your base resume. It will be used automatically for ATS audits, interview prep, cover letters, and more — unless you upload a specific resume per job.
                        </p>

                        {profile?.masterResumeText ? (
                            <div className="resume-uploaded">
                                <CheckCircle size={20} color="var(--emerald)" />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--emerald)' }}>Master Resume on file</p>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        {profile.masterResumeText.length.toLocaleString()} characters · {profile.skills?.length || 0} skills extracted
                                    </p>
                                </div>
                                <label className="btn-secondary btn-sm" htmlFor="master-resume-upload" style={{ cursor: 'pointer' }}>
                                    Replace
                                    <input id="master-resume-upload" type="file" accept=".pdf" hidden onChange={e => handleUpload(e.target.files[0])} />
                                </label>
                            </div>
                        ) : (
                            <label
                                className={`master-upload-zone ${dragOver ? 'drag-over' : ''}`}
                                htmlFor="master-resume-upload"
                                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                            >
                                {uploading ? (
                                    <>
                                        <span className="spinner" style={{ width: 32, height: 32 }} />
                                        <p>Analyzing your resume...</p>
                                        <p style={{ fontSize: 12 }}>Extracting skills and experience</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={36} opacity={0.5} />
                                        <p style={{ fontWeight: 600 }}>Drop your resume PDF here</p>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>or click to browse</p>
                                    </>
                                )}
                                <input id="master-resume-upload" type="file" accept=".pdf" hidden onChange={e => handleUpload(e.target.files[0])} />
                            </label>
                        )}
                    </div>

                    {profile?.skills?.length > 0 && (
                        <div className="glass-card studio-skills">
                            <h2 style={{ fontSize: 16, marginBottom: 16 }}>
                                <Sparkles size={16} style={{ display: 'inline', color: 'var(--accent-cybervolt)', marginRight: 6 }} />
                                Auto-Extracted Skills ({profile.skills.length})
                            </h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {profile.skills.map((skill, i) => (
                                    <span key={i} className="chip">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: A/B Success Tracking */}
                <div className="studio-right">
                    <div className="glass-card ab-testing-dashboard">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BarChart2 size={16} color="var(--violet-light)" />
                                A/B Success Tracking
                            </h2>
                            <span className="badge badge-cyan">{versions.length} CV Versions</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            See which resume variants generate the most interviews and job offers. Metrics update automatically as you progress cards on the Job Board.
                        </p>

                        {loadingVersions ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', gap: 8, color: 'var(--text-muted)' }}>
                                <span className="spinner" style={{ width: 18, height: 18 }} /> Loading analytics...
                            </div>
                        ) : versions.length === 0 ? (
                            <div className="empty-versions-state">
                                <TrendingUp size={32} style={{ opacity: 0.2, marginBottom: 10 }} />
                                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No resume variants tracked yet.</p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload your master resume or tailor one for a job to start gathering data.</p>
                            </div>
                        ) : (
                            <div className="versions-list">
                                {versions.map((v) => (
                                    <div key={v._id} className="version-item glass-card" onClick={() => setSelectedVersion(v)}>
                                        <div className="version-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <h4 className="version-name">{v.name}</h4>
                                                {v.isMaster && <span className="badge badge-emerald badge-sm">Master</span>}
                                            </div>
                                            <div className="version-meta">
                                                <Clock size={11} />
                                                <span>{formatDate(v.createdAt)}</span>
                                            </div>
                                        </div>

                                        <div className="version-stats-row">
                                            <div className="stat-pill">
                                                <span className="stat-label">Used</span>
                                                <span className="stat-value">{v.stats.totalApplications}</span>
                                            </div>
                                            <div className="stat-pill">
                                                <span className="stat-label">Interviews</span>
                                                <span className="stat-value">{v.stats.interviewsCount}</span>
                                            </div>
                                            <div className="stat-pill">
                                                <span className="stat-label">Offers</span>
                                                <span className="stat-value">{v.stats.offersCount}</span>
                                            </div>
                                            <div className="stat-pill success-rate-pill" style={{
                                                background: v.stats.successRate >= 70 ? 'var(--emerald-dim)' : v.stats.successRate >= 40 ? 'var(--amber-dim)' : 'rgba(255,255,255,0.02)',
                                                color: v.stats.successRate >= 70 ? 'var(--emerald)' : v.stats.successRate >= 40 ? 'var(--amber)' : 'var(--text-muted)'
                                            }}>
                                                <span className="stat-label">Success Rate</span>
                                                <span className="stat-value">{v.stats.successRate}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Version Detail Modal */}
            {selectedVersion && (
                <div className="modal-overlay" onClick={() => setSelectedVersion(null)}>
                    <div className="modal-content version-detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FileText size={18} color="var(--accent-cybervolt)" />
                                    {selectedVersion.name}
                                </h2>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created on {formatDate(selectedVersion.createdAt)}</p>
                            </div>
                            <button className="btn-icon" onClick={() => setSelectedVersion(null)}><X size={16} /></button>
                        </div>

                        <div className="modal-body version-modal-body">
                            <div className="version-stats-summary">
                                <div className="summary-card">
                                    <span className="summary-val">{selectedVersion.stats.totalApplications}</span>
                                    <span className="summary-label">Times Used</span>
                                </div>
                                <div className="summary-card">
                                    <span className="summary-val">{selectedVersion.stats.interviewsCount}</span>
                                    <span className="summary-label">Interviews</span>
                                </div>
                                <div className="summary-card">
                                    <span className="summary-val">{selectedVersion.stats.offersCount}</span>
                                    <span className="summary-label">Offers Recieved</span>
                                </div>
                                <div className="summary-card success-rate-card" style={{
                                    borderLeftColor: selectedVersion.stats.successRate >= 70 ? 'var(--emerald)' : selectedVersion.stats.successRate >= 40 ? 'var(--amber)' : 'var(--border)'
                                }}>
                                    <span className="summary-val" style={{
                                        color: selectedVersion.stats.successRate >= 70 ? 'var(--emerald)' : selectedVersion.stats.successRate >= 40 ? 'var(--amber)' : 'inherit'
                                    }}>{selectedVersion.stats.successRate}%</span>
                                    <span className="summary-label">Interview Rate</span>
                                </div>
                            </div>

                            <div className="version-preview-container">
                                <h3 style={{ fontSize: 14, marginBottom: 10 }}>Resume Content Preview</h3>
                                {selectedVersion.tailoredHtml ? (
                                    <div 
                                        className="version-preview-html"
                                        dangerouslySetInnerHTML={{ __html: selectedVersion.tailoredHtml }}
                                    />
                                ) : (
                                    <pre className="version-preview-text">
                                        {selectedVersion.resumeText}
                                    </pre>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResumeStudio
