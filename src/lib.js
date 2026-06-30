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

export async function sGet(k) {
  if (SB) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=value`, { headers: { ...SB_H, "Cache-Control": "no-cache" }, cache: "no-store" });
      if (r.ok) { const d = await r.json(); const v = d?.[0] ? d[0].value : null; if (v != null) MEM[k] = v; return v ?? MEM[k] ?? null; }
    } catch {}
    return MEM[k] ?? null;
  }
  if (k in MEM) return MEM[k];
  try { const r = await window.storage.get(k); const v = r ? JSON.parse(r.value) : null; if (v != null) MEM[k] = v; return v ?? MEM[k] ?? null; }
  catch { storageOK = false; return MEM[k] ?? null; }
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
export async function sSet(k, v) {
  MEM[k] = v;
  const emptyObj = v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0;
  if (SB) {
    try {
      if (emptyObj) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}`, { method: "DELETE", headers: SB_H });
        if (!r.ok) storageOK = false;
        return r.ok;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/data?on_conflict=key`, {
        method: "POST",
        headers: { ...SB_H, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ key: k, value: v, updated_at: new Date().toISOString() }),
      });
      if (!r.ok) storageOK = false;
      return r.ok;
    } catch { storageOK = false; return false; }
  }
  try {
    if (emptyObj) { await window.storage.delete(k); return true; }
    await window.storage.set(k, JSON.stringify(v)); return true;
  } catch (e) { storageOK = false; return false; }
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
export const LOAI_CHI = ["PHAT_SINH", "CO_DINH", "NO_AB", "CHUYEN", "TRA_NO", "RUT_LOI", "HOAN_UNG"];

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
    const tienT7 = (rec.buoiT7 || 0) * (lop?.t7 || 0);
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
        const tru = -soNghi * (lop?.tienAn || 0);
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
  if (rec.buoiT7 > 0) { const t = rec.buoiT7 * (lop?.t7 || 0); dong.push([`T7 (${rec.buoiT7} buổi)`, t, false]); tong += t; }
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
