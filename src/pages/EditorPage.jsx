import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Upload, FileText, Scissors, GitMerge, RotateCw,
  Image, Minimize2, Type, PenLine, Download, X, Menu, CheckCircle2, PenTool
} from 'lucide-react'

import PdfViewer         from '../components/PdfViewer'
import AnnotationLayer   from '../components/AnnotationLayer'
import AddTextPanel      from '../tools/AddTextPanel'
import AddImagePanel     from '../tools/AddImagePanel'
import DrawPanel         from '../tools/DrawPanel'
import CompressPanel     from '../tools/CompressPanel'
import RotatePanel       from '../tools/RotatePanel'
import MergePanel        from '../tools/MergePanel'
import SplitPanel        from '../tools/SplitPanel'
import ConvertImagePanel from '../tools/ConvertImagePanel'
import { addText, addImage, addDrawing, addSignature, bytesToUrl } from '../utils/pdfUtils'
import SignPanel from '../tools/SignPanel'

const TOOLS = [
  { id: 'sign',      icon: PenTool,   label: 'Sign',             group: 'Edit' },
  { id: 'edit-text', icon: Type,      label: 'Add Text',         group: 'Edit' },
  { id: 'add-image', icon: Image,     label: 'Add Image',        group: 'Edit' },
  { id: 'draw',      icon: PenLine,   label: 'Draw',             group: 'Edit' },
  { id: 'rename',    icon: FileText,  label: 'Rename',           group: 'Manage' },
  { id: 'compress',  icon: Minimize2, label: 'Compress',         group: 'Manage' },
  { id: 'rotate',    icon: RotateCw,  label: 'Rotate',           group: 'Manage' },
  { id: 'merge',     icon: GitMerge,  label: 'Merge',            group: 'Manage' },
  { id: 'split',     icon: Scissors,  label: 'Split',            group: 'Manage' },
  { id: 'to-image',  icon: Image,     label: 'Convert to Image', group: 'Convert' },
]
const GROUPS = ['Edit', 'Manage', 'Convert']
const EDIT_TOOLS = ['sign', 'edit-text', 'add-image', 'draw']

function fmt(b) {
  if (!b) return ''
  return b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB'
}

function RenamePanel({ fileName, onRename }) {
  const [val, setVal] = useState(fileName.replace(/\.pdf$/i, ''))
  const [ok,  setOk]  = useState(false)
  const save = () => {
    if (!val.trim()) return
    onRename(val.trim() + '.pdf')
    setOk(true)
    setTimeout(() => setOk(false), 2000)
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Enter a new name for your PDF file.</p>
      <div className="flex gap-2 items-center">
        <input value={val} onChange={e => { setVal(e.target.value); setOk(false) }}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand" />
        <span className="text-sm text-gray-400 shrink-0">.pdf</span>
      </div>
      <button onClick={save} className="btn-primary w-full">{ok ? '✓ Renamed!' : 'Apply Rename'}</button>
      <p className="text-xs text-gray-400">The download button will use this filename.</p>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────────────
   EditorPage
   
   State model:
   - `overlays`   — persistent list of text/image boxes; survives tool switches
   - `drawConfig` — only active while the Draw tool is selected; cleared on
                    switching away so the draw canvas doesn't linger
   - `canvasInfo` — kept in BOTH state (for renders) AND a ref (for the apply
                    callback, so it never reads stale closure values)
   - `fileUrl`    — always reflects the latest PDF bytes after any apply
   
   Tool switching:
   - Switching tools does NOT clear overlays (text/image boxes persist)
   - Switching AWAY from Draw deactivates drawConfig
   - Users can freely mix Add Text → Add Image → Draw → Add Text → Compress etc.
   
   Apply & Save (green button in topbar):
   - Embeds ALL pending overlays + draw canvas into the PDF in one shot
   - Clears overlays and draw canvas afterwards
   - fileUrl updated → viewer re-renders the new PDF
─────────────────────────────────────────────────────────────────────────── */

/* ── ToolPanelContent ────────────────────────────────────────────────────────
   Extracted so it renders identically inside both the desktop right-panel
   and the mobile bottom-sheet drawer.
─────────────────────────────────────────────────────────────────────────── */
function ToolPanelContent({ activeTool, handleToolMsg, setDrawConfig, drawConfig, renderNonEditPanel, EDIT_TOOLS }) {
  return (
    <>
      {/* Edit panels — always mounted (display:none when inactive) to preserve state */}
      <div style={{ display: activeTool === 'edit-text' ? 'block' : 'none' }} className="p-4">
        <AddTextPanel onAddOverlay={handleToolMsg} />
      </div>
      <div style={{ display: activeTool === 'add-image' ? 'block' : 'none' }} className="p-4">
        <AddImagePanel onAddOverlay={handleToolMsg} />
      </div>
      <div style={{ display: activeTool === 'sign' ? 'block' : 'none' }} className="p-4">
        <SignPanel onAddOverlay={handleToolMsg} />
      </div>
      <div style={{ display: activeTool === 'draw' ? 'block' : 'none' }} className="p-4">
        <DrawPanel
          onAddOverlay={handleToolMsg}
          onClearOverlays={() => setDrawConfig(null)}
          drawConfig={drawConfig}
        />
      </div>
      {/* Stateless panels — rendered only when active */}
      {!EDIT_TOOLS.includes(activeTool) && (
        <div className="p-4">{renderNonEditPanel()}</div>
      )}
    </>
  )
}

export default function EditorPage() {
  const { state } = useLocation()
  const navigate  = useNavigate()

  const [fileName,    setFileName]    = useState(state?.fileName || 'document.pdf')
  const [fileUrl,     setFileUrl]     = useState(state?.fileUrl  || null)
  const [fileSize,    setFileSize]    = useState(state?.fileSize || 0)
  // Raw PDF bytes stored alongside the URL — avoids re-fetching revoked blob URLs
  const pdfBytesRef = useRef(null)
  const [activeTool,  setActiveTool]  = useState('rename')
  const [sidebarOpen,   setSidebarOpen]   = useState(false)
  const [toolPanelOpen, setToolPanelOpen] = useState(false)
  const [numPages,    setNumPages]    = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // canvasInfo in both state (to trigger re-renders) and ref (for callbacks)
  const [canvasInfo,  setCanvasInfo]  = useState(null)
  const canvasInfoRef = useRef(null)
  const handleCanvasRect = useCallback(info => {
    canvasInfoRef.current = info
    setCanvasInfo(info)
  }, [])

  // Overlays: text + image boxes. Persist across tool switches.
  const [overlays,    setOverlays]    = useState([])

  // drawConfig: only meaningful when draw tool is active.
  // Cleared when switching away from draw.
  const [drawConfig,  setDrawConfig]  = useState(null)

  const [applying,    setApplying]    = useState(false)
  const [applyDone,   setApplyDone]   = useState(false)
  const drawCanvasRef = useRef(null)

  // fileUrl ref so doApply always has the latest URL (not stale closure)
  const fileUrlRef  = useRef(fileUrl)
  const fileNameRef = useRef(fileName)
  useEffect(() => { fileUrlRef.current  = fileUrl  }, [fileUrl])
  useEffect(() => { fileNameRef.current = fileName }, [fileName])

  // Seed pdfBytesRef from the initial URL (uploaded file) on mount
  useEffect(() => {
    const url = state?.fileUrl
    if (!url) return
    fetch(url).then(r => r.arrayBuffer()).then(buf => {
      pdfBytesRef.current = new Uint8Array(buf)
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── overlay CRUD ─────────────────────────────────── */
  const addOverlay = useCallback(item => {
    setOverlays(prev => [
      ...prev,
      { ...item, id: crypto.randomUUID(), pageIndex: currentPage - 1 },
    ])
  }, [currentPage])

  const updateOverlay = useCallback((id, patch) => {
    setOverlays(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }, [])

  const removeOverlay = useCallback(id => {
    setOverlays(prev => prev.filter(i => i.id !== id))
  }, [])

  /* ── messages from tool panels ────────────────────── */
  const handleToolMsg = useCallback(item => {
    if (item === '__apply__') {
      doApply()
      return
    }
    if (item?.type === 'draw') {
      // Activate or update draw config
      setDrawConfig({ active: true, color: item.color, brushSz: item.brushSz, mode: item.mode })
      return
    }
    addOverlay(item)
  }, [addOverlay]) // doApply intentionally excluded — called via ref pattern below

  /* ── Apply: embed everything into the PDF ─────────── */
  // Use refs to avoid stale closure — this function reads the very latest
  // values of fileUrl, fileName, overlays, drawConfig, canvasInfo, currentPage
  const overlaysRef    = useRef(overlays)
  const drawConfigRef  = useRef(drawConfig)
  const currentPageRef = useRef(currentPage)
  useEffect(() => { overlaysRef.current    = overlays    }, [overlays])
  useEffect(() => { drawConfigRef.current  = drawConfig  }, [drawConfig])
  useEffect(() => { currentPageRef.current = currentPage }, [currentPage])

  const doApply = useCallback(async () => {
    const info    = canvasInfoRef.current
    const name0   = fileNameRef.current
    const items   = overlaysRef.current
    const dc      = drawConfigRef.current
    const pageIdx = currentPageRef.current - 1

    if (!info) return
    if (items.length === 0 && !dc?.active) return

    // Guard against bad coordinate info (e.g. scale not yet resolved)
    const { pdfWidth, pdfHeight, width, height } = info
    if (!pdfWidth || !pdfHeight || !isFinite(pdfWidth) || !isFinite(pdfHeight)) {
      alert('Please wait for the PDF to finish loading before saving.')
      return
    }

    setApplying(true)
    try {
      const sx = pdfWidth  / width
      const sy = pdfHeight / height

      // Use stored bytes directly — avoids re-fetching a potentially-revoked blob URL
      // Fall back to fetching the current URL if bytes aren't cached yet
      let currentBytes = pdfBytesRef.current
      if (!currentBytes) {
        const res = await fetch(fileUrlRef.current)
        currentBytes = new Uint8Array(await res.arrayBuffer())
        pdfBytesRef.current = currentBytes
      }

      // Helper: run a pdfUtils function that takes a sourceUrl, but pass bytes instead
      // by creating a temporary blob URL from the current bytes
      const makeTempUrl = (bytes) => {
        const blob = new Blob([bytes], { type: 'application/pdf' })
        return URL.createObjectURL(blob)
      }

      let workingBytes = currentBytes
      const runOp = async (opFn, opts) => {
        const tempUrl = makeTempUrl(workingBytes)
        try {
          workingBytes = await opFn(tempUrl, opts)
        } finally {
          URL.revokeObjectURL(tempUrl)
        }
      }

      // Placeholder — replaced below with actual operations
      void runOp  // used below

      // 1. Text overlays
      for (const item of items) {
        if (item.type !== 'text') continue
        await runOp(addText, {
          pageIndex: item.pageIndex ?? pageIdx,
          text:      item.text,
          x:         item.x * sx,
          y:         Math.max(0, pdfHeight - (item.y + item.h) * sy),
          size:      item.fontSize,
          color:     item.color,
          bold:      item.bold,
          pdfFont:   item.pdfFont,
        })
      }

      // 2. Image overlays
      for (const item of items) {
        if (item.type !== 'image') continue
        await runOp(addImage, {
          pageIndex: item.pageIndex ?? pageIdx,
          imgFile:   item.imgFile,
          x:         item.x * sx,
          y:         Math.max(0, pdfHeight - (item.y + item.h) * sy),
          width:     item.w * sx,
          height:    item.h * sy,
        })
      }

      // 3. Signature overlays
      for (const item of items) {
        if (item.type !== 'signature') continue
        await runOp(addSignature, {
          pageIndex:  item.pageIndex ?? pageIdx,
          pngDataUrl: item.sigDataUrl,
          x:          item.x * sx,
          y:          Math.max(0, pdfHeight - (item.y + item.h) * sy),
          width:      item.w * sx,
          height:     item.h * sy,
        })
      }

      // 4. Drawing canvas
      if (dc?.active && drawCanvasRef.current) {
        const c = drawCanvasRef.current
        await runOp(addDrawing, {
          pageIndex:  pageIdx,
          pngDataUrl: c.toDataURL('image/png'),
          pageWidth:  c.width,
          pageHeight: c.height,
        })
      }

      // Commit: update stored bytes + URL
      pdfBytesRef.current = workingBytes
      const finalUrl  = URL.createObjectURL(new Blob([workingBytes], { type: 'application/pdf' }))
      const newName   = name0.replace(/\.pdf$/i, '') + '-edited.pdf'
      setFileUrl(finalUrl)
      setFileName(newName)
      setFileSize(workingBytes.length)
      setOverlays([])
      setDrawConfig(null)
      setApplyDone(true)
      setTimeout(() => setApplyDone(false), 2500)
    } catch (e) {
      alert('Apply failed: ' + e.message)
    }
    setApplying(false)
  }, []) // intentionally empty — reads everything from refs

  /* ── Tool switching ───────────────────────────────── */
  const selectTool = useCallback(id => {
    setActiveTool(id)
    setSidebarOpen(false)
    setToolPanelOpen(true)   // open tool panel drawer on mobile
    // Only deactivate draw config when leaving the draw tool
    if (id !== 'draw') setDrawConfig(null)
    // Note: overlays are NOT cleared — they persist across tool switches
  }, [])

  /* ── Guard ────────────────────────────────────────── */
  if (!fileUrl) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
        <Upload size={28} className="text-brand" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No file selected</h2>
        <p className="text-gray-500 text-sm">Go back and upload a PDF to get started.</p>
      </div>
      <button onClick={() => navigate('/')} className="btn-primary">
        <ChevronLeft size={15} /> Back to Home
      </button>
    </div>
  )

  const activeDef  = TOOLS.find(t => t.id === activeTool)
  const isEditTool = EDIT_TOOLS.includes(activeTool)
  const hasPending = overlays.length > 0 || drawConfig?.active

  /* ── Render tool panel ────────────────────────────── */
  // The three edit-tool panels are mounted ONCE (always in the DOM) and
  // toggled visible/hidden via CSS so their local state (typed text,
  // uploaded file, brush settings) persists across tool switches.
  const commonUpdate = (url, name) => { setFileUrl(url); if (name) setFileName(name) }

  const renderNonEditPanel = () => {
    const common = { fileUrl, fileName, numPages, currentPage, fileSize, onUpdate: commonUpdate }
    switch (activeTool) {
      case 'rename':   return <RenamePanel fileName={fileName} onRename={setFileName} />
      case 'compress': return <CompressPanel {...common} />
      case 'rotate':   return <RotatePanel   {...common} />
      case 'merge':    return <MergePanel    {...common} />
      case 'split':    return <SplitPanel    {...common} />
      case 'to-image': return <ConvertImagePanel fileUrl={fileUrl} numPages={numPages} />
      default:         return null
    }
  }

  /* ── Sidebar ──────────────────────────────────────── */
  const SidebarContent = () => (
    <div className="w-56 bg-white border-r border-gray-100 flex flex-col h-full overflow-y-auto shrink-0">
      {/* File info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
            <FileText size={13} className="text-brand" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate" title={fileName}>{fileName}</p>
            {fileSize > 0 && <p className="text-xs text-gray-400 mt-0.5">{fmt(fileSize)}</p>}
            {numPages > 0 && <p className="text-xs text-gray-400">{numPages} page{numPages !== 1 ? 's' : ''}</p>}
          </div>
        </div>
        {/* Pending annotation badge */}
        {hasPending && (
          <div className="mt-3 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="text-xs text-amber-700 font-medium">
              {overlays.length > 0 ? `${overlays.length} pending annotation${overlays.length > 1 ? 's' : ''}` : 'Drawing in progress'}
            </span>
          </div>
        )}
      </div>

      {/* Tools */}
      <nav className="flex-1 p-3 space-y-4">
        {GROUPS.map(group => (
          <div key={group}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">{group}</p>
            {TOOLS.filter(t => t.group === group).map(tool => (
              <button key={tool.id} onClick={() => selectTool(tool.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 mb-0.5
                  ${activeTool === tool.id
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-gray-600 hover:bg-brand-50 hover:text-brand'}`}>
                <tool.icon size={14} strokeWidth={2} />
                {tool.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Download */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        {/* Apply button in sidebar too */}
        {hasPending && (
          <button onClick={doApply} disabled={applying}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
                       bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                       transition-colors disabled:opacity-60">
            {applying ? (
              <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
            ) : applyDone ? (
              <><CheckCircle2 size={14} /> Saved!</>
            ) : (
              '✓ Apply & Save'
            )}
          </button>
        )}
        <a href={fileUrl} download={fileName} className="btn-outline w-full text-sm py-2">
          <Download size={13} strokeWidth={2.5} /> Download PDF
        </a>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Topbar ── */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2 shrink-0 min-w-0">
        <button onClick={() => navigate('/')} className="btn-ghost py-1.5 px-2.5 text-xs shrink-0">
          <ChevronLeft size={14} /> Back
        </button>
        <div className="h-4 w-px bg-gray-200 shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <FileText size={13} className="text-brand shrink-0" strokeWidth={2} />
          <span className="text-sm font-semibold text-gray-800 truncate">{fileName}</span>
          {fileSize > 0 && <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">· {fmt(fileSize)}</span>}
        </div>

        {/* Active tool badge */}
        {activeDef && (
          <span className="hidden sm:inline text-xs text-brand bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full font-semibold shrink-0">
            {activeDef.label}
          </span>
        )}

        {/* Pending annotations badge — desktop only */}
        {hasPending && !applying && !applyDone && (
          <span className="hidden md:inline text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-full font-medium shrink-0">
            {overlays.length > 0 ? `${overlays.length} unsaved` : 'Drawing…'}
          </span>
        )}

        {/* Apply & Save — desktop only (mobile has bottom toolbar) */}
        {hasPending && (
          <button onClick={doApply} disabled={applying}
            className="hidden sm:flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl shrink-0
                       bg-green-600 hover:bg-green-700 text-white text-xs font-semibold
                       transition-colors disabled:opacity-60 shadow-sm">
            {applying ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : applyDone ? (
              <CheckCircle2 size={13} />
            ) : '✓ Apply & Save'}
          </button>
        )}

        <a href={fileUrl} download={fileName} className="hidden sm:inline-flex btn-primary text-xs px-3 py-2 shrink-0">
          <Download size={13} strokeWidth={2.5} /> Download
        </a>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setSidebarOpen(false)}>
            <div className="absolute left-0 top-0 h-full z-50 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="relative h-full">
                <button onClick={() => setSidebarOpen(false)}
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                  <X size={15} />
                </button>
                <SidebarContent />
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <div className="hidden md:flex shrink-0"><SidebarContent /></div>

        {/* Main: viewer + tool panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* PDF Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-48">
            <PdfViewer
              fileUrl={fileUrl}
              onPageCount={setNumPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onCanvasRect={handleCanvasRect}
              overlayChildren={
                canvasInfo && (isEditTool || overlays.length > 0) ? (
                  <AnnotationLayer
                    items={overlays}
                    onUpdate={updateOverlay}
                    onRemove={removeOverlay}
                    canvasW={canvasInfo.width}
                    canvasH={canvasInfo.height}
                    drawConfig={activeTool === 'draw' ? drawConfig : null}
                    drawCanvasRef={drawCanvasRef}
                  />
                ) : null
              }
            />
          </div>

          {/* ── Desktop tool panel (right sidebar, always visible) ── */}
          <div className="hidden md:flex md:w-72 bg-white border-l border-gray-100 flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5 shrink-0">
              {activeDef && (
                <>
                  <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <activeDef.icon size={13} className="text-brand" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{activeDef.label}</p>
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto relative">
              <ToolPanelContent
                activeTool={activeTool}
                handleToolMsg={handleToolMsg}
                setDrawConfig={setDrawConfig}
                drawConfig={drawConfig}
                renderNonEditPanel={renderNonEditPanel}
                EDIT_TOOLS={EDIT_TOOLS}
              />
            </div>
          </div>

          {/* ── Mobile tool panel (bottom sheet drawer) ── */}
          {toolPanelOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end"
                 onClick={() => setToolPanelOpen(false)}>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Sheet */}
              <div
                className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col z-10"
                style={{ maxHeight: '80vh' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-gray-200" />
                </div>
                {/* Sheet header */}
                <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2.5 shrink-0">
                  {activeDef && (
                    <>
                      <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                        <activeDef.icon size={13} className="text-brand" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-1">{activeDef.label}</p>
                    </>
                  )}
                  <button onClick={() => setToolPanelOpen(false)}
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 shrink-0">
                    <X size={15} />
                  </button>
                </div>
                {/* Sheet content — scrollable */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <ToolPanelContent
                    activeTool={activeTool}
                    handleToolMsg={handleToolMsg}
                    setDrawConfig={setDrawConfig}
                    drawConfig={drawConfig}
                    renderNonEditPanel={renderNonEditPanel}
                    EDIT_TOOLS={EDIT_TOOLS}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Mobile bottom toolbar ── */}
      <div className="md:hidden bg-white border-t border-gray-200 px-3 pb-safe flex items-stretch gap-2 shrink-0"
           style={{ paddingTop: '10px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>

        {/* ── Tools button ── */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-2xl
                     bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
        >
          <Menu size={24} strokeWidth={2.2} />
          <span className="text-[11px] font-bold leading-none tracking-wide uppercase">Tools</span>
        </button>

        {/* ── Active tool pill ── */}
        <button
          onClick={() => setToolPanelOpen(true)}
          className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-2xl transition-all
            ${activeDef
              ? toolPanelOpen
                ? 'bg-brand text-white shadow-md'
                : 'bg-brand-50 text-brand border-2 border-brand/20'
              : 'bg-gray-100 text-gray-300'}`}
        >
          {activeDef
            ? <activeDef.icon size={24} strokeWidth={2.2} />
            : <FileText size={24} strokeWidth={2.2} />
          }
          <span className="text-[11px] font-bold leading-none tracking-wide uppercase truncate max-w-[70px]">
            {activeDef ? activeDef.label : 'Select'}
          </span>
        </button>

        {/* ── Apply & Save — glows when pending ── */}
        <button
          onClick={doApply}
          disabled={!hasPending || applying}
          className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-2xl transition-all
            ${hasPending
              ? 'bg-green-600 text-white shadow-lg active:bg-green-700'
              : 'bg-gray-100 text-gray-300'}`}
        >
          {applying
            ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : applyDone
              ? <CheckCircle2 size={24} />
              : <span className="text-xl font-black leading-none">✓</span>
          }
          <span className="text-[11px] font-bold leading-none tracking-wide uppercase">
            {applying ? 'Saving…' : applyDone ? 'Saved!' : 'Save'}
          </span>
        </button>

        {/* ── Download ── */}
        <a
          href={fileUrl}
          download={fileName}
          className="flex flex-col items-center justify-center gap-1.5 flex-1 py-2 rounded-2xl
                     bg-gray-100 text-gray-600 active:bg-gray-200 transition-colors"
        >
          <Download size={24} strokeWidth={2.2} />
          <span className="text-[11px] font-bold leading-none tracking-wide uppercase">Download</span>
        </a>
      </div>

    </div>
  )
}
