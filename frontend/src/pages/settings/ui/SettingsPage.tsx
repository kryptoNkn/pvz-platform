import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User, Lock, Bell, Info, ChevronRight,
    Shield, LogOut, CheckCircle, XCircle,
    Sun, Moon, Globe
} from 'lucide-react'
import styles from './SettingsPage.module.scss'

interface Profile {
    full_name: string
    phone: string
    role: string
    avatar_url: string | null
}

type Theme = 'light' | 'dark'
type Lang  = 'ru' | 'en'

const T = {
    ru: {
        account:          'Аккаунт',
        editProfile:      'Редактировать профиль',
        changePassword:   'Изменить пароль',
        notifications:    'Уведомления',
        roleChange:       'Смена роли',
        roleChangeDesc:   'Уведомлять при изменении вашей роли',
        systemNotifs:     'Системные уведомления',
        systemNotifsDesc: 'Информация от администраторов системы',
        appearance:       'Внешний вид',
        theme:            'Тема',
        light:            'Светлая',
        dark:             'Тёмная',
        language:         'Язык',
        about:            'О системе',
        version:          'Версия',
        platform:         'Платформа',
        logout:           'Выйти из аккаунта',
        saved:            'Настройки сохранены',
    },
    en: {
        account:          'Account',
        editProfile:      'Edit profile',
        changePassword:   'Change password',
        notifications:    'Notifications',
        roleChange:       'Role change',
        roleChangeDesc:   'Notify when your role changes',
        systemNotifs:     'System notifications',
        systemNotifsDesc: 'Information from system administrators',
        appearance:       'Appearance',
        theme:            'Theme',
        light:            'Light',
        dark:             'Dark',
        language:         'Language',
        about:            'About',
        version:          'Version',
        platform:         'Platform',
        logout:           'Log out',
        saved:            'Settings saved',
    },
}

const ROLE_LABELS: Record<string, Record<Lang, string>> = {
    owner:    { ru: 'Владелец',       en: 'Owner' },
    admin:    { ru: 'Администратор',  en: 'Administrator' },
    operator: { ru: 'Оператор',       en: 'Operator' },
    pending:  { ru: 'Ожидает',        en: 'Pending' },
    user:     { ru: 'Пользователь',   en: 'User' },
}

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
}

function applyLang(lang: Lang) {
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('lang', lang)
    window.dispatchEvent(new CustomEvent('langChanged', { detail: lang }))
}

export default function SettingsPage() {
    const navigate = useNavigate()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem('theme') as Theme) || 'light'
    )
    const [lang, setLang] = useState<Lang>(
        () => (localStorage.getItem('lang') as Lang) || 'ru'
    )
    const [notifRole, setNotifRole] = useState(() =>
        localStorage.getItem('notif_role') !== 'false'
    )
    const [notifSystem, setNotifSystem] = useState(() =>
        localStorage.getItem('notif_system') !== 'false'
    )

    const t = T[lang]

    const showToast = (type: 'success' | 'error', text: string) => {
        setToast({ type, text })
        setTimeout(() => setToast(null), 2500)
    }

    useEffect(() => {
        fetch('/api/user/profile', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(setProfile)
            .catch(() => {})
    }, [])

    const handleTheme = (next: Theme) => {
        setTheme(next)
        applyTheme(next)
        showToast('success', t.saved)
    }

    const handleLang = (next: Lang) => {
        setLang(next)
        applyLang(next)
        showToast('success', T[next].saved)
    }

    const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
        setter(value)
        localStorage.setItem(key, String(value))
        showToast('success', t.saved)
    }

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                document.cookie = 'token=; Max-Age=0; path=/'
                navigate('/login')
            })
    }

    return (
        <div className={styles.pageOuter}>
            <div className={styles.page}>
                {toast && (
                    <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                        {toast.type === 'success'
                            ? <CheckCircle size={15} />
                            : <XCircle size={15} />}
                        {toast.text}
                    </div>
                )}

                {/* ── Account ─────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t.account}</h2>
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
                                        {ROLE_LABELS[profile.role]?.[lang] ?? profile.role}
                                    </div>
                                </div>
                            </div>
                        )}
                        <button className={styles.linkRow} onClick={() => navigate('/profile')}>
                            <User size={16} />
                            <span>{t.editProfile}</span>
                            <ChevronRight size={16} className={styles.chevron} />
                        </button>
                        <button className={styles.linkRow} onClick={() => navigate('/profile')}>
                            <Lock size={16} />
                            <span>{t.changePassword}</span>
                            <ChevronRight size={16} className={styles.chevron} />
                        </button>
                    </div>
                </section>

                {/* ── Appearance ──────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t.appearance}</h2>
                    <div className={styles.card}>
                        <div className={styles.pickerRow}>
                            <div className={styles.pickerInfo}>
                                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                <span className={styles.pickerLabel}>{t.theme}</span>
                            </div>
                            <div className={styles.segmented}>
                                <button
                                    className={`${styles.seg} ${theme === 'light' ? styles.segActive : ''}`}
                                    onClick={() => handleTheme('light')}
                                >
                                    <Sun size={13} />{t.light}
                                </button>
                                <button
                                    className={`${styles.seg} ${theme === 'dark' ? styles.segActive : ''}`}
                                    onClick={() => handleTheme('dark')}
                                >
                                    <Moon size={13} />{t.dark}
                                </button>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.pickerRow}>
                            <div className={styles.pickerInfo}>
                                <Globe size={16} />
                                <span className={styles.pickerLabel}>{t.language}</span>
                            </div>
                            <div className={styles.segmented}>
                                <button
                                    className={`${styles.seg} ${lang === 'ru' ? styles.segActive : ''}`}
                                    onClick={() => handleLang('ru')}
                                >
                                    RU
                                </button>
                                <button
                                    className={`${styles.seg} ${lang === 'en' ? styles.segActive : ''}`}
                                    onClick={() => handleLang('en')}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Notifications ───────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t.notifications}</h2>
                    <div className={styles.card}>
                        <div className={styles.toggleRow}>
                            <div className={styles.toggleInfo}>
                                <Bell size={16} />
                                <div>
                                    <div className={styles.toggleLabel}>{t.roleChange}</div>
                                    <div className={styles.toggleDesc}>{t.roleChangeDesc}</div>
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
                                    <div className={styles.toggleLabel}>{t.systemNotifs}</div>
                                    <div className={styles.toggleDesc}>{t.systemNotifsDesc}</div>
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

                {/* ── About ───────────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t.about}</h2>
                    <div className={styles.card}>
                        <div className={styles.infoRow}>
                            <Info size={16} />
                            <span className={styles.infoLabel}>{t.version}</span>
                            <span className={styles.infoValue}>1.0.0</span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.infoRow}>
                            <Shield size={16} />
                            <span className={styles.infoLabel}>{t.platform}</span>
                            <span className={styles.infoValue}>ПВЗ Master</span>
                        </div>
                    </div>
                </section>

                {/* ── Logout ──────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.card}>
                        <button className={styles.logoutRow} onClick={handleLogout}>
                            <LogOut size={16} />
                            <span>{t.logout}</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}
