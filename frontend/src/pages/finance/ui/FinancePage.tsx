import { useEffect, useState } from 'react'
import { useLang } from '@/shared/i18n'
import styles from './FinancePage.module.scss'

interface MarketplaceBreakdown {
    marketplace: string
    items_delivered: number
    avg_commission: number
    revenue: number
}

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
    delivery_count: number
    acceptance_count: number
    returns_count: number
    monthly: MonthlyFinance[]
    breakdown: MarketplaceBreakdown[]
}

const MARKETPLACE_COLORS: Record<string, string> = {
    'Ozon':          '#005BFF',
    'WB':            '#CB11AB',
    'Яндекс Маркет': '#FFCC00',
    'Авито':         '#00AAFF',
}
const MARKETPLACE_TEXT: Record<string, string> = {
    'Яндекс Маркет': '#1a1a1a',
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

    const totalBreakdownRevenue = finance.breakdown.reduce((s, b) => s + b.revenue, 0)

    return (
        <div className={styles.page}>

            {/* ── Главные показатели ── */}
            <div className={styles.statsSection}>
                <div className={`${styles.statBlock} ${styles.statDark}`}>
                    <span className={styles.statLabel}>{t.revenue}</span>
                    <span className={styles.statValue}>{fmtRub(finance.total_revenue)}</span>
                    <span className={styles.statSub}>
                        {fmt(finance.delivery_count)} выд. × комиссия + {fmt(finance.acceptance_count)} приём.
                    </span>
                </div>
                <div className={`${styles.statBlock} ${styles.statRed}`}>
                    <span className={styles.statLabel}>{t.expenses}</span>
                    <span className={styles.statValue}>{fmtRub(finance.total_expenses)}</span>
                    <span className={styles.statSub}>65% выручки — аренда, зарплаты, коммунальные</span>
                </div>
                <div className={`${styles.statBlock} ${finance.net_profit >= 0 ? styles.statGreen : styles.statRedDark}`}>
                    <span className={styles.statLabel}>{t.netProfit}</span>
                    <span className={styles.statValue}>{fmtRub(finance.net_profit)}</span>
                    <span className={styles.statSub}>Выручка − Расходы</span>
                </div>
            </div>

            {/* ── Вторичные показатели ── */}
            <div className={styles.statsSection2}>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.transactions}</span>
                    <span className={styles.statValue2}>{fmt(finance.transactions)}</span>
                    <span className={styles.statSub}>
                        {fmt(finance.delivery_count)} выдач · {fmt(finance.acceptance_count)} приёмок · {fmt(finance.returns_count)} возвратов
                    </span>
                </div>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.avgCheck}</span>
                    <span className={styles.statValue2}>{fmtRub(finance.avg_check)}</span>
                    <span className={styles.statSub}>Выручка ÷ Кол-во операций</span>
                </div>
                <div className={`${styles.statBlock2} ${styles.statGreen}`}>
                    <span className={styles.statLabel}>{t.margin}</span>
                    <span className={styles.statValue2}>
                        {finance.total_revenue > 0
                            ? `${Math.round((finance.net_profit / finance.total_revenue) * 100)}%`
                            : '—'}
                    </span>
                    <span className={styles.statSub}>35% от выручки остаётся после расходов</span>
                </div>
            </div>

            {/* ── Структура выручки по маркетплейсам ── */}
            {finance.breakdown.length > 0 && (
                <div className={styles.tableSection}>
                    <h2 className={styles.sectionTitle}>Структура выручки по маркетплейсам</h2>
                    <p className={styles.sectionHint}>
                        Выручка от выдач = количество выданных товаров × комиссия ПВЗ за товар.
                        Данные по операциям — из раздела «Операции».
                    </p>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th className={styles.th}>Маркетплейс</th>
                                <th className={styles.th}>Выдано товаров</th>
                                <th className={styles.th}>Комиссия за товар</th>
                                <th className={styles.th}>Выручка от выдач</th>
                                <th className={styles.th}>Доля</th>
                            </tr>
                        </thead>
                        <tbody>
                            {finance.breakdown.map((b) => {
                                const share = totalBreakdownRevenue > 0
                                    ? Math.round((b.revenue / totalBreakdownRevenue) * 100)
                                    : 0
                                return (
                                    <tr key={b.marketplace} className={styles.tr}>
                                        <td className={styles.td}>
                                            <span
                                                className={styles.mpBadge}
                                                style={{
                                                    background: MARKETPLACE_COLORS[b.marketplace] ?? '#888',
                                                    color: MARKETPLACE_TEXT[b.marketplace] ?? '#fff',
                                                }}
                                            >
                                                {b.marketplace}
                                            </span>
                                        </td>
                                        <td className={styles.td}>{fmt(b.items_delivered)} шт.</td>
                                        <td className={styles.td}>
                                            <span className={styles.commissionNote}>
                                                {fmtRub(b.avg_commission)}/товар
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.profitPos}>{fmtRub(b.revenue)}</span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.shareBarWrap}>
                                                <div
                                                    className={styles.shareBar}
                                                    style={{
                                                        width: `${share}%`,
                                                        background: MARKETPLACE_COLORS[b.marketplace] ?? '#888',
                                                    }}
                                                />
                                                <span className={styles.shareLabel}>{share}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr className={styles.trTotal}>
                                <td className={styles.td}><strong>Итого от выдач</strong></td>
                                <td className={styles.td}>{fmt(finance.delivery_count)} шт.</td>
                                <td className={styles.td}>—</td>
                                <td className={styles.td}>
                                    <span className={styles.profitPos}><strong>{fmtRub(totalBreakdownRevenue)}</strong></span>
                                </td>
                                <td className={styles.td}>100%</td>
                            </tr>
                        </tfoot>
                    </table>
                    {finance.acceptance_count > 0 && (
                        <div className={styles.additionalRevenue}>
                            <span>+ Приёмка: {fmt(finance.acceptance_count)} товаров × 20 ₽ = </span>
                            <span className={styles.profitPos}>{fmtRub(finance.acceptance_count * 20)}</span>
                            {finance.returns_count > 0 && (
                                <>
                                    <span className={styles.separator}>·</span>
                                    <span>Возвраты: {fmt(finance.returns_count)} товаров × 10 ₽ = </span>
                                    <span className={styles.profitPos}>{fmtRub(finance.returns_count * 10)}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Динамика по месяцам ── */}
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
