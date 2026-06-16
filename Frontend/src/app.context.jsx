import { createContext, useState } from "react"

export const AppContext = createContext()

export const AppProvider = ({ children }) => {
    const [jobs, setJobs] = useState([])
    const [kanban, setKanban] = useState({ saved: [], applied: [], interviewing: [], offer: [], rejected: [] })
    const [currentJob, setCurrentJob] = useState(null)
    const [profile, setProfile] = useState(null)
    const [analytics, setAnalytics] = useState(null)
    const [generatingState, setGeneratingState] = useState({}) // { [key]: boolean }
    const [toast, setToast] = useState(null)

    const showToast = (message, type = 'success') => {
        setToast({ message, type, id: Date.now() })
        setTimeout(() => setToast(null), 3500)
    }

    const setGenerating = (key, value) => {
        setGeneratingState(prev => ({ ...prev, [key]: value }))
    }

    return (
        <AppContext.Provider value={{
            jobs, setJobs,
            kanban, setKanban,
            currentJob, setCurrentJob,
            profile, setProfile,
            analytics, setAnalytics,
            generatingState, setGenerating,
            toast, showToast
        }}>
            {children}
        </AppContext.Provider>
    )
}
