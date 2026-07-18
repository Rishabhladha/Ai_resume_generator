const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174"
]
if (process.env.FRONTEND_URL) {
    const cleanUrl = process.env.FRONTEND_URL.replace(/\/$/, "")
    allowedOrigins.push(cleanUrl)
    allowedOrigins.push(cleanUrl + "/")
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const jobRouter = require("./routes/job.routes")
const profileRouter = require("./routes/profile.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/jobs", jobRouter)
app.use("/api/profile", profileRouter)



module.exports = app