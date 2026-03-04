import React, { useState } from 'react'
import { CheckCircle2, Download, Minimize2 } from 'lucide-react'
import { compressPdf, bytesToUrl } from '../utils/pdfUtils'

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function CompressPanel({ fileUrl, fileName, fileSize, onUpdate }) {
  const [status,    setStatus]    = useState(null)
  const [msg,       setMsg]       = useState('')
  const [resultUrl, setResultUrl] = useState(null)
  const [resultName,setResultName]= useState('')
  const [newSize,   setNewSize]   = useState(null)

  const apply = async () => {
    setStatus('working'); setMsg('')
    try {
      const bytes = await compressPdf(fileUrl)
      const url   = bytesToUrl(bytes)
      const name  = fileName.replace(/\.pdf$/i, '') + '-compressed.pdf'
      setResultUrl(url); setResultName(name)
      setNewSize(bytes.length)
      setStatus('done')
      const saved = fileSize - bytes.length
      const pct   = fileSize > 0 ? Math.round((saved / fileSize) * 100) : 0
      setMsg(saved > 0 ? `Saved ${formatBytes(saved)} (${pct}% smaller)` : 'File re-optimised.')
      onUpdate?.(url, name)
    } catch (e) {
      setStatus('error'); setMsg('Compression failed: ' + e.message)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Re-serialise and optimise the PDF structure to reduce file size. Works best on PDFs with redundant objects.
      </p>

      {fileSize > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Original size</span>
            <span className="font-semibold">{formatBytes(fileSize)}</span>
          </div>
          {newSize !== null && (
            <div className="flex justify-between text-brand">
              <span>Compressed size</span>
              <span className="font-semibold">{formatBytes(newSize)}</span>
            </div>
          )}
        </div>
      )}

      {msg && (
        <p className={`text-xs font-medium flex items-center gap-1.5 ${status === 'error' ? 'text-red-500' : 'text-brand'}`}>
          {status === 'done' && <CheckCircle2 size={12} />}{msg}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={apply} disabled={status === 'working'} className="btn-primary w-full">
          <Minimize2 size={14} />
          {status === 'working' ? 'Compressing…' : 'Compress PDF'}
        </button>
        {status === 'done' && (
          <button onClick={() => {
            const a = Object.assign(document.createElement('a'), { href: resultUrl, download: resultName })
            a.click()
          }} className="btn-outline w-full">
            <Download size={14} /> Download Compressed PDF
          </button>
        )}
      </div>
    </div>
  )
}
