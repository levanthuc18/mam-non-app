// Màu / font / radius / style chung gom ở theme.js (1 file để chỉnh sửa).
import { C, font, R, SH, S } from "./theme.js";
export { C, font, R, SH, S };
export { THEMES, PALETTES, applyTheme, setTheme, getTheme, LIGHT_VARS, DEFAULT_THEME, getCustom, setCustomColor, resetCustom, currentColor, EDITABLE_COLORS } from "./theme.js";
export const fmt = (n) => (n < 0 ? "-" : "") + Math.abs(Math.round(n || 0)).toLocaleString("vi-VN");
export const ymKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;
export const stripYm = (d) => { if (!d) return d; const { __ym, ...rest } = d; return rest; };
export const uid = () => Math.random().toString(36).slice(2, 9);
export const noDau = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

// ===== Storage: Supabase HOAC window.storage + mirror RAM =====
export const SUPABASE_URL = "https://seflblpxqvedpjpqphet.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZmxibHB4cXZlZHBqcHFwaGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjI1MTYsImV4cCI6MjA5NjkzODUxNn0.SVGFvNbhaEGVsE4bSrdz2hubgTAH-LkIS-EqVMzUu9Q";
export const SB = !!(SUPABASE_URL && SUPABASE_KEY);
export const SB_H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

export const MEM = {};
export const CHOT_MEM = {};
try { const _cm = (typeof localStorage !== "undefined") && localStorage.getItem("mn5:chotmem"); if (_cm) Object.assign(CHOT_MEM, JSON.parse(_cm)); } catch {}
export function saveChotMem() { try { if (typeof localStorage !== "undefined") localStorage.setItem("mn5:chotmem", JSON.stringify(CHOT_MEM)); } catch {} }

// Đặt tên file gợi ý khi In → Lưu PDF (dùng document.title), tự khôi phục sau khi in
export function printWithName(name, delay = 0) {
  try {
    const prev = document.title;
    if (name) document.title = name;
    const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 60000);
    setTimeout(() => window.print(), delay);
  } catch { try { window.print(); } catch {} }
}

// Dọn tên file: bỏ ký tự không hợp lệ, giữ tiếng Việt
export function fileName(s) { return (s || "").replace(/[\/\\:*?"<>|]+/g, "").replace(/\s+/g, " ").trim(); }
export let storageOK = true;

// ===== Đồng bộ & offline (3 tầng) =====
// VER[k]  : updated_at server đã thấy lần cuối (phát hiện máy khác sửa)
// PENDING : hàng đợi ghi thất bại, bền qua F5/đóng app (localStorage)
const VER = {};
let PENDING = {};
try { PENDING = JSON.parse(localStorage.getItem("mn5:pendingWrites") || "{}"); } catch {}
const savePending = () => { try { localStorage.setItem("mn5:pendingWrites", JSON.stringify(PENDING)); } catch {} };
let syncErr = false;
const syncSubs = new Set();
export function getSyncState() { return { pending: Object.keys(PENDING).length, err: syncErr }; }
export function subSync(cb) { syncSubs.add(cb); cb(getSyncState()); return () => syncSubs.delete(cb); }
const notifySync = () => { const s = getSyncState(); syncSubs.forEach((cb) => { try { cb(s); } catch {} }); };
const markErr = (e) => { if (syncErr !== e) { syncErr = e; notifySync(); } };
const enqueue = (k, v) => { PENDING[k] = { __pw: 1, v, base: VER[k] ?? null }; savePending(); notifySync(); };
const dequeue = (k) => { if (k in PENDING) { delete PENDING[k]; savePending(); notifySync(); } };

// Ghi thẳng lên Supabase (không kiểm xung đột) — dùng cho flush + ghi đè
async function rawWrite(k, v) {
  const isDel = (v && v.__del) || (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
  if (isDel) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}`, { method: "DELETE", headers: SB_H });
    return r.ok;
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/data?on_conflict=key`, {
    method: "POST",
    headers: { ...SB_H, Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ key: k, value: v, updated_at: new Date().toISOString() }),
  });
  if (r.ok) { try { const d = await r.json(); if (d?.[0]?.updated_at) VER[k] = d[0].updated_at; } catch {} }
  return r.ok;
}

// Chuẩn hóa 1 mục PENDING (tương thích cả bản cũ chưa gói lẫn bản mới {__pw,v,base})
function pendVal(ent) { return (ent && ent.__pw) ? ent.v : ent; }
function pendBase(ent) { return (ent && ent.__pw) ? ent.base : undefined; }
function tenKey(k) {
  if (k === "mn5:students") return "Danh sách học sinh";
  if (k === "mn5:meta") return "Cấu hình (lớp, đơn giá…)";
  let m = k.match(/^mn5:thang:(\d{4})-(\d{2})$/); if (m) return `Bảng thu T${Number(m[2])}/${m[1]}`;
  m = k.match(/^mn5:dd:(\d{4})-(\d{2})$/); if (m) return `Điểm danh T${Number(m[2])}/${m[1]}`;
  return k;
}
async function srvVersion(k) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=updated_at`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
    if (r.ok) { const d = await r.json(); return { ok: true, ver: d?.[0]?.updated_at ?? null }; }
  } catch {}
  return { ok: false, ver: null };
}

// Đẩy hàng đợi lên server (khi có mạng lại / bấm Thử lại / định kỳ)
let flushing = false;
export async function flushPending() {
  if (flushing || !SB) return;
  const keys = Object.keys(PENDING);
  if (!keys.length) { markErr(false); return; }
  flushing = true;
  let allOk = true, sent = 0;
  const conflicts = [];
  for (const k of keys) {
    const ent = PENDING[k];
    const val = pendVal(ent), base = pendBase(ent);
    const isDel = val && val.__del;
    try {
      // Kiểm xung đột: nếu biết base version và không phải key ghi-dày → so với server.
      if (base !== undefined && base !== null && !isDel && !NO_CONFLICT.has(k)) {
        const sv = await srvVersion(k);
        if (!sv.ok) { allOk = false; continue; }          // đọc lỗi → để lần sau
        if (sv.ver && sv.ver !== base) { conflicts.push(k); allOk = false; continue; } // máy khác đã sửa → KHÔNG đè mù
      }
      if (await rawWrite(k, val)) { dequeue(k); sent++; } else allOk = false;
    } catch { allOk = false; }
  }
  markErr(!allOk);
  try {
    if (conflicts.length) { await resolveConflicts(conflicts); }
    else if (allOk && sent) { try { toast(`Đã đồng bộ ${sent} thay đổi chờ`); } catch {} }
  } finally { flushing = false; }
}

// Xử lý xung đột khi flush: hỏi người dùng ghi đè hay lấy bản máy kia (không tự đè mù).
async function resolveConflicts(keys) {
  let daLayMayKia = false;
  for (const k of keys) {
    const val = pendVal(PENDING[k]);
    let ghiDe = false;
    try {
      ghiDe = await ask(`⚠ "${tenKey(k)}" đã bị máy khác sửa trong lúc máy này offline.\n\nGhi đè bằng bản của máy này? (Hủy = giữ bản máy kia, bỏ thay đổi offline)`, { okText: "Ghi đè bản của tôi", danger: true });
    } catch { ghiDe = false; } // không hỏi được → an toàn: giữ bản máy kia
    if (ghiDe) {
      try { if (await rawWrite(k, val)) { dequeue(k); logAction(`Ghi đè xung đột khi đồng bộ (${k})`); } } catch {}
    } else {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=value,updated_at`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
        if (r.ok) { const d = await r.json(); if (d?.[0]) { MEM[k] = d[0].value; VER[k] = d[0].updated_at; } }
      } catch {}
      dequeue(k); daLayMayKia = true;
    }
  }
  if (daLayMayKia) { try { toast("Đã giữ bản máy kia — đang tải lại…"); } catch {} setTimeout(() => { try { window.location.reload(); } catch {} }, 900); }
}
if (typeof window !== "undefined") {
  window.addEventListener("online", () => { flushPending(); });
  setInterval(() => { if (Object.keys(PENDING).length) flushPending(); }, 30000);
  setTimeout(() => { if (Object.keys(PENDING).length) flushPending(); }, 2500);
}

export async function sGet(k) {
  if (SB) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=value,updated_at`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
      if (r.ok) { const d = await r.json(); const row = d?.[0]; if (row) { MEM[k] = row.value; VER[k] = row.updated_at; } return row?.value ?? MEM[k] ?? null; }
    } catch {}
    return MEM[k] ?? null;
  }
  if (k in MEM) return MEM[k];
  try { const r = await window.storage.get(k); const v = r ? JSON.parse(r.value) : null; if (v != null) MEM[k] = v; return v ?? MEM[k] ?? null; }
  catch { storageOK = false; return MEM[k] ?? null; }
}
// Đọc CÓ PHÂN BIỆT LỖI: { ok, value }.
// ok=false nghĩa là KHÔNG đọc được (mạng lỗi/timeout) — nơi gọi TUYỆT ĐỐI không được coi là "chưa có dữ liệu".
// ok=true + value=null nghĩa là server trả lời thành công và thật sự chưa có key đó.
export async function sGetSafe(k) {
  if (SB) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=value,updated_at`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
      if (r.ok) { const d = await r.json(); const row = d?.[0]; if (row) { MEM[k] = row.value; VER[k] = row.updated_at; markHad(k, row.value); return { ok: true, value: row.value }; } return { ok: true, value: null }; }
      return { ok: false, value: MEM[k] ?? null };
    } catch { return { ok: false, value: MEM[k] ?? null }; }
  }
  try { const r = await window.storage.get(k); const v = r ? JSON.parse(r.value) : null; if (v != null) MEM[k] = v; return { ok: true, value: v }; }
  catch { return { ok: false, value: MEM[k] ?? null }; }
}
export async function sProbe(k, v) {
  if (!SB) return { ok: false, status: 0, text: "no-supabase" };
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/data?on_conflict=key`, {
      method: "POST",
      headers: { ...SB_H, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ key: k, value: v, updated_at: new Date().toISOString() }),
    });
    return { ok: r.ok, status: r.status, text: r.ok ? "" : (await r.text()).slice(0, 120) };
  } catch (e) { return { ok: false, status: -1, text: String(e).slice(0, 120) }; }
}
// Các key không kiểm xung đột (ghi dày, xung đột vô hại)
const NO_CONFLICT = new Set(["mn5:log"]);
// Các key TỐI QUAN TRỌNG: không bao giờ để ghi rỗng đè lên bản đang có dữ liệu (trừ khi force = xóa chủ đích).
const PROTECT_KEYS = new Set(["mn5:students", "mn5:meta"]);
// Cờ BỀN (localStorage): đánh dấu key này ĐÃ TỪNG có dữ liệu thật — dùng làm mốc chặn kể cả khi RAM (MEM) trống lúc app vừa mở.
function hadKey(k) { try { return localStorage.getItem("mn5:had:" + k) === "1"; } catch { return false; } }
function markHad(k, v) {
  if (!PROTECT_KEYS.has(k)) return;
  let co = false;
  if (k === "mn5:students") co = Array.isArray(v) && v.length > 0;
  else if (k === "mn5:meta") co = !!(v && v.classes && v.classes.length > 0);
  try { if (co) localStorage.setItem("mn5:had:" + k, "1"); else localStorage.removeItem("mn5:had:" + k); } catch {}
}
function laRong(k, v) {
  if (k === "mn5:students") return Array.isArray(v) && v.length === 0;
  if (k === "mn5:meta") return !v || !v.classes || v.classes.length === 0;
  return false;
}
function dangCoDL(k) {
  const cur = MEM[k];
  if (k === "mn5:students") { if (Array.isArray(cur) && cur.length > 0) return true; }
  else if (k === "mn5:meta") { if (cur && cur.classes && cur.classes.length > 0) return true; }
  // MEM trống (app vừa mở) nhưng cờ bền nói TỪNG có data → vẫn coi là đang có, để chặn ghi rỗng
  return hadKey(k);
}
export async function sSet(k, v, opts = {}) {
  // ⛔ CHỐT CHẶN chống mất dữ liệu: từ chối ghi RỖNG đè lên dữ liệu đang có.
  if (!opts.force && PROTECT_KEYS.has(k) && laRong(k, v) && dangCoDL(k)) {
    try { logAction(`⛔ Đã chặn ghi rỗng đè ${k} (bản đang có còn dữ liệu)`); } catch {}
    try { toast("Đã chặn thao tác xóa toàn bộ bất thường (bảo vệ dữ liệu)"); } catch {}
    return false;
  }
  if (PROTECT_KEYS.has(k)) markHad(k, v);
  MEM[k] = v;
  const emptyObj = v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0;
  if (SB) {
    try {
      // Tầng 3 — kiểm xung đột: máy khác đã sửa key này sau lần mình đọc?
      if (!emptyObj && !NO_CONFLICT.has(k) && VER[k]) {
        try {
          const rc = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=updated_at`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
          if (rc.ok) {
            const dc = await rc.json();
            const srvVer = dc?.[0]?.updated_at;
            if (srvVer && srvVer !== VER[k]) {
              let ghiDe = true;
              try { ghiDe = await ask("⚠ Dữ liệu này vừa được máy khác cập nhật.\n\nGhi đè bằng bản trên máy này? (Chọn Hủy để lấy bản của máy kia — app sẽ tải lại)", { okText: "Ghi đè", danger: true }); } catch {}
              if (!ghiDe) {
                const rv = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=value,updated_at`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
                if (rv.ok) { const dv = await rv.json(); if (dv?.[0]) { MEM[k] = dv[0].value; VER[k] = dv[0].updated_at; } }
                try { toast("Đã giữ bản của máy kia — đang tải lại…"); } catch {}
                setTimeout(() => { try { window.location.reload(); } catch {} }, 900);
                return false;
              }
              try { logAction(`Ghi đè xung đột dữ liệu (${k})`); } catch {}
            }
          }
        } catch {}
      }
      const ok = await rawWrite(k, emptyObj ? { __del: true } : v);
      if (ok) { dequeue(k); markErr(false); return true; }
      enqueue(k, emptyObj ? { __del: true } : v); markErr(true); storageOK = false; return false;
    } catch { enqueue(k, emptyObj ? { __del: true } : v); markErr(true); storageOK = false; return false; }
  }
  try {
    if (emptyObj) { await window.storage.delete(k); return true; }
    await window.storage.set(k, JSON.stringify(v)); return true;
  } catch (e) { storageOK = false; return false; }
}
// Đẩy 1 thay đổi vào HÀNG ĐỢI BỀN (localStorage) một cách ĐỒNG BỘ — dùng khi
// app sắp đóng/ẩn để không mất các bản lưu debounce chưa kịp bắn. Lần mở sau tự flush.
// Cấp số biên lai — GỘP CHUNG cho cả in lẻ & in loạt (trước đây lặp ở 3 nơi).
// Đọc meta MỚI NHẤT từ server + lấy MAX với bản trong máy → chống trùng số cả
// khi 2 máy cùng in lẫn khi in nhiều lần liên tiếp trên 1 máy.
// rows: [{ id, nguoiThu }]. Trả { soBienLai (bản mới để lưu vào meta), capFor:{id:"BL-..."} }.
export async function capSoBienLai(meta, rows) {
  const fresh = await sGetSafe("mn5:meta");
  const serverS = (fresh.ok && fresh.value && fresh.value.soBienLai) ? fresh.value.soBienLai : {};
  const propS = (meta && meta.soBienLai) ? meta.soBienLai : {};
  const soBienLai = {};
  new Set([...Object.keys(serverS), ...Object.keys(propS)]).forEach((k) => { soBienLai[k] = Math.max(serverS[k] || 0, propS[k] || 0); });
  const capFor = {};
  (rows || []).forEach(({ id, nguoiThu }) => {
    const next = (soBienLai[nguoiThu] || 0) + 1;
    soBienLai[nguoiThu] = next;
    capFor[id] = `BL-${nguoiThu}-${String(next).padStart(4, "0")}`;
  });
  return { soBienLai, capFor };
}
export function queueWrite(k, v) {
  if (PROTECT_KEYS.has(k) && laRong(k, v) && dangCoDL(k)) return false; // không đẩy ghi rỗng đè dữ liệu
  if (PROTECT_KEYS.has(k)) markHad(k, v);
  const emptyObj = v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0;
  MEM[k] = v;
  enqueue(k, emptyObj ? { __del: true } : v);
  return true;
}
export async function sList(prefix) {
  const memKeys = Object.keys(MEM).filter((k) => k.startsWith(prefix) && MEM[k] != null);
  if (SB) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/data?select=key&key=like.${encodeURIComponent(prefix + "%")}`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
      if (r.ok) { const d = await r.json(); return Array.from(new Set([...memKeys, ...d.map((x) => x.key)])); }
    } catch {}
    return memKeys;
  }
  try { const r = await window.storage.list(prefix); const dk = r ? r.keys : []; return Array.from(new Set([...memKeys, ...dk])); }
  catch { return memKeys; }
}
export async function sDel(k) {
  delete MEM[k];
  if (SB) { try { await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}`, { method: "DELETE", headers: SB_H }); } catch {} return; }
  try { await window.storage.delete(k); } catch (e) {}
}

export const PHAN_LOAI = ["Bthg", "AE", "GV", "T7"];
export const PL_LABEL = { Bthg: "Bình thường", AE: "Anh em (−50%)", GV: "Con GV (miễn)", T7: "Chỉ thứ 7" };
export const PL_COLOR = { Bthg: { bg: C.greenSoft, fg: C.green }, AE: { bg: C.blueASoft, fg: C.blueA }, GV: { bg: C.violetBSoft, fg: C.violetB }, T7: { bg: C.amberSoft, fg: C.amber } };
export const PL_HE = { Bthg: 1, AE: 0.5, GV: 0, T7: 0 };
export const GIOI_TINH = [["nam", "Nam"], ["nu", "Nữ"]];
export const GT_LABEL = { nam: "Nam", nu: "Nữ", "": "—" };
// Chuẩn hoá giá trị giới tính từ nhập tay / file import về "nam" | "nu" | ""
export const normGt = (v) => {
  const x = noDau(String(v || "").trim().toLowerCase());
  if (["nam", "male", "m", "trai", "b", "boy", "1"].includes(x)) return "nam";
  if (["nu", "female", "f", "gai", "g", "girl", "2"].includes(x)) return "nu";
  return "";
};

export const TRANG_THAI = ["Đang học", "Học thử", "Bảo lưu", "Nghỉ học", "Ra trường"];
export const TT_COLOR = { "Đang học": C.green, "Học thử": C.blueA, "Bảo lưu": C.amber, "Nghỉ học": C.coral, "Ra trường": C.violetB };
export const TT_THU_PHI = { "Đang học": true, "Học thử": true, "Bảo lưu": false, "Nghỉ học": false, "Ra trường": false };
export { LOAI_CHI, GD_META } from "./taichinh.js";

export const KHOAN = [
  { key: "hocPhi", label: "Học phí", src: "hocPhi" },
  { key: "banTru", label: "Bán trú", src: "lopFlat" },
  { key: "veSinh", label: "Vệ sinh", src: "lopFlat" },
  { key: "tienAn", label: "Tiền ăn", src: "an" },
  { key: "tiengAnh", label: "Tiếng Anh", src: "ta" },
  { key: "ngoaiKhoa", label: "Ngoại khóa", src: "lopFlat" },
  { key: "dongPhuc", label: "Đồng phục", src: "zero" },
  { key: "dauNam", label: "Đầu năm", src: "zero" },
];
export const khoanMode = (lop, key) => {
  const m = lop?.lapLai;
  if (!m || m[key] === undefined) return "thu";
  const v = m[key];
  if (v === false || v === "khong") return "khong";
  return "thu";
};
export const isKhongThu = (lop, key) => khoanMode(lop, key) === "khong";

export const SEED_META = {
  tenTruong: "Mầm Non Tuổi Thần Tiên",
  classes: [
    { id: "c1", ten: "Sóc Nhí", hocPhi: 800000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c2", ten: "Sơn Ca", hocPhi: 800000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c3", ten: "Họa Mi", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c4", ten: "Chích Bông", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c5", ten: "Mickey", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c6", ten: "Thỏ Bông", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
  ],
  bank: { A: { chu: "Lê Thị Phương", stk: "19034529895014", nh: "Techcombank" }, B: { chu: "Lê Thị Hậu", stk: "1023827702", nh: "Vietcombank" } },
  soDuDauKy: { tienMatA: 0, tienMatB: 0, AnoB: 0, BnoA: 0 }, tyLeLaiA: 50, soBienLai: { A: 0, B: 0 },
  giaoVien: [{ id: "gv1", ten: "Cô Hoa", pin: "1111", lopId: "c1" }, { id: "gv2", ten: "Cô Lan", pin: "2222", lopId: "c2" }],
};

export function defaultKhoan(key, lop, hs, ngayAn) {
  if (!lop) return 0;
  switch (key) {
    case "hocPhi": return Math.round((lop.hocPhi || 0) * (PL_HE[hs.pl] ?? 1));
    case "banTru": return lop.banTru || 0;
    case "veSinh": return lop.veSinh || 0;
    case "tienAn": return (ngayAn || 0) * (lop.tienAn || 0);
    case "tiengAnh": return lop.tiengAnh || 0;
    case "ngoaiKhoa": return lop.ngoaiKhoa || 0;
    case "dongPhuc": return lop.dongPhuc || 0;
    case "dauNam": return lop.dauNam || 0;
    default: return 0;
  }
}

export function seedThangData(ym, students, meta) {
  const fees = {};
  students.forEach((hs) => {
    const lopId = lopOfMonth(hs, ym);
    const lop = meta.classes.find((c) => c.id === lopId);
    if (!TT_THU_PHI[hs.trangThai]) return;
    const nhap = ngayNhapHocTrongThang(hs, Number(ym.slice(0,4)), Number(ym.slice(5,7)));
    const ngayAn = nhap <= 26 ? soNgayHoc(Number(ym.slice(0,4)), Number(ym.slice(5,7)), {}, nhap) : 0;
    const rec = { ngayAn, buoiT7: hs.pl === "T7" ? 4 : 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
    KHOAN.forEach((k) => { const d = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, ngayAn); rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d; });
    fees[hs.id] = rec;
  });
  const chiPhi = [
    { id: uid(), noiDung: "Lương giáo viên", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Thực phẩm 1", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Thực phẩm 2", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Tiền điện", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Tiền nước", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
  ];
  return { fees, thuNgoai: [], chiPhi, daChot: false, khoanThuLop: [] };
}

export function lopOfMonth(hs, ym) {
  const hist = (hs.lopHistory || []).filter((h) => h.tuThang <= ym).sort((a, b) => a.tuThang.localeCompare(b.tuThang));
  return hist.length ? hist[hist.length - 1].lop : (hs.lopHistory?.[0]?.lop || null);
}
export function lopHienTai(hs) {
  const h = (hs.lopHistory || []).slice().sort((a, b) => a.tuThang.localeCompare(b.tuThang));
  return h.length ? h[h.length - 1].lop : null;
}
export function soBuoiT7Auto(year, month, attHS) {
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() === 6 && !(attHS && attHS[d])) n++;
  }
  return n;
}
export function soNgayHoc(year, month, le, tuNgay = 1) {
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = Math.max(1, tuNgay); d <= days; d++) {
    const dw = new Date(year, month - 1, d).getDay();
    if (dw === 0) continue;
    if (le && le[d]) continue;
    n++;
  }
  return n;
}
export function ngayNhapHocTrongThang(hs, year, month) {
  if (!hs || !hs.ngayNhapHoc) return 1;
  const [y, m, d] = hs.ngayNhapHoc.split("-").map(Number);
  if (y > year || (y === year && m > month)) return 99;
  if (y < year || (y === year && m < month)) return 1;
  return d;
}
export const TUAN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function tinhPSFromRec(hs, rec, lop, soNghi) {
  if (!rec) return { tong: 0, dong: [], suaCount: 0 };
  const dong = []; let tong = 0, suaCount = 0;
  if (hs.pl === "GV") return { tong: 0, dong: [["Miễn phí (con GV)", 0, false]], suaCount: 0 };

  if (hs.pl === "T7") {
    const tienT7 = (rec.buoiT7 || 0) * (rec.giaT7 ?? lop?.t7 ?? 0);
    if (tienT7) { dong.push([`T7 (${rec.buoiT7} buổi)`, tienT7, false]); tong += tienT7; }
    (rec.phuThu || []).forEach((p) => { dong.push([p.ten, p.soTien, false]); tong += p.soTien; });
    return { tong, dong, suaCount: 0 };
  }

  KHOAN.forEach((k) => {
    let val = rec.khoan?.[k.key] ?? 0;
    let def = rec.khoanDefault?.[k.key] ?? 0;
    if (k.key === "tienAn") {
      const sua = val !== def;
      if (val !== 0 || def !== 0) { dong.push([`Ăn (${rec.ngayAn || 0} ngày)`, val, sua]); tong += val; if (sua) suaCount++; }
      if (soNghi > 0) {
        const tru = -soNghi * (rec.giaAn ?? lop?.tienAn ?? 0);
        dong.push([`Trừ nghỉ tháng trước (${soNghi})`, tru, false]);
        tong += tru;
      }
      return;
    }
    if (val === 0 && def === 0) return;
    const sua = val !== def;
    dong.push([k.label, val, sua]);
    tong += val; if (sua) suaCount++;
  });
  if (rec.buoiT7 > 0) { const t = rec.buoiT7 * (rec.giaT7 ?? lop?.t7 ?? 0); dong.push([`T7 (${rec.buoiT7} buổi)`, t, false]); tong += t; }
  (rec.phuThu || []).forEach((p) => { dong.push([p.ten, p.soTien, false]); tong += p.soTien; });
  return { tong, dong, suaCount };
}

export function trangThaiThu(ps, thucThu) {
  if (ps === 0) return { t: "Miễn phí", c: C.gray, bg: C.graySoft };
  if (thucThu === 0) return { t: "Chưa thu", c: C.coral, bg: C.coralSoft };
  if (thucThu > ps) return { t: "Thu thừa", c: C.amber, bg: C.amberSoft };
  if (thucThu >= ps) return { t: "Đủ", c: C.green, bg: C.greenSoft };
  return { t: "Thiếu", c: C.coral, bg: C.coralSoft };
}

// ===== [AUDIT] Nhat ky thao tac =====
let CURRENT_ACTOR = "Admin";
// TODO: Tech Debt - Cần chuyển sang EventEmitter/Context sau
export function setCurrentActor(a) { CURRENT_ACTOR = a; }
export async function logAction(act) {
  try {
    const log = (await sGet("mn5:log")) || [];
    log.unshift({ t: new Date().toISOString(), who: CURRENT_ACTOR, act });
    if (log.length > 800) log.length = 800;
    await sSet("mn5:log", log);
  } catch {}
}

// ===== Confirm + Toast (Ref Callback) =====
let _ask = null, _toast = null;
// TODO: Tech Debt - Cần chuyển sang EventEmitter/Context sau
export function setAskRef(fn) { _ask = fn; }
export function setToastRef(fn) { _toast = fn; }
export function ask(msg, opts) { return new Promise((res) => { if (_ask) _ask({ msg, opts: opts || {}, res }); }); }
export function toast(msg, undo) { if (_toast) _toast({ msg, undo }); }

export const BANK_BIN = { "vietcombank": "970436", "vcb": "970436", "techcombank": "970407", "tcb": "970407", "bidv": "970418", "vietinbank": "970415", "ctg": "970415", "agribank": "970405", "mbbank": "970422", "mb": "970422", "acb": "970416", "vpbank": "970432", "vpb": "970432", "tpbank": "970423", "tpb": "970423", "sacombank": "970403", "stb": "970403", "hdbank": "970437", "vib": "970441", "shb": "970443", "ocb": "970448", "msb": "970426", "scb": "970429", "eximbank": "970431", "lienvietpostbank": "970449", "lpbank": "970449", "seabank": "970440", "bacabank": "970409", "vietabank": "970427", "namabank": "970428", "pgbank": "970430", "vietbank": "970433", "baovietbank": "970438", "kienlongbank": "970452", "abbank": "970425", "dongabank": "970406", "gpbank": "970408", "ncb": "970419", "saigonbank": "970400", "pvcombank": "970412" };
export function binOf(nh) { const k = noDau(nh || "").replace(/[^a-z]/g, ""); return BANK_BIN[k] || null; }

// CRC16-CCITT (False) — chuẩn VietQR/EMVCo
function crc16ccitt(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) { crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1); crc &= 0xFFFF; }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
// Dựng chuỗi QR chuyển khoản theo chuẩn VietQR/napas247 (QRIBFTTA) — tạo tại chỗ, không phụ thuộc mạng
export function buildVietQR({ bin, accountNo, amount, addInfo }) {
  const f = (t, v) => t + String(v.length).padStart(2, "0") + v;
  const acq = f("00", String(bin)) + f("01", String(accountNo));
  const mer = f("00", "A000000727") + f("01", acq) + f("02", "QRIBFTTA");
  let s = f("00", "01") + f("01", amount > 0 ? "12" : "11") + f("38", mer)
        + f("53", "704") + (amount > 0 ? f("54", String(Math.round(amount))) : "") + f("58", "VN");
  const info = String(addInfo || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^\x20-\x7E]/g, "").trim().slice(0, 25);
  if (info) s += f("62", f("08", info));
  s += "6304";
  return s + crc16ccitt(s);
}

// ===== PIN quản lý (hash SHA-256, không lưu chữ thường) =====
// Hash mặc định khi chưa từng đổi PIN; đổi xong thì mã cũ hết hiệu lực.
const PIN_MAC_DINH = "9113b98df80f877c7a2ee5d865a04c9514b4e9bf25a49d315b0b15f115d2f0d2";
export async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function getPinHash() {
  try { const h = await sGet("mn5:pinhash"); if (h && typeof h === "string") { try { localStorage.setItem("mn5:pinhash", h); } catch {} return h; } } catch {}
  try { const lc = localStorage.getItem("mn5:pinhash"); if (lc) return lc; } catch {}
  return PIN_MAC_DINH;
}
// Bản AN TOÀN: phân biệt "đọc được nhưng chưa đặt PIN" (mặc định hợp lệ) với
// "lỗi mạng + máy chưa từng lưu" (KHÔNG xác thực được → chặn, tránh PIN mặc định
// thành cửa sau trên máy lạ khi mất mạng). Trả { ok, hash }.
export async function getPinHashSafe() {
  const r = await sGetSafe("mn5:pinhash");
  if (r.ok) {
    if (r.value && typeof r.value === "string") { try { localStorage.setItem("mn5:pinhash", r.value); } catch {} return { ok: true, hash: r.value }; }
    return { ok: true, hash: PIN_MAC_DINH }; // server chưa đặt PIN → mặc định hợp lệ
  }
  try { const lc = localStorage.getItem("mn5:pinhash"); if (lc) return { ok: true, hash: lc }; } catch {}
  return { ok: false, hash: null }; // máy mới + mất mạng → không thể xác thực
}
export async function setPinHash(h) {
  try { localStorage.setItem("mn5:pinhash", h); } catch {}
  await sSet("mn5:pinhash", h);
}
export function getCurrentActor() { return CURRENT_ACTOR; }
