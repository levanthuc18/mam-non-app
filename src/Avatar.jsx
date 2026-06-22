import { useState, useEffect, useRef } from "react";
import { C, font, sGet, sSet, sDel } from "./lib.js";

// Avatar demo theo giới tính (khi chưa có ảnh thật)
const GT_AVA = {
  nam: { emoji: "👦", bg: "#DBEAFE" },
  nu: { emoji: "👧", bg: "#FCE7F0" },
  "": { emoji: "🧒", bg: C.graySoft || "#EEF2F0" },
};

// Cache ảnh thật theo id để khỏi gọi Supabase lại mỗi lần render
const AVT_CACHE = new Map();
const avtKey = (id) => "mn5:avt:" + id;

function useAvatarSrc(hs) {
  const id = hs?.id;
  const hasAvt = !!hs?.avt;
  const [src, setSrc] = useState(() => (hasAvt && AVT_CACHE.has(id) ? AVT_CACHE.get(id) : null));
  useEffect(() => {
    if (!hasAvt) { setSrc(null); return; }
    if (AVT_CACHE.has(id)) { setSrc(AVT_CACHE.get(id)); return; }
    let alive = true;
    sGet(avtKey(id)).then((v) => { AVT_CACHE.set(id, v || null); if (alive) setSrc(v || null); }).catch(() => {});
    return () => { alive = false; };
  }, [id, hasAvt]);
  return src;
}

const readFile = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onerror = rej;
  r.onload = () => res(r.result);
  r.readAsDataURL(file);
});

export function Avatar({ hs, size = 32, onClick }) {
  const src = useAvatarSrc(hs);
  const g = GT_AVA[hs?.gt] || GT_AVA[""];
  const base = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", cursor: onClick ? "pointer" : "default",
  };
  if (src) return <div onClick={onClick} style={{ ...base, background: "#fff" }}><img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>;
  return <div onClick={onClick} style={{ ...base, background: g.bg, fontSize: Math.round(size * 0.56), lineHeight: 1 }}>{g.emoji}</div>;
}

// Màn cắt ảnh: kéo để dịch, thanh trượt zoom, chụm 2 ngón
const VIEW = 280;
const MAX_MULT = 5;

function AvatarCropper({ src, onCancel, onSave }) {
  const areaRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map());
  const gestureRef = useRef(null);
  const [nat, setNat] = useState(null); // {w,h}
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [ox, setOx] = useState(0);
  const [oy, setOy] = useState(0);
  const viewRef = useRef({ scale: 1, ox: 0, oy: 0 });
  viewRef.current = { scale, ox, oy };

  const onImgLoad = (e) => {
    const w = e.target.naturalWidth, h = e.target.naturalHeight;
    const ms = Math.max(VIEW / w, VIEW / h);
    setNat({ w, h }); setMinScale(ms); setScale(ms);
    setOx((VIEW - w * ms) / 2); setOy((VIEW - h * ms) / 2);
  };

  const clampOff = (s, x, y) => {
    const W = nat.w * s, H = nat.h * s;
    return { ox: Math.min(0, Math.max(VIEW - W, x)), oy: Math.min(0, Math.max(VIEW - H, y)) };
  };
  const apply = (s, x, y) => { const c = clampOff(s, x, y); setScale(s); setOx(c.ox); setOy(c.oy); };

  const ptPos = (e) => { const r = areaRef.current.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const rebuild = () => {
    const pts = [...pointers.current.values()];
    const v = viewRef.current;
    gestureRef.current = {
      scale: v.scale, ox: v.ox, oy: v.oy, pts: pts.map((p) => ({ ...p })),
      dist: pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0,
      mid: pts.length === 2 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : (pts[0] || { x: 0, y: 0 }),
    };
  };
  const down = (e) => { if (!nat) return; areaRef.current.setPointerCapture?.(e.pointerId); pointers.current.set(e.pointerId, ptPos(e)); rebuild(); };
  const move = (e) => {
    if (!pointers.current.has(e.pointerId) || !nat) return;
    pointers.current.set(e.pointerId, ptPos(e));
    const g = gestureRef.current; if (!g) return;
    const pts = [...pointers.current.values()];
    if (pts.length === 1 && g.pts.length >= 1) {
      apply(g.scale, g.ox + (pts[0].x - g.pts[0].x), g.oy + (pts[0].y - g.pts[0].y));
    } else if (pts.length >= 2 && g.pts.length >= 2) {
      const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const newS = Math.min(minScale * MAX_MULT, Math.max(minScale, g.scale * (curDist / (g.dist || 1))));
      const ix = (g.mid.x - g.ox) / g.scale, iy = (g.mid.y - g.oy) / g.scale;
      const curMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      apply(newS, curMid.x - ix * newS, curMid.y - iy * newS);
    }
  };
  const up = (e) => { pointers.current.delete(e.pointerId); rebuild(); };

  const zoomCenter = (newS) => {
    const s = Math.min(minScale * MAX_MULT, Math.max(minScale, newS));
    const ix = (VIEW / 2 - ox) / scale, iy = (VIEW / 2 - oy) / scale;
    apply(s, VIEW / 2 - ix * s, VIEW / 2 - iy * s);
  };
  const wheel = (e) => { if (!nat) return; e.preventDefault(); zoomCenter(scale * (e.deltaY < 0 ? 1.08 : 0.92)); };

  const save = () => {
    const OUT = 256, r = OUT / VIEW;
    const c = document.createElement("canvas"); c.width = OUT; c.height = OUT;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(imgRef.current, ox * r, oy * r, nat.w * scale * r, nat.h * scale * r);
    onSave(c.toDataURL("image/jpeg", 0.7));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 16, padding: 16, width: "100%", maxWidth: 340, fontFamily: font.body }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 12, textAlign: "center" }}>Cắt ảnh đại diện</div>
        <div
          ref={areaRef}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} onWheel={wheel}
          style={{ position: "relative", width: VIEW, height: VIEW, maxWidth: "100%", margin: "0 auto", borderRadius: 12, overflow: "hidden", background: "#111", touchAction: "none", cursor: "grab" }}
        >
          <img ref={imgRef} src={src} alt="" draggable={false} onLoad={onImgLoad} style={{ position: "absolute", left: ox, top: oy, width: nat ? nat.w * scale : "auto", height: nat ? nat.h * scale : "auto", maxWidth: "none", userSelect: "none", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: VIEW, height: VIEW, borderRadius: "50%", boxShadow: "0 0 0 9999px rgba(0,0,0,.45)", border: "2px solid rgba(255,255,255,.9)", pointerEvents: "none" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 2px 4px" }}>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input type="range" min={minScale} max={minScale * MAX_MULT} step={0.01} value={scale} onChange={(e) => zoomCenter(parseFloat(e.target.value))} style={{ flex: 1, accentColor: C.pine }} />
        </div>
        <div style={{ fontSize: 11.5, color: C.sub, textAlign: "center", marginBottom: 12 }}>Kéo để dịch ảnh · chụm 2 ngón hoặc thanh trượt để phóng to</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>Hủy</button>
          <button onClick={save} disabled={!nat} style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>Lưu ảnh</button>
        </div>
      </div>
    </div>
  );
}

export function AvatarEditor({ hs, setHS }) {
  const src = useAvatarSrc(hs);
  const [busy, setBusy] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { setCropSrc(await readFile(f)); } catch {}
  };

  const onSave = async (dataURL) => {
    setCropSrc(null); setBusy(true);
    try {
      await sSet(avtKey(hs.id), dataURL);
      AVT_CACHE.set(hs.id, dataURL);
      setHS({ avt: 1 });
    } catch {}
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    try { await sDel(avtKey(hs.id)); } catch {}
    AVT_CACHE.set(hs.id, null);
    setHS({ avt: 0 });
    setBusy(false);
  };

  const btn = { padding: "7px 14px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
      <Avatar hs={hs} size={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ ...btn, borderColor: C.pine }}>{busy ? "Đang lưu…" : (src ? "📷 Đổi ảnh" : "📷 Thêm ảnh")}</button>
          {src && !busy && <button onClick={remove} style={{ ...btn, color: C.coral, borderColor: C.coral }}>Xóa ảnh</button>}
        </div>
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>Chưa có ảnh thì hiển thị icon theo giới tính.</div>
      </div>
      {cropSrc && <AvatarCropper src={cropSrc} onCancel={() => setCropSrc(null)} onSave={onSave} />}
    </div>
  );
}
