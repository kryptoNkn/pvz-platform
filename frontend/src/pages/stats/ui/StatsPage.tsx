import { useEffect, useState } from 'react'
import { useLang } from '@/shared/i18n'
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
    const { t } = useLang()
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
                <p className={styles.loading}>{t.loading}</p>
            </div>
        )
    }

    const activePercent     = stats.total > 0 ? Math.round((stats.active     / stats.total) * 100) : 0
    const overloadedPercent = stats.total > 0 ? Math.round((stats.overloaded / stats.total) * 100) : 0
    const closedPercent     = 100 - activePercent - overloadedPercent

    const opsTotal = stats.acceptance + stats.delivery + stats.returns
    const accPct   = opsTotal > 0 ? Math.round((stats.acceptance / opsTotal) * 100) : 0
    const delPct   = opsTotal > 0 ? Math.round((stats.delivery   / opsTotal) * 100) : 0
    const retPct   = 100 - accPct - delPct

    const fmt = (n: number) => n.toLocaleString(t.locale)

    return (
        <div className={styles.page}>
            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statDark}`}>
                    <span className={styles.statLabel}>{t.totalPvz}</span>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statSub}>{t.totalPvzSub}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.active}</span>
                    <span className={styles.statValue}>{stats.active}</span>
                    <span className={styles.statSub}>{t.ofTotal(activePercent)}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statRed}`}>
                    <span className={styles.statLabel}>{t.overloaded}</span>
                    <span className={styles.statValue}>{stats.overloaded}</span>
                    <span className={styles.statSub}>{t.ofTotal(overloadedPercent)}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGray}`}>
                    <span className={styles.statLabel}>{t.inactive}</span>
                    <span className={styles.statValue}>{stats.closed}</span>
                    <span className={styles.statSub}>{t.ofTotal(closedPercent)}</span>
                </div>
            </div>

            <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>{t.statusDistribution}</h2>
                <div className={styles.barTrack}>
                    {activePercent > 0 && (
                        <div className={styles.barActive} style={{ flex: activePercent }}>
                            <span>{t.barActive(activePercent)}</span>
                        </div>
                    )}
                    {overloadedPercent > 0 && (
                        <div className={styles.barOverloaded} style={{ flex: overloadedPercent }}>
                            <span>{t.barOverloaded(overloadedPercent)}</span>
                        </div>
                    )}
                    {closedPercent > 0 && (
                        <div className={styles.barClosed} style={{ flex: closedPercent }}>
                            <span>{t.barClosed(closedPercent)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statDark}`}>
                    <span className={styles.statLabel}>{t.opsTotal}</span>
                    <span className={styles.statValue}>{fmt(stats.total_items)}</span>
                    <span className={styles.statSub}>{t.opsTotalSub}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.acceptanceStat}</span>
                    <span className={styles.statValue}>{fmt(stats.acceptance)}</span>
                    <span className={styles.statSub}>{t.ofOps(accPct)}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.deliveryStat}</span>
                    <span className={styles.statValue}>{fmt(stats.delivery)}</span>
                    <span className={styles.statSub}>{t.ofOps(delPct)}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.returnsStat}</span>
                    <span className={styles.statValue}>{fmt(stats.returns)}</span>
                    <span className={styles.statSub}>{t.ofOps(retPct)}</span>
                </div>
            </div>

            <div className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>{t.opsBreakdown}</h2>
                <div className={styles.barTrack}>
                    {accPct > 0 && (
                        <div className={styles.barActive} style={{ flex: accPct }}>
                            <span>{t.barAcceptance(accPct)}</span>
                        </div>
                    )}
                    {delPct > 0 && (
                        <div className={styles.barDelivery} style={{ flex: delPct }}>
                            <span>{t.barDelivery(delPct)}</span>
                        </div>
                    )}
                    {retPct > 0 && (
                        <div className={styles.barOverloaded} style={{ flex: retPct }}>
                            <span>{t.barReturns(retPct)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
