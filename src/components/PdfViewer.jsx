import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

let pdfjsLib = null
async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib
  const mod = await import('pdfjs-dist')
  mod.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib = mod
  return pdfjsLib
}

export default function PdfViewer({
  fileUrl, onPageCount,
  currentPage: externalPage, onPageChange,
  onCanvasRect,
  overlayChildren,
}) {
  const canvasRef     = useRef(null)
  const wrapRef       = useRef(null)
  const scrollRef     = useRef(null)
  const renderTaskRef = useRef(null)
  const pdfRef        = useRef(null)

  // Keep a ref to the most-recently-resolved scale so scroll/resize handler
  // always reads the real value, never 0.
  const resolvedScaleRef = useRef(1.0)

  const [numPages,    setNumPages]    = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  // Use null as "not yet calculated" so the % display shows nothing until ready
  const [scale,       setScale]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [canvasSize,  setCanvasSize]  = useState({ w: 0, h: 0 })

  // ── Load PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fileUrl) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const lib = await getPdfJs()
        const pdf = await lib.getDocument(fileUrl).promise
        if (cancelled) return
        pdfRef.current = pdf
        setNumPages(pdf.numPages)
        onPageCount?.(pdf.numPages)
        setCurrentPage(1)
        setScale(null)      // null = auto-fit on next render
        setLoading(false)
      } catch (e) {
        if (!cancelled) { setError('Could not load PDF.'); setLoading(false) }
      }
    })()
    return () => { cancelled = true }
  }, [fileUrl])

  // ── Report canvas metrics ─────────────────────────────────────────────────
  // Always uses resolvedScaleRef so we never divide by 0 or null.
  const reportRect = useCallback(() => {
    if (!canvasRef.current || !onCanvasRect || !scrollRef.current) return
    const sc         = resolvedScaleRef.current
    if (!sc) return                          // still initialising, skip
    const canvas     = canvasRef.current
    const rect       = canvas.getBoundingClientRect()
    const parentRect = scrollRef.current.getBoundingClientRect()
    onCanvasRect({
      x:            rect.left - parentRect.left + scrollRef.current.scrollLeft,
      y:            rect.top  - parentRect.top  + scrollRef.current.scrollTop,
      width:        rect.width,
      height:       rect.height,
      // PDF-space dimensions — these are what doApply uses for coordinate conversion
      pdfWidth:     canvas.width  / sc,
      pdfHeight:    canvas.height / sc,
      displayScale: sc,
    })
  }, [onCanvasRect])

  // ── Render page ───────────────────────────────────────────────────────────
  const renderPage = useCallback(async (pageNum, sc) => {
    if (!pdfRef.current || !canvasRef.current) return
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch (_) {}
    }

    const page = await pdfRef.current.getPage(pageNum)

    // Auto-fit: sc === null means "fit to container width"
    let finalScale = sc
    if (sc === null && scrollRef.current) {
      const containerW = scrollRef.current.clientWidth - 32   // 16px padding each side
      const naturalVp  = page.getViewport({ scale: 1 })
      finalScale = Math.max(0.4, Math.min(3, containerW / naturalVp.width))
    }
    // Fallback guard — should never be falsy after the above, but just in case
    if (!finalScale || !isFinite(finalScale)) finalScale = 1.0

    resolvedScaleRef.current = finalScale
    setScale(finalScale)

    const viewport = page.getViewport({ scale: finalScale })
    const canvas   = canvasRef.current
    canvas.width   = viewport.width
    canvas.height  = viewport.height
    setCanvasSize({ w: viewport.width, h: viewport.height })

    const task = page.render({ canvasContext: canvas.getContext('2d'), viewport })
    renderTaskRef.current = task
    try {
      await task.promise
      reportRect()
    } catch (e) {
      if (e?.name !== 'RenderingCancelledException') console.warn(e)
    }
  }, [reportRect])

  useEffect(() => {
    if (!loading && pdfRef.current) renderPage(currentPage, scale)
  }, [currentPage, scale, loading, renderPage])

  useEffect(() => { onPageChange?.(currentPage) }, [currentPage])
  useEffect(() => {
    if (externalPage && externalPage !== currentPage) setCurrentPage(externalPage)
  }, [externalPage])

  // Re-report on scroll / window resize
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll',  reportRect)
    window.addEventListener('resize', reportRect)
    return () => {
      el.removeEventListener('scroll',  reportRect)
      window.removeEventListener('resize', reportRect)
    }
  }, [reportRect])

  const prev    = () => setCurrentPage(p => Math.max(1, p - 1))
  const next    = () => setCurrentPage(p => Math.min(numPages, p + 1))
  const zoomIn  = () => setScale(s => Math.min(3,   +((s ?? 1) + 0.25).toFixed(2)))
  const zoomOut = () => setScale(s => Math.max(0.4, +((s ?? 1) - 0.25).toFixed(2)))

  if (error) return (
    <div className="flex-1 flex items-center justify-center text-sm text-red-500">{error}</div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 shrink-0 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Preview</span>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={zoomOut} className="btn-ghost p-1.5" title="Zoom out"><ZoomOut size={14} /></button>
          <span className="text-xs text-gray-500 w-10 text-center">
            {scale !== null ? `${Math.round(scale * 100)}%` : '—'}
          </span>
          <button onClick={zoomIn} className="btn-ghost p-1.5" title="Zoom in"><ZoomIn size={14} /></button>
        </div>
        {numPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={prev} disabled={currentPage <= 1}       className="btn-ghost p-1.5 disabled:opacity-40"><ChevronLeft  size={14} /></button>
            <span className="text-xs text-gray-500 whitespace-nowrap">{currentPage} / {numPages}</span>
            <button onClick={next} disabled={currentPage >= numPages} className="btn-ghost p-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>

      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
        {loading ? (
          <div className="flex items-center justify-center w-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-400">Loading PDF…</span>
            </div>
          </div>
        ) : (
          <div
            ref={wrapRef}
            className="relative rounded-xl shadow-lg bg-white"
            style={{ width: canvasSize.w || 'auto', height: canvasSize.h || 'auto', flexShrink: 0 }}
          >
            <canvas ref={canvasRef} className="block rounded-xl" />
            {overlayChildren}
          </div>
        )}
      </div>
    </div>
  )
}
