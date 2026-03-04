/**
 * OverlayCanvas.jsx
 *
 * Renders draggable, resizable overlay elements on top of the PDF canvas.
 * All positions are stored as pixel values relative to the PDF canvas element.
 * The parent passes canvasRect (getBoundingClientRect of the PDF canvas).
 */
import React, { useRef, useState, useCallback, useEffect } from 'react'
import { X, Move, GripSE } from 'lucide-react'

const MIN_W = 60
const MIN_H = 30

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)) }

export default function OverlayCanvas({ items, onUpdate, onRemove, canvasRect }) {
  const [dragging,  setDragging]  = useState(null)  // { id, startMouseX, startMouseY, startX, startY }
  const [resizing,  setResizing]  = useState(null)  // { id, startMouseX, startMouseY, startW, startH }
  const containerRef = useRef(null)

  // ── Drag ────────────────────────────────────────────
  const startDrag = useCallback((e, id) => {
    e.stopPropagation()
    e.preventDefault()
    const src    = e.touches?.[0] || e
    const item   = items.find(i => i.id === id)
    setDragging({ id, startMouseX: src.clientX, startMouseY: src.clientY, startX: item.x, startY: item.y })
  }, [items])

  const onMove = useCallback((e) => {
    const src = e.touches?.[0] || e
    if (dragging) {
      const dx = src.clientX - dragging.startMouseX
      const dy = src.clientY - dragging.startMouseY
      const item = items.find(i => i.id === dragging.id)
      const maxX = canvasRect.width  - item.w
      const maxY = canvasRect.height - item.h
      onUpdate(dragging.id, {
        x: clamp(dragging.startX + dx, 0, maxX),
        y: clamp(dragging.startY + dy, 0, maxY),
      })
    }
    if (resizing) {
      const dx   = src.clientX - resizing.startMouseX
      const dy   = src.clientY - resizing.startMouseY
      const item = items.find(i => i.id === resizing.id)
      const maxW = canvasRect.width  - item.x
      const maxH = canvasRect.height - item.y
      onUpdate(resizing.id, {
        w: clamp(resizing.startW + dx, MIN_W, maxW),
        h: clamp(resizing.startH + dy, MIN_H, maxH),
      })
    }
  }, [dragging, resizing, items, canvasRect, onUpdate])

  const onEnd = useCallback(() => {
    setDragging(null)
    setResizing(null)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend',  onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onEnd)
    }
  }, [onMove, onEnd])

  const startResize = useCallback((e, id) => {
    e.stopPropagation()
    e.preventDefault()
    const src  = e.touches?.[0] || e
    const item = items.find(i => i.id === id)
    setResizing({ id, startMouseX: src.clientX, startMouseY: src.clientY, startW: item.w, startH: item.h })
  }, [items])

  if (!canvasRect || canvasRect.width === 0) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: canvasRect.width, height: canvasRect.height }}
    >
      {items.map(item => (
        <OverlayItem
          key={item.id}
          item={item}
          onStartDrag={startDrag}
          onStartResize={startResize}
          onRemove={onRemove}
          isActive={dragging?.id === item.id || resizing?.id === item.id}
        />
      ))}
    </div>
  )
}

function OverlayItem({ item, onStartDrag, onStartResize, onRemove, isActive }) {
  return (
    <div
      className="absolute group"
      style={{
        left:    item.x,
        top:     item.y,
        width:   item.w,
        height:  item.h,
        pointerEvents: 'all',
        zIndex: isActive ? 20 : 10,
      }}
    >
      {/* Border + selection ring */}
      <div
        className={`absolute inset-0 border-2 rounded-md transition-colors
          ${isActive ? 'border-brand' : 'border-brand/60 group-hover:border-brand'}`}
        style={{ background: item.type === 'draw' ? 'transparent' : 'rgba(255,255,255,0.0)' }}
      />

      {/* Content */}
      <div className="absolute inset-0 overflow-hidden rounded-sm">
        {item.type === 'text' && (
          <div
            className="w-full h-full flex items-start p-1 overflow-hidden select-none"
            style={{
              fontFamily:  item.fontFamily,
              fontSize:    item.fontSize,
              fontWeight:  item.bold ? 'bold' : 'normal',
              fontStyle:   item.italic ? 'italic' : 'normal',
              color:       item.color,
              lineHeight:  1.3,
              background: 'rgba(255,255,255,0.85)',
              wordBreak: 'break-word',
            }}
          >
            {item.text || <span className="text-gray-300 italic text-xs">Click to edit…</span>}
          </div>
        )}
        {item.type === 'image' && item.src && (
          <img src={item.src} alt="" className="w-full h-full object-fill" draggable={false} />
        )}
        {item.type === 'image' && !item.src && (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-xs">
            No image
          </div>
        )}
        {item.type === 'draw' && (
          <canvas
            ref={el => { if (el && item.canvasRef) item.canvasRef.current = el }}
            width={Math.round(item.w)}
            height={Math.round(item.h)}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
          />
        )}
      </div>

      {/* Drag handle — top bar */}
      <div
        className="absolute -top-5 left-0 right-6 h-5 flex items-center px-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={e => onStartDrag(e, item.id)}
        onTouchStart={e => onStartDrag(e, item.id)}
        title="Drag to move"
      >
        <div className="flex gap-0.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-brand/70" />
          ))}
        </div>
      </div>

      {/* Remove button */}
      <button
        className="absolute -top-5 right-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center
                   opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-30"
        onMouseDown={e => { e.stopPropagation(); onRemove(item.id) }}
        onClick={e => { e.stopPropagation(); onRemove(item.id) }}
        title="Remove"
      >
        <X size={10} strokeWidth={3} />
      </button>

      {/* Drag overlay for whole box */}
      <div
        className="absolute inset-0 cursor-move"
        onMouseDown={e => onStartDrag(e, item.id)}
        onTouchStart={e => onStartDrag(e, item.id)}
      />

      {/* Resize handle — bottom-right */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end justify-end p-0.5"
        onMouseDown={e => onStartResize(e, item.id)}
        onTouchStart={e => onStartResize(e, item.id)}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-brand">
          <path d="M1 7L7 1M4 7L7 4M7 7L7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}
