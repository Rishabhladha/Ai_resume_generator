import React, { useState, useContext } from 'react'
import { AppContext } from '../../app.context'
import { updateProfile, getProfile } from '../../api'
import { Upload, CheckCircle, FileText, Sparkles } from 'lucide-react'
import './resumestudio.scss'

const ResumeStudio = () => {
    const { profile, setProfile, showToast } = useContext(AppContext)
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)

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

    return (
        <div className="resume-studio">
            <div className="page-header">
                <h1>Resume Studio</h1>
                <p>Upload your master resume. We'll auto-extract your skills and use it across all your job applications.</p>
            </div>

            <div className="studio-layout">
                <div className="studio-upload-section glass-card">
                    <h2 style={{ fontSize: 16, marginBottom: 6 }}>Master Resume</h2>
                    <p style={{ fontSize: 13, marginBottom: 20 }}>
                        This is your base resume. It will be used automatically for ATS audits, interview prep, cover letters, and more — unless you upload a specific resume per job.
                    </p>

                    {profile?.masterResumeText ? (
                        <div className="resume-uploaded">
                            <CheckCircle size={20} color="var(--emerald)" />
                            <div>
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
                            <Sparkles size={16} style={{ display: 'inline', color: 'var(--violet-light)', marginRight: 6 }} />
                            Auto-Extracted Skills ({profile.skills.length})
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {profile.skills.map((skill, i) => (
                                <span key={i} className="chip">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}

                {profile?.targetRoles?.length > 0 && (
                    <div className="glass-card" style={{ padding: 24 }}>
                        <h2 style={{ fontSize: 16, marginBottom: 16 }}>
                            <FileText size={16} style={{ display: 'inline', color: 'var(--cyan)', marginRight: 6 }} />
                            Suggested Target Roles
                        </h2>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {profile.targetRoles.map((role, i) => (
                                <span key={i} className="badge badge-cyan">{role}</span>
                            ))}
                        </div>
                        {profile.yearsOfExperience && (
                            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                                ~{profile.yearsOfExperience} years of experience detected
                            </p>
                        )}
                    </div>
                )}

                <div className="glass-card" style={{ padding: 24, borderColor: 'var(--border-accent)' }}>
                    <h3 style={{ fontSize: 15, marginBottom: 8, color: 'var(--violet-light)' }}>How to get the most out of CareerOS</h3>
                    <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            'Upload your master resume here — it\'s used for everything',
                            'Add jobs from the Job Board and paste the job description',
                            'Go to a job → Run ATS Audit to see your score',
                            'Generate Interview Prep for technical questions tailored to that company',
                            'Practice in the Mock Interview tab and get graded feedback',
                            'Generate Cover Letter, Networking Messages, and Salary Insights per job',
                            'When you get an offer, mark it as "Offer" and use Negotiation Coach',
                        ].map((step, i) => (
                            <li key={i} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                                <span style={{ background: 'var(--violet-dim)', color: 'var(--violet-light)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    )
}

export default ResumeStudio
