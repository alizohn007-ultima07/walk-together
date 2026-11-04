import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './store/authStore'
import HomePage from './pages/HomePage'
import WalkPage from './pages/WalkPage'
import WalkFormPage from './pages/WalkFormPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MyWalksPage from './pages/MyWalksPage'
import ProfilePage from './pages/ProfilePage'
import UserPage from './pages/UserPage'

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/walks/:id" element={<WalkPage />} />
          <Route path="/users/:id" element={<UserPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/walks/new" element={<ProtectedRoute><WalkFormPage /></ProtectedRoute>} />
          <Route path="/walks/:id/edit" element={<ProtectedRoute><WalkFormPage /></ProtectedRoute>} />
          <Route path="/my" element={<ProtectedRoute><MyWalksPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}
