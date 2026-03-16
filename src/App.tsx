import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Navbar } from './components/Navbar'
import { Spinner } from './components/Spinner'
import { LoginPage } from './pages/LoginPage'
import { VaultPage } from './pages/VaultPage'
import { SendPage } from './pages/SendPage'
import { HistoryPage } from './pages/HistoryPage'
import { BetsPage } from './pages/BetsPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminPage } from './pages/AdminPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-gold mb-4">Gringotts</h1>
          <Spinner />
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Navbar />
      <main className="flex-1 p-6 pb-24 md:pb-6 md:ml-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<VaultPage />} />
          <Route path="/send" element={<SendPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/bets" element={<BetsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
