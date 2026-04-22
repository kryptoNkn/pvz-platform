import { useEffect, useState } from 'react'
import { TrendingUp, Clock, Package, ArrowDownToLine, RefreshCcw, Upload } from 'lucide-react'
import { exportCsv } from '@/shared/exportCsv'
import styles from './MarketplacePage.module.scss'

interface MarketplaceItem {
    marketplace: string
    items_count: number
    commission_percent: number
    avg_price: number
    avg_storage_days: number
    pending_today: number
}

interface OrderItem {
    name: string
    article: string
    quantity: number
    price: number
}

interface MarketplaceOrder {
    id: string
    marketplace: string
    external_id: string
    status: string
    created_at: string
    items: OrderItem[]
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

const fmt = (n: number) => n.toLocaleString('ru-RU')
const fmtRub = (n: number) => fmt(n) + ' ₽'

export const MarketplacePage = () => {
    const [items, setItems] = useState<MarketplaceItem[]>([])
    const [orders, setOrders] = useState<MarketplaceOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [actionsLoading, setActionsLoading] = useState(false)
    const [actionMsg, setActionMsg] = useState('')
    const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null)

    useEffect(() => {
        fetch('/api/v1/marketplace-items', { credentials: 'include' })
            .then(r => r.ok ? r.json() : [])
            .then((data: MarketplaceItem[]) => { setItems(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const loadOrders = () => {
        fetch('/api/marketplace/orders', { credentials: 'include' })
            .then(r => r.ok ? r.json() : [])
            .then((data: MarketplaceOrder[]) => setOrders(data))
            .catch(() => setOrders([]))
    }

    useEffect(() => {
        loadOrders()
    }, [])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedOrder(null)
            }
        }

        if (selectedOrder) {
            window.addEventListener('keydown', onKeyDown)
        }

        return () => window.removeEventListener('keydown', onKeyDown)
    }, [selectedOrder])

    const runAction = async (url: string, label: string) => {
        setActionsLoading(true)
        setActionMsg('')
        try {
            const res = await fetch(url, { method: 'POST', credentials: 'include' })
            if (!res.ok) throw new Error('failed')
            setActionMsg(`${label}: OK`)
            loadOrders()
        } catch {
            setActionMsg(`${label}: ошибка`)
        } finally {
            setActionsLoading(false)
        }
    }

    const totalItems    = items.reduce((s, i) => s + i.items_count, 0)
    const totalPending  = items.reduce((s, i) => s + i.pending_today, 0)
    const totalEarnings = items.reduce((s, i) =>
        s + Math.round(i.items_count * i.avg_price * i.commission_percent / 100), 0)
    const avgStorage    = items.length
        ? Math.round(items.reduce((s, i) => s + i.avg_storage_days, 0) / items.length)
        : 0

    const handleExportCsv = () => {
        exportCsv('marketplace_items.csv',
            ['Маркетплейс', 'Товаров на хранении', 'Комиссия ПВЗ (%)', 'Ср. цена товара (руб)', 'Хранение (дн.)', 'Выдач сегодня', 'Доход оценка (руб)', 'Доля (%)'],
            items.map(item => {
                const earnings = Math.round(item.items_count * item.avg_price * item.commission_percent / 100)
                const share = totalItems > 0 ? Math.round((item.items_count / totalItems) * 100) : 0
                return [item.marketplace, item.items_count, item.commission_percent, item.avg_price, item.avg_storage_days, item.pending_today, earnings, share]
            })
        )
    }

    if (loading) return <div className={styles.page}><p className={styles.loading}>Загрузка...</p></div>

    return (
        <div className={styles.page}>

            {/* ── Заголовок ── */}
            <div className={styles.header}>
                <h2 className={styles.heading}>Товары на ПВЗ</h2>
                <p className={styles.sub}>Распределение по маркетплейсам, комиссии и прогноз выдач</p>
            </div>

            {/* ── Действия API ── */}
            <div className={styles.actionsRow}>
                <button
                    className={styles.actionBtn}
                    disabled={actionsLoading}
                    onClick={() => runAction('/api/marketplace/sync-orders', 'Синк заказов')}
                >
                    <RefreshCcw size={16} /> Синк заказов
                </button>
                <button
                    className={styles.actionBtn}
                    disabled={actionsLoading}
                    onClick={() => runAction('/api/marketplace/wb/sync-cards', 'WB: карточки')}
                >
                    <RefreshCcw size={16} /> WB карточки
                </button>
                <button
                    className={styles.actionBtn}
                    disabled={actionsLoading}
                    onClick={() => runAction('/api/marketplace/wb/push-prices', 'WB: цены')}
                >
                    <Upload size={16} /> WB цены
                </button>
                <button
                    className={styles.actionBtn}
                    disabled={actionsLoading}
                    onClick={() => runAction('/api/marketplace/wb/push-stocks', 'WB: остатки')}
                >
                    <Upload size={16} /> WB остатки
                </button>
                {actionMsg && <span className={styles.actionMsg}>{actionMsg}</span>}
            </div>

            {/* ── Суммарные KPI ── */}
            <div className={styles.kpiRow}>
                <div className={styles.kpi}>
                    <span className={styles.kpiIcon} style={{ background: 'rgba(64,201,126,0.12)', color: '#40c97e' }}>
                        <Package size={20} />
                    </span>
                    <div>
                        <div className={styles.kpiValue}>{fmt(totalItems)}</div>
                        <div className={styles.kpiLabel}>Товаров на хранении</div>
                    </div>
                </div>
                <div className={styles.kpi}>
                    <span className={styles.kpiIcon} style={{ background: 'rgba(0,91,255,0.1)', color: '#005BFF' }}>
                        <ArrowDownToLine size={20} />
                    </span>
                    <div>
                        <div className={styles.kpiValue}>{fmt(totalPending)}</div>
                        <div className={styles.kpiLabel}>Выдач сегодня</div>
                    </div>
                </div>
                <div className={styles.kpi}>
                    <span className={styles.kpiIcon} style={{ background: 'rgba(255,180,0,0.12)', color: '#e6a800' }}>
                        <Clock size={20} />
                    </span>
                    <div>
                        <div className={styles.kpiValue}>{avgStorage} дн.</div>
                        <div className={styles.kpiLabel}>Среднее хранение</div>
                    </div>
                </div>
                <div className={styles.kpi}>
                    <span className={styles.kpiIcon} style={{ background: 'rgba(203,17,171,0.1)', color: '#CB11AB' }}>
                        <TrendingUp size={20} />
                    </span>
                    <div>
                        <div className={styles.kpiValue}>{fmtRub(totalEarnings)}</div>
                        <div className={styles.kpiLabel}>Ожидаемый доход</div>
                    </div>
                </div>
            </div>

            {/* ── Карточки маркетплейсов ── */}
            <div className={styles.cards}>
                {items.map(item => {
                    const earnings = Math.round(item.items_count * item.avg_price * item.commission_percent / 100)
                    const share = Math.round((item.items_count / totalItems) * 100)
                    return (
                        <div className={styles.card} key={item.marketplace}>
                            <div className={styles.cardTop}>
                                <span
                                    className={styles.badge}
                                    style={{
                                        background: MARKETPLACE_COLORS[item.marketplace] ?? '#888',
                                        color: MARKETPLACE_TEXT[item.marketplace] ?? '#fff',
                                    }}
                                >
                                    {item.marketplace}
                                </span>
                                <span className={styles.share}>{share}%</span>
                            </div>

                            <div className={styles.cardValue}>{fmt(item.items_count)}</div>
                            <div className={styles.cardLabel}>товаров</div>

                            <div
                                className={styles.shareBar}
                                style={{ background: `${MARKETPLACE_COLORS[item.marketplace]}22` }}
                            >
                                <div
                                    className={styles.shareBarFill}
                                    style={{
                                        width: `${share}%`,
                                        background: MARKETPLACE_COLORS[item.marketplace] ?? '#888',
                                    }}
                                />
                            </div>

                            <div className={styles.cardStats}>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardStatLabel}>Комиссия ПВЗ</span>
                                    <span className={styles.cardStatValue} style={{ color: '#40c97e' }}>
                                        {item.commission_percent}%
                                    </span>
                                </div>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardStatLabel}>Ср. цена товара</span>
                                    <span className={styles.cardStatValue}>{fmtRub(item.avg_price)}</span>
                                </div>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardStatLabel}>Хранение</span>
                                    <span className={styles.cardStatValue}>{item.avg_storage_days} дн.</span>
                                </div>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardStatLabel}>Выдач сегодня</span>
                                    <span className={styles.cardStatValue}>{fmt(item.pending_today)}</span>
                                </div>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardStatLabel}>Доход</span>
                                    <span className={styles.cardStatValue} style={{ color: '#CB11AB' }}>
                                        {fmtRub(earnings)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Таблица ── */}
            <div className={styles.tableWrap}>
                <div className={styles.tableHeader}>
                    <div className={styles.tableTitle}>Детальная таблица</div>
                    <button className={styles.exportBtn} onClick={handleExportCsv}>↓ CSV</button>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Маркетплейс</th>
                            <th>Товаров</th>
                            <th>Комиссия</th>
                            <th>Ср. цена</th>
                            <th>Хранение</th>
                            <th>Выдач сегодня</th>
                            <th>Доход (оценка)</th>
                            <th>Доля</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => {
                            const earnings = Math.round(item.items_count * item.avg_price * item.commission_percent / 100)
                            const share = Math.round((item.items_count / totalItems) * 100)
                            return (
                                <tr key={item.marketplace}>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            style={{
                                                background: MARKETPLACE_COLORS[item.marketplace] ?? '#888',
                                                color: MARKETPLACE_TEXT[item.marketplace] ?? '#fff',
                                            }}
                                        >
                                            {item.marketplace}
                                        </span>
                                    </td>
                                    <td className={styles.numCell}>{fmt(item.items_count)}</td>
                                    <td className={styles.commissionCell}>{item.commission_percent}%</td>
                                    <td className={styles.numCell}>{fmtRub(item.avg_price)}</td>
                                    <td className={styles.numCell}>{item.avg_storage_days} дн.</td>
                                    <td className={styles.numCell}>{fmt(item.pending_today)}</td>
                                    <td className={styles.earningsCell}>{fmtRub(earnings)}</td>
                                    <td>
                                        <div className={styles.barWrap}>
                                            <div
                                                className={styles.bar}
                                                style={{
                                                    width: `${share}%`,
                                                    background: MARKETPLACE_COLORS[item.marketplace] ?? '#888',
                                                }}
                                            />
                                            <span className={styles.barLabel}>{share}%</span>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className={styles.totalLabel}>Итого</td>
                            <td className={styles.numCell}>{fmt(totalItems)}</td>
                            <td>—</td>
                            <td>—</td>
                            <td>—</td>
                            <td className={styles.numCell}>{fmt(totalPending)}</td>
                            <td className={styles.earningsCell}>{fmtRub(totalEarnings)}</td>
                            <td>100%</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* ── Заказы ── */}
            <div className={styles.ordersWrap}>
                <div className={styles.tableHeader}>
                    <div className={styles.tableTitle}>Последние заказы</div>
                    <button className={styles.exportBtn} onClick={loadOrders}>Обновить</button>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Маркетплейс</th>
                            <th>ID</th>
                            <th>Статус</th>
                            <th>Создан</th>
                            <th>Позиции</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr
                                key={o.id}
                                className={styles.clickableRow}
                                tabIndex={0}
                                role="button"
                                onClick={() => setSelectedOrder(o)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        setSelectedOrder(o)
                                    }
                                }}
                            >
                                <td>
                                    <span
                                        className={styles.badge}
                                        style={{
                                            background: MARKETPLACE_COLORS[o.marketplace] ?? '#888',
                                            color: MARKETPLACE_TEXT[o.marketplace] ?? '#fff',
                                        }}
                                    >
                                        {o.marketplace}
                                    </span>
                                </td>
                                <td className={styles.numCell}>{o.external_id}</td>
                                <td>{o.status}</td>
                                <td>{new Date(o.created_at).toLocaleString('ru-RU')}</td>
                                <td>
                                    {o.items?.length
                                        ? o.items.map(it => `${it.name} ×${it.quantity}`).join(', ')
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalTop}>
                            <div>
                                <h3 className={styles.modalTitle}>Информация о заказе</h3>
                                <p className={styles.modalSubtitle}>{selectedOrder.external_id}</p>
                            </div>
                            <button className={styles.modalClose} onClick={() => setSelectedOrder(null)}>
                                Закрыть
                            </button>
                        </div>

                        <div className={styles.detailGrid}>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Маркетплейс</span>
                                <span className={styles.detailValue}>
                                    <span
                                        className={styles.badge}
                                        style={{
                                            background: MARKETPLACE_COLORS[selectedOrder.marketplace] ?? '#888',
                                            color: MARKETPLACE_TEXT[selectedOrder.marketplace] ?? '#fff',
                                        }}
                                    >
                                        {selectedOrder.marketplace}
                                    </span>
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Статус</span>
                                <span className={styles.detailValue}>{selectedOrder.status}</span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Создан</span>
                                <span className={styles.detailValue}>
                                    {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <span className={styles.detailLabel}>Адрес ПВЗ</span>
                                <span className={styles.detailValue}>не передан в текущих данных</span>
                            </div>
                        </div>

                        <div className={styles.itemsBlock}>
                            <h4 className={styles.itemsTitle}>Товары</h4>
                            <div className={styles.itemsList}>
                                {selectedOrder.items?.length ? (
                                    selectedOrder.items.map((item, index) => (
                                        <div className={styles.itemRow} key={`${item.article}-${index}`}>
                                            <div className={styles.itemMain}>
                                                <div className={styles.itemName}>{item.name}</div>
                                                <div className={styles.itemMeta}>Артикул: {item.article}</div>
                                            </div>
                                            <div className={styles.itemStats}>
                                                <span>Кол-во: {item.quantity}</span>
                                                <span>Цена: {fmtRub(item.price)}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>Позиции в заказе отсутствуют.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
