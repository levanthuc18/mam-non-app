import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { registerDismiss } from "./nav.js";
import { C, font, PL_COLOR } from "./lib.js";
import { Icon, Ii } from "./Icon.jsx";

// Emo — bọc emoji cho căn giữa, kích cỡ đều nhau (giữ emoji ở list, không thay icon)
export function Emo({ children, size = 18, box }) {
  const b = box ?? size + 4;
  return (
    <span style={{
      fontSize: size, lineHeight: 1, display: "inline-flex",
      alignItems: "center", justifyContent: "center",
      width: b, height: b, flexShrink: 0,
    }}>{children}</span>
  );
}

export function PLBadge({ pl }) { const c = PL_COLOR[pl] || PL_COLOR.Bthg; return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: c.bg, color: c.fg, whiteSpace: "nowrap" }}>{pl}</span>; }
export function Badge({ s }) { return <span style={{ background: s.bg, color: s.c, fontFamily: font.body, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.t}</span>; }

export function NumInput({ value, onChange, w = 70, disabled, warn, lazy, neg }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(null); // lazy: giữ nháp khi đang gõ, chỉ lưu khi rời ô
  const [minus, setMinus] = useState(false); // neg: đang gõ dấu "-" chưa có số
  const cur = (lazy && focused && draft != null) ? draft : value;
  const display = focused ? (cur === 0 || cur == null ? (neg && minus ? "-" : "") : String(cur)) : (cur === 0 || cur == null ? "" : Number(cur).toLocaleString("vi-VN"));
  return (
    <input type="text" inputMode="numeric" value={display} disabled={disabled} placeholder="0"
      onFocus={(e) => { if (!disabled) { setFocused(true); if (lazy) setDraft(value ?? 0); e.target.style.borderColor = C.pine; setTimeout(() => e.target.select(), 0); } }}
      onChange={(e) => { const isNeg = !!neg && /^\s*-/.test(e.target.value); if (neg) setMinus(isNeg); const digits = e.target.value.replace(/[^\d]/g, ""); const n = digits === "" ? 0 : (isNeg ? -1 : 1) * Number(digits); if (lazy) setDraft(n); else onChange(n); }}
      onKeyDown={(e) => { if (lazy && e.key === "Enter") e.target.blur(); }}
      onBlur={(e) => { setFocused(false); setMinus(false); e.target.style.borderColor = warn ? C.amber : C.line; if (lazy && draft != null) { if (draft !== (value ?? 0)) onChange(draft); setDraft(null); } }}
      style={{ width: w, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${warn ? C.amber : C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: disabled ? C.graySoft : warn ? C.amberSoft : C.card, textAlign: "right", outline: "none" }} />
  );
}

export function ABBtn({ val, set, small, disabled }) {
  return (
    <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: `1.5px solid ${C.line}`, opacity: disabled ? 0.6 : 1 }}>
      {["A", "B"].map((p) => (
        <button key={p} onClick={() => !disabled && set(p)} style={{ padding: small ? "5px 11px" : "7px 13px", fontWeight: 700, fontSize: small ? 12 : 13, border: "none", cursor: disabled ? "default" : "pointer", background: val === p ? (p === "A" ? C.blueA : C.violetB) : C.card, color: val === p ? C.onFill : C.sub, fontFamily: font.body }}>{p}</button>
      ))}
    </div>
  );
}

export function Chips({ items, val, set, compact }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: compact ? 2 : 4, marginBottom: compact ? 6 : 10 }}>
      {items.map(([id, lb]) => (
        <button key={id} onClick={() => set(id)} style={{ flexShrink: 0, padding: compact ? "5px 12px" : "6px 13px", borderRadius: 99, border: `1.5px solid ${val === id ? C.pine : C.line}`, cursor: "pointer", background: val === id ? C.pine : C.card, color: val === id ? C.onFill : C.sub, fontFamily: font.body, fontSize: 12.5, fontWeight: 600 }}>{lb}</button>
      ))}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder, style }) {
  return (
    <div style={{ position: "relative", marginBottom: 10, ...style }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.grayText, display: "flex" }}><Icon name="search" size={16} color={C.gray} /></span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Tìm tên học sinh…"}
        style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: C.card, outline: "none" }}
        onFocus={(e) => (e.target.style.borderColor = C.pine)} onBlur={(e) => (e.target.style.borderColor = C.line)} />
      {value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: C.grayText, cursor: "pointer", fontSize: 16 }}>×</button>}
    </div>
  );
}

export function useStickyShrink() {
  const sentinelRef = useRef(null);
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current; if (!el) return;
    const ob = new IntersectionObserver(([e]) => setShrunk(!e.isIntersecting), { root: null, threshold: 0 });
    ob.observe(el); return () => ob.disconnect();
  }, []);
  return { sentinelRef, shrunk };
}

export function StickyBar({ shrunk, children }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 22,
      background: shrunk ? C.bg : "transparent",
      backdropFilter: shrunk ? "blur(6px)" : "none", WebkitBackdropFilter: shrunk ? "blur(6px)" : "none",
      margin: "0 -14px", padding: shrunk ? "8px 14px 2px" : "0 14px",
      borderBottom: shrunk ? `1px solid ${C.line}` : "1px solid transparent",
      boxShadow: shrunk ? "0 4px 12px -8px rgba(13,111,168,.35)" : "none",
      transition: "background .2s ease, padding .2s ease, border-color .2s ease, box-shadow .2s ease",
    }}>{children}</div>
  );
}

export function Card({ children, style }) { return <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: 14, ...style }}>{children}</div>; }

export function LockNote() { return <div style={{ background: C.goldSoft, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12.5, color: C.amberText, display: "flex", alignItems: "center", gap: 6 }}><Icon name="lock" size={14} color={C.amberText} /> Tháng này đã chốt — chỉ xem. Mở khóa ở tab Tổng quan.</div>; }

export function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);
  const startTimeRef = useRef(null);
  const dyRef = useRef(0);
  const draggingRef = useRef(false);
  // Nút Back Android: sheet đang mở tự đăng ký "đóng tôi" (nav.js LIFO)
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => { if (!open) return; return registerDismiss(() => closeRef.current && closeRef.current()); }, [open]);
  const setT = (y, anim) => {
    const el = sheetRef.current; if (!el) return;
    el.style.transition = anim ? "transform .22s cubic-bezier(.32,.72,.35,1)" : "none";
    el.style.transform = `translateY(${y}px)`;
  };
  useEffect(() => { if (open) { dyRef.current = 0; draggingRef.current = false; requestAnimationFrame(() => setT(0, false)); } }, [open]);
  if (!open) return null;

  const onStart = (y) => { startYRef.current = y; startTimeRef.current = Date.now(); dyRef.current = 0; draggingRef.current = true; setT(0, false); };
  const onMove = (y) => {
    if (startYRef.current == null) return;
    const dy = Math.max(0, y - startYRef.current); dyRef.current = dy; setT(dy, false);
  };
  const onEnd = () => {
    if (startYRef.current == null) return;
    const dy = dyRef.current;
    const dt = Date.now() - (startTimeRef.current || 0);
    const velocity = dy / (dt || 1);
    startYRef.current = null; startTimeRef.current = null; draggingRef.current = false;
    if (dy > 90 || (dy > 30 && velocity > 0.35)) {
      setT((typeof window !== "undefined" ? window.innerHeight : 800), true);
      setTimeout(onClose, 160);
    } else { setT(0, true); }
  };

  const dragProps = {
    onTouchStart: (e) => onStart(e.touches[0].clientY),
    onTouchMove: (e) => onMove(e.touches[0].clientY),
    onTouchEnd: () => onEnd(),
    onMouseDown: (e) => onStart(e.clientY),
    onMouseMove: (e) => { if (e.buttons === 1) onMove(e.clientY); },
    onMouseUp: () => onEnd(),
    onMouseLeave: (e) => { if (draggingRef.current && e.buttons === 1) onEnd(); },
  };

  const desk = typeof window !== "undefined" && window.innerWidth >= 1024; // máy tính: ngăn kéo bên phải
  // Vẽ ra thẳng <body>: không bị khung nội dung (z-index 1) đè dưới thanh điều hướng dưới / thanh bên.
  if (desk) {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
        <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,.35)" }} />
        <div ref={sheetRef} role="dialog" aria-label={title || "Chi tiết"} style={{ width: 460, maxWidth: "100%", height: "100%", background: C.card, padding: "0 20px 24px", overflowY: "auto", boxShadow: "-8px 0 28px rgba(0,0,0,.18)" }}>
          <div style={{ position: "sticky", top: 0, background: C.card, zIndex: 2, padding: "16px 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, fontFamily: font.display, fontWeight: 700, fontSize: 18, color: C.ink }}>{title}</div>
            <button onClick={onClose} aria-label="Đóng" style={{ width: 36, height: 36, borderRadius: 99, border: "none", background: C.graySoft, color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ii name="x" size={16} /></button>
          </div>
          <div>{children}</div>
        </div>
      </div>, document.body
    );
  }
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,.45)" }} />
      <div ref={sheetRef} style={{ background: C.card, borderRadius: "20px 20px 0 0", padding: "0 16px calc(24px + env(safe-area-inset-bottom, 0px))", maxHeight: "82vh", overflowY: "auto", boxShadow: "0 -4px 24px rgba(0,0,0,.18)", willChange: "transform" }}>
        <div {...dragProps} style={{ touchAction: "none", cursor: "grab", margin: "0 -16px", padding: "10px 16px 2px", position: "sticky", top: 0, background: C.card, zIndex: 2 }}>
          <div style={{ width: 44, height: 5, borderRadius: 99, background: C.line, margin: "0 auto 12px" }} />
          {title && <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.ink, marginBottom: 8 }}>{title}</div>}
          <button onClick={onClose} aria-label="Đóng" style={{ position: "absolute", top: 8, right: 10, width: 32, height: 32, borderRadius: 99, border: "none", background: C.graySoft, color: C.sub, fontSize: 17, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ii name="x" size={14} /></button>
        </div>
        <div style={{ paddingTop: 8 }}>{children}</div>
      </div>
    </div>, document.body
  );
}

// DragDialog — hộp thoại GIỮA màn hình cho máy tính: nền mờ, nhấn giữ thanh tiêu đề để kéo, Esc / bấm nền để đóng.
// (Điện thoại dùng BottomSheet như cũ.)
export function DragDialog({ open, onClose, title, children, width = 460 }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [keo, setKeo] = useState(false);
  const drag = useRef(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => { if (open) { setPos({ x: 0, y: 0 }); setKeo(false); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") closeRef.current && closeRef.current(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  if (!open) return null;
  const clamp = (x, y) => {
    const mx = Math.max(0, window.innerWidth / 2 - 80), my = Math.max(0, window.innerHeight / 2 - 40);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  };
  const down = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest("button")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setKeo(true);
  };
  const move = (e) => { const d = drag.current; if (!d) return; setPos(clamp(d.ox + e.clientX - d.sx, d.oy + e.clientY - d.sy)); };
  const up = () => { drag.current = null; setKeo(false); };
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(20,40,30,.5)" }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        style={{ width, maxWidth: "100%", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: C.card, borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,.2)", transform: `translate(${pos.x}px, ${pos.y}px)` }}>
        <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} title="Nhấn giữ để kéo"
          style={{ cursor: keo ? "grabbing" : "grab", userSelect: "none", touchAction: "none", padding: "10px 20px 4px" }}>
          <div aria-hidden="true" style={{ width: 44, height: 5, borderRadius: 99, background: C.line, margin: "0 auto 10px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, fontFamily: font.display, fontWeight: 700, fontSize: 18, color: C.ink }}>{title}</div>
            <button onClick={onClose} aria-label="Đóng" style={{ width: 32, height: 32, borderRadius: 99, border: "none", background: C.graySoft, color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ii name="x" size={14} /></button>
          </div>
        </div>
        <div style={{ padding: "8px 20px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

// TieuDeTrang — tiêu đề trang cho MÁY TÍNH: một kiểu duy nhất (chữ, không biểu tượng) để các màn đồng nhất.
export function TieuDeTrang({ tieuDe, phu, style }) {
  return (
    <div style={{ minWidth: 0, ...style }}>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 26, color: C.ink, lineHeight: 1.15, whiteSpace: "nowrap" }}>{tieuDe}</div>
      {phu && <div style={{ fontSize: 13.5, color: C.sub, marginTop: 2, whiteSpace: "nowrap" }}>{phu}</div>}
    </div>
  );
}

// Button — nút chuẩn dùng class trong ui.css (có hover, nhấn, focus bàn phím, trạng thái tải). Dùng thay cho <button style={{…}}> khi viết màn mới.
// variant: "primary" (một nút chính mỗi màn) | "secondary" (mặc định) | "danger" (thao tác phá huỷ) | "ghost". loading=true → khoá nút và báo aria-busy.
export function Button({ variant = "secondary", block, loading, className = "", children, ...rest }) {
  const cls = `mn-btn mn-btn--${variant}${block ? " mn-btn--block" : ""}${className ? " " + className : ""}`;
  return <button type="button" {...rest} className={cls} disabled={rest.disabled || loading} aria-busy={loading ? "true" : undefined}>{children}</button>;
}


// ===== BIỂU ĐỒ DÙNG CHUNG (mọi vòng tròn / thanh tiến độ trong app dùng 3 thứ này) =====
// Ring: vòng tròn % (nét bo tròn, nền vòng màu C.line, số % to + nhãn nhỏ bên dưới khi đủ lớn)
export function Ring({ pct, color, size = 112, sub, isGhost = false }) {
  const stroke = Math.max(6, Math.round(size * 0.11));
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, cx = size / 2;
  const off = circ * (1 - Math.min(100, Math.max(0, pct || 0)) / 100);
  const coNhan = !!sub && size >= 90;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} role="img" aria-label={isGhost ? "Chưa có số liệu" : `${pct}%${sub ? " " + sub : ""}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
      {!isGhost && <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cx})`} />}
      <text x="50%" y={coNhan ? "47%" : "50%"} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: font.display, fontWeight: 800, fontSize: size * (coNhan ? 0.27 : 0.25), fill: C.ink }}>{isGhost ? "—" : `${pct}%`}</text>
      {coNhan && <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: size * 0.125, fill: C.sub }}>{isGhost ? "Chờ DD" : sub}</text>}
    </svg>
  );
}
// Bar: thanh tiến độ (nền thanh = màu thanh pha nhạt, bo tròn hẳn)
export function Bar({ pct, color = C.pine, h = 12, style }) {
  return (
    <div style={{ height: h, borderRadius: 99, overflow: "hidden", background: `color-mix(in srgb, ${color} 16%, var(--c-card))`, ...style }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct || 0))}%`, height: "100%", background: color, borderRadius: 99, transition: "width .3s" }} />
    </div>
  );
}
// Màu theo tỉ lệ: từ ngưỡng cao trở lên xanh lá, từ ngưỡng giữa vàng, còn lại đỏ
export const mauTheoTyLe = (pct, cao = 80, giua = 50) => (pct >= cao ? C.green : pct >= giua ? C.amber : C.coral);

// Segmented: TAB CON / công tắc chế độ dùng chung (nền xám nhạt, viền, nút đang chọn tô màu chủ đạo).
// items: [[khoá, nhãn, tên-icon?], …]; scroll: cuộn ngang khi hẹp; wrap: xuống dòng; full: dàn đều hết chiều ngang; small: nhỏ gọn.
export function Segmented({ items, value, onChange, scroll, wrap, full, small, style, className }) {
  return (
    <div role="tablist" className={className} style={{ display: full ? "flex" : "inline-flex", gap: 2, background: C.graySoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: 3, maxWidth: "100%", boxSizing: "border-box", overflowX: scroll ? "auto" : undefined, flexWrap: wrap ? "wrap" : "nowrap", ...style }}>
      {items.map(([k, label, icon]) => {
        const on = value === k;
        return (
          <button key={k} role="tab" aria-selected={on} aria-pressed={on} onClick={() => onChange(k)}
            style={{ flex: full ? 1 : "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: small ? "6px 12px" : "8px 14px", whiteSpace: "nowrap", border: "none", borderRadius: 10, background: on ? C.pine : "transparent", color: on ? C.onFill : C.ink, fontFamily: font.display, fontWeight: 700, fontSize: small ? 12.5 : 13.5, cursor: "pointer" }}>
            {icon && <Icon name={icon} size={small ? 14 : 16} color={on ? C.onFill : C.ink} />}{label}
          </button>
        );
      })}
    </div>
  );
}
