import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User, Lock, Bell, Info, ChevronRight,
    Shield, LogOut, CheckCircle, XCircle
} from 'lucide-react'
import styles from './SettingsPage.module.scss'

interface Profile {
    full_name: string
    phone: string
    role: string
    avatar_url: string | null
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Владелец',
    admin: 'Администратор',
    operator: 'Оператор',
    pending: 'Ожидает',
    user: 'Пользователь',
}

export default function SettingsPage() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Notification toggles (stored in localStorage for now)
    const [notifRole, setNotifRole] = useState(() =>
        localStorage.getItem('notif_role') !== 'false'
    )
    const [notifSystem, setNotifSystem] = useState(() =>
        localStorage.getItem('notif_system') !== 'false'
    )

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        fetch('/api/user/profile', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(setProfile)
            .catch(() => {})
    }, [])

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                document.cookie = 'token=; Max-Age=0; path=/'
                navigate('/login')
            })
    }

    const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
        setter(value)
        localStorage.setItem(key, String(value))
        showToast('success', 'Настройки сохранены')
    }

    return (
        <div className={styles.page}>
            {toast && (
                <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    {toast.type === 'success'
                        ? <CheckCircle size={15} />
                        : <XCircle size={15} />}
                    {toast.text}
                </div>
            )}

            {/* ── Account ─────────────────────────────────────── */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Аккаунт</h2>
                <div className={styles.card}>
                    {profile && (
                        <div className={styles.profileRow}>
                            <div
                                className={styles.avatar}
                                style={profile.avatar_url ? {
                                    backgroundImage: `url(${profile.avatar_url}?t=${Date.now()})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                } : undefined}
                            />
                            <div className={styles.profileInfo}>
                                <div className={styles.profileName}>{profile.full_name}</div>
                                <div className={styles.profilePhone}>{profile.phone}</div>
                                <div className={styles.roleBadge}>
                                    {ROLE_LABELS[profile.role] ?? profile.role}
                                </div>
                            </div>
                        </div>
                    )}
                    <button className={styles.linkRow} onClick={() => navigate('/profile')}>
                        <User size={16} />
                        <span>Редактировать профиль</span>
                        <ChevronRight size={16} className={styles.chevron} />
                    </button>
                    <button className={styles.linkRow} onClick={() => navigate('/profile')}>
                        <Lock size={16} />
                        <span>Изменить пароль</span>
                        <ChevronRight size={16} className={styles.chevron} />
                    </button>
                </div>
            </section>

            {/* ── Notifications ────────────────────────────────── */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Уведомления</h2>
                <div className={styles.card}>
                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <Bell size={16} />
                            <div>
                                <div className={styles.toggleLabel}>Смена роли</div>
                                <div className={styles.toggleDesc}>
                                    Уведомлять при изменении вашей роли
                                </div>
                            </div>
                        </div>
                        <button
                            className={`${styles.toggle} ${notifRole ? styles.toggleOn : ''}`}
                            onClick={() => toggle('notif_role', !notifRole, setNotifRole)}
                        >
                            <span className={styles.toggleThumb} />
                        </button>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.toggleRow}>
                        <div className={styles.toggleInfo}>
                            <Shield size={16} />
                            <div>
                                <div className={styles.toggleLabel}>Системные уведомления</div>
                                <div className={styles.toggleDesc}>
                                    Информация от администраторов системы
                                </div>
                            </div>
                        </div>
                        <button
                            className={`${styles.toggle} ${notifSystem ? styles.toggleOn : ''}`}
                            onClick={() => toggle('notif_system', !notifSystem, setNotifSystem)}
                        >
                            <span className={styles.toggleThumb} />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── About ────────────────────────────────────────── */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>О системе</h2>
                <div className={styles.card}>
                    <div className={styles.infoRow}>
                        <Info size={16} />
                        <span className={styles.infoLabel}>Версия</span>
                        <span className={styles.infoValue}>1.0.0</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.infoRow}>
                        <Shield size={16} />
                        <span className={styles.infoLabel}>Платформа</span>
                        <span className={styles.infoValue}>ПВЗ Master</span>
                    </div>
                </div>
            </section>

            {/* ── Danger ───────────────────────────────────────── */}
            <section className={styles.section}>
                <div className={styles.card}>
                    <button className={styles.logoutRow} onClick={handleLogout}>
                        <LogOut size={16} />
                        <span>Выйти из аккаунта</span>
                    </button>
                </div>
            </section>
        </div>
    )
}
