"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 教程配图：点击弹出灯箱，支持滚轮/按钮缩放与拖拽平移（不跳转新页）。 */
export function GuideFigure({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="guide-figure" onClick={() => setOpen(true)} aria-label={`放大查看：${alt}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" decoding="async" />
        <span className="guide-figure-zoom" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
          </svg>
        </span>
      </button>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clamp = (s: number) => Math.min(6, Math.max(1, s));

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = clamp(s + delta);
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  // 键盘：Esc 关闭，+/- 缩放，0 还原
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomBy(0.3);
      else if (e.key === "-" || e.key === "_") zoomBy(-0.3);
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, zoomBy, reset]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.3 : -0.3);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (scale <= 1) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos({ x: drag.current.px + (e.clientX - drag.current.sx), y: drag.current.py + (e.clientY - drag.current.sy) });
  }
  function onPointerUp() {
    drag.current = null;
    setDragging(false);
  }

  return (
    <div className="lb-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={alt}>
      <div
        className="lb-stage"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="lb-img"
          src={src}
          alt={alt}
          draggable={false}
          onDoubleClick={() => (scale > 1 ? reset() : zoomBy(1))}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.18s ease",
          }}
        />
      </div>

      <div className="lb-toolbar" onClick={(e) => e.stopPropagation()}>
        <button className="lb-btn" onClick={() => zoomBy(-0.4)} aria-label="缩小">−</button>
        <span className="lb-scale">{Math.round(scale * 100)}%</span>
        <button className="lb-btn" onClick={() => zoomBy(0.4)} aria-label="放大">+</button>
        <button className="lb-btn" onClick={reset} aria-label="还原">还原</button>
      </div>

      <button className="lb-close" onClick={onClose} aria-label="关闭">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}
