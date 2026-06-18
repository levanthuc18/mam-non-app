import { useState, useEffect, useRef, memo } from "react";
import { C, font, noDau, PL_COLOR } from "./lib.js";

// ===== Badge phân loại =====
export function PLBadge({ pl }) {
  const c = PL_COLOR[pl] || PL_COLOR.Bthg;
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: c.bg, color: c.fg, whiteSpace: "nowrap" }}>{pl}</span>;
}

export function Badge({ s }) {
  return <span style={{ background: s.bg, color: s.c, fontFamily: font.body, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.t}</span>;
}

export function NumInput({ value, onChange, w = 70, disabled, warn }) {
  const [focused, setFocused] = useState(false);
  const display = focused
    ? (value === 0 || value == null ? "" : String(value))
    : (value === 0 || value == null ? "" : Number(value).toLocaleString("vi-VN"));
  return (
    <input type="text" inputMode="numeric" value={display} disabled={disabled} placeholder="0"
      onFocus={(e) => { if (!disabled) { setFocused(true); e.target.style.borderColor = C.pine; setTimeout(() => e.target.select(), 0); } }}
      onChange={(e) => { const digits = e.target.value.replace(/[^\d]/g, ""); onChange(digits === "" ? 0 : Number(digits)); }}
      onBlur={(e) => { setFocused(false); e.target.style.borderColor = warn ? C.amber : C.line; }}
      style={{ width: w, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${warn ? C.amber : C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: disabled ? C.graySoft : warn ? C.amberSoft : "#FAFCFA", textAlign: "right", outline: "none" }} />
  );
}

export function ABBtn({ val, set, small, disabled }) {
  return (
    <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.line}`, opacity: disabled ? 0.6 : 1 }}>
      {["A", "B"].map((p) => (
        <button key={p} onClick={() => !disabled && set(p)} style={{ padding: small ? "5px 11px" : "7px 13px", fontWeight: 700, fontSize: small ? 12 : 13, border: "none", cursor: disabled ? "default" : "pointer", background: val === p ? (p === "A" ? C.blueA : C.violetB) : "#fff", color: val === p ? "#fff" : C.sub, fontFamily: font.body }}>{p}</button>
      ))}
    </div>
  );
}

export function Chips({ items, val, set, compact }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: compact ? 2 : 4, marginBottom: compact ? 6 : 10 }}>
      {items.map(([id, lb]) => (
        <button key={id} onClick={() => set(id)} style={{ flexShrink: 0, padding: compact ? "5px 12px" : "6px 13px", borderRadius: 99, border: `1.5px solid ${val === id ? C.pine : C.line}`, cursor: "pointer", background: val === id ? C.pine : C.card, color: val === id ? "#fff" : C.sub, fontFamily: font.body, fontSize: 12.5, fontWeight: 600 }}>{lb}</button>
      ))}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.gray, fontSize: 14 }}>🔍</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "Tìm tên học sinh…"}
        style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: C.card, outline: "none" }}
        onFocus={(e) => (e.target.style.borderColor = C.pine)} onBlur={(e) => (e.target.style.borderColor = C.line)} />
      {value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: C.gray, cursor: "pointer", fontSize: 16 }}>×</button>}
    </div>
  );
}

export function useStickyShrink() {
  const sentinelRef = useRef(null);
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => setShrunk(!e.isIntersecting), { root: null, threshold: 0 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return { sentinelRef, shrunk };
}

export function StickyBar({ shrunk, children }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 22,
      background: shrunk ? "rgba(245,247,243,.96)" : "transparent",
      backdropFilter: shrunk ? "blur(6px)" : "none",
      WebkitBackdropFilter: shrunk ? "blur(6px)" : "none",
      margin: "0 -14px", padding: shrunk ? "8px 14px 2px" : "0 14px",
      borderBottom: shrunk ? `1px solid ${C.line}` : "1px solid transparent",
      boxShadow: shrunk ? "0 4px 12px -8px rgba(23,107,91,.35)" : "none",
      transition: "background .2s ease, padding .2s ease, border-color .2s ease, box-shadow .2s ease",
    }}>{children}</div>
  );
}

export function Card({ children, style }) {
  return <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: 14, ...style }}>{children}</div>;
}

export function LockNote() {
  return <div style={{ background: C.goldSoft, border: `1px solid #EAD8A0`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12.5, color: "#7A5E12" }}>🔒 Tháng này đã chốt — chỉ xem. Mở khóa ở tab Tổng quan.</div>;
}
