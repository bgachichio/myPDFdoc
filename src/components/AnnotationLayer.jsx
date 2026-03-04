/**
 * AnnotationLayer.jsx
 * Overlays for text boxes, image boxes, and freehand drawing.
 * Lives absolutely over the PDF canvas wrapper.
 *
 * Key fixes:
 *  - Draw events fire on the CANVAS element itself (not the wrapper div)
 *    so getDrawPos always measures against the right element.
 *  - Eraser uses globalCompositeOperation='destination-out' so it actually
 *    removes painted pixels instead of clearing a transparent rect.
 *  - drawConfig changes (color, brushSz, mode) are picked up live via a ref
 *    so the drawing handler always sees current values without re-registration.
 */
import React, { useRef, useState, useCallback, useEffect } from 'react'
import { X } from 'lucide-react'

const MIN_W = 50
const MIN_H = 28
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)) }

export default function AnnotationLayer({
  items, onUpdate, onRemove,
  canvasW, canvasH,
  drawConfig,      // { active, color, brushSz, mode }
  drawCanvasRef,   // forwarded ref to the <canvas> element
}) {
  /* ── drag / resize state ───────────────────────────── */
  const [drag,   setDrag]   = useState(null)
  const [resize, setResize] = useState(null)

  const onPointerMove = useCallback((e) => {
    const src = e.touches?.[0] || e
    if (drag) {
      const item = items.find(i => i.id === drag.id)
      if (!item) return
      onUpdate(drag.id, {
        x: clamp(drag.ox + src.clientX - drag.sx, 0, canvasW - item.w),
        y: clamp(drag.oy + src.clientY - drag.sy, 0, canvasH - item.h),
      })
    }
    if (resize) {
      const item = items.find(i => i.id === resize.id)
      if (!item) return
      onUpdate(resize.id, {
        w: clamp(resize.ow + src.clientX - resize.sx, MIN_W, canvasW - item.x),
        h: clamp(resize.oh + src.clientY - resize.sy, MIN_H, canvasH - item.y),
      })
    }
  }, [drag, resize, items, canvasW, canvasH, onUpdate])

  const onPointerUp = useCallback(() => { setDrag(null); setResize(null) }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup',   onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend',  onPointerUp)
    return () => {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup',   onPointerUp)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('touchend',  onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  /* ── freehand drawing ──────────────────────────────── */
  // Keep drawConfig in a ref so event handlers always see the latest value
  // without needing to re-register. This is the correct pattern for canvas drawing.
  const drawConfigRef = useRef(drawConfig)
  useEffect(() => { drawConfigRef.current = drawConfig }, [drawConfig])

  const isDrawing = useRef(false)
  const lastPos   = useRef(null)

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src  = e.touches?.[0] || e
    // Scale from CSS pixels to canvas pixels
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  // These handlers are attached directly to the <canvas> element
  const onDrawPointerDown = useCallback((e) => {
    const cfg = drawConfigRef.current
    if (!cfg?.active) return
    e.preventDefault()
    isDrawing.current = true
    const canvas = drawCanvasRef?.current
    if (!canvas) return
    lastPos.current = getPos(e, canvas)
  }, [drawCanvasRef])

  const onDrawPointerMove = useCallback((e) => {
    const cfg = drawConfigRef.current
    if (!isDrawing.current || !cfg?.active) return
    e.preventDefault()
    const canvas = drawCanvasRef?.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)

    if (cfg.mode === 'eraser') {
      // destination-out compositing: painted pixels become transparent
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, cfg.brushSz * 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.fill()
      ctx.restore()
    } else {
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = cfg.color
      ctx.lineWidth   = cfg.brushSz
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.stroke()
      ctx.restore()
    }
    lastPos.current = pos
  }, [drawCanvasRef])

  const onDrawPointerUp = useCallback(() => { isDrawing.current = false }, [])

  const drawActive = drawConfig?.active
  const cursorStyle = drawActive
    ? (drawConfig.mode === 'eraser' ? 'cell' : 'crosshair')
    : 'default'

  return (
    <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>

      {/* ── Draw canvas — receives all pointer events when active ── */}
      {drawActive && (
        <canvas
          ref={drawCanvasRef}
          width={canvasW}
          height={canvasH}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'all', cursor: cursorStyle, touchAction: 'none', zIndex: 5 }}
          onMouseDown={onDrawPointerDown}
          onMouseMove={onDrawPointerMove}
          onMouseUp={onDrawPointerUp}
          onMouseLeave={onDrawPointerUp}
          onTouchStart={onDrawPointerDown}
          onTouchMove={onDrawPointerMove}
          onTouchEnd={onDrawPointerUp}
        />
      )}

      {/* ── Text + image overlay boxes ── */}
      {items.map(item => (
        <OverlayBox
          key={item.id}
          item={item}
          onStartDrag={(e) => {
            e.stopPropagation(); e.preventDefault()
            const src = e.touches?.[0] || e
            setDrag({ id: item.id, sx: src.clientX, sy: src.clientY, ox: item.x, oy: item.y })
          }}
          onStartResize={(e) => {
            e.stopPropagation(); e.preventDefault()
            const src = e.touches?.[0] || e
            setResize({ id: item.id, sx: src.clientX, sy: src.clientY, ow: item.w, oh: item.h })
          }}
          onRemove={() => onRemove(item.id)}
          isDragging={drag?.id === item.id}
          isResizing={resize?.id === item.id}
        />
      ))}
    </div>
  )
}

/* ── OverlayBox ─────────────────────────────────────────────────────────────── */
function OverlayBox({ item, onStartDrag, onStartResize, onRemove, isDragging, isResizing }) {
  const isActive = isDragging || isResizing
  return (
    <div
      className="absolute group select-none"
      style={{ left: item.x, top: item.y, width: item.w, height: item.h, pointerEvents: 'all', zIndex: isActive ? 30 : 10 }}
    >
      {/* Border */}
      <div className={`absolute inset-0 rounded border-2 pointer-events-none transition-colors
        ${isActive ? 'border-brand' : 'border-brand/50 group-hover:border-brand'}`} />

      {/* Text content */}
      {item.type === 'text' && (
        <div className="absolute inset-0 p-1.5 overflow-hidden rounded" style={{
          background: 'rgba(255,255,255,0.88)',
          fontFamily: item.fontFamily,
          fontSize:   `${item.fontSize}px`,
          fontWeight: item.bold   ? 'bold'   : 'normal',
          fontStyle:  item.italic ? 'italic' : 'normal',
          color:      item.color,
          lineHeight: 1.35,
          wordBreak:  'break-word',
          whiteSpace: 'pre-wrap',
        }}>
          {item.text}
        </div>
      )}

      {/* Image content */}
      {item.type === 'image' && (
        <img src={item.src} alt="" draggable={false}
          className="absolute inset-0 w-full h-full object-fill rounded" />
      )}

      {/* Signature — transparent bg, contain to preserve proportions */}
      {item.type === 'signature' && (
        <img src={item.sigDataUrl} alt="signature" draggable={false}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ imageRendering: 'crisp-edges' }} />
      )}

      {/* Full-box drag target */}
      <div className="absolute inset-0 cursor-move z-10"
        onMouseDown={onStartDrag} onTouchStart={onStartDrag} />

      {/* Remove button */}
      <button
        onMouseDown={e => { e.stopPropagation(); onRemove() }}
        className="absolute -top-3 -right-3 z-20 w-5 h-5 rounded-full bg-red-500 text-white
                   flex items-center justify-center opacity-0 group-hover:opacity-100
                   hover:bg-red-600 transition-all shadow-md"
      >
        <X size={10} strokeWidth={3} />
      </button>

      {/* Resize corner */}
      <div
        className="absolute bottom-0 right-0 z-20 w-5 h-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={onStartResize} onTouchStart={onStartResize}
      >
        <svg viewBox="0 0 10 10" className="w-full h-full text-brand/80 p-0.5">
          <path d="M2 8 L8 2 M5 8 L8 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}
