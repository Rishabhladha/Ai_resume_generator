import { createBrowserRouter } from "react-router"
import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import Protected from "./features/auth/components/Protected"
import Dashboard from "./pages/Dashboard/Dashboard"
import WarRoom from "./pages/WarRoom/WarRoom"
import ResumeStudio from "./pages/ResumeStudio/ResumeStudio"
import Analytics from "./pages/Analytics/Analytics"

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
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