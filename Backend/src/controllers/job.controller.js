const pdfParse = require("pdf-parse")
const JobApplication = require("../models/jobApplication.model")
const UserProfile = require("../models/userProfile.model")
const ResumeVersion = require("../models/resumeVersion.model")
const {
    generateResumeAudit,
    generateInterviewPrep,
    generateCoverLetter,
    generateNetworkingMessages,
    generateSalaryInsights,
    generateLinkedinTips,
    generateNegotiationCoach,
    gradeMockInterviewAnswer,
    generateAtsResumePdf,
    extractProfileFromResume,
    scrapeJobDescription
} = require("../services/ai.service")

// ─── Helper: get resume text from profile or application ────────────────────
async function getResumeText(userId, application) {
    if (application.resumeText) return application.resumeText
    const profile = await UserProfile.findOne({ user: userId })
    return profile?.masterResumeText || application.selfDescription || ""
}


/**
 * @route POST /api/jobs
 * Create a new job application card
 */
async function createJobApplication(req, res) {
    const { company, role, jobUrl, jobDescription, status, notes } = req.body

    if (!company || !role || !jobDescription) {
        return res.status(400).json({ message: "Company, role, and job description are required." })
    }

    let resumeText = null
    let resumeVersionId = null

    // If resume PDF uploaded, parse it and save it as a new custom resume version
    if (req.file) {
        const parsed = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        resumeText = parsed.text
        
        const customVersion = await ResumeVersion.create({
            user: req.user.id,
            name: `${company} - ${role} Resume (Uploaded)`,
            resumeText: resumeText,
            isMaster: false
        })
        resumeVersionId = customVersion._id
    }

    // If no resume file uploaded, try to link the user's master resume
    if (!resumeText) {
        let masterVersion = await ResumeVersion.findOne({ user: req.user.id, isMaster: true })
        
        // If master version doesn't exist in ResumeVersion but masterResumeText exists in UserProfile, migrate it
        if (!masterVersion) {
            const profile = await UserProfile.findOne({ user: req.user.id })
            if (profile && profile.masterResumeText) {
                masterVersion = await ResumeVersion.create({
                    user: req.user.id,
                    name: "Master Resume",
                    resumeText: profile.masterResumeText,
                    isMaster: true
                })
            }
        }

        if (masterVersion) {
            resumeText = masterVersion.resumeText
            resumeVersionId = masterVersion._id
        }
    }

    const application = await JobApplication.create({
        user: req.user.id,
        company,
        role,
        jobUrl,
        jobDescription,
        status: status || 'saved',
        notes,
        resumeText,
        resumeVersion: resumeVersionId,
        appliedDate: status === 'applied' ? new Date() : undefined
    })

    res.status(201).json({ message: "Job application created.", application })
}


/**
 * @route GET /api/jobs
 * Get all applications grouped by status for Kanban
 */
async function getAllJobApplications(req, res) {
    const applications = await JobApplication.find({ user: req.user.id })
        .sort({ updatedAt: -1 })
        .select("-resumeText -selfDescription -tailoredResumeHtml -coverLetter -networkingMessages -negotiationCoach")

    // Group by status for Kanban
    const kanban = {
        saved: [],
        applied: [],
        interviewing: [],
        offer: [],
        rejected: []
    }
    applications.forEach(app => {
        kanban[app.status].push(app)
    })

    res.status(200).json({ message: "Applications fetched.", applications, kanban })
}


/**
 * @route GET /api/jobs/:id
 * Get a single application (full detail)
 */
async function getJobApplicationById(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })
    res.status(200).json({ message: "Application fetched.", application })
}


/**
 * @route PATCH /api/jobs/:id/status
 * Update application status (Kanban drag)
 */
async function updateApplicationStatus(req, res) {
    const { status } = req.body
    const validStatuses = ['saved', 'applied', 'interviewing', 'offer', 'rejected']
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status." })
    }
    const application = await JobApplication.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        {
            status,
            ...(status === 'applied' ? { appliedDate: new Date() } : {})
        },
        { new: true }
    ).select("-resumeText -selfDescription -tailoredResumeHtml -coverLetter -networkingMessages -negotiationCoach")
    if (!application) return res.status(404).json({ message: "Application not found." })
    res.status(200).json({ message: "Status updated.", application })
}


/**
 * @route PATCH /api/jobs/:id
 * Update application fields (notes, followUpDate, salaryOffered, etc.)
 */
async function updateJobApplication(req, res) {
    const allowedFields = ['notes', 'followUpDate', 'salaryOffered', 'jobUrl', 'company', 'role']
    const updates = {}
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f] })

    const application = await JobApplication.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        updates,
        { new: true }
    ).select("-resumeText -selfDescription -tailoredResumeHtml -coverLetter")
    if (!application) return res.status(404).json({ message: "Application not found." })
    res.status(200).json({ message: "Application updated.", application })
}


/**
 * @route DELETE /api/jobs/:id
 */
async function deleteJobApplication(req, res) {
    const application = await JobApplication.findOneAndDelete({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })
    res.status(200).json({ message: "Application deleted." })
}


/**
 * @route POST /api/jobs/:id/audit
 * Generate ATS resume audit for this job
 */
async function generateAudit(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const resumeText = await getResumeText(req.user.id, application)
    if (!resumeText) return res.status(400).json({ message: "No resume found. Upload a resume first." })

    const audit = await generateResumeAudit({ resume: resumeText, jobDescription: application.jobDescription })
    application.resumeAudit = audit
    await application.save()

    res.status(200).json({ message: "Resume audit generated.", resumeAudit: audit })
}


/**
 * @route POST /api/jobs/:id/interview-prep
 * Generate technical interview prep + company insights
 */
async function generateInterviewPrepController(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const resumeText = await getResumeText(req.user.id, application)
    if (!resumeText) return res.status(400).json({ message: "No resume found. Upload a resume first." })

    const prep = await generateInterviewPrep({
        resume: resumeText,
        jobDescription: application.jobDescription,
        company: application.company
    })
    application.interviewPrep = prep
    await application.save()

    res.status(200).json({ message: "Interview prep generated.", interviewPrep: prep })
}


/**
 * @route POST /api/jobs/:id/cover-letter
 */
async function generateCoverLetterController(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const resumeText = await getResumeText(req.user.id, application)
    if (!resumeText) return res.status(400).json({ message: "No resume found." })

    const result = await generateCoverLetter({
        resume: resumeText,
        jobDescription: application.jobDescription,
        company: application.company,
        role: application.role
    })
    application.coverLetter = result.coverLetter
    await application.save()

    res.status(200).json({ message: "Cover letter generated.", coverLetter: result.coverLetter })
}


/**
 * @route POST /api/jobs/:id/networking
 */
async function generateNetworkingController(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const resumeText = await getResumeText(req.user.id, application)

    const messages = await generateNetworkingMessages({
        resume: resumeText || "",
        jobDescription: application.jobDescription,
        company: application.company,
        role: application.role
    })
    application.networkingMessages = messages
    await application.save()

    res.status(200).json({ message: "Networking messages generated.", networkingMessages: messages })
}


/**
 * @route POST /api/jobs/:id/salary
 */
async function generateSalaryController(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const resumeText = await getResumeText(req.user.id, application)

    const insights = await generateSalaryInsights({
        resume: resumeText || "",
        jobDescription: application.jobDescription,
        company: application.company,
        role: application.role
    })
    application.salaryInsights = insights
    await application.save()

    res.status(200).json({ message: "Salary insights generated.", salaryInsights: insights })
}


/**
 * @route POST /api/jobs/:id/linkedin
 */
async function generateLinkedinController(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const resumeText = await getResumeText(req.user.id, application)
    if (!resumeText) return res.status(400).json({ message: "No resume found." })

    const tips = await generateLinkedinTips({
        resume: resumeText,
        jobDescription: application.jobDescription,
        role: application.role
    })
    application.linkedinTips = tips
    await application.save()

    res.status(200).json({ message: "LinkedIn tips generated.", linkedinTips: tips })
}


/**
 * @route POST /api/jobs/:id/negotiation
 */
async function generateNegotiationController(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })
    if (application.status !== 'offer') {
        return res.status(400).json({ message: "Negotiation coach is only available for applications with an offer." })
    }

    const resumeText = await getResumeText(req.user.id, application)
    const salary = application.salaryInsights

    const coach = await generateNegotiationCoach({
        resume: resumeText || "",
        role: application.role,
        company: application.company,
        salaryOffered: application.salaryOffered || 0,
        marketMin: salary?.minSalary || 0,
        marketMid: salary?.midSalary || 0,
        marketMax: salary?.maxSalary || 0
    })
    application.negotiationCoach = coach
    await application.save()

    res.status(200).json({ message: "Negotiation coach generated.", negotiationCoach: coach })
}


/**
 * @route POST /api/jobs/:id/tailored-resume
 * Generate ATS-optimized resume PDF
 */
async function generateTailoredResumeController(req, res) {
    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const resumeText = await getResumeText(req.user.id, application)
    if (!resumeText) return res.status(400).json({ message: "No resume found." })

    const { pdfBuffer, html, plainText } = await generateAtsResumePdf({
        resume: resumeText,
        jobDescription: application.jobDescription,
        company: application.company,
        role: application.role
    })

    // Create tailored resume version
    const tailoredVersion = await ResumeVersion.create({
        user: req.user.id,
        name: `${application.company} - ${application.role} Resume (Tailored)`,
        resumeText: plainText, // Storing tailored plain text
        tailoredHtml: html,
        isMaster: false
    })

    // Update job application
    application.resumeVersion = tailoredVersion._id
    application.tailoredResumeHtml = html
    await application.save()

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${application.company}_${application.role}.pdf`.replace(/\s+/g, '_')
    })
    res.send(pdfBuffer)
}


/**
 * @route POST /api/jobs/:id/mock-interview/grade
 * Grade a mock interview answer
 */
async function gradeMockAnswer(req, res) {
    const { question, userAnswer, difficulty } = req.body
    if (!question || !userAnswer) {
        return res.status(400).json({ message: "Question and answer are required." })
    }

    const application = await JobApplication.findOne({ _id: req.params.id, user: req.user.id })
    if (!application) return res.status(404).json({ message: "Application not found." })

    const grade = await gradeMockInterviewAnswer({
        question,
        userAnswer,
        jobDescription: application.jobDescription,
        difficulty: difficulty || 'medium'
    })

    res.status(200).json({ message: "Answer graded.", grade })
}


/**
 * @route GET /api/jobs/analytics
 * Career analytics for the dashboard
 */
async function getAnalytics(req, res) {
    const applications = await JobApplication.find({ user: req.user.id })

    const total = applications.length
    const byStatus = {
        saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0
    }
    let totalAtsScore = 0
    let atsCount = 0
    const allSkillGaps = {}

    applications.forEach(app => {
        byStatus[app.status] = (byStatus[app.status] || 0) + 1
        if (app.resumeAudit?.atsScore) {
            totalAtsScore += app.resumeAudit.atsScore
            atsCount++
        }
        app.interviewPrep?.skillGaps?.forEach(g => {
            allSkillGaps[g.skill] = (allSkillGaps[g.skill] || 0) + 1
        })
    })

    const topSkillGaps = Object.entries(allSkillGaps)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([skill, count]) => ({ skill, count }))

    const avgAtsScore = atsCount > 0 ? Math.round(totalAtsScore / atsCount) : null
    const interviewRate = total > 0 ? Math.round(((byStatus.interviewing + byStatus.offer) / total) * 100) : 0
    const offerRate = total > 0 ? Math.round((byStatus.offer / total) * 100) : 0

    // Applications per week (last 8 weeks)
    const now = new Date()
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (7 * (7 - i)))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const count = applications.filter(a => {
            const d = new Date(a.createdAt)
            return d >= weekStart && d < weekEnd
        }).length
        return { week: `W${i + 1}`, count }
    })

    res.status(200).json({
        message: "Analytics fetched.",
        analytics: {
            total,
            byStatus,
            avgAtsScore,
            interviewRate,
            offerRate,
            topSkillGaps,
            weeklyApplications: weeklyData
        }
    })
}

/**
 * @route POST /api/jobs/scrape
 * Scrape a job posting from a URL
 */
async function scrapeJob(req, res) {
    const { url } = req.body
    if (!url) {
        return res.status(400).json({ message: "URL is required." })
    }
    try {
        const details = await scrapeJobDescription(url)
        res.status(200).json({ message: "Job scraped successfully.", details })
    } catch (error) {
        res.status(500).json({ message: "Failed to scrape job details.", error: error.message })
    }
}

module.exports = {
    createJobApplication,
    getAllJobApplications,
    getJobApplicationById,
    updateApplicationStatus,
    updateJobApplication,
    deleteJobApplication,
    generateAudit,
    generateInterviewPrepController,
    generateCoverLetterController,
    generateNetworkingController,
    generateSalaryController,
    generateLinkedinController,
    generateNegotiationController,
    generateTailoredResumeController,
    gradeMockAnswer,
    getAnalytics,
    scrapeJob
}
