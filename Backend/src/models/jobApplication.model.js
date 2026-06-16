const mongoose = require('mongoose')

const resumeAuditSchema = new mongoose.Schema({
    atsScore: { type: Number, min: 0, max: 100 },
    keywordMatches: [String],
    missingKeywords: [String],
    sectionScores: {
        summary: { type: Number, min: 0, max: 100 },
        experience: { type: Number, min: 0, max: 100 },
        skills: { type: Number, min: 0, max: 100 },
        education: { type: Number, min: 0, max: 100 },
        formatting: { type: Number, min: 0, max: 100 }
    },
    improvements: [String],
    strengths: [String]
}, { _id: false })

const technicalQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    intention: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
}, { _id: false })

const skillGapSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    learningResource: { type: String }
}, { _id: false })

const preparationPlanSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    focus: { type: String, required: true },
    tasks: [{ type: String }]
}, { _id: false })

const companyInsightsSchema = new mongoose.Schema({
    culture: { type: String },
    techStack: [String],
    interviewStyle: { type: String },
    recentNews: { type: String },
    whatTheyValue: [String]
}, { _id: false })

const interviewPrepSchema = new mongoose.Schema({
    matchScore: { type: Number, min: 0, max: 100 },
    technicalQuestions: [technicalQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    companyInsights: companyInsightsSchema
}, { _id: false })

const salaryInsightsSchema = new mongoose.Schema({
    minSalary: { type: Number },
    midSalary: { type: Number },
    maxSalary: { type: Number },
    currency: { type: String, default: 'USD' },
    seniorityLevel: { type: String },
    marketPosition: { type: String, enum: ['below', 'at', 'above'] },
    notes: { type: String }
}, { _id: false })

const linkedinTipsSchema = new mongoose.Schema({
    headline: { type: String },
    about: { type: String },
    skillsToAdd: [String]
}, { _id: false })

const networkingMessagesSchema = new mongoose.Schema({
    linkedinDm: { type: String },
    coldEmail: { type: String },
    coldEmailSubject: { type: String },
    followUp: { type: String }
}, { _id: false })

const negotiationSchema = new mongoose.Schema({
    script: { type: String },
    counterOffer: { type: Number },
    keyPoints: [String],
    redFlags: [String]
}, { _id: false })

const jobApplicationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },

    // Job Info
    company: { type: String, required: true },
    role: { type: String, required: true },
    jobUrl: { type: String },
    jobDescription: { type: String, required: true },
    status: {
        type: String,
        enum: ['saved', 'applied', 'interviewing', 'offer', 'rejected'],
        default: 'saved'
    },
    appliedDate: { type: Date },
    followUpDate: { type: Date },
    notes: { type: String },
    salaryOffered: { type: Number },

    // User input
    resumeText: { type: String },
    selfDescription: { type: String },

    // Link to specific resume version
    resumeVersion: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion' },

    // Generated assets (lazy — generated on demand)
    resumeAudit: resumeAuditSchema,
    interviewPrep: interviewPrepSchema,
    tailoredResumeHtml: { type: String },
    coverLetter: { type: String },
    linkedinTips: linkedinTipsSchema,
    networkingMessages: networkingMessagesSchema,
    salaryInsights: salaryInsightsSchema,
    negotiationCoach: negotiationSchema,

}, { timestamps: true })

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema)
module.exports = JobApplication
