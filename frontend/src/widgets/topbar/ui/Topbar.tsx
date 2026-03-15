import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, Bell } from 'lucide-react'
import styles from './Topbar.module.scss'

const PAGE_TITLES: Record<string, string> = {
    '/workload': 'Загруженность ПВЗ',
    '/workload/add': 'Добавить ПВЗ',
    '/workload/employees': 'Список сотрудников',
    '/stats': 'Статистика',
    '/finance': 'Финансы',
    '/profile': 'Профиль',
}

export default function Topbar() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const title = PAGE_TITLES[pathname] ?? 'ПВЗ Master'

    return (
        <header className={styles.header}>
            <span className={styles.title}>{title}</span>
            <div className={styles.actions}>
                <button className={styles.actionBtn} aria-label="Настройки">
                    <Settings size={18} />
                </button>
                <button className={styles.actionBtn} aria-label="Уведомления">
                    <Bell size={18} />
                </button>
                <button
                    className={styles.avatarBtn}
                    aria-label="Профиль"
                    onClick={() => navigate('/profile')}
                />
            </div>
        </header>
    )
}
