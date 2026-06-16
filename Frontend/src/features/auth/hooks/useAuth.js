import { useContext, useEffect } from "react"
import { AuthContext } from "../auth.context"
import { login, register, logout, getMe } from "../../../api"

export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        const data = await login({ email, password })
        setUser(data.user)
    }

    const handleRegister = async ({ username, email, password }) => {
        const data = await register({ username, email, password })
        setUser(data.user)
    }

    const handleLogout = async () => {
        await logout()
        setUser(null)
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch { } finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}