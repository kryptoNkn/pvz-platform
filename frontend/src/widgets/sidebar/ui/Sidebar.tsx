import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Users, Package } from 'lucide-react'
import { StatsIcon, WorkloadIcon, FinanceIcon, LeaveIcon } from '@/shared/Icons'
import { useLang } from '@/shared/i18n'
import styles from './Sidebar.module.scss'
// @ts-ignore
import pvzIconUrl from '@/shared/assets/pvz-icon.svg'

const navItems = [
    { path: '/stats', icon: <StatsIcon /> },
    { path: '/workload', icon: <WorkloadIcon /> },
    { path: '/finance', icon: <FinanceIcon /> },
    { path: '/marketplace', icon: <Package width={40} height={40} color="white" /> },
]

interface SidebarProps {
    role: string
}

export const Sidebar = ({ role }: SidebarProps) => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const { t } = useLang()
    const [showConfirm, setShowConfirm] = useState(false)

    const canManageUsers = role === 'owner' || role === 'admin'

    return (
        <>
            <aside className={styles.sidebar}>
                <div className={styles.top}>
                    <img src={pvzIconUrl} alt="PVZ" width={64} height={64} className={styles.avatar} />
                    <p className={styles.title}>ПВЗ Master</p>
                </div>

                <nav className={styles.nav}>
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`${styles.navIcon} ${pathname === item.path ? styles.navIconActive : ''}`}
                        >
                            {item.icon}
                        </Link>
                    ))}
                    {canManageUsers && (
                        <Link
                            to="/workload/employees"
                            className={`${styles.navIcon} ${pathname === '/workload/employees' ? styles.navIconActive : ''}`}
                        >
                            <Users width={40} height={40} />
                        </Link>
                    )}
                </nav>

                <div className={styles.leave} onClick={() => setShowConfirm(true)}>
                    <LeaveIcon />
                </div>
            </aside>

            {showConfirm && (
                <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>{t.logoutTitle}</h3>
                        <p className={styles.modalText}>{t.logoutConfirm}</p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setShowConfirm(false)}>
                                {t.cancel}
                            </button>
                            <button
                                className={styles.modalConfirm}
                                onClick={() => {
                                    setShowConfirm(false)
                                    navigate('/login')
                                }}
                            >
                                {t.logout}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
