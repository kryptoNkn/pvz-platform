import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from '@/widgets/sidebar'
import { Topbar } from '@/widgets/topbar'
import styles from './ProtectedLayout.module.scss'

type UserRole = 'operator' | 'admin' | 'owner' | null

const roleHome: Record<Exclude<UserRole, null>, string> = {
    operator: '/workload',
    admin: '/stats',
    owner: '/stats',
}

function canAccess(pathname: string, role: Exclude<UserRole, null>) {
    if (pathname.startsWith('/workload/employees')) return role === 'admin' || role === 'owner'
    if (pathname.startsWith('/finance')) return role === 'admin' || role === 'owner'
    if (pathname.startsWith('/marketplace')) return role === 'admin' || role === 'owner'
    if (pathname.startsWith('/workload')) return true
    if (pathname.startsWith('/profile')) return true
    if (pathname.startsWith('/settings')) return true
    if (pathname.startsWith('/stats')) return true
    return false
}

export const ProtectedLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [role, setRole] = useState<UserRole>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/user/profile', { credentials: 'include' })
            .then(r => {
                if (r.status === 401) { navigate('/login'); return null }
                return r.json()
            })
            .then(data => {
                if (data && (data.role === 'operator' || data.role === 'admin' || data.role === 'owner')) {
                    setRole(data.role)
                }
            })
            .catch(() => navigate('/login'))
            .finally(() => setLoading(false))
    }, [navigate])

    useEffect(() => {
        if (!role) return
        if (!canAccess(location.pathname, role)) {
            navigate(roleHome[role], { replace: true })
        }
    }, [location.pathname, navigate, role])

    if (loading) return null

    return (
        <div className={styles.layout}>
            <Sidebar role={role} />
            <div className={styles.column}>
                <Topbar />
                <main className={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
