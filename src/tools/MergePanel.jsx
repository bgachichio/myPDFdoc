import React, { useState, useRef } from 'react'
import { GitMerge, Plus, Trash2, GripVertical, CheckCircle2, Download } from 'lucide-react'
import { mergePdfs, bytesToUrl } from '../utils/pdfUtils'

export default function MergePanel({ fileUrl, fileName, onUpdate }) {
  const inputRef  = useRef(null)
  const [files,   setFiles]   = useState([])
  const [status,  setStatus]  = useState(null)
  const [msg,     setMsg]     = useState('')
  const [resultUrl, setResultUrl] = useState(null)
  const [resultName,setResultName]= useState('')

  const addFiles = (newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf')
    if (pdfs.length < newFiles.length) setMsg('Only PDF files are accepted — others were skipped.')
    setFiles(prev => [...prev, ...pdfs.map(f => ({ file: f, id: crypto.randomUUID() }))])
  }

  const remove = (id) => setFiles(prev => prev.filter(f => f.id !== id))

  const moveUp = (i) => {
    if (i === 0) return
    setFiles(prev => { const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a })
  }
  const moveDown = (i) => {
    setFiles(prev => {
      if (i === prev.length - 1) return prev
      const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a
    })
  }

  const apply = async () => {
    if (files.length < 1) { setMsg('Add at least one more PDF to merge.'); setStatus('error'); return }
    setStatus('working'); setMsg('')
    try {
      // Fetch current file as a File object for uniform handling
      const res   = await fetch(fileUrl)
      const blob  = await res.blob()
      const base  = new File([blob], fileName, { type: 'application/pdf' })
      const allFiles = [base, ...files.map(f => f.file)]
      const bytes = await mergePdfs(allFiles)
      const url   = bytesToUrl(bytes)
      const name  = 'merged.pdf'
      setResultUrl(url); setResultName(name)
      setStatus('done'); setMsg(`Merged ${allFiles.length} PDFs successfully!`)
      onUpdate?.(url, name)
    } catch (e) {
      setStatus('error'); setMsg('Merge failed: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        The current PDF is first. Add more PDFs below and reorder them before merging.
      </p>

      {/* Current file (pinned first) */}
      <div className="bg-brand-50 rounded-xl px-3 py-2.5 flex items-center gap-2">
        <GitMerge size={13} className="text-brand shrink-0" />
        <span className="text-xs font-semibold text-brand truncate flex-1">{fileName}</span>
        <span className="text-[10px] text-brand/60 shrink-0">1st</span>
      </div>

      {/* Added files */}
      {files.map((f, i) => (
        <div key={f.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-400 w-4 shrink-0">{i + 2}</span>
          <span className="text-xs font-medium text-gray-700 truncate flex-1">{f.file.name}</span>
          <div className="flex gap-0.5 shrink-0">
            <button onClick={() => moveUp(i)}   className="p-1 rounded hover:bg-gray-200 text-gray-400" title="Move up">↑</button>
            <button onClick={() => moveDown(i)} className="p-1 rounded hover:bg-gray-200 text-gray-400" title="Move down">↓</button>
            <button onClick={() => remove(f.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      ))}

      <button onClick={() => inputRef.current?.click()}
        className="btn-ghost w-full border border-dashed border-gray-200 rounded-xl py-2.5 text-xs">
        <Plus size={13} /> Add PDF files
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" multiple className="hidden"
        onChange={e => addFiles(e.target.files)} />

      {msg && (
        <p className={`text-xs font-medium flex items-center gap-1.5 ${status === 'error' ? 'text-red-500' : 'text-brand'}`}>
          {status === 'done' && <CheckCircle2 size={12} />}{msg}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={apply} disabled={status === 'working' || files.length === 0}
          className="btn-primary w-full disabled:opacity-50">
          <GitMerge size={14} />
          {status === 'working' ? 'Merging…' : `Merge ${files.length + 1} PDFs`}
        </button>
        {status === 'done' && (
          <button onClick={() => {
            const a = Object.assign(document.createElement('a'), { href: resultUrl, download: resultName })
            a.click()
          }} className="btn-outline w-full">
            <Download size={14} /> Download Merged PDF
          </button>
        )}
      </div>
    </div>
  )
}
