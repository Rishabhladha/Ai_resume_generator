import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
    Briefcase, FileText, Mic, BarChart2, Zap, CheckCircle,
    ArrowRight, Star, Users, TrendingUp, Shield, Sparkles,
    ChevronDown, Play, Menu, X
} from 'lucide-react'
import './Landing.scss'

// ── Animated Counter ──────────────────────────────────────────────────────────
const Counter = ({ target, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const started = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    let start = 0
                    const step = target / (duration / 16)
                    const timer = setInterval(() => {
                        start = Math.min(start + step, target)
                        setCount(Math.floor(start))
                        if (start >= target) clearInterval(timer)
                    }, 16)
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target, duration])

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ── Feature Card ──────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, color, title, description, delay }) => (
    <div className="feature-card" style={{ animationDelay: `${delay}ms` }}>
        <div className="feature-card__icon" style={{ background: color }}>
            <Icon size={22} />
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
)

// ── Step Card ─────────────────────────────────────────────────────────────────
const StepCard = ({ number, title, description }) => (
    <div className="step-card">
        <div className="step-number">{number}</div>
        <div className="step-content">
            <h4>{title}</h4>
            <p>{description}</p>
        </div>
    </div>
)

// ── Testimonial ───────────────────────────────────────────────────────────────
const Testimonial = ({ name, role, company, quote, avatar }) => (
    <div className="testimonial-card">
        <div className="testimonial-stars">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
        </div>
        <p className="testimonial-quote">"{quote}"</p>
        <div className="testimonial-author">
            <div className="testimonial-avatar">{avatar}</div>
            <div>
                <div className="testimonial-name">{name}</div>
                <div className="testimonial-role">{role} · {company}</div>
            </div>
        </div>
    </div>
)

// ── Main Landing Page ──────────────────────────────────────────────────────────
const Landing = () => {
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        setMenuOpen(false)
    }

    return (
        <div className="landing">
            {/* ── Navbar ─────────────────────────────────────────────────────── */}
            <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-inner">
                    <div className="nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="nav-brand-icon">🚀</div>
                        <span className="nav-brand-name">CareerOS</span>
                    </div>

                    <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                        <button onClick={() => scrollTo('features')}>Features</button>
                        <button onClick={() => scrollTo('how-it-works')}>How It Works</button>
                        <button onClick={() => scrollTo('stats')}>Impact</button>
                        <button onClick={() => scrollTo('testimonials')}>Testimonials</button>
                    </div>

                    <div className="nav-ctas">
                        <button className="nav-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                        <button className="nav-btn-primary" id="nav-get-started" onClick={() => navigate('/register')}>
                            Get Started Free
                        </button>
                    </div>

                    <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="hero-section">
                <div className="hero-glow hero-glow--left" />
                <div className="hero-glow hero-glow--right" />
                <div className="hero-grid-bg" />

                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={13} />
                        <span>AI-Powered Job Search Platform</span>
                    </div>

                    <h1 className="hero-title">
                        Land your dream job<br />
                        <span className="hero-title-gradient">10× faster with AI</span>
                    </h1>

                    <p className="hero-subtitle">
                        CareerOS combines AI resume tailoring, real-time ATS scoring, mock interview coaching,
                        and salary insights into one intelligent platform — built for the modern job seeker.
                    </p>

                    <div className="hero-ctas">
                        <button className="hero-btn-primary" id="hero-get-started" onClick={() => navigate('/register')}>
                            Start for Free
                            <ArrowRight size={16} />
                        </button>
                        <button className="hero-btn-secondary" onClick={() => scrollTo('how-it-works')}>
                            <Play size={14} />
                            See How It Works
                        </button>
                    </div>

                    <div className="hero-social-proof">
                        <div className="hero-avatars">
                            {['A', 'R', 'S', 'M', 'K'].map((l, i) => (
                                <div key={i} className="hero-avatar" style={{ zIndex: 5 - i }}>{l}</div>
                            ))}
                        </div>
                        <span><strong>2,400+</strong> job seekers trust CareerOS</span>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="hero-card main-card">
                        <div className="hero-card-header">
                            <div className="card-dot red" />
                            <div className="card-dot yellow" />
                            <div className="card-dot green" />
                            <span>Resume ATS Score</span>
                        </div>
                        <div className="ats-score-demo">
                            <div className="ats-circle">
                                <svg viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" className="ats-track" />
                                    <circle cx="40" cy="40" r="34" className="ats-progress" style={{ '--pct': 0.87 }} />
                                </svg>
                                <div className="ats-value">
                                    <span className="ats-num">87</span>
                                    <span className="ats-pct">%</span>
                                </div>
                            </div>
                            <div className="ats-details">
                                <div className="ats-row"><CheckCircle size={13} className="check-green" /><span>Keywords matched</span></div>
                                <div className="ats-row"><CheckCircle size={13} className="check-green" /><span>Format optimized</span></div>
                                <div className="ats-row"><CheckCircle size={13} className="check-yellow" /><span>Skills alignment</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-card float-card float-card--top">
                        <Mic size={14} className="fc-icon fc-violet" />
                        <div>
                            <div className="fc-title">Mock Interview</div>
                            <div className="fc-sub">AI coaching active</div>
                        </div>
                        <div className="fc-badge fc-badge--green">Live</div>
                    </div>

                    <div className="hero-card float-card float-card--bottom">
                        <TrendingUp size={14} className="fc-icon fc-cyan" />
                        <div>
                            <div className="fc-title">₹18.5L salary range</div>
                            <div className="fc-sub">For your role & skills</div>
                        </div>
                    </div>
                </div>

                <button className="scroll-indicator" onClick={() => scrollTo('features')}>
                    <ChevronDown size={18} />
                </button>
            </section>

            {/* ── Features ─────────────────────────────────────────────────── */}
            <section className="section features-section" id="features">
                <div className="section-inner">
                    <div className="section-label">
                        <Zap size={13} />
                        <span>Everything You Need</span>
                    </div>
                    <h2 className="section-title">Your AI job search<br />command center</h2>
                    <p className="section-subtitle">
                        Stop juggling spreadsheets, generic resumes, and endless guesswork.
                        CareerOS gives you every unfair advantage — in one place.
                    </p>

                    <div className="features-grid">
                        <FeatureCard
                            icon={Briefcase}
                            color="rgba(124,58,237,0.2)"
                            title="Kanban Job Tracker"
                            description="Organize every application visually. Drag and drop jobs across Saved, Applied, Interviewing, and Offer stages — never lose track again."
                            delay={0}
                        />
                        <FeatureCard
                            icon={FileText}
                            color="rgba(6,182,212,0.2)"
                            title="AI Resume Tailoring"
                            description="Upload your CV once. Our AI extracts your story and generates ATS-optimized resumes tailored to each specific job description — instantly."
                            delay={100}
                        />
                        <FeatureCard
                            icon={Zap}
                            color="rgba(245,158,11,0.2)"
                            title="ATS Score Audit"
                            description="Get a real-time ATS compatibility score for every application. Discover which keywords are missing and fix them with one click."
                            delay={200}
                        />
                        <FeatureCard
                            icon={Mic}
                            color="rgba(244,63,94,0.2)"
                            title="Mock Interview Coach"
                            description="Practice with AI-generated interview questions tailored to your role. Speak your answers and get instant feedback — anytime, anywhere."
                            delay={300}
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            color="rgba(16,185,129,0.2)"
                            title="Salary Intelligence"
                            description="Know your true market worth. CareerOS provides salary ranges, negotiation tips, and market benchmarks for your exact role and experience level."
                            delay={400}
                        />
                        <FeatureCard
                            icon={BarChart2}
                            color="rgba(124,58,237,0.2)"
                            title="Application Analytics"
                            description="Track response rates, identify patterns in rejections, and optimize your strategy. Turn your job search into a data-driven operation."
                            delay={500}
                        />
                    </div>
                </div>
            </section>

            {/* ── Stats ────────────────────────────────────────────────────── */}
            <section className="stats-section" id="stats">
                <div className="section-inner">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-num"><Counter target={87} suffix="%" /></div>
                            <div className="stat-label">Average ATS Score Improvement</div>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <div className="stat-num"><Counter target={3} suffix="×" /></div>
                            <div className="stat-label">More Interviews Per Month</div>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <div className="stat-num"><Counter target={2400} suffix="+" /></div>
                            <div className="stat-label">Job Seekers Using CareerOS</div>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-item">
                            <div className="stat-num"><Counter target={94} suffix="%" /></div>
                            <div className="stat-label">User Satisfaction Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── How It Works ─────────────────────────────────────────────── */}
            <section className="section how-section" id="how-it-works">
                <div className="section-inner">
                    <div className="section-label">
                        <Play size={13} />
                        <span>How It Works</span>
                    </div>
                    <h2 className="section-title">From upload to offer<br />in 4 simple steps</h2>

                    <div className="steps-container">
                        <div className="steps-line" />
                        <div className="steps-grid">
                            <StepCard
                                number="01"
                                title="Upload Your CV"
                                description="Upload your existing resume PDF. Our AI analyzes your experience, skills, and achievements to build a rich profile."
                            />
                            <StepCard
                                number="02"
                                title="Add a Job Application"
                                description="Paste a job URL or description. CareerOS auto-fills company and role details in seconds using our smart web scraper."
                            />
                            <StepCard
                                number="03"
                                title="Get AI-Powered Insights"
                                description="Receive your ATS score, tailored resume, interview questions, salary range, and cover letter — all generated automatically."
                            />
                            <StepCard
                                number="04"
                                title="Practice & Apply"
                                description="Run a mock interview session, download your tailored resume, and apply with confidence. Track everything from your Kanban board."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────────────────────────── */}
            <section className="section testimonials-section" id="testimonials">
                <div className="section-inner">
                    <div className="section-label">
                        <Users size={13} />
                        <span>Success Stories</span>
                    </div>
                    <h2 className="section-title">Trusted by job seekers<br />across industries</h2>

                    <div className="testimonials-grid">
                        <Testimonial
                            name="Aditya Sharma"
                            role="Software Engineer"
                            company="Razorpay"
                            quote="CareerOS helped me go from 0 callbacks to 4 interviews in 3 weeks. The ATS score audit completely changed how I wrote resumes."
                            avatar="A"
                        />
                        <Testimonial
                            name="Priya Mehta"
                            role="Product Manager"
                            company="Groww"
                            quote="The mock interview feature is incredible. I practiced 20+ questions for my dream company and walked in feeling 100% prepared."
                            avatar="P"
                        />
                        <Testimonial
                            name="Rahul Nair"
                            role="Data Analyst"
                            company="CRED"
                            quote="The salary intelligence tool helped me negotiate my offer from ₹14L to ₹19L. I had real data to back up my ask. Absolutely worth it."
                            avatar="R"
                        />
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ───────────────────────────────────────────────── */}
            <section className="cta-section">
                <div className="cta-glow" />
                <div className="section-inner cta-inner">
                    <Shield size={40} className="cta-icon" />
                    <h2 className="cta-title">Ready to transform<br />your job search?</h2>
                    <p className="cta-subtitle">
                        Join thousands of professionals who've accelerated their careers with CareerOS.
                        Start free — no credit card required.
                    </p>
                    <div className="cta-buttons">
                        <button className="hero-btn-primary" id="cta-get-started" onClick={() => navigate('/register')}>
                            Create Free Account
                            <ArrowRight size={16} />
                        </button>
                        <button className="nav-btn-ghost" onClick={() => navigate('/login')}>
                            Sign In Instead
                        </button>
                    </div>
                    <p className="cta-disclaimer">Free forever for the first 5 applications · No credit card needed</p>
                </div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <div className="nav-brand-icon">🚀</div>
                        <span className="nav-brand-name">CareerOS</span>
                    </div>
                    <p className="footer-tagline">AI-powered job search intelligence. Built for ambitious professionals.</p>
                    <div className="footer-links">
                        <button onClick={() => scrollTo('features')}>Features</button>
                        <button onClick={() => scrollTo('how-it-works')}>How It Works</button>
                        <button onClick={() => scrollTo('testimonials')}>Testimonials</button>
                        <button onClick={() => navigate('/login')}>Sign In</button>
                        <button onClick={() => navigate('/register')}>Register</button>
                    </div>
                    <p className="footer-copy">© {new Date().getFullYear()} CareerOS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default Landing
