import React, { useState } from 'react'
import { Image, Download, CheckCircle2 } from 'lucide-react'
import { convertToImages } from '../utils/pdfUtils'

export default function ConvertImagePanel({ fileUrl, numPages }) {
  const [format,  setFormat]  = useState('jpeg')
  const [scale,   setScale]   = useState(2)
  const [scope,   setScope]   = useState('all')
  const [from,    setFrom]    = useState(1)
  const [to,      setTo]      = useState(numPages || 1)
  const [status,  setStatus]  = useState(null)
  const [msg,     setMsg]     = useState('')
  const [images,  setImages]  = useState([])

  const dpiLabel = { 1: '72 dpi', 2: '144 dpi', 3: '216 dpi' }[scale] || `${scale}× scale`

  const apply = async () => {
    setStatus('working'); setMsg(''); setImages([])
    let indices = null
    if (scope === 'range') {
      const f = Math.max(1, Number(from))
      const t = Math.min(numPages, Number(to))
      indices = Array.from({ length: t - f + 1 }, (_, i) => f + i)
    }
    try {
      const imgs = await convertToImages(fileUrl, format, scale, indices)
      setImages(imgs)
      setStatus('done')
      setMsg(`Converted ${imgs.length} page${imgs.length > 1 ? 's' : ''} to ${format.toUpperCase()}.`)
    } catch (e) {
      setStatus('error'); setMsg('Conversion failed: ' + e.message)
    }
  }

  const downloadAll = () => {
    images.forEach(({ dataUrl, pageNum }) => {
      const a = Object.assign(document.createElement('a'), {
        href: dataUrl,
        download: `page-${pageNum}.${format}`
      })
      a.click()
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Convert PDF pages to images. Each page becomes a separate image file.
      </p>

      {/* Format */}
      <label className="block">
        <span className="text-xs font-semibold text-gray-700 mb-1 block">Format</span>
        <div className="flex gap-2">
          {['jpeg', 'png'].map(f => (
            <button key={f} onClick={() => setFormat(f)}
              className={`flex-1 py-2 rounded-xl border text-sm font-semibold uppercase transition-all
                ${format === f ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand'}`}>
              {f}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {format === 'jpeg' ? 'Smaller file size, good for photos.' : 'Lossless quality, supports transparency.'}
        </p>
      </label>

      {/* Quality/scale */}
      <label className="block">
        <span className="text-xs font-semibold text-gray-700 mb-1 block">Resolution — {dpiLabel}</span>
        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <button key={s} onClick={() => setScale(s)}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all
                ${scale === s ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:border-brand hover:text-brand'}`}>
              {s === 1 ? 'Standard' : s === 2 ? 'High' : 'Ultra'}
            </button>
          ))}
        </div>
      </label>

      {/* Scope */}
      {numPages > 1 && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-gray-700">Pages to convert</legend>
          {['all', 'range'].map(opt => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="img-scope" value={opt} checked={scope === opt}
                onChange={() => setScope(opt)} className="accent-brand" />
              <span className="text-sm text-gray-700">{opt === 'all' ? 'All pages' : 'Page range'}</span>
            </label>
          ))}
          {scope === 'range' && (
            <div className="flex items-center gap-2">
              <input type="number" min={1} max={numPages} value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
              <span className="text-xs text-gray-400">to</span>
              <input type="number" min={1} max={numPages} value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
          )}
        </fieldset>
      )}

      {msg && (
        <p className={`text-xs font-medium flex items-center gap-1.5 ${status === 'error' ? 'text-red-500' : 'text-brand'}`}>
          {status === 'done' && <CheckCircle2 size={12} />}{msg}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button onClick={apply} disabled={status === 'working'} className="btn-primary w-full">
          <Image size={14} />
          {status === 'working' ? 'Converting…' : 'Convert to Image'}
        </button>

        {images.length > 0 && (
          <>
            {images.length > 1 && (
              <button onClick={downloadAll} className="btn-outline w-full">
                <Download size={14} /> Download All Images
              </button>
            )}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {images.map(({ dataUrl, pageNum }) => (
                <div key={pageNum} className="relative group rounded-xl overflow-hidden border border-gray-100">
                  <img src={dataUrl} alt={`Page ${pageNum}`} className="w-full block" />
                  <a href={dataUrl} download={`page-${pageNum}.${format}`}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                    <span className="opacity-0 group-hover:opacity-100 bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-brand flex items-center gap-1.5 transition-opacity">
                      <Download size={11} /> Page {pageNum}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
