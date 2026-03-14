import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AddPvzPage.module.scss'

const DAYS = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье',
]

type DaySchedule = {
    isOff: boolean
    startTime: string
    endTime: string
}

const defaultSchedule = (): DaySchedule[] =>
    DAYS.map(() => ({ isOff: false, startTime: '9:00', endTime: '21:00' }))

export const AddPvzPage = () => {
    const navigate = useNavigate()
    const [address, setAddress] = useState('')
    const [capacity, setCapacity] = useState('')
    const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule())

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

    const handleSave = () => {
        // TODO: submit to API
        navigate('/workload')
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Добавить новый ПВЗ...</h1>

            <section className={styles.section}>
                <p className={styles.sectionTitle}>Основные параметры</p>

                <div className={styles.fieldsRow}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Адрес ПВЗ</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Введите адрес"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Пропускная способность (оп/час)</label>
                        <input
                            className={styles.input}
                            type="number"
                            placeholder="Например, 120"
                            value={capacity}
                            onChange={e => setCapacity(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <section className={styles.section}>
                <p className={styles.sectionTitle}>График работы</p>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead className={styles.tableHead}>
                            <tr>
                                <th className={styles.th}>День</th>
                                <th className={styles.th}>Статус</th>
                                <th className={styles.th}>Время работы</th>
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
                                                {schedule[i].isOff ? 'Выходной' : 'Рабочий'}
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
                    Отмена
                </button>
                <button className={styles.btnSave} onClick={handleSave}>
                    Сохранить изменения
                </button>
            </div>
        </div>
    )
}
