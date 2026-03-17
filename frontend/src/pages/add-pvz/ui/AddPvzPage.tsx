import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/shared/i18n'
import styles from './AddPvzPage.module.scss'

type DaySchedule = {
    isOff: boolean
    startTime: string
    endTime: string
}

const defaultSchedule = (): DaySchedule[] =>
    Array(7).fill(null).map(() => ({ isOff: false, startTime: '9:00', endTime: '21:00' }))

export const AddPvzPage = () => {
    const navigate = useNavigate()
    const { t } = useLang()
    const [address, setAddress] = useState('')
    const [capacity, setCapacity] = useState('')
    const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule())

    const DAYS = [
        t.monday, t.tuesday, t.wednesday, t.thursday,
        t.friday, t.saturday, t.sunday,
    ]

    const toggleOff = (i: number) => {
        setSchedule(prev =>
            prev.map((d, idx) => (idx === i ? { ...d, isOff: !d.isOff } : d))
        )
    }

    const updateTime = (i: number, field: 'startTime' | 'endTime', value: string) => {
        setSchedule(prev =>
            prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d))
        )
    }

    const handleSave = async () => {
        await fetch('/api/v1/pvz', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address,
                max_capacity: Number(capacity) || 100,
            }),
        })
        navigate('/workload')
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>{t.addPvzTitle}</h1>

            <section className={styles.section}>
                <p className={styles.sectionTitle}>{t.mainParams}</p>

                <div className={styles.fieldsRow}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t.pvzAddress}</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder={t.enterAddress}
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>{t.throughput}</label>
                        <input
                            className={styles.input}
                            type="number"
                            placeholder={t.throughputPlaceholder}
                            value={capacity}
                            onChange={e => setCapacity(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <p className={styles.sectionTitle}>{t.workSchedule}</p>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th className={styles.th}>{t.colDay}</th>
                                <th className={styles.th}>{t.colStatus}</th>
                                <th className={styles.th}>{t.colWorkHours}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map((day, i) => (
                                <tr key={day} className={styles.tr}>
                                    <td className={styles.td}>{day}</td>
                                    <td className={styles.td}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={schedule[i].isOff}
                                                onChange={() => toggleOff(i)}
                                            />
                                            <span className={schedule[i].isOff ? styles.offText : styles.workText}>
                                                {schedule[i].isOff ? t.dayOff : t.workDay}
                                            </span>
                                        </label>
                                    </td>
                                    <td className={styles.td}>
                                        <div className={styles.timeRow}>
                                            <input
                                                className={styles.timeInput}
                                                type="text"
                                                value={schedule[i].isOff ? '' : schedule[i].startTime}
                                                placeholder="9:00"
                                                disabled={schedule[i].isOff}
                                                onChange={e => updateTime(i, 'startTime', e.target.value)}
                                            />
                                            <span className={styles.timeSep}>—</span>
                                            <input
                                                className={styles.timeInput}
                                                type="text"
                                                value={schedule[i].isOff ? '' : schedule[i].endTime}
                                                placeholder="21:00"
                                                disabled={schedule[i].isOff}
                                                onChange={e => updateTime(i, 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className={styles.actions}>
                <button className={styles.btnCancel} onClick={() => navigate('/workload')}>
                    {t.cancel}
                </button>
                <button className={styles.btnSave} onClick={handleSave}>
                    {t.saveChanges}
                </button>
            </div>
        </div>
    )
}
