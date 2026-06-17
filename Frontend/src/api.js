import axios from "axios"

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})

// ─── Job Applications ────────────────────────────────────────────────────────

export const createJobApplication = async (formData) => {
    const response = await api.post("/api/jobs", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return response.data
}

export const getAllJobApplications = async () => {
    const response = await api.get("/api/jobs")
    return response.data
}

export const getJobApplicationById = async (id) => {
    const response = await api.get(`/api/jobs/${id}`)
    return response.data
}

export const updateApplicationStatus = async (id, status) => {
    const response = await api.patch(`/api/jobs/${id}/status`, { status })
    return response.data
}

export const updateJobApplication = async (id, data) => {
    const response = await api.patch(`/api/jobs/${id}`, data)
    return response.data
}

export const deleteJobApplication = async (id) => {
    const response = await api.delete(`/api/jobs/${id}`)
    return response.data
}

// ─── AI Generation ────────────────────────────────────────────────────────────

export const generateAudit = async (id) => {
    const response = await api.post(`/api/jobs/${id}/audit`)
    return response.data
}

export const generateInterviewPrep = async (id) => {
    const response = await api.post(`/api/jobs/${id}/interview-prep`)
    return response.data
}

export const generateCoverLetter = async (id) => {
    const response = await api.post(`/api/jobs/${id}/cover-letter`)
    return response.data
}

export const generateNetworking = async (id) => {
    const response = await api.post(`/api/jobs/${id}/networking`)
    return response.data
}

export const generateSalary = async (id) => {
    const response = await api.post(`/api/jobs/${id}/salary`)
    return response.data
}

export const generateLinkedin = async (id) => {
    const response = await api.post(`/api/jobs/${id}/linkedin`)
    return response.data
}

export const generateNegotiation = async (id) => {
    const response = await api.post(`/api/jobs/${id}/negotiation`)
    return response.data
}

export const downloadTailoredResume = async (id, company, role) => {
    const response = await api.post(`/api/jobs/${id}/tailored-resume`, null, {
        responseType: "blob"
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `resume_${company}_${role}.pdf`.replace(/\s+/g, '_'))
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

export const gradeMockAnswer = async (id, { question, userAnswer, difficulty }) => {
    const response = await api.post(`/api/jobs/${id}/mock-interview/grade`, { question, userAnswer, difficulty })
    return response.data
}

export const getAnalytics = async () => {
    const response = await api.get("/api/jobs/analytics")
    return response.data
}

// ─── Profile ────────────────────────────────────────────────────────────────

export const getProfile = async () => {
    const response = await api.get("/api/profile")
    return response.data
}

export const updateProfile = async (formData) => {
    const response = await api.post("/api/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return response.data
}

export const scrapeJob = async (url) => {
    const response = await api.post("/api/jobs/scrape", { url })
    return response.data
}

export const getResumeVersions = async () => {
    const response = await api.get("/api/profile/resumes")
    return response.data
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login = async ({ email, password }) => {
    const response = await api.post("/api/auth/login", { email, password })
    return response.data
}

export const register = async ({ username, email, password }) => {
    const response = await api.post("/api/auth/register", { username, email, password })
    return response.data
}

export const logout = async () => {
    const response = await api.post("/api/auth/logout")
    return response.data
}

export const getMe = async () => {
    const response = await api.get("/api/auth/me")
    return response.data
}

export const changePassword = async ({ currentPassword, newPassword }) => {
    const response = await api.post("/api/auth/change-password", { currentPassword, newPassword })
    return response.data
}

export const sendOtp = async ({ email }) => {
    const response = await api.post("/api/auth/send-otp", { email })
    return response.data
}

export const verifyOtpReset = async ({ email, otp, newPassword }) => {
    const response = await api.post("/api/auth/verify-otp-reset", { email, otp, newPassword })
    return response.data
}
