import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import EditorPage from './pages/EditorPage'

export default function App() {
  const { pathname } = useLocation()
  const isEditor = pathname === '/editor'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex flex-col flex-1 overflow-hidden">
        <Routes>
          <Route path="/"       element={<LandingPage />} />
          <Route path="/editor" element={<EditorPage />} />
        </Routes>
      </main>
      {/* Footer hidden on editor — every pixel counts on mobile */}
      {!isEditor && <Footer />}
    </div>
  )
}
