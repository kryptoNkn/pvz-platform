import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Settings, Bell } from 'lucide-react'
import { useLang } from '@/shared/i18n'
import { NotificationsPanel } from '@/widgets/notifications-panel'
import styles from './Topbar.module.scss'

const PAGE_TITLE_KEYS: Record<string, 'workload' | 'addPvz' | 'employeesList' | 'statsPage' | 'financePage' | 'profilePage' | 'settingsPage'> = {
    '/workload':           'workload',
    '/workload/add':       'addPvz',
    '/workload/employees': 'employeesList',
    '/stats':              'statsPage',
    '/finance':            'financePage',
    '/profile':            'profilePage',
    '/settings':           'settingsPage',
}

const PAGE_TITLES_RU: Record<string, string> = {
    workload:      'Загруженность ПВЗ',
    addPvz:        'Добавить ПВЗ',
    employeesList: 'Список сотрудников',
    statsPage:     'Статистика',
    financePage:   'Финансы',
    profilePage:   'Профиль',
    settingsPage:  'Настройки',
}

const PAGE_TITLES_EN: Record<string, string> = {
    workload:      'PVZ Workload',
    addPvz:        'Add PVZ',
    employeesList: 'Employees',
    statsPage:     'Statistics',
    financePage:   'Finance',
    profilePage:   'Profile',
    settingsPage:  'Settings',
}

export default function Topbar() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const { lang } = useLang()
    const key = PAGE_TITLE_KEYS[pathname]
    const titles = lang === 'en' ? PAGE_TITLES_EN : PAGE_TITLES_RU
    const title = key ? titles[key] : 'ПВЗ Master'

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
        window.addEventListener('profileUpdated', loadAvatar)
        const interval = setInterval(loadUnreadCount, 60_000)
        return () => {
            window.removeEventListener('profileUpdated', loadAvatar)
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

