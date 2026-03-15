import { useEffect, useState } from 'react'
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

const fmt = (n: number) => n.toLocaleString('ru-RU')
const fmtRub = (n: number) => `${fmt(n)} ₽`

export const FinancePage = () => {
    const [finance, setFinance] = useState<FinancialStats | null>(null)

    useEffect(() => {
        fetch('/api/v1/finance', { credentials: 'include' })
            .then(r => r.json())
            .then(setFinance)
            .catch(console.error)
    }, [])

    if (!finance) {
        return (
            <div className={styles.page}>
                <p className={styles.loading}>Загрузка...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statDark}`}>
                    <span className={styles.statLabel}>Выручка</span>
                    <span className={styles.statValue}>{fmtRub(finance.total_revenue)}</span>
                </div>
                <div className={`${styles.statBlock} ${styles.statRed}`}>
                    <span className={styles.statLabel}>Расходы</span>
                    <span className={styles.statValue}>{fmtRub(finance.total_expenses)}</span>
                </div>
                <div className={`${styles.statBlock} ${finance.net_profit >= 0 ? styles.statGreen : styles.statRedDark}`}>
                    <span className={styles.statLabel}>Чистая прибыль</span>
                    <span className={styles.statValue}>{fmtRub(finance.net_profit)}</span>
                </div>
            </div>

            <div className={styles.statsSection2}>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>Транзакции</span>
                    <span className={styles.statValue2}>{fmt(finance.transactions)}</span>
                    <span className={styles.statSub}>за текущий период</span>
                </div>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>Средний чек</span>
                    <span className={styles.statValue2}>{fmtRub(finance.avg_check)}</span>
                    <span className={styles.statSub}>на одну операцию</span>
                </div>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>Маржа</span>
                    <span className={styles.statValue2}>
                        {finance.total_revenue > 0
                            ? `${Math.round((finance.net_profit / finance.total_revenue) * 100)}%`
                            : '—'}
                    </span>
                    <span className={styles.statSub}>от выручки</span>
                </div>
            </div>

            <div className={styles.tableSection}>
                <h2 className={styles.sectionTitle}>Динамика по месяцам</h2>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.th}>Месяц</th>
                            <th className={styles.th}>Выручка</th>
                            <th className={styles.th}>Расходы</th>
                            <th className={styles.th}>Прибыль</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finance.monthly.map((m) => {
                            const profit = m.revenue - m.expenses
                            return (
                                <tr key={m.month} className={styles.tr}>
                                    <td className={styles.td}>{m.month}</td>
                                    <td className={styles.td}>{fmtRub(m.revenue)}</td>
                                    <td className={styles.td}>{fmtRub(m.expenses)}</td>
                                    <td className={styles.td}>
                                        <span className={profit >= 0 ? styles.profitPos : styles.profitNeg}>
                                            {profit >= 0 ? '+' : ''}{fmtRub(profit)}
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
