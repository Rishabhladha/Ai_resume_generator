const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const otpModel = require("../models/otp.model")
const { sendOtpEmail } = require("../services/email.service")


/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {

    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Please provide username, email and password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [ { username }, { email } ]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)


    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)



    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}

/**
 * @name changePasswordController
 * @description Change password for the currently logged-in user.
 *              Requires the correct current password before updating.
 * @access Private (requires auth token)
 */
async function changePasswordController(req, res) {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Please provide current password and new password"
        })
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "New password must be at least 6 characters"
        })
    }

    // req.user is set by authMiddleware — user must be logged in
    const user = await userModel.findById(req.user.id)

    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    // Verify the current password is correct
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
        return res.status(401).json({
            message: "Current password is incorrect"
        })
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({
            message: "New password must be different from your current password"
        })
    }

    const hash = await bcrypt.hash(newPassword, 10)
    user.password = hash
    await user.save()

    res.status(200).json({
        message: "Password changed successfully"
    })
}

/**
 * @name sendOtpController
 * @description Send a 6-digit OTP to the user's email for password reset.
 *              OTP is stored hashed in DB and auto-expires after 10 mins.
 * @access Public
 */
async function sendOtpController(req, res) {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({ message: "Please provide an email address" })
    }

    const user = await userModel.findOne({ email: email.toLowerCase() })
    if (!user) {
        // Return generic message to avoid email enumeration attacks
        return res.status(200).json({ message: "If that email exists, an OTP has been sent." })
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash the OTP before storing (same security principle as passwords)
    const hashedOtp = await bcrypt.hash(otp, 10)

    // Delete any existing OTP for this email, then save the new one
    await otpModel.deleteMany({ email: email.toLowerCase() })
    await otpModel.create({ email: email.toLowerCase(), otp: hashedOtp })

    // Send the plain OTP via email
    await sendOtpEmail(email, otp)

    res.status(200).json({ message: "OTP sent to your email address." })
}

/**
 * @name verifyOtpResetController
 * @description Verify the OTP and reset the user's password.
 * @access Public
 */
async function verifyOtpResetController(req, res) {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, OTP, and new password are required" })
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    const otpRecord = await otpModel.findOne({ email: email.toLowerCase() })

    if (!otpRecord) {
        return res.status(400).json({ message: "OTP has expired or was not requested. Please request a new one." })
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp)

    if (!isOtpValid) {
        return res.status(400).json({ message: "Invalid OTP. Please check and try again." })
    }

    // OTP is valid — update the password
    const user = await userModel.findOne({ email: email.toLowerCase() })
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    // Delete the OTP record so it can't be reused
    await otpModel.deleteMany({ email: email.toLowerCase() })

    res.status(200).json({ message: "Password reset successfully. You can now log in." })
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    changePasswordController,
    sendOtpController,
    verifyOtpResetController
}