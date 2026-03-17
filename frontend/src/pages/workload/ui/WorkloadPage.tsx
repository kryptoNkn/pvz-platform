import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/shared/i18n'
import styles from './WorkloadPage.module.scss'

interface Pvz {
    id: string
    name: string
    address: string
    status: 'active' | 'overloaded' | 'closed'
    load_percent: number
    traffic: string
    hours: string
}

interface Stats {
    total: number
    total_items: number
    acceptance: number
    delivery: number
    returns: number
}

export const WorkloadPage = () => {
    const navigate = useNavigate()
    const { t } = useLang()
    const [pvzList, setPvzList] = useState<Pvz[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetch('/api/v1/pvz', { credentials: 'include' })
            .then(r => r.json())
            .then(setPvzList)
            .catch(console.error)

        fetch('/api/v1/stats', { credentials: 'include' })
            .then(r => r.json())
            .then(setStats)
            .catch(console.error)
    }, [])

    const STATUS_LABEL: Record<string, string> = {
        active:     t.statusActive,
        overloaded: t.statusOverloaded,
        closed:     t.statusInactive,
    }

    const filtered = pvzList.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className={styles.page}>
            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statBlock1}`}>
                    <span className={styles.statLabel}>{t.totalItems}</span>
                    <span className={styles.statValue}>{stats?.total_items ?? '—'}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statBlock2}`}>
                    <span className={styles.statLabel}>{t.acceptance}</span>
                    <span className={styles.statValue}>{stats?.acceptance ?? '—'}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statBlock3}`}>
                    <span className={styles.statLabel}>{t.delivery}</span>
                    <span className={styles.statValue}>{stats?.delivery ?? '—'}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statBlock4}`}>
                    <span className={styles.statLabel}>{t.returns}</span>
                    <span className={styles.statValue}>{stats?.returns ?? '—'}</span>
                </div>
            </div>

            <div className={styles.searchSection}>
                <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className={styles.searchInput}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <span className={styles.pointsText}>{t.points(stats?.total ?? pvzList.length)}</span>
                <button className={styles.btnSecondary} onClick={() => navigate('/workload/employees')}>
                    {t.employees}
                </button>
                <button className={styles.btnPrimary} onClick={() => navigate('/workload/add')}>
                    {t.addPvz}
                </button>
            </div>

            <div className={styles.tableSection}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.th}>{t.colName}</th>
                            <th className={styles.th}>{t.colAddress}</th>
                            <th className={styles.th}>{t.colLoad}</th>
                            <th className={styles.th}>{t.colStatus}</th>
                            <th className={styles.th}>{t.colHours}</th>
                            <th className={styles.th}>{t.colTraffic}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(pvz => (
                            <tr key={pvz.id} className={styles.tr}>
                                <td className={styles.td}>{pvz.name}</td>
                                <td className={styles.td}>{pvz.address}</td>
                                <td className={styles.td}>{pvz.load_percent}%</td>
                                <td className={styles.td}>
                                    <span className={
                                        pvz.status === 'closed' ? styles.statusInactive
                                        : pvz.status === 'overloaded' ? styles.statusOverloaded
                                        : styles.statusActive
                                    }>
                                        {STATUS_LABEL[pvz.status] ?? pvz.status}
                                    </span>
                                </td>
                                <td className={styles.td}>{pvz.status === 'closed' ? '—' : pvz.hours}</td>
                                <td className={styles.td}>{pvz.traffic}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
