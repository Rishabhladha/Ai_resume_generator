import React, { useState, useContext, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, Briefcase, ExternalLink, Clock, TrendingUp, ChevronRight, X, Upload, Building2, AlertCircle } from 'lucide-react'
import { AppContext } from '../../app.context'
import { AuthContext } from '../../features/auth/auth.context'
import { getAllJobApplications, createJobApplication, updateApplicationStatus, deleteJobApplication } from '../../api'
import { useNavigate } from 'react-router'
import './dashboard.scss'

const STATUS_COLUMNS = [
    { id: 'saved', label: 'Saved', color: 'var(--text-secondary)', accent: 'rgba(148,163,184,0.15)' },
    { id: 'applied', label: 'Applied', color: 'var(--cyan)', accent: 'var(--cyan-dim)' },
    { id: 'interviewing', label: 'Interviewing', color: 'var(--violet-light)', accent: 'var(--violet-dim)' },
    { id: 'offer', label: 'Offer 🎉', color: 'var(--emerald)', accent: 'var(--emerald-dim)' },
    { id: 'rejected', label: 'Rejected', color: 'var(--rose)', accent: 'var(--rose-dim)' },
]

const scoreColor = (score) => {
    if (!score) return 'var(--text-muted)'
    if (score >= 75) return 'var(--emerald)'
    if (score >= 50) return 'var(--amber)'
    return 'var(--rose)'
}

const daysAgo = (date) => {
    if (!date) return null
    const diff = Math.floor((Date.now() - new Date(date)) / 86400000)
    if (diff === 0) return 'Today'
    if (diff === 1) return '1d ago'
    return `${diff}d ago`
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
const JobCard = ({ job, index, onOpen, onDelete }) => {
    const atsScore = job.resumeAudit?.atsScore
    const matchScore = job.interviewPrep?.matchScore

    return (
        <Draggable draggableId={job._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`job-card ${snapshot.isDragging ? 'dragging' : ''}`}
                    onClick={() => onOpen(job)}
                >
                    <div className="job-card__header">
                        <div className="job-card__company-icon">
                            {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div className="job-card__meta">
                            <h4 className="job-card__role">{job.role}</h4>
                            <p className="job-card__company">{job.company}</p>
                        </div>
                        <button
                            className="job-card__delete"
                            onClick={(e) => { e.stopPropagation(); onDelete(job._id) }}
                        >
                            <X size={12} />
                        </button>
                    </div>

                    <div className="job-card__scores">
                        {atsScore != null && (
                            <span className="score-chip" style={{ color: scoreColor(atsScore) }}>
                                ATS {atsScore}%
                            </span>
                        )}
                        {matchScore != null && (
                            <span className="score-chip" style={{ color: scoreColor(matchScore) }}>
                                Match {matchScore}%
                            </span>
                        )}
                    </div>

                    {job.appliedDate && (
                        <div className="job-card__footer">
                            <Clock size={11} />
                            <span>{daysAgo(job.appliedDate)}</span>
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    )
}

// ─── Add Job Modal ────────────────────────────────────────────────────────────
const AddJobModal = ({ onClose, onAdd }) => {
    const [form, setForm] = useState({ company: '', role: '', jobUrl: '', jobDescription: '' })
    const [resumeFile, setResumeFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.company || !form.role || !form.jobDescription) {
            setError('Company, role, and job description are required.')
            return
        }
        setLoading(true)
        try {
            const fd = new FormData()
            Object.entries(form).forEach(([k, v]) => fd.append(k, v))
            if (resumeFile) fd.append('resume', resumeFile)
            const data = await createJobApplication(fd)
            onAdd(data.application)
            onClose()
        } catch (err) {
            setError('Failed to create application. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add Job Application</h2>
                    <button className="btn-icon" onClick={onClose}><X size={16} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label className="input-label">Company *</label>
                            <input className="input" placeholder="e.g. Google" value={form.company}
                                onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                        </div>
                        <div>
                            <label className="input-label">Role *</label>
                            <input className="input" placeholder="e.g. Software Engineer" value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Job URL</label>
                        <input className="input" placeholder="https://..." value={form.jobUrl}
                            onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))} />
                    </div>

                    <div>
                        <label className="input-label">Job Description *</label>
                        <textarea className="input" rows={6} placeholder="Paste the full job description..."
                            value={form.jobDescription}
                            onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))} />
                    </div>

                    <div>
                        <label className="input-label">Upload Resume PDF (optional — uses master resume if not provided)</label>
                        <label className="upload-zone" htmlFor="job-resume-upload">
                            <Upload size={18} />
                            <span>{resumeFile ? resumeFile.name : 'Click to upload resume PDF'}</span>
                            <input id="job-resume-upload" type="file" accept=".pdf" hidden
                                onChange={e => setResumeFile(e.target.files[0])} />
                        </label>
                    </div>

                    {error && (
                        <div className="error-msg">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Adding...</> : 'Add Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
    const { kanban, setKanban, setCurrentJob, showToast } = useContext(AppContext)
    const [showAddModal, setShowAddModal] = useState(false)
    const [loadingBoard, setLoadingBoard] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await getAllJobApplications()
                setKanban(data.kanban)
            } catch (err) {
                showToast('Failed to load applications', 'error')
            } finally {
                setLoadingBoard(false)
            }
        }
        fetchJobs()
    }, [])

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result
        if (!destination || source.droppableId === destination.droppableId) return

        const srcCol = source.droppableId
        const dstCol = destination.droppableId

        // Optimistic update
        const card = kanban[srcCol][source.index]
        const newKanban = { ...kanban }
        newKanban[srcCol] = kanban[srcCol].filter(j => j._id !== draggableId)
        newKanban[dstCol] = [
            ...kanban[dstCol].slice(0, destination.index),
            { ...card, status: dstCol },
            ...kanban[dstCol].slice(destination.index)
        ]
        setKanban(newKanban)

        try {
            await updateApplicationStatus(draggableId, dstCol)
            showToast(`Moved to ${dstCol}`, 'success')
        } catch {
            setKanban(kanban) // revert
            showToast('Failed to update status', 'error')
        }
    }

    const handleAddJob = (newJob) => {
        setKanban(prev => ({
            ...prev,
            [newJob.status]: [newJob, ...prev[newJob.status]]
        }))
        showToast('Job application added!', 'success')
    }

    const handleDeleteJob = async (jobId) => {
        // Find which column
        let colId = null
        for (const [col, jobs] of Object.entries(kanban)) {
            if (jobs.find(j => j._id === jobId)) { colId = col; break }
        }
        if (!colId) return

        setKanban(prev => ({ ...prev, [colId]: prev[colId].filter(j => j._id !== jobId) }))
        try {
            await deleteJobApplication(jobId)
            showToast('Application deleted', 'info')
        } catch {
            showToast('Failed to delete', 'error')
        }
    }

    const handleOpenJob = (job) => {
        setCurrentJob(job)
        navigate(`/jobs/${job._id}`)
    }

    const totalApps = Object.values(kanban).reduce((s, col) => s + col.length, 0)

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1>Job Board</h1>
                        <p>{totalApps} application{totalApps !== 1 ? 's' : ''} tracked</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Add Application
                    </button>
                </div>
            </div>

            {loadingBoard ? (
                <div className="kanban-skeleton">
                    {STATUS_COLUMNS.map(col => (
                        <div key={col.id} className="kanban-col-skeleton">
                            <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 16 }} />
                            {[1, 2].map(i => (
                                <div key={i} className="skeleton" style={{ height: 80, marginBottom: 10, borderRadius: 12 }} />
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="kanban-board">
                        {STATUS_COLUMNS.map(col => (
                            <div key={col.id} className="kanban-col">
                                <div className="kanban-col__header" style={{ borderTopColor: col.color }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span className="kanban-col__title" style={{ color: col.color }}>{col.label}</span>
                                        <span className="kanban-col__count">{kanban[col.id]?.length || 0}</span>
                                    </div>
                                </div>

                                <Droppable droppableId={col.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            className={`kanban-col__cards ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {(kanban[col.id] || []).map((job, index) => (
                                                <JobCard
                                                    key={job._id}
                                                    job={job}
                                                    index={index}
                                                    onOpen={handleOpenJob}
                                                    onDelete={handleDeleteJob}
                                                />
                                            ))}
                                            {provided.placeholder}

                                            {(kanban[col.id] || []).length === 0 && (
                                                <div className="kanban-col__empty">
                                                    <Briefcase size={20} opacity={0.2} />
                                                    <span>Drop cards here</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            )}

            {showAddModal && <AddJobModal onClose={() => setShowAddModal(false)} onAdd={handleAddJob} />}
        </div>
    )
}

export default Dashboard
