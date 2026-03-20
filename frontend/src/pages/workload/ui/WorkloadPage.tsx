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
    max_capacity: number
    location_type: string
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

type EditForm = {
    address: string
    max_capacity: string
    location_type: string
    status: string
    hours: string
}

export const WorkloadPage = () => {
    const navigate = useNavigate()
    const { t } = useLang()
    const [pvzList, setPvzList] = useState<Pvz[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [search, setSearch] = useState('')
    const [editPvz, setEditPvz] = useState<Pvz | null>(null)
    const [editForm, setEditForm] = useState<EditForm>({
        address: '', max_capacity: '', location_type: 'street', status: 'active', hours: '',
    })
    const [confirmDeletePvz, setConfirmDeletePvz] = useState<Pvz | null>(null)

    const loadList = () =>
        fetch('/api/v1/pvz', { credentials: 'include' })
            .then(r => r.json())
            .then(setPvzList)
            .catch(console.error)

    useEffect(() => {
        loadList()
        fetch('/api/v1/stats', { credentials: 'include' })
            .then(r => r.json())
            .then(setStats)
            .catch(console.error)
    }, [])

    const openEdit = (pvz: Pvz) => {
        setEditPvz(pvz)
        setEditForm({
            address: pvz.address,
            max_capacity: String(pvz.max_capacity),
            location_type: pvz.location_type,
            status: pvz.status,
            hours: pvz.hours,
        })
    }

    const saveEdit = async () => {
        if (!editPvz) return
        await fetch(`/api/v1/pvz/${editPvz.id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: editForm.address,
                max_capacity: Number(editForm.max_capacity) || 1,
                location_type: editForm.location_type,
                status: editForm.status,
                hours: editForm.hours,
            }),
        })
        setEditPvz(null)
        loadList()
    }

    const confirmAndDelete = async () => {
        if (!confirmDeletePvz) return
        await fetch(`/api/v1/pvz/${confirmDeletePvz.id}`, { method: 'DELETE', credentials: 'include' })
        setPvzList(prev => prev.filter(p => p.id !== confirmDeletePvz.id))
        setConfirmDeletePvz(null)
        setEditPvz(null)
    }

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
                            <th className={`${styles.th} ${styles.thActions}`}>{t.colActions}</th>
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
                                <td className={`${styles.td} ${styles.tdActions}`}>
                                    <button
                                        className={styles.btnEdit}
                                        title={t.edit}
                                        onClick={() => openEdit(pvz)}
                                    >
                                        ✏
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {confirmDeletePvz && (
                <div className={styles.modalOverlay} onClick={() => setConfirmDeletePvz(null)}>
                    <div className={styles.confirmDialog} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>⚠</div>
                        <h3 className={styles.confirmTitle}>Удалить ПВЗ?</h3>
                        <p className={styles.confirmBody}>
                            <strong>«{confirmDeletePvz.name}»</strong> будет удалён безвозвратно.
                        </p>
                        <div className={styles.confirmActions}>
                            <button className={styles.btnModalCancel} onClick={() => setConfirmDeletePvz(null)}>
                                {t.cancel}
                            </button>
                            <button className={styles.btnConfirmDelete} onClick={confirmAndDelete}>
                                {t.delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editPvz && (
                <div className={styles.modalOverlay} onClick={() => setEditPvz(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>{t.editPvzTitle} — {editPvz.name}</h2>

                        <div className={styles.modalFields}>
                            <div className={styles.modalField}>
                                <label className={styles.modalLabel}>{t.pvzAddress}</label>
                                <input
                                    className={styles.modalInput}
                                    value={editForm.address}
                                    onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                                />
                            </div>
                            <div className={styles.modalRow}>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel}>{t.throughput}</label>
                                    <input
                                        className={styles.modalInput}
                                        type="number"
                                        min={1}
                                        value={editForm.max_capacity}
                                        onChange={e => setEditForm(f => ({ ...f, max_capacity: e.target.value }))}
                                    />
                                </div>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel}>{t.locationType}</label>
                                    <select
                                        className={styles.modalSelect}
                                        value={editForm.location_type}
                                        onChange={e => setEditForm(f => ({ ...f, location_type: e.target.value }))}
                                    >
                                        <option value="mall">{t.locationMall}</option>
                                        <option value="street">{t.locationStreet}</option>
                                        <option value="residential">{t.locationResidential}</option>
                                        <option value="office">{t.locationOffice}</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalRow}>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel}>{t.pvzStatusLabel}</label>
                                    <select
                                        className={styles.modalSelect}
                                        value={editForm.status}
                                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                                    >
                                        <option value="active">{t.statusActive}</option>
                                        <option value="overloaded">{t.statusOverloaded}</option>
                                        <option value="closed">{t.statusInactive}</option>
                                    </select>
                                </div>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel}>{t.pvzHoursLabel}</label>
                                    <input
                                        className={styles.modalInput}
                                        placeholder="09:00 - 21:00"
                                        value={editForm.hours}
                                        onChange={e => setEditForm(f => ({ ...f, hours: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.btnModalDelete}
                                onClick={() => { setConfirmDeletePvz(editPvz); setEditPvz(null) }}
                            >
                                {t.delete}
                            </button>
                            <div className={styles.modalActionsRight}>
                                <button className={styles.btnModalCancel} onClick={() => setEditPvz(null)}>
                                    {t.cancel}
                                </button>
                                <button className={styles.btnModalSave} onClick={saveEdit}>
                                    {t.saveChanges}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
