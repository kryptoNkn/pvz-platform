import { useState, useEffect } from 'react'
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
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    const loadAvatar = () => {
        fetch('/api/user/profile', { credentials: 'include' })
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (data?.avatar_url) {
                    setAvatarUrl(data.avatar_url + '?t=' + Date.now())
                } else {
                    setAvatarUrl(null)
                }
            })
            .catch(() => {})
    }

    useEffect(() => {
        loadAvatar()
        window.addEventListener('profileUpdated', loadAvatar)
        return () => window.removeEventListener('profileUpdated', loadAvatar)
    }, [])

    useEffect(() => {
        document.title = title
    }, [title])

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
                    style={avatarUrl ? {
                        backgroundImage: `url(${avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    } : undefined}
                />
            </div>
        </header>
    )
}
