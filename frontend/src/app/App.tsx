import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedLayout } from '@/widgets/layout'
import { WorkloadPage } from '@/pages/workload'
import { StatsPage } from '@/pages/stats'
import { FinancePage } from '@/pages/finance'
import { AddPvzPage } from '@/pages/add-pvz'
import { EmployeesPage } from '@/pages/employees'
import { ProfilePage } from '@/pages/profile'
import { SettingsPage } from '@/pages/settings'
import { AuthPage } from '@/pages/auth'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route element={<ProtectedLayout />}>
                    <Route path="/workload" element={<WorkloadPage />} />
                    <Route path="/workload/add" element={<AddPvzPage />} />
                    <Route path="/workload/employees" element={<EmployeesPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/finance" element={<FinancePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
