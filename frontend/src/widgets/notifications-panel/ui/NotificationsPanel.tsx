import { useEffect, useRef, useState } from 'react'
import { X, CheckCheck, Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { useLang } from '@/shared/i18n'
import {
    getNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    refreshNotifications,
    type NotificationItem,
} from '../model/mockNotifications'
import styles from './NotificationsPanel.module.scss'

interface Props {
    open: boolean
    onClose: () => void
    onUnreadChange: (count: number) => void
}

function timeAgo(iso: string, locale: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (locale === 'en-US') {
        if (diff < 60) return 'just now'
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
        return `${Math.floor(diff / 86400)} d ago`
    }
    if (diff < 60) return 'только что'
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
    return `${Math.floor(diff / 86400)} д назад`
}

const TYPE_ICON = {
    info:    <Info size={15} />,
    success: <CheckCircle size={15} />,
    warning: <AlertTriangle size={15} />,
    error:   <AlertTriangle size={15} />,
}

export default function NotificationsPanel({ open, onClose, onUnreadChange }: Props) {
    const { lang, t } = useLang()
    const [items, setItems] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)

    const load = () => {
        setLoading(true)
        const data = open ? refreshNotifications(lang) : getNotifications()
        setItems(data)
        onUnreadChange(data.filter((n) => !n.is_read).length)
        setLoading(false)
    }

    useEffect(() => {
        if (open) load()
    }, [open, lang])

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open, onClose])

    const markRead = (id: string) => {
        const nextItems = markNotificationRead(id)
        setItems(nextItems)
        onUnreadChange(nextItems.filter((n) => !n.is_read).length)
    }

    const markAllRead = () => {
        const nextItems = markAllNotificationsRead()
        setItems(nextItems)
        onUnreadChange(0)
    }

    const unread = items.filter(n => !n.is_read).length

    return (
        <>
            <div className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`} />
            <div ref={panelRef} className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Bell size={18} />
                        <span>{t.notifications}</span>
                        {unread > 0 && <span className={styles.badge}>{unread}</span>}
                    </div>
                    <div className={styles.headerRight}>
                        {unread > 0 && (
                            <button className={styles.markAllBtn} onClick={markAllRead}>
                                <CheckCheck size={16} />
                            </button>
                        )}
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className={styles.list}>
                    {loading && (
                        <div className={styles.empty}>
                            <div className={styles.spinner} />
                        </div>
                    )}
                    {!loading && items.length === 0 && (
                        <div className={styles.empty}>
                            <Bell size={36} strokeWidth={1.2} />
                            <p>{t.noNotifications}</p>
                        </div>
                    )}
                    {!loading && items.map(n => (
                        <div
                            key={n.id}
                            className={`${styles.item} ${!n.is_read ? styles.itemUnread : ''} ${styles[`item_${n.type}`]}`}
                            onClick={() => !n.is_read && markRead(n.id)}
                        >
                            <div className={`${styles.typeIcon} ${styles[`icon_${n.type}`]}`}>
                                {TYPE_ICON[n.type] ?? TYPE_ICON.info}
                            </div>
                            <div className={styles.itemContent}>
                                <div className={styles.itemTitle}>{n.title}</div>
                                {n.body && <div className={styles.itemBody}>{n.body}</div>}
                                <div className={styles.itemTime}>{timeAgo(n.created_at, t.locale)}</div>
                            </div>
                            {!n.is_read && <div className={styles.unreadDot} />}
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
