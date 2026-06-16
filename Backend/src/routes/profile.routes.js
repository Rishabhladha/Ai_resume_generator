const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const upload = require("../middlewares/file.middleware")
const profileController = require("../controllers/profile.controller")

const profileRouter = express.Router()

profileRouter.get("/", authMiddleware.authUser, profileController.getProfile)
profileRouter.post("/", authMiddleware.authUser, upload.single("resume"), profileController.updateProfile)

module.exports = profileRouter
