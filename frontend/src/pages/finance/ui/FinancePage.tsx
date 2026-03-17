import { useEffect, useState } from 'react'
import { useLang } from '@/shared/i18n'
import styles from './FinancePage.module.scss'

interface MonthlyFinance {
    month: string
    revenue: number
    expenses: number
}

interface FinancialStats {
    total_revenue: number
    total_expenses: number
    net_profit: number
    avg_check: number
    transactions: number
    monthly: MonthlyFinance[]
}

export const FinancePage = () => {
    const { t } = useLang()
    const [finance, setFinance] = useState<FinancialStats | null>(null)

    useEffect(() => {
        fetch('/api/v1/finance', { credentials: 'include' })
            .then(r => r.json())
            .then(setFinance)
            .catch(console.error)
    }, [])

    const fmt    = (n: number) => n.toLocaleString(t.locale)
    const fmtRub = (n: number) => `${fmt(n)} ₽`

    if (!finance) {
        return (
            <div className={styles.page}>
                <p className={styles.loading}>{t.loading}</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statDark}`}>
                    <span className={styles.statLabel}>{t.revenue}</span>
                    <span className={styles.statValue}>{fmtRub(finance.total_revenue)}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statRed}`}>
                    <span className={styles.statLabel}>{t.expenses}</span>
                    <span className={styles.statValue}>{fmtRub(finance.total_expenses)}</span>
                </div>
                <div className={`${styles.statBlock} ${finance.net_profit >= 0 ? styles.statGreen : styles.statRedDark}`}>
                    <span className={styles.statLabel}>{t.netProfit}</span>
                    <span className={styles.statValue}>{fmtRub(finance.net_profit)}</span>
                </div>
            </div>

            <div className={styles.statsSection2}>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.transactions}</span>
                    <span className={styles.statValue2}>{fmt(finance.transactions)}</span>
                    <span className={styles.statSub}>{t.forPeriod}</span>
                </div>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.avgCheck}</span>
                    <span className={styles.statValue2}>{fmtRub(finance.avg_check)}</span>
                    <span className={styles.statSub}>{t.perOperation}</span>
                </div>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.margin}</span>
                    <span className={styles.statValue2}>
                        {finance.total_revenue > 0
                            ? `${Math.round((finance.net_profit / finance.total_revenue) * 100)}%`
                            : '—'}
                    </span>
                    <span className={styles.statSub}>{t.ofRevenue}</span>
                </div>
            </div>

            <div className={styles.tableSection}>
                <h2 className={styles.sectionTitle}>{t.monthlyDynamics}</h2>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.th}>{t.month}</th>
                            <th className={styles.th}>{t.revenue}</th>
                            <th className={styles.th}>{t.expenses}</th>
                            <th className={styles.th}>{t.profit}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finance.monthly.map((m) => {
                            const p = m.revenue - m.expenses
                            return (
                                <tr key={m.month} className={styles.tr}>
                                    <td className={styles.td}>{m.month}</td>
                                    <td className={styles.td}>{fmtRub(m.revenue)}</td>
                                    <td className={styles.td}>{fmtRub(m.expenses)}</td>
                                    <td className={styles.td}>
                                        <span className={p >= 0 ? styles.profitPos : styles.profitNeg}>
                                            {p >= 0 ? '+' : ''}{fmtRub(p)}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
