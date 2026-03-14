import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { StatsIcon } from '@/shared/Icons/statsIcon/StatsIcon'
import { WorkloadIcon } from '@/shared/Icons/workloadIcon/WorkloadIcon'
import { FinanceIcon } from '@/shared/Icons/financeIcon/FinanceIcon'
import { LeaveIcon } from '@/shared/Icons/leaveIcon/LeaveIcon'
import styles from './Sidebar.module.scss'
// @ts-ignore
import pvzIconUrl from '@/shared/Icons/pvzIcon/Ellipse 6.svg'

const navItems = [
    { path: '/stats', icon: <StatsIcon /> },
    { path: '/workload', icon: <WorkloadIcon /> },
    { path: '/finance', icon: <FinanceIcon /> },
]

export const Sidebar = () => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const [showConfirm, setShowConfirm] = useState(false)

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
