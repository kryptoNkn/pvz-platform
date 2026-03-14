import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './EmployeesPage.module.scss'

type Role = 'Оператор' | 'Администратор'

type Employee = {
    id: number
    firstName: string
    lastName: string
    email: string
    role: Role
}

const mockEmployees: Employee[] = [
    { id: 1, firstName: 'Алексей',   lastName: 'Смирнов',   email: 'a.smirnov@pvz.ru',   role: 'Оператор' },
    { id: 2, firstName: 'Мария',     lastName: 'Иванова',   email: 'm.ivanova@pvz.ru',   role: 'Оператор' },
    { id: 3, firstName: 'Дмитрий',   lastName: 'Козлов',    email: 'd.kozlov@pvz.ru',    role: 'Оператор' },
    { id: 4, firstName: 'Анна',      lastName: 'Петрова',   email: 'a.petrova@pvz.ru',   role: 'Оператор' },
    { id: 5, firstName: 'Сергей',    lastName: 'Новиков',   email: 's.novikov@pvz.ru',   role: 'Оператор' },
    { id: 6, firstName: 'Екатерина', lastName: 'Морозова',  email: 'e.morozova@pvz.ru',  role: 'Оператор' },
]

export const EmployeesPage = () => {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [employees, setEmployees] = useState<Employee[]>(mockEmployees)

    const filtered = employees.filter(e => {
        const full = `${e.firstName} ${e.lastName}`.toLowerCase()
        return full.includes(search.toLowerCase())
    })

    const updateRole = (id: number, role: Role) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, role } : e))
    }

    const handleSave = () => {
        // TODO: submit to API
        navigate('/workload')
    }

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Список сотрудников</h1>

            <div className={styles.toolbar}>
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Поиск сотрудника..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button className={styles.btnSave} onClick={handleSave}>
                    Сохранить изменения
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={styles.th}>Сотрудник</th>
                            <th className={styles.th}>Роль</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(e => (
                            <tr key={e.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <span className={styles.name}>{e.firstName} {e.lastName}</span>
                                    <span className={styles.email}>{e.email}</span>
                                </td>
                                <td className={styles.td}>
                                    <select
                                        className={styles.roleSelect}
                                        value={e.role}
                                        onChange={ev => updateRole(e.id, ev.target.value as Role)}
                                    >
                                        <option value="Оператор">Оператор</option>
                                        <option value="Администратор">Администратор</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td className={styles.td} colSpan={2} style={{ textAlign: 'center', color: '#999' }}>
                                    Сотрудники не найдены
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
