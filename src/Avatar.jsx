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

// Đọc ảnh thật của 1 HS (nếu hs.avt). Trả về dataURL | null
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

// Cắt vuông + nén ảnh về dataURL jpeg nhỏ gọn
function fileToSquareDataURL(file, size = 128, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

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

// Khối đổi ảnh đặt trong phần Thông tin cá nhân
export function AvatarEditor({ hs, setHS }) {
  const src = useAvatarSrc(hs);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToSquareDataURL(f, 128, 0.6);
      await sSet(avtKey(hs.id), url);
      AVT_CACHE.set(hs.id, url);
      setHS({ avt: 1 });
    } catch { /* bỏ qua nếu lỗi đọc ảnh */ }
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
          <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ ...btn, borderColor: C.pine }}>{busy ? "Đang xử lý…" : (src ? "📷 Đổi ảnh" : "📷 Thêm ảnh")}</button>
          {src && !busy && <button onClick={remove} style={{ ...btn, color: C.coral, borderColor: C.coral }}>Xóa ảnh</button>}
        </div>
        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 6, lineHeight: 1.4 }}>Ảnh tự cắt vuông & nén nhẹ. Chưa có ảnh thì hiển thị icon theo giới tính.</div>
      </div>
    </div>
  );
}
