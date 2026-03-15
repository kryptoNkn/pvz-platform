import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import { StatsIcon, WorkloadIcon, FinanceIcon, LeaveIcon } from '@/shared/Icons'
import styles from './Sidebar.module.scss'
// @ts-ignore
import pvzIconUrl from '@/shared/assets/pvz-icon.svg'

const navItems = [
    { path: '/stats', icon: <StatsIcon /> },
    { path: '/workload', icon: <WorkloadIcon /> },
    { path: '/finance', icon: <FinanceIcon /> },
]

interface SidebarProps {
    role: string
}

export const Sidebar = ({ role }: SidebarProps) => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
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
                        <h3 className={styles.modalTitle}>Выйти из аккаунта?</h3>
                        <p className={styles.modalText}>Вы уверены, что хотите выйти?</p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalCancel} onClick={() => setShowConfirm(false)}>
                                Отмена
                            </button>
                            <button
                                className={styles.modalConfirm}
                                onClick={() => {
                                    setShowConfirm(false)
                                    navigate('/login')
                                }}
                            >
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
