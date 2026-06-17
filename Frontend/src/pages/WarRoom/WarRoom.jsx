import React, { useState, useContext, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
    ArrowLeft, Code2, MessageSquare, Brain, DollarSign,
    Link2, Mail, Trophy, ChevronDown, Copy, Check, Download,
    Sparkles, Target, BookOpen, AlertTriangle, Building2, Zap,
    Mic, MicOff
} from 'lucide-react'
import { AppContext } from '../../app.context'
import {
    getJobApplicationById, generateInterviewPrep, generateCoverLetter,
    generateNetworking, generateSalary, generateLinkedin, generateNegotiation,
    gradeMockAnswer, downloadTailoredResume, generateAudit, updateApplicationStatus
} from '../../api'
import './warroom.scss'

// ─── Score Ring ───────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 80, color = 'var(--violet-light)' }) => {
    const r = 28
    const circ = 2 * Math.PI * r
    const offset = circ - ((score || 0) / 100) * circ

    return (
        <div className="score-ring-wrap" style={{ width: size, height: size }}>
            <svg className="score-ring" width={size} height={size} viewBox="0 0 64 64">
                <circle className="track" cx="32" cy="32" r={r} strokeDasharray={circ} />
                <circle className="progress" cx="32" cy="32" r={r}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    stroke={color} />
            </svg>
            <div className="score-ring-value">
                <span style={{ color }}>{score ?? '—'}</span>
                <span className="score-label">/ 100</span>
            </div>
        </div>
    )
}

// ─── Copy Button ──────────────────────────────────────────────────────────────
const CopyButton = ({ text, size = 14 }) => {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button className="btn-icon btn-sm copy-btn" onClick={copy} title="Copy">
            {copied ? <Check size={size} color="var(--emerald)" /> : <Copy size={size} />}
        </button>
    )
}

// ─── Accordion Card ───────────────────────────────────────────────────────────
const AccordionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className="accordion-card">
            <div className="accordion-header" onClick={() => setOpen(o => !o)}>
                <span className="accordion-index">Q{index + 1}</span>
                <span className="accordion-title">{item.question}</span>
                <span className={`accordion-chevron ${open ? 'open' : ''}`}>
                    <ChevronDown size={16} />
                </span>
            </div>
            {open && (
                <div className="accordion-body">
                    <div className="section-block">
                        <span className="tag tag-intention">Interviewer Intent</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className="section-block">
                        <span className="tag tag-answer">How to Answer</span>
                        <p>{item.answer}</p>
                    </div>
                    {item.difficulty && (
                        <span className={`tag tag-${item.difficulty}`} style={{ float: 'right' }}>
                            {item.difficulty}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Mock Interview Tab ───────────────────────────────────────────────────────
const MockInterviewTab = ({ questions, jobId, showToast }) => {
    const [currentQ, setCurrentQ] = useState(0)
    const [answer, setAnswer] = useState('')
    const [grading, setGrading] = useState(false)
    const [grade, setGrade] = useState(null)
    const [session, setSession] = useState([]) // history
    const [isListening, setIsListening] = useState(false)
    const [hasSpeechSupport, setHasSpeechSupport] = useState(false)
    const recognitionRef = useRef(null)

    const question = questions[currentQ]

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            setHasSpeechSupport(true)
            const rec = new SpeechRecognition()
            rec.continuous = true
            rec.interimResults = true
            rec.lang = 'en-US'

            rec.onresult = (e) => {
                let finalTranscript = ''
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    if (e.results[i].isFinal) {
                        finalTranscript += e.results[i][0].transcript + ' '
                    }
                }
                if (finalTranscript) {
                    setAnswer(prev => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + finalTranscript)
                }
            }

            rec.onerror = (e) => {
                console.error("Speech recognition error", e)
                setIsListening(false)
            }

            rec.onend = () => {
                setIsListening(false)
            }

            recognitionRef.current = rec
        }
    }, [])

    const toggleListening = () => {
        if (!recognitionRef.current) {
            showToast('Speech recognition is not supported in this browser.', 'error')
            return
        }

        if (isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        } else {
            recognitionRef.current.start()
            setIsListening(true)
            showToast('Microphone active. Start speaking...', 'success')
        }
    }

    const submitAnswer = async () => {
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
        if (!answer.trim()) return
        setGrading(true)
        try {
            const data = await gradeMockAnswer(jobId, {
                question: question.question,
                userAnswer: answer,
                difficulty: question.difficulty
            })
            const result = { question: question.question, answer, grade: data.grade }
            setGrade(data.grade)
            setSession(prev => [...prev, result])
        } catch {
            showToast('Failed to grade answer', 'error')
        } finally {
            setGrading(false)
        }
    }

    const nextQuestion = () => {
        setGrade(null)
        setAnswer('')
        setCurrentQ(q => Math.min(q + 1, questions.length - 1))
    }

    return (
        <div className="mock-interview">
            <div className="mock-header">
                <div className="mock-progress">
                    <span className="mock-q-count">Question {currentQ + 1} / {questions.length}</span>
                    <div className="progress-bar-wrap" style={{ width: 200 }}>
                        <div className="progress-fill" style={{
                            width: `${((currentQ + 1) / questions.length) * 100}%`,
                            background: 'var(--violet-light)'
                        }} />
                    </div>
                </div>
                {session.length > 0 && (
                    <span className="badge badge-emerald">
                        Avg: {Math.round(session.reduce((s, r) => s + r.grade.score, 0) / session.length)} / 10
                    </span>
                )}
            </div>

            <div className="mock-question-card">
                <div className="mock-q-badge">
                    <span className={`tag tag-${question.difficulty}`}>{question.difficulty}</span>
                </div>
                <h3 className="mock-question">{question.question}</h3>
            </div>

            {!grade ? (
                <div className="mock-answer-area">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="input-label" style={{ margin: 0 }}>Your Answer</label>
                        {hasSpeechSupport && (
                            <button
                                type="button"
                                className={`btn-ghost btn-sm mic-btn ${isListening ? 'listening' : ''}`}
                                onClick={toggleListening}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    color: isListening ? 'var(--rose)' : 'var(--text-secondary)',
                                    borderColor: isListening ? 'var(--rose)' : 'var(--border)',
                                    background: isListening ? 'rgba(244,63,94,0.1)' : 'transparent',
                                    padding: '6px 12px',
                                    borderRadius: 0,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                {isListening ? (
                                    <>
                                        <span className="pulse-dot" style={{ width: 8, height: 8, background: 'var(--rose)', borderRadius: '50%', display: 'inline-block' }} />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic size={12} />
                                        Speak Answer
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <textarea
                        className="input mock-textarea"
                        rows={6}
                        placeholder={isListening ? "Listening... Speak your answer now. Your voice is transcribed in real-time." : "Type your answer here or click 'Speak Answer' to speak it aloud..."}
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                    />
                    <button className="btn-primary" onClick={submitAnswer} disabled={grading || !answer.trim()}>
                        {grading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Grading...</> : <><Zap size={14} /> Submit Answer</>}
                    </button>
                </div>
            ) : (
                <div className="mock-grade">
                    <div className="mock-score-row">
                        <div className="mock-score">
                            <span className="mock-score-val" style={{ color: grade.score >= 7 ? 'var(--emerald)' : grade.score >= 5 ? 'var(--amber)' : 'var(--rose)' }}>
                                {grade.score}
                            </span>
                            <span className="mock-score-label">/ 10</span>
                        </div>
                        <div className="mock-feedback">
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{grade.feedback}</p>
                        </div>
                    </div>

                    <div className="mock-details">
                        {grade.whatWasGood?.length > 0 && (
                            <div className="mock-section">
                                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>✓ What you did well</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {grade.whatWasGood.map((g, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 12, position: 'relative' }}>• {g}</li>)}
                                </ul>
                            </div>
                        )}
                        {grade.improvements?.length > 0 && (
                            <div className="mock-section">
                                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>↑ Improvements</p>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {grade.improvements.map((g, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>• {g}</li>)}
                                </ul>
                            </div>
                        )}
                        <details style={{ marginTop: 12 }}>
                            <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--violet-light)', fontWeight: 600 }}>View model answer</summary>
                            <div className="copy-box" style={{ marginTop: 8, fontSize: 13 }}>
                                {grade.modelAnswer}
                                <CopyButton text={grade.modelAnswer} />
                            </div>
                        </details>
                    </div>

                    <button className="btn-secondary" onClick={nextQuestion} style={{ marginTop: 16 }} disabled={currentQ === questions.length - 1}>
                        Next Question →
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Generate Button ──────────────────────────────────────────────────────────
const GenButton = ({ onClick, loading, children }) => (
    <button className="gen-btn" onClick={onClick} disabled={loading}>
        {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Generating...</> : <><Sparkles size={14} /> {children}</>}
    </button>
)

// ─── Main War Room ────────────────────────────────────────────────────────────
const TAB_ITEMS = [
    { id: 'prep', label: 'Interview Prep', icon: Code2 },
    { id: 'audit', label: 'ATS Audit', icon: Target },
    { id: 'mock', label: 'Mock Interview', icon: Brain },
    { id: 'cover', label: 'Cover Letter', icon: MessageSquare },
    { id: 'network', label: 'Networking', icon: Mail },
    { id: 'salary', label: 'Salary', icon: DollarSign },
    { id: 'linkedin', label: 'LinkedIn', icon: Link2 },
    { id: 'negotiate', label: 'Negotiate', icon: Trophy },
]

const WarRoom = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { currentJob, setCurrentJob, generatingState, setGenerating, showToast } = useContext(AppContext)
    const [activeTab, setActiveTab] = useState('prep')
    const [job, setJob] = useState(currentJob)
    const [loading, setLoading] = useState(!currentJob)
    const [downloadingResume, setDownloadingResume] = useState(false)

    useEffect(() => {
        if (!currentJob || currentJob._id !== id) {
            setLoading(true)
            getJobApplicationById(id).then(data => {
                setJob(data.application)
                setCurrentJob(data.application)
                setLoading(false)
            }).catch(() => { navigate('/'); setLoading(false) })
        } else {
            setJob(currentJob)
        }
    }, [id])

    const refreshJob = async () => {
        const data = await getJobApplicationById(id)
        setJob(data.application)
        setCurrentJob(data.application)
    }

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value
        try {
            await updateApplicationStatus(id, newStatus)
            setJob(prev => ({ ...prev, status: newStatus }))
            setCurrentJob({ ...job, status: newStatus })
            showToast(`Moved to ${newStatus}`, 'success')
        } catch {
            showToast('Failed to update status', 'error')
        }
    }

    const generate = async (key, apiFn) => {
        setGenerating(key, true)
        try {
            await apiFn(id)
            await refreshJob()
            showToast('Generated successfully!', 'success')
        } catch (err) {
            showToast(err?.response?.data?.message || 'Generation failed', 'error')
        } finally {
            setGenerating(key, false)
        }
    }

    if (loading || !job) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: 'var(--text-secondary)' }}>
            <span className="spinner" style={{ width: 24, height: 24 }} />
            Loading job details...
        </div>
    )

    const prep = job.interviewPrep
    const audit = job.resumeAudit
    const cover = job.coverLetter
    const network = job.networkingMessages
    const salary = job.salaryInsights
    const linkedin = job.linkedinTips
    const negotiate = job.negotiationCoach

    const handleDownloadResume = async () => {
        setDownloadingResume(true)
        try {
            await downloadTailoredResume(id, job.company, job.role)
            showToast('ATS Resume downloaded successfully!', 'success')
        } catch (err) {
            showToast('Failed to download resume', 'error')
        } finally {
            setDownloadingResume(false)
        }
    }

    return (
        <div className="warroom-page">
            {/* Header */}
            <div className="warroom-header">
                <button className="btn-ghost btn-sm" onClick={() => navigate('/')}>
                    <ArrowLeft size={14} /> Back
                </button>
                <div className="warroom-job-info">
                    <div className="warroom-company-icon">{job.company.charAt(0)}</div>
                    <div>
                        <h1 className="warroom-title">{job.role}</h1>
                        <p className="warroom-subtitle">
                            {job.company} · 
                            <select
                                className={`status-select status-${job.status}`}
                                value={job.status}
                                onChange={handleStatusChange}
                            >
                                <option value="saved">Saved</option>
                                <option value="applied">Applied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="offer">Offer 🎉</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </p>
                    </div>
                </div>
                <button 
                    className="btn-secondary btn-sm" 
                    onClick={handleDownloadResume} 
                    disabled={downloadingResume}
                >
                    {downloadingResume ? (
                        <>
                            <span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download size={14} /> ATS Resume
                        </>
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="warroom-tabs">
                {TAB_ITEMS.map(({ id: tid, label, icon: Icon }) => (
                    <button key={tid} className={`warroom-tab ${activeTab === tid ? 'active' : ''}`} onClick={() => setActiveTab(tid)}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="warroom-content">

                {/* ── Interview Prep ── */}
                {activeTab === 'prep' && (
                    <div>
                        {!prep ? (
                            <div className="empty-state">
                                <Code2 size={40} className="empty-icon" />
                                <h3>Generate your interview prep</h3>
                                <p>AI will analyze the JD and create tailored technical questions + company insights</p>
                                <GenButton loading={generatingState['prep']} onClick={() => generate('prep', generateInterviewPrep)}>
                                    Generate Interview Prep
                                </GenButton>
                            </div>
                        ) : (
                            <div className="prep-layout">
                                <div className="prep-main">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <h2 style={{ fontSize: 18 }}>Technical Questions <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 14 }}>({prep.technicalQuestions?.length})</span></h2>
                                        <GenButton loading={generatingState['prep']} onClick={() => generate('prep', generateInterviewPrep)}>Regenerate</GenButton>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {prep.technicalQuestions?.map((q, i) => <AccordionCard key={i} item={q} index={i} />)}
                                    </div>
                                </div>

                                <div className="prep-sidebar">
                                    {/* Match Score */}
                                    <div className="glass-card" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Match Score</p>
                                        <ScoreRing score={prep.matchScore} color={prep.matchScore >= 70 ? 'var(--emerald)' : prep.matchScore >= 50 ? 'var(--amber)' : 'var(--rose)'} />
                                    </div>

                                    {/* Company Insights */}
                                    {prep.companyInsights && (
                                        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                                <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                Company Intel
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <div>
                                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>CULTURE</p>
                                                    <p style={{ fontSize: 13, lineHeight: 1.5 }}>{prep.companyInsights.culture}</p>
                                                </div>
                                                {prep.companyInsights.techStack?.length > 0 && (
                                                    <div>
                                                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>TECH STACK</p>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {prep.companyInsights.techStack.map((t, i) => <span key={i} className="chip">{t}</span>)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>INTERVIEW STYLE</p>
                                                    <p style={{ fontSize: 13, lineHeight: 1.5 }}>{prep.companyInsights.interviewStyle}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Skill Gaps */}
                                    {prep.skillGaps?.length > 0 && (
                                        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Skill Gaps</p>
                                            {prep.skillGaps.map((g, i) => (
                                                <div key={i} style={{ marginBottom: 10 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{g.skill}</span>
                                                        <span className={`severity-${g.severity}`} style={{ fontSize: 11, fontWeight: 700 }}>{g.severity}</span>
                                                    </div>
                                                    {g.learningResource && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>📚 {g.learningResource}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Roadmap */}
                                    {prep.preparationPlan?.length > 0 && (
                                        <div className="glass-card" style={{ padding: 16 }}>
                                            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--violet-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                                <BookOpen size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                {prep.preparationPlan.length}-Day Roadmap
                                            </p>
                                            {prep.preparationPlan.map(d => (
                                                <div key={d.day} style={{ marginBottom: 12 }}>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                                        <span style={{ background: 'var(--violet-dim)', color: 'var(--violet-light)', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>Day {d.day}</span>
                                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{d.focus}</span>
                                                    </div>
                                                    <ul style={{ listStyle: 'none', paddingLeft: 8 }}>
                                                        {d.tasks.map((t, i) => <li key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>• {t}</li>)}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ATS Audit ── */}
                {activeTab === 'audit' && (
                    <div>
                        {!audit ? (
                            <div className="empty-state">
                                <Target size={40} className="empty-icon" />
                                <h3>Run your ATS audit</h3>
                                <p>Check how well your resume matches this job's ATS requirements</p>
                                <GenButton loading={generatingState['audit']} onClick={() => generate('audit', generateAudit)}>Run ATS Audit</GenButton>
                            </div>
                        ) : (
                            <div className="audit-layout">
                                <div className="audit-header-scores">
                                    <div className="glass-card audit-score-card">
                                        <ScoreRing score={audit.atsScore} size={100}
                                            color={audit.atsScore >= 75 ? 'var(--emerald)' : audit.atsScore >= 50 ? 'var(--amber)' : 'var(--rose)'} />
                                        <div>
                                            <h3 style={{ fontSize: 20, marginBottom: 4 }}>ATS Score</h3>
                                            <p style={{ fontSize: 14 }}>
                                                {audit.atsScore >= 75 ? '✅ Strong ATS compatibility' : audit.atsScore >= 50 ? '⚠️ Moderate match — needs work' : '❌ Likely to be filtered by ATS'}
                                            </p>
                                            <GenButton loading={generatingState['audit']} onClick={() => generate('audit', generateAudit)}>Re-run Audit</GenButton>
                                        </div>
                                    </div>

                                    <div className="audit-section-scores glass-card">
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Section Scores</p>
                                        {Object.entries(audit.sectionScores || {}).map(([section, score]) => (
                                            <div key={section} style={{ marginBottom: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{section}</span>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: score >= 70 ? 'var(--emerald)' : score >= 50 ? 'var(--amber)' : 'var(--rose)' }}>{score}%</span>
                                                </div>
                                                <div className="progress-bar-wrap">
                                                    <div className="progress-fill" style={{
                                                        width: `${score}%`,
                                                        background: score >= 70 ? 'var(--emerald)' : score >= 50 ? 'var(--amber)' : 'var(--rose)'
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="audit-keywords">
                                    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>✓ Keyword Matches ({audit.keywordMatches?.length})</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {audit.keywordMatches?.map((k, i) => <span key={i} className="chip chip-matched">{k}</span>)}
                                        </div>
                                    </div>
                                    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>✗ Missing Keywords ({audit.missingKeywords?.length})</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {audit.missingKeywords?.map((k, i) => <span key={i} className="chip chip-missing">{k}</span>)}
                                        </div>
                                    </div>
                                    <div className="glass-card" style={{ padding: 20 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--violet-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>↑ Improvements</p>
                                        {audit.improvements?.map((imp, i) => (
                                            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                                                <span style={{ color: 'var(--violet-light)', marginTop: 2 }}>→</span>
                                                <p style={{ fontSize: 13, lineHeight: 1.5 }}>{imp}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Mock Interview ── */}
                {activeTab === 'mock' && (
                    <div>
                        {!prep?.technicalQuestions?.length ? (
                            <div className="empty-state">
                                <Brain size={40} className="empty-icon" />
                                <h3>Generate Interview Prep first</h3>
                                <p>Go to "Interview Prep" tab to generate questions, then come back here to practice</p>
                                <button className="btn-primary" onClick={() => setActiveTab('prep')}>Go to Interview Prep →</button>
                            </div>
                        ) : (
                            <MockInterviewTab questions={prep.technicalQuestions} jobId={id} showToast={showToast} />
                        )}
                    </div>
                )}

                {/* ── Cover Letter ── */}
                {activeTab === 'cover' && (
                    <div>
                        {!cover ? (
                            <div className="empty-state">
                                <MessageSquare size={40} className="empty-icon" />
                                <h3>Generate your cover letter</h3>
                                <p>AI writes a personalized, human-sounding cover letter for {job.company}</p>
                                <GenButton loading={generatingState['cover']} onClick={() => generate('cover', generateCoverLetter)}>Generate Cover Letter</GenButton>
                            </div>
                        ) : (
                            <div className="cover-wrap">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h2 style={{ fontSize: 18 }}>Cover Letter — {job.company}</h2>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <CopyButton text={cover} size={16} />
                                        <GenButton loading={generatingState['cover']} onClick={() => generate('cover', generateCoverLetter)}>Regenerate</GenButton>
                                    </div>
                                </div>
                                <div className="copy-box" style={{ minHeight: 300, fontSize: 14, lineHeight: 1.9 }}>
                                    {cover}
                                    <CopyButton text={cover} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Networking ── */}
                {activeTab === 'network' && (
                    <div>
                        {!network ? (
                            <div className="empty-state">
                                <Mail size={40} className="empty-icon" />
                                <h3>Generate networking messages</h3>
                                <p>LinkedIn DM, cold email, and follow-up — all personalized for {job.company}</p>
                                <GenButton loading={generatingState['network']} onClick={() => generate('network', generateNetworking)}>Generate Messages</GenButton>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <GenButton loading={generatingState['network']} onClick={() => generate('network', generateNetworking)}>Regenerate</GenButton>
                                </div>
                                {[
                                    { label: 'LinkedIn DM', hint: 'Short & personalized · Max 250 chars', content: network.linkedinDm, color: 'var(--cyan)' },
                                    { label: 'Cold Email', hint: `Subject: ${network.coldEmailSubject}`, content: network.coldEmail, color: 'var(--violet-light)' },
                                    { label: 'Follow-Up Message', hint: 'Send 1 week after applying', content: network.followUp, color: 'var(--emerald)' },
                                ].map(msg => (
                                    <div key={msg.label} className="glass-card" style={{ padding: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 700, color: msg.color }}>{msg.label}</p>
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{msg.hint}</p>
                                            </div>
                                            <CopyButton text={msg.content} />
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 0, padding: 14, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Salary ── */}
                {activeTab === 'salary' && (
                    <div>
                        {!salary ? (
                            <div className="empty-state">
                                <DollarSign size={40} className="empty-icon" />
                                <h3>Get salary insights</h3>
                                <p>AI estimates the salary range for {job.role} at {job.company} based on market data</p>
                                <GenButton loading={generatingState['salary']} onClick={() => generate('salary', generateSalary)}>Analyze Salary</GenButton>
                            </div>
                        ) : (
                            <div className="salary-layout">
                                <div className="glass-card salary-main">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                                        <div>
                                            <h2 style={{ fontSize: 22, marginBottom: 4 }}>{salary.seniorityLevel}</h2>
                                            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{job.role} · {salary.currency}</p>
                                        </div>
                                        <span className={`badge ${salary.marketPosition === 'above' ? 'badge-emerald' : salary.marketPosition === 'below' ? 'badge-rose' : 'badge-amber'}`}>
                                            {salary.marketPosition === 'above' ? '↑ Above Market' : salary.marketPosition === 'below' ? '↓ Below Market' : '↔ At Market'}
                                        </span>
                                    </div>

                                    <div className="salary-range">
                                        <div className="salary-point">
                                            <span className="salary-amount">{salary.minSalary?.toLocaleString()}</span>
                                            <span className="salary-label">Minimum</span>
                                        </div>
                                        <div className="salary-bar-wrap">
                                            <div className="salary-bar">
                                                <div className="salary-bar-fill" />
                                                <div className="salary-mid-marker">
                                                    <span>{salary.midSalary?.toLocaleString()}</span>
                                                    <span>Median</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="salary-point">
                                            <span className="salary-amount">{salary.maxSalary?.toLocaleString()}</span>
                                            <span className="salary-label">Maximum</span>
                                        </div>
                                    </div>

                                    {salary.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 20, padding: '14px', background: 'rgba(0,0,0,0.3)', borderRadius: 0, border: '1px solid var(--border)' }}>{salary.notes}</p>}
                                    <GenButton loading={generatingState['salary']} onClick={() => generate('salary', generateSalary)}>Refresh</GenButton>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── LinkedIn ── */}
                {activeTab === 'linkedin' && (
                    <div>
                        {!linkedin ? (
                            <div className="empty-state">
                                <Link2 size={40} className="empty-icon" />
                                <h3>Optimize your LinkedIn</h3>
                                <p>AI generates a recruiter-optimized headline, about section, and skill list</p>
                                <GenButton loading={generatingState['linkedin']} onClick={() => generate('linkedin', generateLinkedin)}>Optimize Profile</GenButton>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <GenButton loading={generatingState['linkedin']} onClick={() => generate('linkedin', generateLinkedin)}>Regenerate</GenButton>
                                </div>
                                <div className="glass-card" style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Headline</p>
                                        <CopyButton text={linkedin.headline} />
                                    </div>
                                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{linkedin.headline}</p>
                                </div>
                                <div className="glass-card" style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--violet-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>About Section</p>
                                        <CopyButton text={linkedin.about} />
                                    </div>
                                    <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{linkedin.about}</p>
                                </div>
                                <div className="glass-card" style={{ padding: 20 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Skills to Add</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {linkedin.skillsToAdd?.map((s, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--emerald-dim)', border: '1px solid rgba(90,135,103,0.2)', borderRadius: 0, padding: '6px 12px' }}>
                                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--emerald)' }}>{s}</span>
                                                <CopyButton text={s} size={11} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Negotiation ── */}
                {activeTab === 'negotiate' && (
                    <div>
                        {job.status !== 'offer' ? (
                            <div className="empty-state">
                                <Trophy size={40} className="empty-icon" />
                                <h3>Not at the offer stage yet</h3>
                                <p>Move this application to "Offer" status on the job board to unlock the negotiation coach</p>
                            </div>
                        ) : !negotiate ? (
                            <div className="empty-state">
                                <Trophy size={40} className="empty-icon" />
                                <h3>Negotiation Coach</h3>
                                <p>AI generates your exact negotiation script, counter-offer amount, and red flags to watch for</p>
                                <GenButton loading={generatingState['negotiate']} onClick={() => generate('negotiate', generateNegotiation)}>Generate Strategy</GenButton>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="glass-card" style={{ padding: 24 }}>
                                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Recommended Counter-Offer</p>
                                    <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)' }}>
                                        {negotiate.counterOffer?.toLocaleString()}
                                    </p>
                                </div>
                                <div className="glass-card" style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--violet-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Negotiation Script</p>
                                        <CopyButton text={negotiate.script} />
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 0, padding: 16, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap', border: '1px solid var(--border)', fontStyle: 'italic' }}>
                                        {negotiate.script}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="glass-card" style={{ padding: 16 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan)', marginBottom: 10 }}>Key Talking Points</p>
                                        {negotiate.keyPoints?.map((p, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>• {p}</p>)}
                                    </div>
                                    <div className="glass-card" style={{ padding: 16 }}>
                                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)', marginBottom: 10 }}>
                                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                                            Red Flags to Watch
                                        </p>
                                        {negotiate.redFlags?.map((f, i) => <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>⚠ {f}</p>)}
                                    </div>
                                </div>
                                <GenButton loading={generatingState['negotiate']} onClick={() => generate('negotiate', generateNegotiation)}>Regenerate</GenButton>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

export default WarRoom
