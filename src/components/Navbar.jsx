import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, FileText } from 'lucide-react'

const NAV = [
  { label: 'Tools',        href: '/#tools' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Privacy',      href: '/#privacy' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleUpload = () => {
    if (pathname === '/') {
      document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
    }
    setOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group focus:outline-none">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm group-hover:bg-brand-hover transition-colors">
            <FileText size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight select-none">
            my<span className="text-brand">PDF</span>doc
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV.map(item => (
            <a key={item.label} href={item.href} className="nav-link">{item.label}</a>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-2">
          <button onClick={handleUpload} className="btn-primary hidden sm:inline-flex text-sm px-4 py-2">
            Upload PDF
          </button>
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          {NAV.map(item => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="nav-link block">
              {item.label}
            </a>
          ))}
          <div className="pt-3">
            <button onClick={handleUpload} className="btn-primary w-full">Upload PDF</button>
          </div>
        </div>
      )}
    </nav>
  )
}
