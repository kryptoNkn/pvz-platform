import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, Bell } from 'lucide-react'
import { NotificationsPanel } from '@/widgets/notifications-panel'
import styles from './Topbar.module.scss'

type Lang = 'ru' | 'en'

const PAGE_TITLES: Record<string, Record<Lang, string>> = {
    '/workload':           { ru: 'Загруженность ПВЗ',   en: 'PVZ Workload' },
    '/workload/add':       { ru: 'Добавить ПВЗ',         en: 'Add PVZ' },
    '/workload/employees': { ru: 'Список сотрудников',   en: 'Employees' },
    '/stats':              { ru: 'Статистика',            en: 'Statistics' },
    '/finance':            { ru: 'Финансы',               en: 'Finance' },
    '/profile':            { ru: 'Профиль',               en: 'Profile' },
    '/settings':           { ru: 'Настройки',             en: 'Settings' },
}

export default function Topbar() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [lang, setLang] = useState<Lang>(
        () => (localStorage.getItem('lang') as Lang) || 'ru'
    )
    const title = PAGE_TITLES[pathname]?.[lang] ?? 'ПВЗ Master'
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [notifOpen, setNotifOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

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

    const loadUnreadCount = () => {
        fetch('/api/notifications/unread-count', { credentials: 'include' })
            .then(r => r.ok ? r.json() : { count: 0 })
            .then(data => setUnreadCount(data.count ?? 0))
            .catch(() => {})
    }

    useEffect(() => {
        loadAvatar()
        loadUnreadCount()
        const onLang = (e: Event) => setLang((e as CustomEvent<Lang>).detail)
        window.addEventListener('profileUpdated', loadAvatar)
        window.addEventListener('langChanged', onLang)
        // Poll unread count every 60s
        const interval = setInterval(loadUnreadCount, 60_000)
        return () => {
            window.removeEventListener('profileUpdated', loadAvatar)
            window.removeEventListener('langChanged', onLang)
            clearInterval(interval)
        }
    }, [])

    useEffect(() => {
        document.title = title
    }, [title])

    return (
        <>
            <header className={styles.header}>
                <span className={styles.title}>{title}</span>
                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        aria-label="Настройки"
                        onClick={() => navigate('/settings')}
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        className={styles.actionBtn}
                        aria-label="Уведомления"
                        onClick={() => setNotifOpen(true)}
                        style={{ position: 'relative' }}
                    >
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <span className={styles.notifBadge}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
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

            <NotificationsPanel
                open={notifOpen}
                onClose={() => setNotifOpen(false)}
                onUnreadChange={setUnreadCount}
            />
        </>
    )
}
