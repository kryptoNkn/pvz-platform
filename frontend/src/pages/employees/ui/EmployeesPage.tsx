import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './EmployeesPage.module.scss'

type ApiRole = 'pending' | 'operator' | 'admin' | 'owner'

const ROLE_LABELS: Record<ApiRole, string> = {
    pending: 'Ожидает назначения',
    operator: 'Оператор',
    admin: 'Администратор',
    owner: 'Владелец',
}

interface User {
    id: string
    full_name: string
    role: ApiRole
}

export const EmployeesPage = () => {
    const navigate = useNavigate()
    const [users, setUsers] = useState<User[]>([])
    const [myRole, setMyRole] = useState<ApiRole | null>(null)
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/user/profile', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setMyRole(data.role))
            .catch(console.error)

        fetch('/api/users', { credentials: 'include' })
            .then(r => r.json())
            .then(setUsers)
            .catch(console.error)
    }, [])

    const assignRole = async (userId: string, role: string) => {
        setSaving(userId)
        try {
            await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            })
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as ApiRole } : u))
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(null)
        }
    }

    const roleOptions = (): ApiRole[] => {
        if (myRole === 'owner') return ['operator', 'admin']
        if (myRole === 'admin') return ['operator']
        return []
    }

    const canAssign = roleOptions().length > 0

    const filtered = users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase())
    )

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
                <button className={styles.btnSave} onClick={() => navigate('/workload')}>
                    Назад
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
                        {filtered.map(u => (
                            <tr key={u.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <span className={styles.name}>{u.full_name}</span>
                                </td>
                                <td className={styles.td}>
                                    {canAssign && u.role !== 'owner' ? (
                                        <select
                                            className={styles.roleSelect}
                                            value={u.role}
                                            disabled={saving === u.id}
                                            onChange={e => assignRole(u.id, e.target.value)}
                                        >
                                            <option value="pending" disabled>
                                                Ожидает назначения
                                            </option>
                                            {roleOptions().map(r => (
                                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={u.role === 'pending' ? styles.rolePending : styles.roleLabel}>
                                            {ROLE_LABELS[u.role] ?? u.role}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td className={styles.td} colSpan={2} style={{ textAlign: 'center', color: '#999' }}>
                                    Пользователи не найдены
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
