import { useNavigate } from 'react-router-dom'
import { SettingsIcon, NotificationIcon } from '@/shared/Icons'
import styles from './WorkloadPage.module.scss'

const mockPvzData = [
    { id: 1, name: 'ПВЗ Центральный', address: 'ул. Ленина, 1', load: 87, status: 'Активен', hours: '09:00 - 21:00', traffic: 'Высокий' },
    { id: 2, name: 'ПВЗ Северный', address: 'пр. Мира, 45', load: 62, status: 'Активен', hours: '10:00 - 20:00', traffic: 'Средний' },
    { id: 3, name: 'ПВЗ Южный', address: 'ул. Садовая, 12', load: 41, status: 'Активен', hours: '09:00 - 18:00', traffic: 'Низкий' },
    { id: 4, name: 'ПВЗ Восточный', address: 'ул. Победы, 78', load: 95, status: 'Активен', hours: '08:00 - 22:00', traffic: 'Высокий' },
    { id: 5, name: 'ПВЗ Западный', address: 'ул. Труда, 33', load: 0, status: 'Неактивен', hours: '-', traffic: '-' },
]

export const WorkloadPage = () => {
    const navigate = useNavigate()
    return (
    <div className={styles.page}>
        <div className={styles.header}>
            <h1 className={styles.headerTitle}>Загруженность ПВЗ</h1>
            <div className={styles.headerActions}>
                <button className={styles.btnEmployees} onClick={() => navigate('/workload/employees')}>Список сотрудников</button>
                <button className={styles.btnIcon}><SettingsIcon /></button>
                <button className={styles.btnIcon}><NotificationIcon /></button>
                <div className={styles.avatarEmpty} />
            </div>
        </div>

        <div className={styles.statsSection}>
            <div className={`${styles.statBlock} ${styles.statBlock1}`}>
                <span className={styles.statLabel}>Всего товаров:</span>
                <span className={styles.statValue}>15736</span>
            </div>
            <div className={`${styles.statBlock} ${styles.statBlock2}`}>
                <span className={styles.statLabel}>Приемка</span>
                <span className={styles.statValue}>4128</span>
            </div>
            <div className={`${styles.statBlock} ${styles.statBlock3}`}>
                <span className={styles.statLabel}>Выдача</span>
                <span className={styles.statValue}>11240</span>
            </div>
            <div className={`${styles.statBlock} ${styles.statBlock4}`}>
                <span className={styles.statLabel}>Возврат</span>
                <span className={styles.statValue}>999</span>
            </div>
        </div>

        <div className={styles.searchSection}>
            <input type="text" placeholder="Поиск..." className={styles.searchInput} />
            <span className={styles.pointsText}>156 пунктов</span>
            <button className={styles.btnAddPvz} onClick={() => navigate('/workload/add')}>Добавить ПВЗ</button>
        </div>

        <div className={styles.tableSection}>
            <table className={styles.table}>
                <thead className={styles.tableHead}>
                    <tr>
                        <th className={styles.th}>Название</th>
                        <th className={styles.th}>Адрес</th>
                        <th className={styles.th}>Загрузка, %</th>
                        <th className={styles.th}>Статус</th>
                        <th className={styles.th}>Часы работы</th>
                        <th className={styles.th}>Трафик</th>
                    </tr>
                </thead>
                <tbody>
                    {mockPvzData.map(pvz => (
                        <tr key={pvz.id} className={styles.tr}>
                            <td className={styles.td}>{pvz.name}</td>
                            <td className={styles.td}>{pvz.address}</td>
                            <td className={styles.td}>{pvz.load}%</td>
                            <td className={styles.td}>
                                <span className={pvz.status === 'Активен' ? styles.statusActive : styles.statusInactive}>
                                    {pvz.status}
                                </span>
                            </td>
                            <td className={styles.td}>{pvz.hours}</td>
                            <td className={styles.td}>{pvz.traffic}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
    )
}
