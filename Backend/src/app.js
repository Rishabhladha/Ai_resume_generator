const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.FRONTEND_URL
    ].filter(Boolean),
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