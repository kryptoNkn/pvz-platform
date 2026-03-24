import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/shared/i18n'
import styles from './WorkloadPage.module.scss'

type DaySchedule = {
    isOff: boolean
    startTime: string
    endTime: string
}

const defaultSchedule = (): DaySchedule[] =>
    Array(7).fill(null).map(() => ({ isOff: false, startTime: '09:00', endTime: '21:00' }))

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

interface Operation {
    id: string
    pvz_id: string
    pvz_name: string
    op_type: 'in' | 'out' | 'return'
    quantity: number
    note: string | null
    created_at: string
}

type EditForm = {
    address: string
    max_capacity: string
    location_type: string
    status: string
    hours: string
}

const OP_TYPE_LABEL: Record<string, string> = {
    in: 'Приёмка',
    out: 'Выдача',
    return: 'Возврат',
}

export const WorkloadPage = () => {
    const navigate = useNavigate()
    const { t } = useLang()

    // PVZ state
    const [pvzList, setPvzList] = useState<Pvz[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [search, setSearch] = useState('')
    const [editPvz, setEditPvz] = useState<Pvz | null>(null)
    const [editForm, setEditForm] = useState<EditForm>({
        address: '', max_capacity: '', location_type: 'street', status: 'active', hours: '',
    })
    const [confirmDeletePvz, setConfirmDeletePvz] = useState<Pvz | null>(null)
    const [editSchedule, setEditSchedule] = useState<DaySchedule[]>(defaultSchedule())

    // Operations state
    const [ops, setOps] = useState<Operation[]>([])
    const [filterOpPvz, setFilterOpPvz] = useState('')
    const [filterOpType, setFilterOpType] = useState('')
    const [filterFrom, setFilterFrom] = useState('')
    const [filterTo, setFilterTo] = useState('')
    const [showAddOp, setShowAddOp] = useState(false)
    const [opForm, setOpForm] = useState({ pvz_id: '', op_type: 'in', quantity: '1', note: '' })
    const [confirmDeleteOp, setConfirmDeleteOp] = useState<Operation | null>(null)
    const [savingOp, setSavingOp] = useState(false)
    const [opError, setOpError] = useState('')

    const loadList = () =>
        fetch('/api/v1/pvz', { credentials: 'include' })
            .then(r => r.json())
            .then(setPvzList)
            .catch(console.error)

    const loadStats = () =>
        fetch('/api/v1/stats', { credentials: 'include' })
            .then(r => r.json())
            .then(setStats)
            .catch(console.error)

    const loadOps = () => {
        const params = new URLSearchParams()
        if (filterOpPvz) params.set('pvz_id', filterOpPvz)
        if (filterOpType) params.set('op_type', filterOpType)
        if (filterFrom) params.set('date_from', new Date(filterFrom).toISOString())
        if (filterTo) params.set('date_to', new Date(filterTo + 'T23:59:59').toISOString())
        fetch(`/api/v1/operations?${params}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setOps(data) })
            .catch(console.error)
    }

    useEffect(() => {
        loadList()
        loadStats()
    }, [])

    useEffect(() => {
        loadOps()
    }, [filterOpPvz, filterOpType, filterFrom, filterTo])

    const handleExportCsv = () => {
        const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`
        const rows = [
            ['id', 'pvz_id', 'pvz_name', 'op_type', 'quantity', 'note', 'created_at'].join(','),
            ...ops.map(o => [
                o.id,
                o.pvz_id,
                escape(o.pvz_name),
                escape(o.op_type),
                o.quantity,
                escape(o.note),
                o.created_at,
            ].join(','))
        ].join('\n')
        const blob = new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'operations.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const openEdit = (pvz: Pvz) => {
        setEditPvz(pvz)
        setEditForm({
            address: pvz.address,
            max_capacity: String(pvz.max_capacity),
            location_type: pvz.location_type,
            status: pvz.status,
            hours: pvz.hours,
        })
        setEditSchedule(defaultSchedule())
        fetch(`/api/v1/pvz/${pvz.id}/schedule`, { credentials: 'include' })
            .then(r => r.json())
            .then((days: Array<{ day_index: number; is_day_off: boolean; start_time: string; end_time: string }>) => {
                if (!Array.isArray(days) || days.length === 0) return
                setEditSchedule(prev =>
                    prev.map((d, i) => {
                        const found = days.find(x => x.day_index === i)
                        return found
                            ? { isOff: found.is_day_off, startTime: found.start_time, endTime: found.end_time }
                            : d
                    })
                )
            })
            .catch(console.error)
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
        await fetch(`/api/v1/pvz/${editPvz.id}/schedule`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                editSchedule.map((day, i) => ({
                    day_index: i,
                    is_day_off: day.isOff,
                    start_time: day.isOff ? '00:00' : day.startTime,
                    end_time:   day.isOff ? '00:00' : day.endTime,
                }))
            ),
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

    const openAddOp = () => {
        setOpForm({ pvz_id: pvzList[0]?.id ?? '', op_type: 'in', quantity: '1', note: '' })
        setOpError('')
        setShowAddOp(true)
    }

    const saveOperation = async () => {
        if (!opForm.pvz_id) {
            setOpError('Выберите ПВЗ')
            return
        }
        setSavingOp(true)
        setOpError('')
        try {
            const res = await fetch('/api/v1/operations', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pvz_id: opForm.pvz_id,
                    op_type: opForm.op_type,
                    quantity: Math.max(1, Number(opForm.quantity) || 1),
                    note: opForm.note || null,
                }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                setOpError(body?.error ?? `Ошибка сервера (${res.status})`)
                setSavingOp(false)
                return
            }
        } catch {
            setOpError('Ошибка сети')
            setSavingOp(false)
            return
        }
        setSavingOp(false)
        setShowAddOp(false)
        loadOps()
        loadStats()
        loadList()
    }

    const deleteOp = async () => {
        if (!confirmDeleteOp) return
        const res = await fetch(`/api/v1/operations/${confirmDeleteOp.id}`, { method: 'DELETE', credentials: 'include' })
        if (!res.ok) { console.error('Failed to delete operation:', res.status); return }
        setConfirmDeleteOp(null)
        loadOps()
        loadStats()
        loadList()
    }

    const fmtDate = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
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
            {/* Stats cards */}
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

            {/* PVZ search + actions */}
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

            {/* PVZ table */}
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

            {/* ── Operations section ── */}
            <div className={styles.opsHeader}>
                <span className={styles.opsTitle}>{t.operationsTitle}</span>
                <div className={styles.opsFilters}>
                    <select
                        className={styles.opsFilterSelect}
                        value={filterOpPvz}
                        onChange={e => setFilterOpPvz(e.target.value)}
                    >
                        <option value="">{t.filterAllPvz}</option>
                        {pvzList.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <select
                        className={styles.opsFilterSelect}
                        value={filterOpType}
                        onChange={e => setFilterOpType(e.target.value)}
                    >
                        <option value="">{t.filterAllTypes}</option>
                        <option value="in">{t.opTypeIn}</option>
                        <option value="out">{t.opTypeOut}</option>
                        <option value="return">{t.opTypeReturn}</option>
                    </select>
                    <input
                        type="date"
                        className={styles.opsFilterDate}
                        value={filterFrom}
                        onChange={e => setFilterFrom(e.target.value)}
                    />
                    <input
                        type="date"
                        className={styles.opsFilterDate}
                        value={filterTo}
                        onChange={e => setFilterTo(e.target.value)}
                    />
                </div>
                <button className={styles.btnSecondary} onClick={handleExportCsv}>
                    {t.exportCsv}
                </button>
                <button className={styles.btnPrimary} onClick={openAddOp}>
                    {t.addOperation}
                </button>
            </div>

            <div className={styles.tableSection}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.th}>{t.colType}</th>
                            <th className={styles.th}>{t.colPvz}</th>
                            <th className={styles.th}>{t.colQuantity}</th>
                            <th className={styles.th}>{t.colNote}</th>
                            <th className={styles.th}>{t.colDate}</th>
                            <th className={`${styles.th} ${styles.thActions}`}>{t.colActions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ops.length === 0 && (
                            <tr>
                                <td colSpan={6} className={styles.opsEmpty}>{t.noOperations}</td>
                            </tr>
                        )}
                        {ops.map(op => (
                            <tr key={op.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <span className={`${styles.opsBadge} ${styles['opsType_' + op.op_type]}`}>
                                        {OP_TYPE_LABEL[op.op_type]}
                                    </span>
                                </td>
                                <td className={styles.td}>{op.pvz_name}</td>
                                <td className={styles.td}>{op.quantity}</td>
                                <td className={styles.td}>{op.note ?? '—'}</td>
                                <td className={styles.td}>{fmtDate(op.created_at)}</td>
                                <td className={`${styles.td} ${styles.tdActions}`}>
                                    <button
                                        className={styles.btnDelete}
                                        title={t.delete}
                                        onClick={() => setConfirmDeleteOp(op)}
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Modals ── */}

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

            {confirmDeleteOp && (
                <div className={styles.modalOverlay} onClick={() => setConfirmDeleteOp(null)}>
                    <div className={styles.confirmDialog} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>⚠</div>
                        <h3 className={styles.confirmTitle}>{t.deleteOperationTitle}</h3>
                        <p className={styles.confirmBody}>
                            <strong>{OP_TYPE_LABEL[confirmDeleteOp.op_type]}</strong> × {confirmDeleteOp.quantity} — {confirmDeleteOp.pvz_name}
                        </p>
                        <div className={styles.confirmActions}>
                            <button className={styles.btnModalCancel} onClick={() => setConfirmDeleteOp(null)}>
                                {t.cancel}
                            </button>
                            <button className={styles.btnConfirmDelete} onClick={deleteOp}>
                                {t.delete}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAddOp && (
                <div className={styles.modalOverlay} onClick={() => setShowAddOp(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>{t.addOperationTitle}</h2>
                        <div className={styles.modalFields}>
                            <div className={styles.modalField}>
                                <label className={styles.modalLabel}>{t.colPvz}</label>
                                <select
                                    className={styles.modalSelect}
                                    value={opForm.pvz_id}
                                    onChange={e => setOpForm(f => ({ ...f, pvz_id: e.target.value }))}
                                >
                                    {pvzList.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.modalRow}>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel}>{t.colType}</label>
                                    <select
                                        className={styles.modalSelect}
                                        value={opForm.op_type}
                                        onChange={e => setOpForm(f => ({ ...f, op_type: e.target.value }))}
                                    >
                                        <option value="in">{t.opTypeIn}</option>
                                        <option value="out">{t.opTypeOut}</option>
                                        <option value="return">{t.opTypeReturn}</option>
                                    </select>
                                </div>
                                <div className={styles.modalField}>
                                    <label className={styles.modalLabel}>{t.quantityLabel}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={styles.modalInput}
                                        value={opForm.quantity}
                                        onChange={e => setOpForm(f => ({ ...f, quantity: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalField}>
                                <label className={styles.modalLabel}>{t.noteLabel}</label>
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={opForm.note}
                                    placeholder={t.noteLabel}
                                    onChange={e => setOpForm(f => ({ ...f, note: e.target.value }))}
                                />
                            </div>
                        </div>
                        {opError && <p className={styles.opError}>{opError}</p>}
                        <div className={styles.modalActions}>
                            <button className={styles.btnModalCancel} onClick={() => setShowAddOp(false)}>
                                {t.cancel}
                            </button>
                            <button className={styles.btnModalSave} onClick={saveOperation} disabled={savingOp}>
                                {savingOp ? t.saving : t.save}
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

                        <div className={styles.modalField} style={{ marginTop: '16px' }}>
                            <label className={styles.modalLabel}>{t.workSchedule}</label>
                            <table className={styles.table} style={{ marginTop: '8px' }}>
                                <thead className={styles.tableHead}>
                                    <tr>
                                        <th className={styles.th}>{t.colDay}</th>
                                        <th className={styles.th}>{t.colStatus}</th>
                                        <th className={styles.th}>{t.colWorkHours}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday].map((day, i) => (
                                        <tr key={i} className={styles.tr}>
                                            <td className={styles.td}>{day}</td>
                                            <td className={styles.td}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editSchedule[i].isOff}
                                                        onChange={() => setEditSchedule(prev =>
                                                            prev.map((d, idx) => idx === i ? { ...d, isOff: !d.isOff } : d)
                                                        )}
                                                    />
                                                    {editSchedule[i].isOff ? t.dayOff : t.workDay}
                                                </label>
                                            </td>
                                            <td className={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <input
                                                        className={styles.modalInput}
                                                        style={{ width: '60px', textAlign: 'center' }}
                                                        type="text"
                                                        disabled={editSchedule[i].isOff}
                                                        value={editSchedule[i].isOff ? '' : editSchedule[i].startTime}
                                                        placeholder="09:00"
                                                        onChange={e => setEditSchedule(prev =>
                                                            prev.map((d, idx) => idx === i ? { ...d, startTime: e.target.value } : d)
                                                        )}
                                                    />
                                                    <span>—</span>
                                                    <input
                                                        className={styles.modalInput}
                                                        style={{ width: '60px', textAlign: 'center' }}
                                                        type="text"
                                                        disabled={editSchedule[i].isOff}
                                                        value={editSchedule[i].isOff ? '' : editSchedule[i].endTime}
                                                        placeholder="21:00"
                                                        onChange={e => setEditSchedule(prev =>
                                                            prev.map((d, idx) => idx === i ? { ...d, endTime: e.target.value } : d)
                                                        )}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
