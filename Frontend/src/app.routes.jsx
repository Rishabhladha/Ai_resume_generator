import { createBrowserRouter } from "react-router"
import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import ForgotPassword from "./features/auth/pages/ForgotPassword"
import Protected from "./features/auth/components/Protected"
import Dashboard from "./pages/Dashboard/Dashboard"
import WarRoom from "./pages/WarRoom/WarRoom"
import ResumeStudio from "./pages/ResumeStudio/ResumeStudio"
import Analytics from "./pages/Analytics/Analytics"
import Landing from "./pages/Landing/Landing"

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Landing />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/forgot-password",
        element: <ForgotPassword />
    },
    {
        path: "/dashboard",
        element: <Protected><Dashboard /></Protected>
    },
    {
        path: "/jobs/:id",
        element: <Protected><WarRoom /></Protected>
    },
    {
        path: "/resume",
        element: <Protected><ResumeStudio /></Protected>
    },
    {
        path: "/analytics",
        element: <Protected><Analytics /></Protected>
    }
])