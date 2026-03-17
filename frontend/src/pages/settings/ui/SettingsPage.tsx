import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    User, Lock, Bell, Info, ChevronRight,
    Shield, LogOut, CheckCircle, XCircle,
    Sun, Moon, Globe
} from 'lucide-react'
import { useLang } from '@/shared/i18n'
import type { Lang } from '@/shared/i18n/translations'
import styles from './SettingsPage.module.scss'

interface Profile {
    full_name: string
    phone: string
    role: string
    avatar_url: string | null
}

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
}

export default function SettingsPage() {
    const navigate = useNavigate()
    const { lang, t, setLang } = useLang()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem('theme') as Theme) || 'light'
    )
    const [notifRole, setNotifRole] = useState(() =>
        localStorage.getItem('notif_role') !== 'false'
    )
    const [notifSystem, setNotifSystem] = useState(() =>
        localStorage.getItem('notif_system') !== 'false'
    )

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
        showToast('success', t.settingsSaved)
    }

    const handleLang = (next: Lang) => {
        setLang(next)
        showToast('success', t.settingsSaved)
    }

    const toggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
        setter(value)
        localStorage.setItem(key, String(value))
        showToast('success', t.settingsSaved)
    }

    const handleLogout = () => {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
            .finally(() => {
                document.cookie = 'token=; Max-Age=0; path=/'
                navigate('/login')
            })
    }

    const ROLE_LABELS: Record<string, string> = {
        owner:    t.roleOwnerLabel,
        admin:    t.roleAdminLabel,
        operator: t.roleOperatorLabel,
        pending:  t.rolePendingLabel,
        user:     t.roleUserLabel,
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
                    <h2 className={styles.sectionTitle}>{t.settingsAccount}</h2>
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
                            <span>{t.settingsEditProfile}</span>
                            <ChevronRight size={16} className={styles.chevron} />
                        </button>
                        <button className={styles.linkRow} onClick={() => navigate('/profile')}>
                            <Lock size={16} />
                            <span>{t.settingsChangePassword}</span>
                            <ChevronRight size={16} className={styles.chevron} />
                        </button>
                    </div>
                </section>

                {/* ── Appearance ──────────────────────────────── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t.settingsAppearance}</h2>
                    <div className={styles.card}>
                        <div className={styles.pickerRow}>
                            <div className={styles.pickerInfo}>
                                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                <span className={styles.pickerLabel}>{t.settingsTheme}</span>
                            </div>
                            <div className={styles.segmented}>
                                <button
                                    className={`${styles.seg} ${theme === 'light' ? styles.segActive : ''}`}
                                    onClick={() => handleTheme('light')}
                                >
                                    <Sun size={13} />{t.settingsLight}
                                </button>
                                <button
                                    className={`${styles.seg} ${theme === 'dark' ? styles.segActive : ''}`}
                                    onClick={() => handleTheme('dark')}
                                >
                                    <Moon size={13} />{t.settingsDark}
                                </button>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.pickerRow}>
                            <div className={styles.pickerInfo}>
                                <Globe size={16} />
                                <span className={styles.pickerLabel}>{t.settingsLanguage}</span>
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
                    <h2 className={styles.sectionTitle}>{t.settingsNotifications}</h2>
                    <div className={styles.card}>
                        <div className={styles.toggleRow}>
                            <div className={styles.toggleInfo}>
                                <Bell size={16} />
                                <div>
                                    <div className={styles.toggleLabel}>{t.settingsRoleChange}</div>
                                    <div className={styles.toggleDesc}>{t.settingsRoleChangeDesc}</div>
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
                                    <div className={styles.toggleLabel}>{t.settingsSystemNotifs}</div>
                                    <div className={styles.toggleDesc}>{t.settingsSystemNotifsDesc}</div>
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
                    <h2 className={styles.sectionTitle}>{t.settingsAbout}</h2>
                    <div className={styles.card}>
                        <div className={styles.infoRow}>
                            <Info size={16} />
                            <span className={styles.infoLabel}>{t.settingsVersion}</span>
                            <span className={styles.infoValue}>1.0.0</span>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.infoRow}>
                            <Shield size={16} />
                            <span className={styles.infoLabel}>{t.settingsPlatform}</span>
                            <span className={styles.infoValue}>ПВЗ Master</span>
                        </div>
                    </div>
                </section>

                {/* ── Logout ──────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.card}>
                        <button className={styles.logoutRow} onClick={handleLogout}>
                            <LogOut size={16} />
                            <span>{t.settingsLogout}</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}
