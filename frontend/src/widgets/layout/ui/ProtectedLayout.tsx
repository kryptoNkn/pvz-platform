import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { Sidebar } from '@/widgets/sidebar'
import { Topbar } from '@/widgets/topbar'
import styles from './ProtectedLayout.module.scss'

type UserRole = 'operator' | 'admin' | 'owner' | null

type LoadState = 'loading' | 'ready' | 'error'

const roleHome: Record<Exclude<UserRole, null>, string> = {
    operator: '/workload',
    admin: '/stats',
    owner: '/stats',
}

function canAccess(pathname: string, role: Exclude<UserRole, null>) {
    if (pathname.startsWith('/workload/employees')) return role === 'admin' || role === 'owner'
    if (pathname.startsWith('/finance')) return role === 'admin' || role === 'owner'
    if (pathname.startsWith('/marketplace')) return role === 'admin' || role === 'owner'
    if (pathname.startsWith('/workload')) return true
    if (pathname.startsWith('/profile')) return true
    if (pathname.startsWith('/settings')) return true
    if (pathname.startsWith('/stats')) return true
    return false
}

function isUserRole(role: unknown): role is Exclude<UserRole, null> {
    return role === 'operator' || role === 'admin' || role === 'owner'
}

interface PendingStateProps {
    title: string
    text: string
    actionLabel?: string
    onAction?: () => void
}

function PendingState({ title, text, actionLabel, onAction }: PendingStateProps) {
    return (
        <div className={styles.pendingScreen}>
            <div className={styles.pendingCard}>
                <p className={styles.pendingTitle}>{title}</p>
                <p className={styles.pendingText}>{text}</p>
                {actionLabel && onAction && (
                    <div className={styles.pendingActions}>
                        <button className={styles.pendingButton} type="button" onClick={onAction}>
                            {actionLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export const ProtectedLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [role, setRole] = useState<UserRole>(null)
    const [loadState, setLoadState] = useState<LoadState>('loading')
    const [loadError, setLoadError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        let cancelled = false

        const loadProfile = async () => {
            setLoadState('loading')
            setLoadError(null)
            setRole(null)

            try {
                const response = await fetch('/api/user/profile', {
                    credentials: 'include',
                    signal: controller.signal,
                })

                if (response.status === 401) {
                    navigate('/login', { replace: true })
                    return
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }

                const data = await response.json()
                if (cancelled || controller.signal.aborted) return

                if (!isUserRole(data?.role)) {
                    throw new Error('Не удалось определить роль пользователя')
                }

                setRole(data.role)
                setLoadState('ready')
            } catch (error) {
                if (cancelled || controller.signal.aborted) return

                const message = error instanceof Error ? error.message : 'Не удалось загрузить профиль'
                setLoadError(message)
                setLoadState('error')
                console.error('Failed to load protected profile', error)
            }
        }

        void loadProfile()

        return () => {
            cancelled = true
            controller.abort()
        }
    }, [navigate, reloadKey])

    useEffect(() => {
        if (!role) return
        if (!canAccess(location.pathname, role)) {
            navigate(roleHome[role], { replace: true })
        }
    }, [location.pathname, navigate, role])

    if (loadState === 'loading') {
        return (
            <PendingState
                title="Загрузка данных"
                text="Подготавливаем рабочее пространство и проверяем профиль."
            />
        )
    }

    if (loadState === 'error') {
        return (
            <PendingState
                title="Не удалось загрузить профиль"
                text={loadError ?? 'Попробуйте повторить загрузку или обновить страницу.'}
                actionLabel="Повторить загрузку"
                onAction={() => setReloadKey((value) => value + 1)}
            />
        )
    }

    return (
        <ErrorBoundary
            key={location.pathname}
            onError={(error, info) => {
                console.error('Protected layout render error', error, info)
            }}
            fallback={(error, reset) => (
                <PendingState
                    title="Что-то пошло не так"
                    text={error.message || 'Во время рендера интерфейса произошла ошибка.'}
                    actionLabel="Повторить загрузку"
                    onAction={() => {
                        reset()
                        setReloadKey((value) => value + 1)
                    }}
                />
            )}
        >
            <div className={styles.layout}>
                <Sidebar role={role} />
                <div className={styles.column}>
                    <Topbar />
                    <main className={styles.main}>
                        <Outlet />
                    </main>
                </div>
            </div>
        </ErrorBoundary>
    )
}
