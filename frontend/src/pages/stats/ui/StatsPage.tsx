import { useEffect, useState } from 'react'
import styles from './StatsPage.module.scss'

interface Stats {
    total: number
    active: number
    overloaded: number
    closed: number
    total_items: number
    acceptance: number
    delivery: number
    returns: number
}

export const StatsPage = () => {
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {
        fetch('/api/v1/stats', { credentials: 'include' })
            .then(r => r.json())
            .then(setStats)
            .catch(console.error)
    }, [])

    if (!stats) {
        return (
            <div className={styles.page}>
                <p className={styles.loading}>Загрузка...</p>
            </div>
        )
    }

    const activePercent = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0
    const overloadedPercent = stats.total > 0 ? Math.round((stats.overloaded / stats.total) * 100) : 0
    const closedPercent = 100 - activePercent - overloadedPercent

    const opsTotal = stats.acceptance + stats.delivery + stats.returns
    const accPct = opsTotal > 0 ? Math.round((stats.acceptance / opsTotal) * 100) : 0
    const delPct = opsTotal > 0 ? Math.round((stats.delivery / opsTotal) * 100) : 0
    const retPct = 100 - accPct - delPct

    return (
        <div className={styles.page}>
            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statDark}`}>
                    <span className={styles.statLabel}>Всего ПВЗ</span>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statSub}>всего объектов</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>Активных</span>
                    <span className={styles.statValue}>{stats.active}</span>
                    <span className={styles.statSub}>{activePercent}% от общего числа</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statRed}`}>
                    <span className={styles.statLabel}>Перегружено</span>
                    <span className={styles.statValue}>{stats.overloaded}</span>
                    <span className={styles.statSub}>{overloadedPercent}% от общего числа</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGray}`}>
                    <span className={styles.statLabel}>Неактивных</span>
                    <span className={styles.statValue}>{stats.closed}</span>
                    <span className={styles.statSub}>{closedPercent}% от общего числа</span>
                </div>
            </div>

            <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>Распределение статусов ПВЗ</h2>
                <div className={styles.barTrack}>
                    {activePercent > 0 && (
                        <div className={styles.barActive} style={{ flex: activePercent }}>
                            <span>Активен {activePercent}%</span>
                        </div>
                    )}
                    {overloadedPercent > 0 && (
                        <div className={styles.barOverloaded} style={{ flex: overloadedPercent }}>
                            <span>Перегружен {overloadedPercent}%</span>
                        </div>
                    )}
                    {closedPercent > 0 && (
                        <div className={styles.barClosed} style={{ flex: closedPercent }}>
                            <span>Неактивен {closedPercent}%</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statDark}`}>
                    <span className={styles.statLabel}>Всего товаров</span>
                    <span className={styles.statValue}>{stats.total_items.toLocaleString('ru-RU')}</span>
                    <span className={styles.statSub}>на всех ПВЗ</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>Приёмка</span>
                    <span className={styles.statValue}>{stats.acceptance.toLocaleString('ru-RU')}</span>
                    <span className={styles.statSub}>{accPct}% операций</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>Выдача</span>
                    <span className={styles.statValue}>{stats.delivery.toLocaleString('ru-RU')}</span>
                    <span className={styles.statSub}>{delPct}% операций</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>Возвраты</span>
                    <span className={styles.statValue}>{stats.returns.toLocaleString('ru-RU')}</span>
                    <span className={styles.statSub}>{retPct}% операций</span>
                </div>
            </div>

            <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>Соотношение операций</h2>
                <div className={styles.barTrack}>
                    {accPct > 0 && (
                        <div className={styles.barActive} style={{ flex: accPct }}>
                            <span>Приёмка {accPct}%</span>
                        </div>
                    )}
                    {delPct > 0 && (
                        <div className={styles.barDelivery} style={{ flex: delPct }}>
                            <span>Выдача {delPct}%</span>
                        </div>
                    )}
                    {retPct > 0 && (
                        <div className={styles.barOverloaded} style={{ flex: retPct }}>
                            <span>Возвраты {retPct}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
