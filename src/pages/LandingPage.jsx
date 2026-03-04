import React, { useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, Scissors, GitMerge, RotateCw, Lock, Unlock,
  Image, Minimize2, Type, PenLine, PenTool, Shield, Zap, Monitor,
  CheckCircle2, ChevronRight, ArrowRight
} from 'lucide-react'

/* ── Tool definitions ────────────────────────────────────── */
const TOOLS = [
  { id: 'sign',       icon: PenTool,   label: 'Sign',           desc: 'Draw, type or upload your signature' },
  { id: 'edit-text',  icon: Type,      label: 'Add Text',       desc: 'Annotate pages with custom text' },
  { id: 'add-image',  icon: Image,     label: 'Add Image',      desc: 'Insert images into any page' },
  { id: 'draw',       icon: PenLine,   label: 'Draw',           desc: 'Freehand drawing & annotation' },
  { id: 'rename',     icon: FileText,  label: 'Rename',         desc: 'Rename your PDF file instantly' },
  { id: 'compress',   icon: Minimize2, label: 'Compress',       desc: 'Reduce file size, keep quality' },
  { id: 'rotate',     icon: RotateCw,  label: 'Rotate',         desc: 'Rotate pages to any orientation' },
  { id: 'merge',      icon: GitMerge,  label: 'Merge',          desc: 'Combine multiple PDFs into one' },
  { id: 'split',      icon: Scissors,  label: 'Split',          desc: 'Split a PDF into separate files' },
  { id: 'to-image',   icon: Image,     label: 'Convert to Image', desc: 'Export pages as JPEG or PNG files' },
]

const WHY = [
  { icon: Shield,  title: '100% Private',      desc: 'Your files never leave your browser. Zero uploads, zero servers, zero risk.' },
  { icon: Zap,     title: 'Lightning Fast',     desc: 'All processing happens locally on your device — instant results every time.' },
  { icon: Monitor, title: 'Works Everywhere',   desc: 'Any device, any browser. No installs, no accounts, no subscriptions.' },
]

const STEPS = [
  { n: '01', title: 'Upload your PDF',   desc: 'Drag & drop or click to choose a file from your device.' },
  { n: '02', title: 'Choose a tool',     desc: 'Select from our complete PDF toolkit to edit or transform.' },
  { n: '03', title: 'Download result',   desc: 'Save your edited PDF directly to your device. Done.' },
]

const TRUST = ['Zero file uploads', 'No account needed', 'Works offline', 'Free forever']

/* ── Component ───────────────────────────────────────────── */
export default function LandingPage() {
  const navigate  = useNavigate()
  const inputRef  = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState('')

  const handleFile = useCallback((file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.')
      return
    }
    setError('')
    const url = URL.createObjectURL(file)
    navigate('/editor', { state: { fileName: file.name, fileUrl: url, fileSize: file.size } })
  }, [navigate])

  const onInputChange  = (e) => handleFile(e.target.files?.[0])
  const onDragOver     = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave    = () => setDragging(false)
  const onDrop         = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]) }
  const openFilePicker = () => inputRef.current?.click()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">

          <div className="fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand text-xs font-semibold mb-6 border border-brand-100">
              <Shield size={11} strokeWidth={2.5} />
              100% Private — Files Never Leave Your Browser
            </span>
          </div>

          <h1 className="fade-in-1 text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            Edit PDFs <span className="text-brand">safely</span>,<br className="hidden sm:block" />
            right in your browser.
          </h1>

          <p className="fade-in-2 text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            No uploads. No accounts. No servers. myPDFdoc runs entirely on your device —
            so your files stay yours, always.
          </p>

          {/* Upload zone */}
          <div
            id="upload"
            className={`fade-in-3 max-w-lg mx-auto p-10 text-center dropzone${dragging ? ' dropzone-active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={openFilePicker}
          >
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onInputChange} />

            <div className={`mx-auto mb-5 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${dragging ? 'bg-brand' : 'bg-brand-50'}`}>
              <Upload size={28} strokeWidth={1.8} className={`pulse-icon ${dragging ? 'text-white' : 'text-brand'}`} />
            </div>

            <p className="font-semibold text-gray-800 text-base mb-1">
              {dragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
            </p>
            <p className="text-sm text-gray-400 mb-6">or click to browse files from your device</p>

            <button onClick={(e) => { e.stopPropagation(); openFilePicker() }} className="btn-primary px-7 py-2.5">
              <Upload size={15} strokeWidth={2.5} />
              Choose PDF File
            </button>

            {error && <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>}
            <p className="mt-4 text-xs text-gray-400">PDF files only · Processed 100% in your browser</p>
          </div>
        </div>
      </section>

      {/* ── Why myPDFdoc ────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Why myPDFdoc?</h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Built privacy-first. Your documents are never uploaded anywhere.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {WHY.map((f) => (
              <div key={f.title} className="card p-6 text-center">
                <div className="mx-auto mb-4 w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                  <f.icon size={20} className="text-brand" strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tools Grid ───────────────────────────────────── */}
      <section id="tools" className="py-16 px-4 sm:px-6 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Everything you need</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              A complete PDF toolkit — free, private, and instant.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={openFilePicker}
                className="tool-card group text-left"
              >
                <div className="tool-icon group-hover:bg-brand group-hover:text-white">
                  <tool.icon size={17} strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm mb-0.5">{tool.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{tool.desc}</p>
                </div>
                <ChevronRight size={13} className="text-gray-300 group-hover:text-brand transition-colors mt-auto" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Simple as 1, 2, 3</h2>
            <p className="text-gray-500 text-sm">Edit your PDF in seconds — no learning curve.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative text-center px-4">
                <div className="text-6xl font-black text-brand/[0.07] mb-2 leading-none">{s.n}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight size={16} className="hidden sm:block absolute -right-2 top-6 text-brand-100" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy banner ───────────────────────────────── */}
      <section id="privacy" className="py-16 px-4 sm:px-6 bg-brand">
        <div className="max-w-2xl mx-auto text-center">
          <Shield size={32} className="mx-auto mb-5 text-white/60" strokeWidth={1.5} />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Your privacy is non-negotiable.
          </h2>
          <p className="text-white/75 leading-relaxed mb-8 text-sm sm:text-base">
            myPDFdoc processes everything in your browser. No file ever touches a server —
            because we don't have any.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {TRUST.map(t => (
              <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium border border-white/20">
                <CheckCircle2 size={11} className="text-white/70" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-gray-100 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Ready to edit your PDF?</h2>
          <p className="text-gray-500 text-sm mb-8">Upload your file and get started — no sign-up needed.</p>
          <button onClick={openFilePicker} className="btn-primary px-8 py-3 text-base">
            <Upload size={16} strokeWidth={2.5} />
            Upload a PDF now
          </button>
        </div>
      </section>

    </div>
  )
}
