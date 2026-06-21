import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CourtDetailPage from './pages/CourtDetailPage'
import MyBookingsPage from './pages/MyBookingsPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'
import CourtFormPage from './pages/CourtFormPage'
import ManageSchedulePage from './pages/ManageSchedulePage'
import ProfilePage from './pages/ProfilePage'
import ShareReservaPage from './pages/ShareReservaPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/canchas/:id" element={<CourtDetailPage />} />
          <Route path="/reserva/:codigo" element={<ShareReservaPage />} />
          <Route path="/perfil" element={<ProfilePage />} />

          <Route path="/mis-turnos" element={
            <ProtectedRoute rol="jugador">
              <MyBookingsPage />
            </ProtectedRoute>
          } />

          <Route path="/panel" element={
            <ProtectedRoute rol="dueno">
              <OwnerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/panel/canchas/nueva" element={
            <ProtectedRoute rol="dueno">
              <CourtFormPage />
            </ProtectedRoute>
          } />
          <Route path="/panel/canchas/:id/editar" element={
            <ProtectedRoute rol="dueno">
              <CourtFormPage />
            </ProtectedRoute>
          } />
          <Route path="/panel/canchas/:id/horarios" element={
            <ProtectedRoute rol="dueno">
              <ManageSchedulePage />
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <div className="page">
              <div className="container" style={{ textAlign: 'center', paddingTop: 64 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>⚽</div>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>404 — Página no encontrada</h1>
                <p style={{ color: 'var(--muted)', marginBottom: 20 }}>La página que buscás no existe.</p>
                <a href="/" className="btn btn-primary">Volver al inicio</a>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
