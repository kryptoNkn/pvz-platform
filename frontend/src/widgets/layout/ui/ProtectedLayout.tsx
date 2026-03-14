import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/widgets/sidebar'
import styles from './ProtectedLayout.module.scss'

export const ProtectedLayout = () => (
    <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
            <Outlet />
        </main>
    </div>
)
