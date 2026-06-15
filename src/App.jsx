import { useState, useEffect, useRef, useMemo, memo } from "react";

// ====================================================================
// QUAN LY MAM NON — v5 (BẢN FULL SỬA LỖI CRASH VÀ ĐỒNG BỘ CHỐT THÁNG)
//  + Lich su chuyen lop (lopHistory theo thang) - Đã chống crash rỗng
//  + Trang thai HS: Dang hoc / Nghi hoc / Tot nghiep
//  + Ngay nhap hoc
//  + Phi linh hoat tung HS/thang: moi khoan luu {gia, default}
//  + Khoan thu dong: them bat ky, ap cho ca lop
//  + Cong no luy ke xuyen thang (bu tru thua/thieu) + bao cao tong no
//  + Tim kiem bo dau (Thu phi + Diem danh)
//  + Diem danh theo lop + theo ngay (mac dinh hom nay) + bang thang
//  + Chi phi A/B, no noi bo A<->B, chot thang, phieu thu PDF
// ====================================================================

const C = {
  bg: "#F5F7F3", card: "#FFFFFF", ink: "#1C3530", sub: "#5C7068",
  pine: "#176B5B", pineSoft: "#E2F0EB",
  coral: "#D14B32", coralSoft: "#FBEAE5",
  green: "#2E8F63", greenSoft: "#E4F3EA",
  amber: "#A8731B", amberSoft: "#FBF1DC",
  gray: "#8A938E", graySoft: "#EEF1EE", line: "#E3E8E2",
  blueA: "#2F6FBF", blueASoft: "#E7F0FB",
  violetB: "#8A56B8", violetBSoft: "#F2EAFA",
  gold: "#C99A2E", goldSoft: "#FBF1D8",
};

const font = { display: "'Baloo 2', system-ui, sans-serif", body: "'Be Vietnam Pro', system-ui, sans-serif" };
const fmt = (n) => (n < 0 ? "-" : "") + Math.abs(Math.round(n || 0)).toLocaleString("vi-VN");
const ymKey = (y, m) => `${y}-${String(m).padStart(2, "0")}`;
const stripYm = (d) => { if (!d) return d; const { __ym, ...rest } = d; return rest; };
const uid = () => Math.random().toString(36).slice(2, 9);
const noDau = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

// ===== Storage: Supabase =====
const SUPABASE_URL = "https://seflblpxqvedpjpqphet.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZmxibHB4cXZlZHBqcHFwaGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjI1MTYsImV4cCI6MjA5NjkzODUxNn0.SVGFvNbhaEGVsE4bSrdz2hubgTAH-LkIS-EqVMzUu9Q";
const SB = !!(SUPABASE_URL && SUPABASE_KEY);
const SB_H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const MEM = {};
let storageOK = true;

async function sGet(k) {
  if (SB) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}&select=value`, { headers: SB_H });
      if (r.ok) { const d = await r.json(); const v = d?.[0] ? d[0].value : null; MEM[k] = v; return v; }
    } catch {}
    return MEM[k] ?? null;
  }
  if (k in MEM) return MEM[k];
  try { const r = await window.storage.get(k); const v = r ? JSON.parse(r.value) : null; MEM[k] = v; return v; }
  catch { storageOK = false; return MEM[k] ?? null; }
}

async function sSet(k, v) {
  MEM[k] = v;
  if (SB) {
    try {
      const p = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}`, { method: "PATCH", headers: { ...SB_H, Prefer: "return=representation" }, body: JSON.stringify({ value: v, updated_at: new Date().toISOString() }) });
      const txt = await p.text();
      if (p.status === 404 || txt === "[]") {
        await fetch(`${SUPABASE_URL}/rest/v1/data`, { method: "POST", headers: { ...SB_H, Prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify({ key: k, value: v }) });
      }
    } catch {}
    return;
  }
  try { await window.storage.set(k, JSON.stringify(v)); } catch (e) { storageOK = false; }
}

async function sList(prefix) {
  const memKeys = Object.keys(MEM).filter((k) => k.startsWith(prefix) && MEM[k] != null);
  if (SB) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/data?select=key&key=like.${encodeURIComponent(prefix + "%")}`, { headers: SB_H });
      if (r.ok) { const d = await r.json(); return Array.from(new Set([...memKeys, ...d.map((x) => x.key)])); }
    } catch {}
    return memKeys;
  }
  try { const r = await window.storage.list(prefix); const dk = r ? r.keys : []; return Array.from(new Set([...memKeys, ...dk])); }
  catch { return memKeys; }
}

async function sDel(k) {
  delete MEM[k];
  if (SB) { try { await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}`, { method: "DELETE", headers: SB_H }); } catch {} return; }
  try { await window.storage.delete(k); } catch (e) {}
}

const PHAN_LOAI = ["Bthg", "AE", "GV", "T7"];
const PL_LABEL = { Bthg: "Bình thường", AE: "Anh em (−50%)", GV: "Con GV (miễn)", T7: "Chỉ thứ 7" };
const PL_HE = { Bthg: 1, AE: 0.5, GV: 0, T7: 0 };
const TRANG_THAI = ["Đang học", "Học thử", "Bảo lưu", "Nghỉ học", "Ra trường"];
const TT_COLOR = { "Đang học": C.green, "Học thử": C.blueA, "Bảo lưu": C.amber, "Nghỉ học": C.coral, "Ra trường": C.violetB };
const TT_THU_PHI = { "Đang học": true, "Học thử": true, "Bảo lưu": false, "Nghỉ học": false, "Ra trường": false };
const LOAI_CHI = ["PHAT_SINH", "CO_DINH", "NO_AB", "CHUYEN"];

const KHOAN = [
  { key: "hocPhi", label: "Học phí", src: "hocPhi" },
  { key: "banTru", label: "Bán trú", src: "lopFlat" },
  { key: "veSinh", label: "Vệ sinh", src: "lopFlat" },
  { key: "tienAn", label: "Tiền ăn", src: "an" },
  { key: "tiengAnh", label: "Tiếng Anh", src: "ta" },
  { key: "ngoaiKhoa", label: "Ngoại khóa", src: "lopFlat" },
  { key: "dongPhuc", label: "Đồng phục", src: "zero" },
  { key: "dauNam", label: "Đầu năm", src: "zero" },
];

const khoanMode = (lop, key) => {
  const m = lop?.lapLai;
  if (!m || m[key] === undefined) return "thu";
  const v = m[key];
  if (v === false || v === "khong") return "khong";
  return "thu";
};
const isKhongThu = (lop, key) => khoanMode(lop, key) === "khong";

const SEED_META = {
  tenTruong: "Mầm Non Tuổi Thần Tiên",
  classes: [
    { id: "c1", ten: "Sóc Nhí", hocPhi: 800000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c2", ten: "Sơn Ca", hocPhi: 800000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c3", ten: "Họa Mi", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c4", ten: "Chích Bông", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c5", ten: "Mickey", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
    { id: "c6", ten: "Thỏ Bông", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dongPhuc: 200000, dauNam: 1200000, lapLai: { dauNam: "khong", dongPhuc: "khong" } },
  ],
  bank: {
    A: { chu: "Lê Thị Phương", stk: "19034529895014", nh: "Techcombank" },
    B: { chu: "Lê Thị Hậu", stk: "1023827702", nh: "Vietcombank" },
  },
  soDuDauKy: { tienMatA: 0, tienMatB: 0, AnoB: 0, BnoA: 0 },
  tyLeLaiA: 50,
  soBienLai: { A: 0, B: 0 },
  giaoVien: [
    { id: "gv1", ten: "Cô Hoa", pin: "1111", lopId: "c1" },
    { id: "gv2", ten: "Cô Lan", pin: "2222", lopId: "c2" },
  ],
};

function defaultKhoan(key, lop, hs, ngayAn) {
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

function seedThangData(ym, students, meta) {
  const fees = {};
  students.forEach((hs) => {
    const lopId = lopOfMonth(hs, ym);
    const lop = meta.classes.find((c) => c.id === lopId);
    if (!TT_THU_PHI[hs.trangThai]) return;
    const ngayAn = 24;
    const rec = { ngayAn, buoiT7: hs.pl === "T7" ? 4 : 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
    KHOAN.forEach((k) => {
      const d = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, ngayAn);
      rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d;
    });
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

// [FIX CRASH] Đảm bảo luôn kiểm tra sự tồn tại của `hs.lopHistory` bằng toán tử `|| []`
function lopOfMonth(hs, ym) {
  if (!hs) return null;
  const historyList = hs.lopHistory || [];
  const hist = historyList.filter((h) => h && h.tuThang && h.tuThang <= ym).sort((a, b) => a.tuThang.localeCompare(b.tuThang));
  if (hist.length) return hist[hist.length - 1].lop;
  if (historyList[0]?.lop) return historyList[0].lop;
  return hs.lop || null; // Fallback nếu cấu trúc cũ chỉ có thuộc tính lop phẳng
}

function lopHienTai(hs) {
  if (!hs) return null;
  const historyList = hs.lopHistory || [];
  if (historyList.length) {
    const h = [...historyList].sort((a, b) => a.tuThang.localeCompare(b.tuThang));
    return h[h.length - 1].lop;
  }
  return hs.lop || null;
}

function soBuoiT7Auto(year, month, attHS) {
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() === 6 && !(attHS && attHS[d])) n++;
  }
  return n;
}

function soNgayHoc(year, month, le) {
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    const dw = new Date(year, month - 1, d).getDay();
    if (dw === 0) continue;
    if (le && le[d]) continue;
    n++;
  }
  return n;
}
const TUAN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function tinhPSFromRec(hs, rec, lop, soNghi) {
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
      if (val !== 0 || def !== 0) {
        dong.push([`Ăn (${rec.ngayAn || 0} ngày)`, val, sua]);
        tong += val;
        if (sua) suaCount++;
      }
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

function trangThaiThu(ps, thucThu) {
  if (ps === 0) return { t: "Miễn phí", c: C.gray, bg: C.graySoft };
  if (thucThu === 0) return { t: "Chưa thu", c: C.coral, bg: C.coralSoft };
  if (thucThu > ps) return { t: "Thu thừa", c: C.amber, bg: C.amberSoft };
  if (thucThu >= ps) return { t: "Đủ", c: C.green, bg: C.greenSoft };
  return { t: "Thiếu", c: C.coral, bg: C.coralSoft };
}

function Badge({ s }) { return <span style={{ background: s.bg, color: s.c, fontFamily: font.body, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.t}</span>; }

function NumInput({ value, onChange, w = 70, disabled, warn }) {
  const [focused, setFocused] = useState(false);
  const display = focused ? (value === 0 || value == null ? "" : String(value)) : (value === 0 || value == null ? "" : Number(value).toLocaleString("vi-VN"));
  return (
    <input type="text" inputMode="numeric" value={display} disabled={disabled} placeholder="0"
      onFocus={(e) => { if (!disabled) { setFocused(true); e.target.style.borderColor = C.pine; setTimeout(() => e.target.select(), 0); } }}
      onChange={(e) => { const digits = e.target.value.replace(/[^\d]/g, ""); onChange(digits === "" ? 0 : Number(digits)); }}
      onBlur={(e) => { setFocused(false); e.target.style.borderColor = warn ? C.amber : C.line; }}
      style={{ width: w, padding: "6px 8px", borderRadius: 8, border: `1.5px solid ${warn ? C.amber : C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: disabled ? C.graySoft : warn ? C.amberSoft : "#FAFCFA", textAlign: "right", outline: "none" }} />
  );
}

function ABBtn({ val, set, small, disabled }) {
  return (
    <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.line}`, opacity: disabled ? 0.6 : 1 }}>
      {["A", "B"].map((p) => (
        <button key={p} onClick={() => !disabled && set(p)} style={{ padding: small ? "5px 11px" : "7px 13px", fontWeight: 700, fontSize: small ? 12 : 13, border: "none", cursor: disabled ? "default" : "pointer", background: val === p ? (p === "A" ? C.blueA : C.violetB) : "#fff", color: val === p ? "#fff" : C.sub, fontFamily: font.body }}>{p}</button>
      ))}
    </div>
  );
}

function Chips({ items, val, set }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
      {items.map(([id, lb]) => (
        <button key={id} onClick={() => set(id)} style={{ flexShrink: 0, padding: "6px 13px", borderRadius: 99, border: `1.5px solid ${val === id ? C.pine : C.line}`, cursor: "pointer", background: val === id ? C.pine : C.card, color: val === id ? "#fff" : C.sub, fontFamily: font.body, fontSize: 12.5, fontWeight: 600 }}>{lb}</button>
      ))}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
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

function Card({ children, style }) { return <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: 14, ...style }}>{children}</div>; }
function LockNote() { return <div style={{ background: C.goldSoft, border: `1px solid #EAD8A0`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12.5, color: "#7A5E12" }}>🔒 Tháng này đã chốt — chỉ xem số liệu. Bạn có thể mở khóa ở mục Cài đặt hệ thống.</div>; }

let _ask = null, _toast = null;
function ask(msg, opts) { return new Promise((res) => { _ask && _ask({ msg, opts: opts || {}, res }); }); }
function toast(msg, undo) { _toast && _toast({ msg, undo }); }

let CURRENT_ACTOR = "Admin";
async function logAction(act) {
  try {
    const log = (await sGet("mn5:log")) || [];
    log.unshift({ t: new Date().toISOString(), who: CURRENT_ACTOR, act });
    if (log.length > 800) log.length = 800;
    await sSet("mn5:log", log);
  } catch {}
}

function ConfirmHost() {
  const [state, setState] = useState(null);
  useEffect(() => { _ask = (s) => setState(s); return () => { _ask = null; }; }, []);
  if (!state) return null;
  const close = (v) => { state.res(v); setState(null); };
  const danger = state.opts.danger;
  return (
    <div onClick={() => close(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,40,30,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, maxWidth: 380, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 14.5, color: C.ink, whiteSpace: "pre-line", lineHeight: 1.55, marginBottom: 18 }}>{state.msg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => close(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.cancelText || "Hủy"}</button>
          <button onClick={() => close(true)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: danger ? C.coral : C.pine, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.okText || "Đồng ý"}</button>
        </div>
      </div>
    </div>
  );
}

function ToastHost() {
  const [state, setState] = useState(null);
  const t = useRef(null);
  useEffect(() => { _toast = (s) => { setState(s); clearTimeout(t.current); t.current = setTimeout(() => setState(null), s && s.undo ? 6000 : 2600); }; return () => { _toast = null; }; }, []);
  if (!state) return null;
  return (
    <div style={{ position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: C.ink, color: "#fff", padding: "11px 18px", borderRadius: 99, fontSize: 13.5, fontWeight: 600, maxWidth: "90%", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10 }}>
      <span>{state.msg}</span>
      {state.undo && <button onClick={() => { state.undo(); clearTimeout(t.current); setState(null); }} style={{ background: "#fff", color: C.ink, border: "none", borderRadius: 99, padding: "4px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>↩ Hoàn tác</button>}
    </div>
  );
}

function LoginScreen({ meta, onLogin }) {
  const [mode, setMode] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const tryAdmin = () => { if (pin.trim() === "1989") onLogin({ role: "admin" }); else setErr("Mã quản lý không đúng"); };
  const tryGV = () => { const gv = meta?.giaoVien?.find((g) => g.pin === pin.trim()); if (gv) onLogin({ role: "gv", gvId: gv.id, ten: gv.ten, lopId: gv.lopId }); else setErr("PIN không đúng"); };
  const lopTen = (id) => meta?.classes.find((c) => c.id === id)?.ten || "?";
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: font.body }}>
      <div style={{ background: C.card, borderRadius: 20, padding: "30px 26px", width: "100%", maxWidth: 360, boxShadow: "0 8px 30px rgba(0,0,0,.08)", textAlign: "center" }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: C.pine }}>{meta?.tenTruong || "Mầm Non"}</div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 22 }}>Quản lý điểm danh & thu phí</div>
        {!mode && (<>
          <button onClick={() => { setMode("admin"); setPin(""); setErr(""); }} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12 }}>👩‍💼 Quản lý (Kế toán)</button>
          <button onClick={() => { setMode("gv"); setPin(""); setErr(""); }} style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: `1.5px solid ${C.blueA}`, background: C.card, color: C.blueA, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>👩‍🏫 Giáo viên điểm danh</button>
        </>)}
        {mode && (<>
          <div style={{ textAlign: "left", marginBottom: 8, fontSize: 13, fontWeight: 700, color: C.sub }}>{mode === "admin" ? "🔐 Nhập mã quản lý" : "👩‍🏫 Nhập PIN giáo viên"}</div>
          <input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e) => { setPin(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && (mode === "admin" ? tryAdmin() : tryGV())} placeholder={mode === "admin" ? "Mã quản lý" : "PIN của bạn"} style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1.5px solid ${err ? C.coral : C.line}`, fontSize: 16, fontFamily: font.body, outline: "none", textAlign: "center", letterSpacing: 4 }} />
          {err && <div style={{ fontSize: 12.5, color: C.coral, marginTop: 6 }}>{err}</div>}
          <button onClick={mode === "admin" ? tryAdmin : tryGV} style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: mode === "admin" ? C.pine : C.blueA, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 12 }}>Vào</button>
          <button onClick={() => { setMode(null); setPin(""); setErr(""); }} style={{ width: "100%", padding: "8px 0", borderRadius: 10, border: "none", background: "none", color: C.sub, fontSize: 13, cursor: "pointer", marginTop: 6 }}>‹ Quay lại</button>
          {mode === "gv" && meta?.giaoVien?.length > 0 && <div style={{ marginTop: 12, fontSize: 11, color: C.gray, lineHeight: 1.6 }}>{meta.giaoVien.map((g) => <div key={g.id}>{g.ten} · lớp {lopTen(g.lopId)}</div>)}</div>}
        </>)}
      </div>
    </div>
  );
}

function BackupExport({ meta, students }) {
  const [busy, setBusy] = useState(false);
  const [outText, setOutText] = useState("");
  const [outName, setOutName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const dl = (text, name, type) => { try { const blob = new Blob([type === "csv" ? "\uFEFF" + text : text], { type: type === "csv" ? "text/csv;charset=utf-8;" : "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (e) {} };

  const buildJSON = async () => {
    const keys = await sList("mn5:");
    const data = {};
    for (const k of keys) data[k] = await sGet(k);
    return JSON.stringify(data);
  };
  const buildCSV = async () => {
    const keys = (await sList("mn5:thang:")).filter((k) => /mn5:thang:\d{4}-\d{2}$/.test(k)).sort();
    const rows = [["Tháng", "Mã HS", "Tên", "Lớp", "Phải thu", "Đã thu", "Còn nợ"]];
    for (const k of keys) {
      const td = await sGet(k); if (!td?.fees) continue;
      const ym = k.replace("mn5:thang:", ""); const y = Number(ym.slice(0, 4)), mo = Number(ym.slice(5));
      const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
      const dp = await sGet(`mn5:dd:${ymKey(py, pm)}`) || {};
      students.forEach((hs) => {
        const r = td.fees[hs.id]; if (!r) return;
        const lid = lopOfMonth(hs, ym); const lop = meta.classes.find((c) => c.id === lid);
        let sn = 0; if (dp[hs.id]) { Object.keys(dp[hs.id]).forEach((d) => { if (dp[hs.id][d] === "nghi") sn++; }); }
        const ps = tinhPSFromRec(hs, r, lop, sn);
        rows.push([ym, hs.id, hs.ten, lop?.ten || "", ps.tong, r.thucThu || 0, ps.tong - (r.thucThu || 0)]);
      });
    }
    return rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  };
  const doImport = async () => {
    if (!pasteText.trim()) return;
    if (!await ask("⚠️ HÀNH ĐỘNG NÀY SẼ GHI ĐÈ TOÀN BỘ dữ liệu hiện tại bằng dữ liệu trong ô văn bản!\nBạn đã chắc chắn sao lưu dữ liệu cũ chưa?")) return;
    try {
      const obj = JSON.parse(pasteText.trim());
      let c = 0;
      for (const k in obj) { if (k.startsWith("mn5:")) { await sSet(k, obj[k]); c++; } }
      toast(`✅ Đã nhập thành công ${c} bản ghi. Hãy tải lại trang!`); setPasteText("");
    } catch (e) { toast("❌ Lỗi cấu trúc JSON không hợp lệ."); }
  };
  return (
    <Card>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, marginBottom: 10, color: C.pine }}>Dữ liệu & Sao lưu</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button disabled={busy} onClick={async () => { setBusy(true); const t = await buildJSON(); dl(t, `mamnon_backup_${new Date().toISOString().slice(0, 10)}.json`, "json"); setBusy(false); }} style={{ flex: 1, padding: "10px", background: C.pine, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>📥 Xuất JSON Backup</button>
        <button disabled={busy} onClick={async () => { setBusy(true); const t = await buildCSV(); dl(t, `baocao_thuphi_tatcathang.csv`, "csv"); setBusy(false); }} style={{ flex: 1, padding: "10px", background: C.blueA, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>📊 Xuất Báo cáo CSV</button>
      </div>
      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, marginBottom: 4 }}>Nhập dữ liệu sao lưu (Paste đoạn mã JSON vào đây):</div>
        <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder='{"mn5:meta":...}' style={{ width: "100%", height: 60, borderRadius: 8, border: `1.5px solid ${C.line}`, padding: 6, fontSize: 12, fontFamily: "monospace", outline: "none", background: "#FAFBF9" }} />
        <button onClick={doImport} style={{ marginTop: 6, padding: "6px 14px", background: C.coral, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>🔂 Khôi phục từ ô trên</button>
      </div>
    </Card>
  );
}

function AuditLog() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { sGet("mn5:log").then((d) => setLogs(d || [])); }, []);
  return (
    <Card style={{ maxHeight: 300, overflowY: "auto" }}>
      <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Nhật ký hoạt động hệ thống</div>
      {logs.length === 0 ? <div style={{ fontSize: 13, color: C.gray }}>Chưa có lịch sử thao tác.</div> : logs.map((l, i) => (
        <div key={i} style={{ fontSize: 11.5, padding: "4px 0", borderBottom: `1px solid ${C.line}`, lineHeight: 1.4 }}>
          <span style={{ color: C.gray }}>{new Date(l.t).toLocaleString("vi-VN", { hour12: false })}</span> | <b>{l.who}</b>: {l.act}
        </div>
      ))}
    </Card>
  );
}

export default function App() {
  const [auth, setAuth] = useState(null);
  const [meta, setMeta] = useState(SEED_META);
  const [students, setStudents] = useState([]);
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(4);
  const [tab, setTab] = useState("tp");

  const [mData, setMData] = useState(null);
  const [ddData, setDDData] = useState({});
  const [ddPrev, setDDPrev] = useState({});
  const [leData, setLeData] = useState({});
  const [nextChot, setNextChot] = useState(false);

  const [search, setSearch] = useState("");
  const [lopFilter, setLopFilter] = useState("all");
  const [thuFilter, setThuFilter] = useState("all");
  const [viewDay, setViewDay] = useState(new Date().getDate());
  const [isDDMonthView, setIsDDMonthView] = useState(false);

  const [phieuId, setPhieuId] = useState(null);
  const [daChot, setDaChot] = useState(false); // [FIX] Độc lập trạng thái chốt sổ theo mã tháng

  const isGV = auth?.role === "gv";
  const isAdmin = auth?.role === "admin";
  const gvLopId = auth?.lopId;

  const monthsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const yearsList = [2025, 2026, 2027];

  const ym = ymKey(year, month);

  // ====================================================================
  // [FIX CHỐT THÁNG] ĐỒNG BỘ VÀ TẢI DỮ LIỆU AN TOÀN THEO THÁNG
  // ====================================================================
  useEffect(() => {
    let isMounted = true;
    async function loadDataAndCheckLock() {
      if (!students || students.length === 0) return;
      const currentYm = ymKey(year, month);
      try {
        let dataThang = await sGet(`mn5:thang:${currentYm}`);
        const diemDanh = await sGet(`mn5:dd:${currentYm}`) || {};
        const le = await sGet(`mn5:le:${currentYm}`) || {};

        const pm = month === 1 ? 12 : month - 1;
        const py = month === 1 ? year - 1 : year;
        const diemDanhTruoc = await sGet(`mn5:dd:${ymKey(py, pm)}`) || {};

        const nm = month === 12 ? 1 : month + 1;
        const ny = month === 12 ? year + 1 : year;
        const dataThangSau = await sGet(`mn5:thang:${ymKey(ny, nm)}`);

        if (!isMounted) return;

        if (!dataThang) {
          dataThang = seedThangData(currentYm, students, meta);
          await sSet(`mn5:thang:${currentYm}`, dataThang);
        }

        setMData(dataThang);
        setDDData(diemDanh);
        setLeData(le);
        setDDPrev(diemDanhTruoc);
        setNextChot(dataThangSau ? !!dataThangSau.daChot : false);
        
        // Cô lập trạng thái chốt hoàn toàn theo mã tháng đang xem
        setDaChot(!!dataThang.daChot);
      } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu tháng:", error);
      }
    }
    loadDataAndCheckLock();
    return () => { isMounted = false; };
  }, [year, month, students, meta]);

  const flushMData = async (updatedData) => {
    const currentYm = ymKey(year, month);
    setMData(updatedData);
    await sSet(`mn5:thang:${currentYm}`, updatedData);
  };

  // Khởi tạo app lúc ban đầu từ DB
  useEffect(() => {
    async function initApp() {
      try {
        let trườngMeta = await sGet("mn5:meta");
        let danhSachHS = await sGet("mn5:students");
        if (!trườngMeta) { trườngMeta = SEED_META; await sSet("mn5:meta", trườngMeta); }
        if (!danhSachHS) { danhSachHS = []; await sSet("mn5:students", danhSachHS); }
        setMeta(trườngMeta);
        setStudents(danhSachHS);
        const savedAuth = await sGet("mn5:auth");
        if (savedAuth) setAuth(savedAuth);
      } catch (e) {
        toast("Không thể tải cấu hình gốc từ máy chủ.");
      }
    }
    initApp();
  }, []);

  const locked = daChot;

  // Tính số ngày nghỉ tháng trước của học sinh
  const getSoNghiThangTruoc = (hsId) => {
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    const daysInPrev = new Date(py, pm, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInPrev; d++) {
      if (ddPrev[hsId]?.[d] === "nghi") count++;
    }
    return count;
  };

  // Tính công nợ lũy kế lịch sử (Các tháng trước cộng lại)
  const [noLuyKeMap, setNoLuyKeMap] = useState({});
  useEffect(() => {
    async function calcHistoryDebt() {
      if (!students.length || !meta.classes.length) return;
      const keys = (await sList("mn5:thang:")).filter((k) => /mn5:thang:\d{4}-\d{2}$/.test(k)).sort();
      const map = {};
      students.forEach((h) => (map[h.id] = 0));
      for (const k of keys) {
        const ymLoop = k.replace("mn5:thang:", "");
        if (ymLoop >= ym) break;
        const td = await sGet(k); if (!td?.fees) continue;
        const yL = Number(ymLoop.slice(0, 4)), mL = Number(ymLoop.slice(5));
        const pmL = mL === 1 ? 12 : mL - 1, pyL = mL === 1 ? yL - 1 : yL;
        const dpL = await sGet(`mn5:dd:${ymKey(pyL, pmL)}`) || {};

        students.forEach((hs) => {
          const rec = td.fees[hs.id]; if (!rec) return;
          const lid = lopOfMonth(hs, ymLoop); const lop = meta.classes.find((c) => c.id === lid);
          let sn = 0; if (dpL[hs.id]) { Object.keys(dpL[hs.id]).forEach((d) => { if (dpL[hs.id][d] === "nghi") sn++; }); }
          const ps = tinhPSFromRec(hs, rec, lop, sn);
          map[hs.id] += ps.tong - (rec.thucThu || 0);
        });
      }
      setNoLuyKeMap(map);
    }
    calcHistoryDebt();
  }, [students, meta, ym, mData]);

  // Chuẩn bị dữ liệu hiển thị toàn bộ học sinh
  const allRows = useMemo(() => {
    if (!mData || !mData.fees) return [];
    return students.map((hs) => {
      const lopId = lopOfMonth(hs, ym);
      const lop = meta.classes.find((c) => c.id === lid => lid === lopId || lid?.id === lopId);
      const targetLop = meta.classes.find((c) => c.id === lopId);
      const rec = mData.fees[hs.id];
      const soNghiPrev = getSoNghiThangTruoc(hs.id);
      const ps = tinhPSFromRec(hs, rec, targetLop, soNghiPrev);
      const noTruoc = noLuyKeMap[hs.id] || 0;
      const tongPhaiThu = ps.tong + noTruoc;
      const conNo = tongPhaiThu - (rec?.thucThu || 0);
      return { hs, rec, lopId, lop: targetLop, ps, noTruoc, tongPhaiThu, conNo, coRec: !!rec };
    });
  }, [students, mData, meta, ym, ddPrev, noLuyKeMap]);

  // Bộ lọc tìm kiếm
  const filteredRows = useMemo(() => {
    let s = noDau(search.trim());
    return allRows.filter((r) => {
      if (isGV && r.lopId !== gvLopId) return false;
      if (!isGV && lopFilter !== "all" && r.lopId !== lopFilter) return false;
      if (s && !noDau(r.hs.ten).includes(s) && !r.hs.id.toLowerCase().includes(s)) return false;
      if (thuFilter === "chuaThu") return r.ps.tong > 0 && (r.rec?.thucThu || 0) === 0;
      if (thuFilter === "thieu") return r.conNo > 0 && (r.rec?.thucThu || 0) > 0;
      if (thuFilter === "thuThua") return r.conNo < 0;
      return true;
    });
  }, [allRows, lopFilter, search, thuFilter, isGV, gvLopId]);

  const setRec = async (hsId, fields) => {
    if (locked) return;
    const updatedFees = { ...mData.fees, [hsId]: { ...mData.fees[hsId], ...fields } };
    await flushMData({ ...mData, fees: updatedFees });
  };

  const handleToggleChotThang = async () => {
    if (!mData) return;
    const currentYm = ymKey(year, month);
    const trangThaiMoi = !daChot;

    const xacNhan = trangThaiMoi 
      ? `Bạn có chắc chắn muốn CHỐT dữ liệu tháng ${month}/${year}?\nSau khi chốt, giáo viên không thể điểm danh và kế toán không thể sửa tiền.`
      : `Bạn có chắc chắn muốn MỞ KHÓA dữ liệu tháng ${month}/${year}?`;

    if (!(await ask(xacNhan, { danger: !trangThaiMoi, okText: trangThaiMoi ? "Chốt ngay" : "Mở khóa" }))) return;

    const updatedMData = { ...mData, daChot: trangThaiMoi };
    await logAction(`${trangThaiMoi ? "Chốt" : "Mở chốt"} dữ liệu tháng ${month}/${year}`);
    await sSet(`mn5:thang:${currentYm}`, updatedMData);
    
    setMData(updatedMData);
    setDaChot(trangThaiMoi);
    toast(trangThaiMoi ? `🔒 Đã chốt tháng ${month}/${year}` : `🔓 Đã mở khóa tháng ${month}/${year}`);
  };

  const reseedAll = async () => {
    const keys = await sList("mn5:");
    for (const k of keys) { if (k !== "mn5:meta" && k !== "mn5:auth") await sDel(k); }
    await sSet("mn5:students", []);
    setStudents([]); setMData(null);
  };

  // ----- SUB COMPONENT: TAB CAI DAT -----
  function SecCaiDat() {
    const [sec, setSec] = useState("truong");
    const [edClass, setEdClass] = useState(null);
    const [edHS, setEdHS] = useState(null);
    const [edGV, setEdGV] = useState(null);

    const saveMeta = async (newMeta) => { setMeta(newMeta); await sSet("mn5:meta", newMeta); };
    const saveStudents = async (newSt) => { setStudents(newSt); await sSet("mn5:students", newSt); };

    return (
      <div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
          {/* Menu phụ của mục cài đặt */}
          {[["truong", "🏫 Trường"], ["lop", "🚪 Lớp học"], ["hs", "👶 Học sinh"], ["gv", "👩‍🏫 Giáo viên"], ["backup", "💾 Sao lưu"], ["log", "📋 Nhật ký"], ["data", "⚠️ Xóa sạch"]].map(([id, lb]) => (
            <button key={id} onClick={() => setSec(id)} style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 8, border: `1px solid ${sec === id ? C.pine : C.line}`, background: sec === id ? C.pineSoft : "#fff", color: sec === id ? C.pine : C.sub, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{lb}</button>
          ))}
        </div>

        {sec === "truong" && (
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 15 }}>Cài đặt chung nhà trường</div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Tên trường hiển thị:</label><input value={meta.tenTruong || ""} onChange={(e) => saveMeta({ ...meta, tenTruong: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 8, border: `1.5px solid ${C.line}`, marginTop: 4 }} /></div>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Tỷ lệ lãi của bên A (%):</label><NumInput value={meta.tyLeLaiA ?? 50} onChange={(v) => saveMeta({ ...meta, tyLeLaiA: v })} w="100%" /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Số BL bắt đầu (A):</label><NumInput value={meta.soBienLai?.A ?? 0} onChange={(v) => saveMeta({ ...meta, soBienLai: { ...(meta.soBienLai || {}), A: v } })} w="100%" /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Số BL bắt đầu (B):</label><NumInput value={meta.soBienLai?.B ?? 0} onChange={(v) => saveMeta({ ...meta, soBienLai: { ...(meta.soBienLai || {}), B: v } })} w="100%" /></div>
            </div>
            {["A", "B"].map((p) => (
              <div key={p} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: p === "A" ? C.blueA : C.violetB }}>Tài khoản nhận tiền bên {p}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input placeholder="Ngân hàng" value={meta.bank?.[p]?.nh || ""} onChange={(e) => { const b = { ...meta.bank }; b[p] = { ...(b[p] || {}), nh: e.target.value }; saveMeta({ ...meta, bank: b }); }} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13 }} />
                  <input placeholder="Số tài khoản" value={meta.bank?.[p]?.stk || ""} onChange={(e) => { const b = { ...meta.bank }; b[p] = { ...(b[p] || {}), stk: e.target.value }; saveMeta({ ...meta, bank: b }); }} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13 }} />
                  <input placeholder="Chủ tài khoản" value={meta.bank?.[p]?.chu || ""} onChange={(e) => { const b = { ...meta.bank }; b[p] = { ...(b[p] || {}), chu: e.target.value }; saveMeta({ ...meta, bank: b }); }} style={{ flex: 1, padding: 6, borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13 }} />
                </div>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 6 }}>Số dư / nợ đầu kỳ lịch sử (vốc gốc ban đầu)</div>
              {[["tienMatA", "Tiền mặt tồn quỹ bên A"], ["tienMatB", "Tiền mặt tồn quỹ bên B"], ["AnoB", "Bên A nợ bên B ban đầu"], ["BnoA", "Bên B nợ bên A ban đầu"]].map(([k, lb]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.line}` }}><span style={{ fontSize: 13.5, color: C.sub }}>{lb}</span><NumInput value={(meta.soDuDauKy || {})[k] || 0} onChange={(v) => { const d = { ...(meta.soDuDauKy || {}) }; d[k] = v; saveMeta({ ...meta, soDuDauKy: d }); }} w={130} /></div>
              ))}
            </div>
          </Card>
        )}

        {sec === "lop" && (
          <div>
            <button onClick={() => setEdClass({ id: "c" + uid(), ten: "Lớp Mới", hocPhi: 700000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 0, dongPhuc: 0, dauNam: 0, lapLai: {} })} style={{ width: "100%", padding: 10, background: C.pine, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, marginBottom: 10, cursor: "pointer" }}>➕ Thêm Lớp Học Mới</button>
            {meta.classes.map((c) => (
              <Card key={c.id} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><b>Lớp: {c.ten}</b><span style={{ fontSize: 12, color: C.sub, marginLeft: 10 }}>Học phí: {fmt(c.hocPhi)}đ | Tiền ăn/ngày: {fmt(c.tienAn)}đ</span></div>
                <button onClick={() => setEdClass({ ...c, lapLai: c.lapLai || {} })} style={{ padding: "4px 10px", background: C.graySoft, border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Sửa đơn giá</button>
              </Card>
            ))}
            {edClass && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 18, maxWidth: 440, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Cấu hình lớp: {edClass.ten}</div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 12, fontWeight: 700 }}>Tên lớp học:</label><input value={edClass.ten} onChange={(e) => setEdClass({ ...edClass, ten: e.target.value })} style={{ width: "100%", padding: 6, borderRadius: 6, border: `1px solid ${C.line}`, marginTop: 2 }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {KHOAN.map((k) => (
                      <div key={k.key} style={{ marginBottom: 6 }}><label style={{ fontSize: 12, color: C.sub }}>{k.label}:</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <NumInput value={edClass[k.key] || 0} onChange={(v) => setEdClass({ ...edClass, [k.key]: v })} w="100%" />
                          {["dongPhuc", "dauNam"].includes(k.key) && (
                            <select value={edClass.lapLai?.[k.key] === "hangThang" ? "hangThang" : "khong"} onChange={(e) => setEdClass({ ...edClass, lapLai: { ...(edClass.lapLai || {}), [k.key]: e.target.value } })} style={{ padding: 5, fontSize: 11, borderRadius: 4 }}>
                              <option value="khong">Thu 1 lần</option>
                              <option value="hangThang">Hàng tháng</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                    <div style={{ marginBottom: 6 }}><label style={{ fontSize: 12, color: C.sub }}>Thứ 7 (1 buổi):</label><NumInput value={edClass.t7 || 0} onChange={(v) => setEdClass({ ...edClass, t7: v })} w="100%" /></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={async () => {
                      if (meta.classes.find((x) => x.id === edClass.id) && await ask(`Xóa lớp ${edClass.ten}?\nHọc sinh thuộc lớp này có thể gặp lỗi hiển thị đơn giá.`, { danger: true })) {
                        await saveMeta({ ...meta, classes: meta.classes.filter((x) => x.id !== edClass.id) }); setEdClass(null);
                      } else if (!meta.classes.find((x) => x.id === edClass.id)) setEdClass(null);
                    }} style={{ padding: "8px 14px", background: C.coralSoft, color: C.coral, border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Xóa lớp</button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => setEdClass(null)} style={{ padding: "8px 14px", border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, cursor: "pointer" }}>Hủy</button>
                    <button onClick={async () => {
                      const list = [...meta.classes]; const idx = list.findIndex((x) => x.id === edClass.id);
                      if (idx >= 0) list[idx] = edClass; else list.push(edClass);
                      await saveMeta({ ...meta, classes: list }); setEdClass(null); toast("Đã lưu cấu hình lớp.");
                    }} style={{ padding: "8px 18px", background: C.pine, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Lưu lớp</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {sec === "hs" && (
          <div>
            <button onClick={() => setEdHS({ id: "hs" + uid(), ten: "", pl: "Bthg", trangThai: "Đang học", ngayNhapHoc: new Date().toISOString().slice(0, 10), lopHistory: [{ tuThang: ym, lop: meta.classes[0]?.id || "" }] })} style={{ width: "100%", padding: 10, background: C.pine, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, marginBottom: 10, cursor: "pointer" }}>➕ Thêm Học Sinh Mới</button>
            <SearchBar value={search} onChange={setSearch} />
            {students.filter(h => !search || noDau(h.ten).includes(noDau(search))).map((h) => {
              const currLopId = lopHienTai(h);
              const lopTen = meta.classes.find((c) => c.id === currLopId)?.ten || "Chưa chọn lớp";
              return (
                <Card key={h.id} style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px" }}>
                  <div><b>{h.ten}</b><span style={{ fontSize: 12, color: C.sub, marginLeft: 8 }}>({lopTen} · {PL_LABEL[h.pl || "Bthg"]})</span></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TT_COLOR[h.trangThai || "Đang học"] }}>{h.trangThai || "Đang học"}</span>
                    <button onClick={() => {
                      const safeHS = { ...h, lopHistory: h.lopHistory || [{ tuThang: ym, lop: h.lop || meta.classes[0]?.id || "" }] };
                      setEdHS(safeHS);
                    }} style={{ padding: "4px 8px", background: C.graySoft, border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Sửa</button>
                  </div>
                </Card>
              );
            })}
            {edHS && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 18, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Thông tin học sinh</div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 12.5, fontWeight: 700 }}>Họ và tên trẻ:</label><input value={edHS.ten} onChange={(e) => setEdHS({ ...edHS, ten: e.target.value })} style={{ width: "100%", padding: 7, borderRadius: 6, border: `1px solid ${C.line}`, marginTop: 2 }} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div><label style={{ fontSize: 12, color: C.sub }}>Phân loại đối tượng:</label>
                      <select value={edHS.pl} onChange={(e) => setEdHS({ ...edHS, pl: e.target.value })} style={{ width: "100%", padding: 6, borderRadius: 6, marginTop: 2 }}>
                        {PHAN_LOAI.map(p => <option key={p} value={p}>{PL_LABEL[p]}</option>)}
                      </select>
                    </div>
                    <div><label style={{ fontSize: 12, color: C.sub }}>Trạng thái học tập:</label>
                      <select value={edHS.trangThai} onChange={(e) => setEdHS({ ...edHS, trangThai: e.target.value })} style={{ width: "100%", padding: 6, borderRadius: 6, marginTop: 2 }}>
                        {TRANG_THAI.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, color: C.sub }}>Ngày nhập học chính thức:</label><input type="date" value={edHS.ngayNhapHoc || ""} onChange={(e) => setEdHS({ ...edHS, ngayNhapHoc: e.target.value })} style={{ width: "100%", padding: 6, borderRadius: 6, border: `1px solid ${C.line}`, marginTop: 2 }} /></div>
                  
                  <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.pine }}>Lịch sử xếp lớp & Chuyển lớp:</span>
                      <button onClick={() => {
                        const hist = [...(edHS.lopHistory || [])];
                        hist.push({ tuThang: ym, lop: meta.classes[0]?.id || "" });
                        setEdHS({ ...edHS, lopHistory: hist });
                      }} style={{ padding: "2px 6px", fontSize: 11, background: C.pineSoft, color: C.pine, border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700 }}>+ Thêm dòng</button>
                    </div>
                    {(edHS.lopHistory || []).map((h, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: C.gray }}>Từ tháng:</span>
                        <input value={h.tuThang || ""} onChange={(e) => {
                          const hist = [...edHS.lopHistory]; hist[i].tuThang = e.target.value; setEdHS({ ...edHS, lopHistory: hist });
                        }} style={{ width: 75, padding: 4, fontSize: 12, borderRadius: 4, border: `1px solid ${C.line}` }} placeholder="2026-04" />
                        <span style={{ fontSize: 11, color: C.gray }}>Vào lớp:</span>
                        <select value={h.lop || ""} onChange={(e) => {
                          const hist = [...edHS.lopHistory]; hist[i].lop = e.target.value; setEdHS({ ...edHS, lopHistory: hist });
                        }} style={{ flex: 1, padding: 4, fontSize: 12, borderRadius: 4 }}>
                          {meta.classes.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
                        </select>
                        {edHS.lopHistory.length > 1 && <button onClick={() => setEdHS({ ...edHS, lopHistory: edHS.lopHistory.filter((_, idx) => idx !== i) })} style={{ border: "none", background: "none", color: C.coral, fontSize: 15, cursor: "pointer" }}>×</button>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                    <button onClick={async () => {
                      if (students.find(x => x.id === edHS.id) && await ask(`Xóa học sinh ${edHS.ten} khỏi danh sách gốc?\\nHành động này không xóa tiền các tháng cũ nhưng trẻ biến mất khỏi danh sách quản lý.`, { danger: true })) {
                        await saveStudents(students.filter(x => x.id !== edHS.id)); setEdHS(null);
                      } else if (!students.find(x => x.id === edHS.id)) setEdHS(null);
                    }} style={{ padding: "8px 14px", background: C.coralSoft, color: C.coral, border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Xóa trẻ</button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => setEdHS(null)} style={{ padding: "8px 14px", border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, cursor: "pointer" }}>Hủy</button>
                    <button onClick={async () => {
                      if (!edHS.ten.trim()) return toast("Vui lòng nhập tên trẻ.");
                      const list = [...students]; const idx = list.findIndex(x => x.id === edHS.id);
                      if (idx >= 0) list[idx] = edHS; else list.push(edHS);
                      await saveStudents(list); setEdHS(null); toast("Đã lưu thông tin học sinh trẻ.");
                    }} style={{ padding: "8px 18px", background: C.pine, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Lưu lại</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {sec === "gv" && (
          <div>
            <button onClick={() => setEdGV({ id: "gv" + uid(), ten: "", pin: "", lopId: meta.classes[0]?.id || "" })} style={{ width: "100%", padding: 10, background: C.pine, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, marginBottom: 10, cursor: "pointer" }}>➕ Thêm Tài Khoản Giáo Viên</button>
            {(meta.giaoVien || []).map((g) => (
              <Card key={g.id} style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><b>{g.ten}</b><span style={{ fontSize: 12, color: C.sub, marginLeft: 8 }}>Lớp phụ trách: {meta.classes.find(c => c.id === g.lopId)?.ten || "?"} | PIN đăng nhập: {g.pin}</span></div>
                <button onClick={() => setEdGV(g)} style={{ padding: "4px 8px", background: C.graySoft, border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>Sửa</button>
              </Card>
            ))}
            {edGV && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
                <div style={{ background: "#fff", borderRadius: 16, padding: 18, maxWidth: 360, width: "100%" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Thông tin giáo viên</div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 12, color: C.sub }}>Tên giáo viên:</label><input value={edGV.ten} onChange={(e) => setEdGV({ ...edGV, ten: e.target.value })} style={{ width: "100%", padding: 6, borderRadius: 6, border: `1px solid ${C.line}`, marginTop: 2 }} /></div>
                  <div style={{ marginBottom: 8 }}><label style={{ fontSize: 12, color: C.sub }}>Mã PIN đăng nhập nhanh (4 số):</label><input value={edGV.pin} onChange={(e) => setEdGV({ ...edGV, pin: e.target.value.replace(/[^\d]/g, "") })} maxLength={6} style={{ width: "100%", padding: 6, borderRadius: 6, border: `1px solid ${C.line}`, marginTop: 2, letterSpacing: 2 }} /></div>
                  <div style={{ marginBottom: 10 }}><label style={{ fontSize: 12, color: C.sub }}>Lớp chủ nhiệm:</label>
                    <select value={edGV.lopId} onChange={(e) => setEdGV({ ...edGV, lopId: e.target.value })} style={{ width: "100%", padding: 6, borderRadius: 6, marginTop: 2 }}>
                      {meta.classes.map(c => <option key={c.id} value={c.id}>{c.ten}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={async () => {
                      const arr = (meta.giaoVien || []).filter(x => x.id !== edGV.id);
                      await saveMeta({ ...meta, giaoVien: arr }); setEdGV(null); toast("Đã xóa giáo viên.");
                    }} style={{ padding: "6px 12px", background: C.coralSoft, color: C.coral, border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>Xóa bỏ</button>
                    <div style={{ flex: 1 }} />
                    <button onClick={() => setEdGV(null)} style={{ padding: "6px 12px", border: `1px solid ${C.line}`, background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 12.5 }}>Hủy</button>
                    <button onClick={async () => {
                      if (!edGV.ten.trim() || !edGV.pin.trim()) return toast("Thiếu thông tin.");
                      const arr = [...(meta.giaoVien || [])]; const idx = arr.findIndex(x => x.id === edGV.id);
                      if (idx >= 0) arr[idx] = edGV; else arr.push(edGV);
                      await saveMeta({ ...meta, giaoVien: arr }); setEdGV(null); toast("Đã lưu tài khoản giáo viên.");
                    }} style={{ padding: "6px 14px", background: C.pine, color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}>Lưu</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {sec === "backup" && <BackupExport meta={meta} students={students} />}
        {sec === "log" && <AuditLog />}
        {sec === "data" && (
          <Card>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>Xóa sạch dữ liệu khởi lập lại</div>
            <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>Đưa phần mềm về trạng thái trống ban đầu: giữ nguyên cấu hình lớp và đơn giá, nhưng <b style={{ color: C.coral }}>xóa sạch toàn bộ dữ liệu học sinh, lịch sử điểm danh, các tháng thu chi tiền.</b> Dùng khi sang năm học mới hoàn toàn hoặc muốn chạy lại sạch từ đầu.</div>
            <button onClick={async () => { if (await ask("Xóa TOÀN BỘ học sinh + lịch sử điểm danh + tiền thu chi các tháng?\n⚠️ Lưu ý hành động này không thể hoàn tác. Nên tải file Sao lưu JSON trước.", { danger: true, okText: "Xóa sạch dữ liệu" })) { await reseedAll(); toast("Đã dọn dẹp sạch sẽ dữ liệu. Hãy thêm học sinh ở mục Cài đặt → Học sinh."); } }} style={{ padding: "10px 16px", background: C.coral, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>⚠️ Thực hiện xóa trắng dữ liệu</button>
          </Card>
        )}
      </div>
    );
  }

  // ----- SUB COMPONENT: TAB CHI PHI VÀ DÒNG TIỀN NỘI BỘ -----
  function SecDongTien() {
    if (!mData) return null;
    const listChi = mData.chiPhi || [];
    const listThuNgoai = mData.thuNgoai || [];
    const listKhoanThuLop = mData.khoanThuLop || [];

    const addChi = async () => {
      if (locked) return;
      const item = { id: uid(), noiDung: "Khoản chi mới", soTien: 0, nguoiChi: "A", loai: "PHAT_SINH", daTra: 0 };
      await flushMData({ ...mData, chiPhi: [...listChi, item] });
    };
    const setChiItem = async (id, fields) => {
      if (locked) return;
      const arr = listChi.map((x) => (x.id === id ? { ...x, ...fields } : x));
      await flushMData({ ...mData, chiPhi: arr });
    };
    const delChi = async (id) => {
      if (locked) return;
      await flushMData({ ...mData, chiPhi: listChi.filter((x) => x.id !== id) });
    };

    const addThuNgoai = async () => {
      if (locked) return;
      const item = { id: uid(), noiDung: "Thu ngoài mục phí", soTien: 0, veBên: "A" };
      await flushMData({ ...mData, thuNgoai: [...listThuNgoai, item] });
    };

    // Tính toán số liệu báo cáo dòng tiền chi tiết toán học
    const tongThuHocPhiThucTe = allRows.reduce((acc, r) => acc + (r.rec?.thucThu || 0), 0);
    const tongThuNgoaiA = listThuNgoai.filter(x => x.veBên === "A").reduce((a, b) => a + (b.soTien || 0), 0);
    const tongThuNgoaiB = listThuNgoai.filter(x => x.veBên === "B").reduce((a, b) => a + (b.soTien || 0), 0);

    const thuGocA = tongThuHocPhiThucTe + tongThuNgoaiA;
    const thuGocB = tongThuNgoaiB;

    let chiA_thuc = 0, chiB_thuc = 0, chiChung_tong = 0;
    listChi.forEach((x) => {
      const v = x.soTien || 0;
      if (x.loai === "PHAT_SINH") { if (x.nguoiChi === "A") chiA_thuc += v; else chiB_thuc += v; }
      else if (x.loai === "CO_DINH") { chiChung_tong += v; if (x.nguoiChi === "A") chiA_thuc += v; else chiB_thuc += v; }
      else if (x.loai === "NO_AB") { if (x.nguoiChi === "A") chiA_thuc += v; else chiB_thuc += v; }
    });

    const tyLeA = meta.tyLeLaiA ?? 50; const tyLeB = 100 - tyLeA;
    const chiChungPhanBoA = Math.round((chiChung_tong * tyLeA) / 100);
    const chiChungPhanBoB = chiChung_tong - chiChungPhanBoA;

    // Tính nợ vay mượn nội bộ phát sinh giữa hai bên trong tháng
    let A_vay_B_trongThang = 0, B_vay_A_trongThang = 0;
    listChi.forEach((x) => {
      if (x.loai === "NO_AB") { if (x.nguoiChi === "A") A_vay_B_trongThang += (x.soTien || 0); else B_vay_A_trongThang += (x.soTien || 0); }
    });

    // Kết quả tính toán cân đối tài chính
    const doanhThuChiaGocA = Math.round((tongThuHocPhiThucTe * tyLeA) / 100) + tongThuNgoaiA;
    const doanhThuChiaGocB = (tongThuHocPhiThucTe - Math.round((tongThuHocPhiThucTe * tyLeA) / 100)) + tongThuNgoaiB;

    const thucThuSauVayA = thuGocA - chiA_thuc;
    const thucThuSauVayB = thuGocB - chiB_thuc;

    const laiRongThuanThangA = doanhThuChiaGocA - chiChungPhanBoA - (chiChi.filter(x => x.loai === "PHAT_SINH" && x.nguoiChi === "A").reduce((a, b) => a + (b.soTien || 0), 0));
    
    // Thu gọn phép toán đối trừ nợ nội bộ
    const doiTruPhaiTraA_sang_B = (doanhThuChiaGocB - tongThuNgoaiB) - chiChungPhanBoB + A_vay_B_trongThang - B_vay_A_trongThang;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: C.pine }}>Mục 1: Quản lý chi phí tháng</span>
            <button disabled={locked} onClick={addChi} style={{ padding: "4px 10px", background: C.pine, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Thêm khoản chi</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {listChi.map((x) => (
              <div key={x.id} style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 6, borderBottom: `1px solid ${C.line}` }}>
                <input disabled={locked} value={x.noiDung} onChange={(e) => setChiItem(x.id, { noiDung: e.target.value })} style={{ flex: 1, padding: 5, borderRadius: 6, border: `1px solid ${C.line}`, fontSize: 13 }} />
                <NumInput value={x.soTien || 0} onChange={(v) => setChiItem(x.id, { soTien: v })} disabled={locked} w={95} />
                <ABBtn val={x.nguoiChi} set={(v) => setChiItem(x.id, { nguoiChi: v })} small disabled={locked} />
                <select disabled={locked} value={x.loai || "PHAT_SINH"} onChange={(e) => setChiItem(x.id, { loai: e.target.value })} style={{ padding: 4, fontSize: 11, borderRadius: 6 }}>
                  <option value="CO_DINH">Chi chung</option>
                  <option value="PHAT_SINH">Chi riêng</option>
                  <option value="NO_AB">Vay nội bộ</option>
                </select>
                {!locked && <button onClick={() => delChi(x.id)} style={{ border: "none", background: "none", color: C.coral, cursor: "pointer", fontSize: 16 }}>×</button>}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ background: C.pineSoft, border: `1px solid ${C.pine}` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.pine, marginBottom: 8 }}>Mục 2: Bảng đối trừ phân chia nội bộ (Toán học cân đối)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 13.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tổng thu học phí thực tế gom được:</span><b>{fmt(tongThuHocPhiThucTe)}đ</b></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Chi chung của trường tổng cộng:</span><b>{fmt(chiChung_tong)}đ</b></div>
            <div style={{ display: "flex", justifyContent: "space-between", color: C.sub, paddingLeft: 10 }}><span>→ Bên A gánh ({tyLeA}%): {fmt(chiChungPhanBoA)}đ | Bên B gánh ({tyLeB}%): {fmt(chiChungPhanBoB)}đ</span></div>
            <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: C.blueA }}><span>Tiền thực thu trong tay quỹ bên A (gồm cả thu ngoài):</span><span>{fmt(thuGocA)}đ</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: C.violetB }}><span>Tiền thực thu trong tay quỹ bên B (thu ngoài):</span><span>{fmt(thuGocB)}đ</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bên A thực chi trả trong tháng:</span><span style={{ color: C.coral }}>-{fmt(chiA_thuc)}đ</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bên B thực chi trả trong tháng:</span><span style={{ color: C.coral }}>-{fmt(chiB_thuc)}đ</span></div>
            <div style={{ height: 1, background: C.line, margin: "4px 0" }} />
            <div style={{ fontSize: 14, fontWeight: 700, background: "#fff", padding: 10, borderRadius: 8, marginTop: 4, borderLeft: `4px solid ${C.amber}` }}>
              {doiTruPhaiTraA_sang_B >= 0 ? (
                <div style={{ color: C.ink }}>👉 Kết toán tháng: Bên A cần bắn khoản sang chuyển khoản cho Bên B số tiền là: <b style={{ color: C.coral, fontSize: 16 }}>{fmt(doiTruPhaiTraA_sang_B)}đ</b></div>
              ) : (
                <div style={{ color: C.ink }}>👉 Kết toán tháng: Bên B cần bắn khoản sang chuyển khoản cho Bên A số tiền là: <b style={{ color: C.green, fontSize: 16 }}>{fmt(Math.abs(doiTruPhaiTraA_sang_B))}đ</b></div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ----- SUB COMPONENT: TAB IN PHIẾU THU PDF -----
  function SecInPhieuPDF() {
    const dataIn = allRows.find((r) => r.hs.id === phieuId);
    if (!dataIn) return null;
    const { hs, rec, lop, ps, noTruoc, tongPhaiThu } = dataIn;
    
    const bankA = meta.bank?.A || {};
    const bankB = meta.bank?.B || {};
    const chonB = (hs.pl === "T7" || hs.pl === "GV");
    const bankDung = chonB ? bankB : bankA;

    const qrUrl = `https://img.vietqr.io/image/${bankDung.nh}-${bankDung.stk}-print.png?amount=${tongPhaiThu}&addInfo=${encodeURIComponent("HP thang " + month + " " + hs.ten)}&accountName=${encodeURIComponent(bankDung.chu)}`;

    return (
      <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 150, overflowY: "auto", padding: "20px 14px", fontFamily: font.body, color: "#000" }} id="printable-invoice">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #000", paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, textTransform: "uppercase" }}>{meta.tenTruong}</div>
            <div style={{ fontSize: 11, color: "#333" }}>Học phí văn phòng ban kế toán</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>PHIẾU THÔNG BÁO HỌC PHÍ</div>
            <div style={{ fontSize: 12, italic: true }}>Tháng {month} / Năm {year}</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13.5 }}>
          <div>Mã học sinh trẻ: <b>{hs.id}</b></div>
          <div>Họ và tên trẻ: <b>{hs.ten}</b></div>
          <div>Lớp học: <span>{lop?.ten || ""}</span></div>
          <div>Phân loại đối tượng: <span>{PL_LABEL[hs.pl || "Bthg"]}</span></div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f2f2f2" }}>
              <th style={{ border: "1px solid #000", padding: 6, textAlign: "left" }}>Nội dung danh mục các khoản thu</th>
              <th style={{ border: "1px solid #000", padding: 6, width: 110, textAlign: "right" }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {ps.dong.map(([lb, val], i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #000", padding: 6 }}>{lb}</td>
                <td style={{ border: "1px solid #000", padding: 6, textAlign: "right" }}>{fmt(val)}đ</td>
              </tr>
            ))}
            {noTruoc !== 0 && (
              <tr>
                <td style={{ border: "1px solid #000", padding: 6, fontWeight: "bold" }}>Nợ tồn cũ / Thừa tháng trước chuyển sang:</td>
                <td style={{ border: "1px solid #000", padding: 6, textAlign: "right", fontWeight: "bold" }}>{fmt(noTruoc)}đ</td>
              </tr>
            )}
            <tr style={{ background: "#f9f9f9", fontWeight: "bold" }}>
              <td style={{ border: "1px solid #000", padding: 6, fontSize: 14 }}>TỔNG CỘNG PHẢI ĐÓNG TIỀN THÁNG NÀY:</td>
              <td style={{ border: "1px solid #000", padding: 6, textAlign: "right", fontSize: 14, color: C.coral }}>{fmt(tongPhaiThu)}đ</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 16, display: "flex", gap: 20, alignItems: "center", background: "#fdfdfd", padding: 10, borderRadius: 8, border: "1px dashed #ccc" }}>
          <img src={qrUrl} alt="VietQR Code" style={{ width: 125, height: 125, objectFit: "contain", border: "1px solid #eee" }} />
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, color: C.pine, marginBottom: 4 }}>THÔNG TIN CHUYỂN KHOẢN QUÉT MÃ VIETQR:</div>
            <div>Ngân hàng: <b>{bankDung.nh}</b></div>
            <div>Số tài khoản: <b>{bankDung.stk}</b></div>
            <div>Chủ tài khoản: <b>{bankDung.chu}</b></div>
            <div>Nội dung ck mẫu: <b style={{ background: "#eee", padding: "2px 6px", borderRadius: 4 }}>HP thang {month} {hs.ten}</b></div>
          </div>
        </div>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", textAlign: "center", fontSize: 13.5 }}>
          <div style={{ width: 150 }}><b>Phụ huynh học sinh</b><div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>(Ký và ghi rõ họ tên)</div></div>
          <div style={{ width: 180 }}><b>Người lập hóa đơn phí</b><div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>(Ban kế toán văn phòng trường)</div></div>
        </div>

        <div className="no-print" style={{ marginTop: 40, paddingTop: 14, borderTop: "1px solid #eee", display: "flex", gap: 10 }}>
          <button onClick={() => setPhieuId(null)} style={{ padding: "10px 18px", borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff", cursor: "pointer" }}>Đóng khung xem</button>
          <button onClick={() => window.print()} style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: C.pine, color: "#fff", fontWeight: 700, cursor: "pointer" }}>🖨️ Tiến hành In lệnh / Xuất File PDF</button>
        </div>
      </div>
    );
  }

  const chipsLop = [["all", "Tất cả lớp"], ...meta.classes.map((c) => [c.id, c.ten])];
  const chipsThu = [["all", "Tất cả học sinh"], ["chuaThu", "Chưa đóng tiền"], ["thieu", "Đóng còn thiếu"], ["thuThua", "Đóng dư thừa"]];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: font.body, paddingBottom: 80 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "10px 14px" }}>
        
        {/* THANH TIÊU ĐỀ ĐIỀU HƯỚNG CHUNG */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: font.display, color: C.pine }}>
              Tháng {month}/{year}
            </span>
            {daChot && <span style={{ marginLeft: 8, color: C.coral, fontWeight: "bold" }}>[ĐÃ CHỐT]</span>}
          </div>
          
          <div style={{ display: "flex", gap: 6 }}>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: font.body }}>
              {monthsList.map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.line}`, fontFamily: font.body }}>
              {yearsList.map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          </div>
        </div>

        {daChot && <LockNote />}

        {/* CÁC TAB CHỨC NĂNG CHÍNH */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <button onClick={() => setTab("tp")} style={{ padding: "9px 15px", borderRadius: 10, border: "none", background: tab === "tp" ? C.pine : C.card, color: tab === "tp" ? "#fff" : C.ink, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>💰 Thu học phí</button>
          <button onClick={() => setTab("dd")} style={{ padding: "9px 15px", borderRadius: 10, border: "none", background: tab === "dd" ? C.pine : C.card, color: tab === "dd" ? "#fff" : C.ink, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>📝 Điểm danh</button>
          {isAdmin && <button onClick={() => setTab("dt")} style={{ padding: "9px 15px", borderRadius: 10, border: "none", background: tab === "dt" ? C.pine : C.card, color: tab === "dt" ? "#fff" : C.ink, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>📊 Đối trừ A-B</button>}
          {isAdmin && <button onClick={() => setTab("cd")} style={{ padding: "9px 15px", borderRadius: 10, border: "none", background: tab === "cd" ? C.pine : C.card, color: tab === "cd" ? "#fff" : C.ink, fontWeight: 700, cursor: "pointer", fontSize: 13.5 }}>⚙️ Cài đặt</button>}
        </div>

        {/* NỘI DUNG TAB 1: THU PHÍ */}
        {tab === "tp" && (
          <div>
            <SearchBar value={search} onChange={setSearch} />
            {!isGV && <Chips items={chipsLop} val={lopFilter} set={setLopFilter} />}
            {!isGV && <Chips items={chipsThu} val={thuFilter} set={setThuFilter} />}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredRows.map(({ hs, rec, lop, ps, noTruoc, tongPhaiThu, conNo, coRec }) => {
                if (!coRec) return null;
                return (
                  <Card key={hs.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.pine }}>{hs.ten}</span>
                        <span style={{ fontSize: 11.5, color: C.sub, marginLeft: 8 }}>Lớp: {lop?.ten || "Chưa xếp"}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button onClick={() => setPhieuId(hs.id)} style={{ padding: "3px 8px", background: C.pineSoft, color: C.pine, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📄 Phiếu thu</button>
                        <Badge s={trangThaiThu(tongPhaiThu, rec.thucThu || 0)} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, fontSize: 13, background: "#fcfdfc", padding: 8, borderRadius: 8 }}>
                      <div>Phát sinh tháng: <b>{fmt(ps.tong)}đ</b></div>
                      <div>Nợ cũ/Thừa tháng trước: <b style={{ color: noTruoc > 0 ? C.coral : C.green }}>{fmt(noTruoc)}đ</b></div>
                      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>Tổng cần đóng: <b style={{ color: C.pine }}>{fmt(tongPhaiThu)}đ</b></div>
                      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 4 }}>Còn nợ lại: <b style={{ color: conNo > 0 ? C.coral : C.green }}>{fmt(conNo)}đ</b></div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 12, color: C.sub }}>Số tiền thực tế phụ huynh đóng:</span>
                        <NumInput value={rec.thucThu || 0} onChange={(v) => setRec(hs.id, { thucThu: v })} disabled={locked} w={110} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* NỘI DUNG TAB 2: ĐIỂM DANH */}
        {tab === "dd" && (
          <div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
              {Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1).map((d) => (
                <button key={d} onClick={() => setViewDay(d)} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 8, border: `1px solid ${viewDay === d ? C.pine : C.line}`, background: viewDay === d ? C.pine : "#fff", color: viewDay === d ? "#fff" : C.ink, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{d}</button>
              ))}
            </div>

            <Card>
              <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 14 }}>Điểm danh học sinh lớp ngày {viewDay}/{month}/{year}</div>
              {filteredRows.map(({ hs }) => {
                const currentStatus = ddData[hs.id]?.[viewDay] || "hoc";
                return (
                  <div key={hs.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{hs.ten}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button disabled={locked} onClick={async () => {
                        const cur = { ...ddData, [hs.id]: { ...(ddData[hs.id] || {}), [viewDay]: "hoc" } };
                        setDDData(cur); await sSet(`mn5:dd:${ym}`, cur);
                      }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: currentStatus === "hoc" ? C.green : C.graySoft, color: currentStatus === "hoc" ? "#fff" : C.sub, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Đi học</button>
                      <button disabled={locked} onClick={async () => {
                        const cur = { ...ddData, [hs.id]: { ...(ddData[hs.id] || {}), [viewDay]: "nghi" } };
                        setDDData(cur); await sSet(`mn5:dd:${ym}`, cur);
                      }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: currentStatus === "nghi" ? C.coral : C.graySoft, color: currentStatus === "nghi" ? "#fff" : C.sub, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Nghỉ học</button>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        )}

        {/* NỘI DUNG TAB 3: CHI PHÍ & ĐỐI TRỪ */}
        {tab === "dt" && isAdmin && <SecDongTien />}

        {/* NỘI DUNG TAB 4: CÀI ĐẶT */}
        {tab === "cd" && isAdmin && <SecCaiDat />}

        {/* PHIẾU THU PDF ẨN HIỆN */}
        {phieuId && <SecInPhieuPDF />}

        {/* HỆ THỐNG KHÓA NHANH TỔNG QUAN Ở DƯỚI CÙNG TAB TỔNG QUAN HỆ THỐNG */}
        {isAdmin && tab === "cd" && (
          <Card style={{ marginTop: 14, borderLeft: `4px solid ${C.coral}` }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Trạng thái khóa dữ liệu tháng hiện tại</div>
            <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.4, marginBottom: 8 }}>Khi chốt dữ liệu, giáo viên không thể thay đổi điểm danh và kế toán không thể sửa tiền thu chi của tháng đó.</p>
            <button onClick={handleToggleChotThang} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: daChot ? C.amber : C.coral, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{daChot ? "🔓 Mở khóa chỉnh sửa tháng" : "🔒 Tiến hành Chốt khóa tháng này"}</button>
          </Card>
        )}

      </div>

      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
