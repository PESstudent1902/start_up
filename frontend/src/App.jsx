import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import ProjectPage from './pages/ProjectPage'
import Leaderboard from './pages/Leaderboard'
import Submission from './pages/Submission'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('buildiq_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        localStorage.removeItem('buildiq_user')
      }
    }
  }, [])

  const handleUserCreated = (userData) => {
    setUser(userData)
    localStorage.setItem('buildiq_user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('buildiq_user')
    localStorage.removeItem('buildiq_current_project')
  }

  return (
    <Router>
      <div className="min-h-screen bg-navy-900">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1228',
              color: '#e2e8f0',
              border: '1px solid rgba(96, 165, 250, 0.3)',
            },
          }}
        />
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/dashboard" replace /> : <Onboarding onUserCreated={handleUserCreated} />}
          />
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/project"
            element={user ? <ProjectPage user={user} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/leaderboard"
            element={user ? <Leaderboard user={user} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/submit/:projectId"
            element={user ? <Submission user={user} /> : <Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
