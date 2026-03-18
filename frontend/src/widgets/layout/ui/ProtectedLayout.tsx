import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/widgets/sidebar'
import { Topbar } from '@/widgets/topbar'
import styles from './ProtectedLayout.module.scss'

export const ProtectedLayout = () => {
    const navigate = useNavigate()
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/user/profile', { credentials: 'include' })
            .then(r => {
                if (r.status === 401) { navigate('/login'); return null }
                return r.json()
            })
            .then(data => { if (data) setRole(data.role) })
            .catch(() => navigate('/login'))
            .finally(() => setLoading(false))
    }, [navigate])

    if (loading) return null

    return (
        <div className={styles.layout}>
            <Sidebar role={role ?? ''} />
            <div className={styles.column}>
                <Topbar />
                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
