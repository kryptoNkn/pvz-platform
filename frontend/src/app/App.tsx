import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedLayout } from '@/widgets/layout'
import { WorkloadPage } from '@/pages/workload'
import { StatsPage } from '@/pages/stats'
import { FinancePage } from '@/pages/finance'

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<ProtectedLayout />}>
                    <Route path="/workload" element={<WorkloadPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/finance" element={<FinancePage />} />
                </Route>
                <Route path="*" element={<Navigate to="/workload" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
