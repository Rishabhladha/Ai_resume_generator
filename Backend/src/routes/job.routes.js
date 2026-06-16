const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const upload = require("../middlewares/file.middleware")
const jobController = require("../controllers/job.controller")

const jobRouter = express.Router()

// Analytics (must be before /:id routes)
jobRouter.get("/analytics", authMiddleware.authUser, jobController.getAnalytics)

// CRUD
jobRouter.post("/", authMiddleware.authUser, upload.single("resume"), jobController.createJobApplication)
jobRouter.get("/", authMiddleware.authUser, jobController.getAllJobApplications)
jobRouter.get("/:id", authMiddleware.authUser, jobController.getJobApplicationById)
jobRouter.patch("/:id/status", authMiddleware.authUser, jobController.updateApplicationStatus)
jobRouter.patch("/:id", authMiddleware.authUser, jobController.updateJobApplication)
jobRouter.delete("/:id", authMiddleware.authUser, jobController.deleteJobApplication)

// AI-powered generation endpoints
jobRouter.post("/:id/audit", authMiddleware.authUser, jobController.generateAudit)
jobRouter.post("/:id/interview-prep", authMiddleware.authUser, jobController.generateInterviewPrepController)
jobRouter.post("/:id/cover-letter", authMiddleware.authUser, jobController.generateCoverLetterController)
jobRouter.post("/:id/networking", authMiddleware.authUser, jobController.generateNetworkingController)
jobRouter.post("/:id/salary", authMiddleware.authUser, jobController.generateSalaryController)
jobRouter.post("/:id/linkedin", authMiddleware.authUser, jobController.generateLinkedinController)
jobRouter.post("/:id/negotiation", authMiddleware.authUser, jobController.generateNegotiationController)
jobRouter.post("/:id/tailored-resume", authMiddleware.authUser, jobController.generateTailoredResumeController)
jobRouter.post("/:id/mock-interview/grade", authMiddleware.authUser, jobController.gradeMockAnswer)

module.exports = jobRouter
