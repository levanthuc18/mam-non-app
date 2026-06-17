import { useState, useEffect, useRef, useMemo, memo } from "react";

// ====================================================================
// QUAN LY MAM NON — v5
//  + Lich su chuyen lop (lopHistory theo thang)
//  + Trang thai HS: Dang hoc / Nghi hoc / Tot nghiep (chi khac nhan)
//  + Ngay nhap hoc
//  + Phi linh hoat tung HS/thang: moi khoan luu {gia, default} -> nut reset + dau (da sua)
//  + Khoan thu dong: them bat ky, ap cho ca lop
//  + Cong no luy ke xuyen thang (bu tru thua/thieu) + bao cao tong no
//  + Tim kiem bo dau (Thu phi + Diem danh)
//  + Diem danh theo lop + theo ngay (mac dinh hom nay) + bang thang (desktop)
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

// ===== Storage: Supabase (neu da cau hinh) HOAC window.storage + mirror RAM =====
// [ONLINE] Dien URL + anon key cua Supabase de dong bo nhieu may. De trong "" => chay local nhu cu.
const SUPABASE_URL = "https://seflblpxqvedpjpqphet.supabase.co";  // URL lấy ở trên
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZmxibHB4cXZlZHBqcHFwaGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjI1MTYsImV4cCI6MjA5NjkzODUxNn0.SVGFvNbhaEGVsE4bSrdz2hubgTAH-LkIS-EqVMzUu9Q";
const SB = !!(SUPABASE_URL && SUPABASE_KEY);
const SB_H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

const MEM = {};
// [FIX chot] Ghi nho trang thai chot/mo cua tung thang trong phien -> tranh ban doc cu (Supabase tre) tu mo khoa
// [FIX chot F5] Luu CHOT_MEM xuong localStorage de song sot qua F5 (RAM bi xoa khi reload)
const CHOT_MEM = {};
try { const _cm = (typeof localStorage !== "undefined") && localStorage.getItem("mn5:chotmem"); if (_cm) Object.assign(CHOT_MEM, JSON.parse(_cm)); } catch {}
function saveChotMem() { try { if (typeof localStorage !== "undefined") localStorage.setItem("mn5:chotmem", JSON.stringify(CHOT_MEM)); } catch {} }
let storageOK = true;

async function sGet(k) {
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
async function sSet(k, v) {
  MEM[k] = v;
  // [FIX rong] value la object rong {} (vd bo het ngay le) -> XOA han dong thay vi ghi rong
  // (Supabase khong nhan ghi {} de "lam rong" -> doc lai khong co dong => tra ve {})
  const emptyObj = v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0;
  if (SB) {
    try {
      if (emptyObj) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}`, { method: "DELETE", headers: SB_H });
        if (!r.ok) storageOK = false;
        return r.ok;
      }
      // UPSERT ATOMIC 1 lenh -> het race khi dat-roi-bo nhanh; tra ve true/false
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
async function sList(prefix) {
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
async function sDel(k) {
  delete MEM[k];
  if (SB) { try { await fetch(`${SUPABASE_URL}/rest/v1/data?key=eq.${encodeURIComponent(k)}`, { method: "DELETE", headers: SB_H }); } catch {} return; }
  try { await window.storage.delete(k); } catch (e) {}
}

const PHAN_LOAI = ["Bthg", "AE", "GV", "T7"];
const PL_LABEL = { Bthg: "Bình thường", AE: "Anh em (−50%)", GV: "Con GV (miễn)", T7: "Chỉ thứ 7" };
// [PLBadge] Mau vien phan loai dung chung (Thu phi + Cai dat)
const PL_COLOR = { Bthg: { bg: C.greenSoft, fg: C.green }, AE: { bg: C.blueASoft, fg: C.blueA }, GV: { bg: C.violetBSoft, fg: C.violetB }, T7: { bg: C.amberSoft, fg: C.amber } };
function PLBadge({ pl }) { const c = PL_COLOR[pl] || PL_COLOR.Bthg; return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: c.bg, color: c.fg, whiteSpace: "nowrap" }}>{pl}</span>; }
const PL_HE = { Bthg: 1, AE: 0.5, GV: 0, T7: 0 };
const TRANG_THAI = ["Đang học", "Học thử", "Bảo lưu", "Nghỉ học", "Ra trường"];
const TT_COLOR = { "Đang học": C.green, "Học thử": C.blueA, "Bảo lưu": C.amber, "Nghỉ học": C.coral, "Ra trường": C.violetB };
// Trang thai co phat sinh hoc phi (tao dong thu thang moi)
const TT_THU_PHI = { "Đang học": true, "Học thử": true, "Bảo lưu": false, "Nghỉ học": false, "Ra trường": false };
const LOAI_CHI = ["PHAT_SINH", "CO_DINH", "NO_AB", "CHUYEN", "TRA_NO"];

// Khoan phi co dinh trong PS (key -> nhan + lay tu dau)
// nguon: 'lop' = gia lop * (he so cho hocPhi), 'lopFlat' = gia lop nguyen, 'an' = tinh theo ngay
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
// Trang thai khoan thu theo lop: "thu" (co thu) | "khong" (khong thu). Mac dinh: thu
const khoanMode = (lop, key) => {
  const m = lop?.lapLai;
  if (!m || m[key] === undefined) return "thu";
  // tuong thich du lieu cu: true/"thang"/"motlan" -> thu ; false/"khong" -> khong
  const v = m[key];
  if (v === false || v === "khong") return "khong";
  return "thu";
};
const isKhongThu = (lop, key) => khoanMode(lop, key) === "khong";

// ===== SEED: 2 lop, 20 HS, 3 thang =====
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


// Tinh gia mac dinh 1 khoan cho HS theo lop + phan loai
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
    if (!TT_THU_PHI[hs.trangThai]) return; // hs nghi tu T6 khong tao
    const nhap = ngayNhapHocTrongThang(hs, Number(ym.slice(0,4)), Number(ym.slice(5,7)));
    const ngayAn = nhap <= 26 ? soNgayHoc(Number(ym.slice(0,4)), Number(ym.slice(5,7)), {}, nhap) : 0;
    const rec = { ngayAn, buoiT7: hs.pl === "T7" ? 4 : 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
    KHOAN.forEach((k) => {
      const d = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, ngayAn);
      rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d;
    });
    fees[hs.id] = rec;
  });
  // [CHI CO DINH] Mau 5 khoan co dinh moi thang
  const chiPhi = [
    { id: uid(), noiDung: "Lương giáo viên", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Thực phẩm 1", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Thực phẩm 2", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Tiền điện", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
    { id: uid(), noiDung: "Tiền nước", soTien: 0, nguoiChi: "A", loai: "CO_DINH", daTra: 0 },
  ];
  return { fees, thuNgoai: [], chiPhi, daChot: false, khoanThuLop: [] };
}

// Lop hieu luc cua HS tai thang ym
function lopOfMonth(hs, ym) {
  const hist = (hs.lopHistory || []).filter((h) => h.tuThang <= ym).sort((a, b) => a.tuThang.localeCompare(b.tuThang));
  return hist.length ? hist[hist.length - 1].lop : (hs.lopHistory?.[0]?.lop || null);
}
function lopHienTai(hs) {
  const h = (hs.lopHistory || []).slice().sort((a, b) => a.tuThang.localeCompare(b.tuThang));
  return h.length ? h[h.length - 1].lop : null;
}
// Dem so thu 7 trong thang ma HS KHONG danh nghi = so buoi T7 di hoc
function soBuoiT7Auto(year, month, attHS) {
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    if (new Date(year, month - 1, d).getDay() === 6 && !(attHS && attHS[d])) n++;
  }
  return n;
}
// [UX-W] So ngay hoc trong thang = tong ngay - CN - ngay le (le = { [day]: true })
function soNgayHoc(year, month, le, tuNgay = 1) {
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = Math.max(1, tuNgay); d <= days; d++) {
    const dw = new Date(year, month - 1, d).getDay();
    if (dw === 0) continue;        // CN nghi
    if (le && le[d]) continue;     // ngay le nghi
    n++;
  }
  return n;
}
// Ngày nhập học trong tháng đang xem (1 = đã nhập từ đầu, 99 = chưa nhập)
function ngayNhapHocTrongThang(hs, year, month) {
  if (!hs || !hs.ngayNhapHoc) return 1;
  const [y, m, d] = hs.ngayNhapHoc.split("-").map(Number);
  if (y > year || (y === year && m > month)) return 99; // chưa nhập học
  if (y < year || (y === year && m < month)) return 1;  // đã nhập từ trước
  return d; // nhập giữa tháng
}
const TUAN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Tong PS tu rec (khoan + phu thu - khong tru ngay nghi rieng vi tienAn da theo ngayAn;
// nghi -> giam ngayAn KHI tinh; o day ta tru nghi qua tienAn = (ngayAn-nghi)*gia)
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
    // tien an: tru ngay nghi -> hien rieng dong
    if (k.key === "tienAn") {
      const sua = val !== def;
      if (val !== 0 || def !== 0) {
        dong.push([`Ăn (${rec.ngayAn || 0} ngày)`, val, sua]);
        tong += val; if (sua) suaCount++;
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
  // buoi T7 le (Bthg co hoc T7)
  if (rec.buoiT7 > 0) { const t = rec.buoiT7 * (lop?.t7 || 0); dong.push([`T7 (${rec.buoiT7} buổi)`, t, false]); tong += t; }
  // phu thu dong
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

// ====== UI nho ======
function Badge({ s }) { return <span style={{ background: s.bg, color: s.c, fontFamily: font.body, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{s.t}</span>; }
// [KT2] O nhap tien: focus -> so thuan (ban phim so), blur -> format 1.000. Khong nhay con tro.
function NumInput({ value, onChange, w = 70, disabled, warn }) {
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
function ABBtn({ val, set, small, disabled }) {
  return (
    <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.line}`, opacity: disabled ? 0.6 : 1 }}>
      {["A", "B"].map((p) => (
        <button key={p} onClick={() => !disabled && set(p)} style={{ padding: small ? "5px 11px" : "7px 13px", fontWeight: 700, fontSize: small ? 12 : 13, border: "none", cursor: disabled ? "default" : "pointer", background: val === p ? (p === "A" ? C.blueA : C.violetB) : "#fff", color: val === p ? "#fff" : C.sub, fontFamily: font.body }}>{p}</button>
      ))}
    </div>
  );
}
function Chips({ items, val, set, compact }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: compact ? 2 : 4, marginBottom: compact ? 6 : 10 }}>
      {items.map(([id, lb]) => (
        <button key={id} onClick={() => set(id)} style={{ flexShrink: 0, padding: compact ? "5px 12px" : "6px 13px", borderRadius: 99, border: `1.5px solid ${val === id ? C.pine : C.line}`, cursor: "pointer", background: val === id ? C.pine : C.card, color: val === id ? "#fff" : C.sub, fontFamily: font.body, fontSize: 12.5, fontWeight: 600 }}>{lb}</button>
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
// [Sticky] Ghim thanh lọc lên đỉnh khi cuộn, có hiệu ứng nền mờ + viền mượt
function useStickyShrink() {
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
function StickyBar({ shrunk, children }) {
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
function Card({ children, style }) { return <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: 14, ...style }}>{children}</div>; }
function LockNote() { return <div style={{ background: C.goldSoft, border: `1px solid #EAD8A0`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12.5, color: "#7A5E12" }}>🔒 Tháng này đã chốt — chỉ xem. Mở khóa ở tab Tổng quan.</div>; }

// ===== Confirm + Toast trong app (thay window.confirm/alert bi chan o artifact) =====
let _ask = null, _toast = null;
function ask(msg, opts) { return new Promise((res) => { _ask && _ask({ msg, opts: opts || {}, res }); }); }
function toast(msg, undo) { _toast && _toast({ msg, undo }); }

// ===== [AUDIT] Nhat ky thao tac =====
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

// ====================================================================
// [PQ] Man hinh dang nhap: Admin (PIN 1989) hoac GV (PIN rieng)
function LoginScreen({ meta, onLogin }) {
  const [mode, setMode] = useState(null); // null | 'admin' | 'gv'
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

// [P0-2] Sao luu / phuc hoi du lieu (co fallback copy/paste cho moi truong chan tai file)
function BackupExport({ meta, students }) {
  const [busy, setBusy] = useState(false);
  const [outText, setOutText] = useState("");
  const [outName, setOutName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const dl = (text, name, type) => { try { const blob = new Blob([type === "csv" ? "\uFEFF" + text : text], { type: type === "csv" ? "text/csv;charset=utf-8;" : "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (e) {} };

  const buildJSON = async () => {
    const keys = await sList("mn5:"); const data = {};
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
      const ddPrevM = (await sGet(`mn5:dd:${ymKey(py, pm)}`)) || {};
      for (const [sid, rec] of Object.entries(td.fees)) {
        const hs = students.find((s) => s.id === sid); if (!hs) continue;
        const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, ym));
        const nghi = Object.keys(ddPrevM[sid] || {}).length;
        const ps = tinhPSFromRec(hs, rec, lop, nghi).tong; const tt = Number(rec.thucThu) || 0;
        rows.push([ym, sid, hs.ten, lop?.ten || "", ps, tt, ps - tt]);
      }
    }
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  };

  const doExport = async (kind) => {
    setBusy(true);
    try {
      const text = kind === "json" ? await buildJSON() : await buildCSV();
      const name = kind === "json" ? `sao-luu-mamnon-${new Date().toISOString().slice(0, 10)}.json` : `bao-cao-thu-phi-${new Date().toISOString().slice(0, 10)}.csv`;
      dl(text, name, kind);                 // thu tai file (chay khi deploy that)
      setOutText(text); setOutName(name);   // hien ra de copy (chay trong khung chat)
    } catch (e) { toast("Lỗi xuất: " + e.message); }
    setBusy(false);
  };

  const copyOut = async () => { try { await navigator.clipboard.writeText(outText); toast("Đã copy."); } catch { toast("Bôi đen ô bên dưới rồi Copy thủ công."); } };

  const restore = async (text) => {
    let data; try { data = JSON.parse(text); } catch { toast("Nội dung không hợp lệ."); return; }
    const n = Object.keys(data).length;
    if (!n) { toast("Không có dữ liệu."); return; }
    if (!(await ask(`Phục hồi ${n} mục?\n⚠️ GHI ĐÈ toàn bộ dữ liệu hiện tại — không hoàn tác được.`, { danger: true, okText: "Phục hồi" }))) return;
    setBusy(true);
    try {
      const old = await sList("mn5:");
      for (const k of old) if (!(k in data)) await sDel(k);
      for (const [k, v] of Object.entries(data)) await sSet(k, v);
      toast("Đã phục hồi. Đang tải lại…");
      setTimeout(() => location.reload(), 800);
    } catch (e) { toast("Lỗi: " + e.message); setBusy(false); }
  };
  const importFile = async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; restore(await f.text()); };

  return (
    <>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>💾 Sao lưu dữ liệu</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>Bấm để xuất. Nếu máy không tự tải file (do trình duyệt/khung xem trước chặn), nội dung sẽ hiện ra ô bên dưới để bạn <b>copy</b> và dán vào ghi chú/Zalo lưu lại.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => doExport("json")} disabled={busy} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Đang xử lý…" : "📥 Sao lưu toàn bộ (JSON)"}</button>
          <button onClick={() => doExport("csv")} disabled={busy} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.pine}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>📊 Xuất Excel thu phí (CSV)</button>
        </div>
        {outText && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.sub }}>{outName}</span>
              <button onClick={copyOut} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: C.blueA, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>📋 Copy</button>
            </div>
            <textarea readOnly value={outText} onFocus={(e) => e.target.select()} style={{ width: "100%", height: 110, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: 8, resize: "vertical", color: C.ink, background: "#FAFCFA" }} />
          </div>
        )}
      </Card>
      <Card>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>♻️ Phục hồi</div>
        <div style={{ fontSize: 12, color: C.coral, fontWeight: 600, marginBottom: 10 }}>⚠️ Ghi đè toàn bộ dữ liệu hiện tại.</div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Cách 1 — dán nội dung bản sao lưu JSON vào đây:</div>
        <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder='Dán nội dung JSON đã sao lưu...' style={{ width: "100%", height: 90, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: 8, resize: "vertical", marginBottom: 8 }} />
        <button onClick={() => restore(pasteText)} disabled={busy || !pasteText.trim()} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: pasteText.trim() ? C.coral : C.graySoft, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: pasteText.trim() ? "pointer" : "default" }}>♻️ Phục hồi từ nội dung dán</button>
        <div style={{ fontSize: 12, color: C.sub, margin: "12px 0 6px" }}>Cách 2 — chọn file .json (chỉ chạy khi mở app thật):</div>
        <label style={{ display: "inline-block", padding: "10px 16px", borderRadius: 10, border: `1.5px dashed ${C.line}`, fontSize: 13.5, color: C.sub, cursor: "pointer" }}>Chọn file .json<input type="file" accept=".json,application/json" onChange={importFile} disabled={busy} style={{ display: "none" }} /></label>
      </Card>
    </>
  );
}

export default function App() {
  const now = new Date();
  const [meta, setMeta] = useState(null);
  const [students, setStudents] = useState(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [mData, setMData] = useState(null);
  const [ddData, setDDData] = useState(null); // [UX-V] diem danh rieng { [hsId]: { [day]: true } }
  const [leData, setLeData] = useState(null); // [UX-W] ngay le chung { [day]: true }
  const [ddPrev, setDDPrev] = useState({}); // [UX-X] diem danh thang TRUOC (de tru nghi)
  const [nextChot, setNextChot] = useState(false); // [UX-Y] thang sau da chot?
  const [tab, setTab] = useState("thu");
  const [auth, setAuth] = useState(null); // [PQ] null | {role:'admin'} | {role:'gv',gvId,ten,lopId}
  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";
  const gvLopId = auth?.lopId || null;
  const gvTen = auth?.ten || "";
  CURRENT_ACTOR = isAdmin ? "Admin" : (isGV ? gvTen : "?");
  const [openId, setOpenId] = useState(null);
  const [phieuId, setPhieuId] = useState(null);
  const [lopFilter, setLopFilter] = useState("all");
  const [thuFilter, setThuFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [isWide, setIsWide] = useState(typeof window !== "undefined" && window.innerWidth >= 820);
  const saveT = useRef({});
  const ym = ymKey(year, month);

  useEffect(() => {
    const h = () => setIsWide(window.innerWidth >= 820);
    window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  // Tao toan bo du lieu mau (3 thang + no luy ke)
  const doSeed = async () => {
    const m = SEED_META, st = [];
    await sSet("mn5:meta", m); await sSet("mn5:students", st);
    await sSet("mn5:seedVersion", 14);
    return { m, st };
  };

  // Load + seed
  useEffect(() => { (async () => {
    let m = await sGet("mn5:meta");
    let st = await sGet("mn5:students");
    const sv = await sGet("mn5:seedVersion");
    // Seed cau hinh lan dau (chua co meta) HOAC phien ban cu
    if (!m || !st || sv !== 14) {
      const r = await doSeed();
      m = r.m; st = r.st; setSeeded(true);
    }
    setMeta(m); setStudents(st); setLoading(false);
    const a = await sGet("mn5:auth"); if (a && (a.role === "admin" || a.role === "gv")) setAuth(a);
  })(); }, []);

  // [PQ] dang nhap / dang xuat
  const login = (a) => { setAuth(a); sSet("mn5:auth", a); };
  const logout = () => { setAuth(null); sDel("mn5:auth"); setTab("dd"); };

  // Nut nap lai du lieu mau (xoa sach + seed)
  const reseedAll = async () => {
    const keys = await sList("mn5:");
    for (const k of keys) await sDel(k);
    Object.keys(CHOT_MEM).forEach((k) => delete CHOT_MEM[k]); saveChotMem();
    const r = await doSeed();
    setMeta({ ...r.m }); setStudents([...r.st]);
    setMData(null); setSeeded(true);
    setMonth(now.getMonth() + 1); setYear(now.getFullYear());
  };

  // Load thang khi doi ym (KHONG phu thuoc meta de tranh ghi de khi sua don gia)
  const metaReady = !!meta;
  useEffect(() => { if (!metaReady) return; (async () => {
    const d = await sGet(`mn5:thang:${ym}`);
    // [UX-V] Load diem danh rieng; migrate tu d.att neu la du lieu cu
    let dd = await sGet(`mn5:dd:${ym}`);
    if (!dd && d?.att) { dd = d.att; await sSet(`mn5:dd:${ym}`, dd); }
    setDDData(dd || {});
    const le = await sGet(`mn5:le:${ym}`);
    setLeData(le || {});
    // [UX-X] Diem danh thang truoc (de tru nghi vao thang nay)
    const pm = month === 1 ? 12 : month - 1, py = month === 1 ? year - 1 : year;
    const ddP = await sGet(`mn5:dd:${ymKey(py, pm)}`);
    setDDPrev(ddP || {});
    // [UX-Y] Trang thai chot cua thang SAU (de khoa diem danh thang nay neu thang sau da chot)
    const nm = month === 12 ? 1 : month + 1, ny = month === 12 ? year + 1 : year;
    const nd = await sGet(`mn5:thang:${ymKey(ny, nm)}`);
    setNextChot(!!nd?.daChot);
    if (d) { const { att, ...rest } = d; if (CHOT_MEM[ym] !== undefined) rest.daChot = CHOT_MEM[ym]; setMData({ ...rest, __ym: ym }); }
    else setMData(null);
  })(); setOpenId(null); setPhieuId(null); }, [ym, metaReady]);

  // [ONLINE] Tu dong tai lai diem danh + bang thang moi 10s (chi khi dung Supabase) de thay may khac vua sua
  useEffect(() => {
    if (!SB || !metaReady) return;
    const t = setInterval(async () => {
      delete MEM[`mn5:dd:${ym}`]; const dd = await sGet(`mn5:dd:${ym}`); setDDData(dd || {});
      // [FIX] Không tự động sync mData (thu phí/chốt tháng) mỗi 10s để tránh ghi đè daChot từ server cũ hơn
      // Nếu cần cập nhật từ máy khác, người dùng đổi tháng hoặc refresh
    }, 10000);
    return () => clearInterval(t);
  }, [ym, metaReady]);
  // [UX-P] Doi tab -> dong the dang mo
  useEffect(() => { setOpenId(null); }, [tab]);
  // [PHAN QUYEN] GV chi o tab Diem danh
  useEffect(() => { if (isGV && tab !== "dd") setTab("dd"); }, [isGV, tab]);

  // Dong bo students -> thang dang mo: them HS moi/chuyen sang Dang hoc, doi lop -> tinh lai default
  // [KT3] Dong bo students + don gia/cong tac lop -> thang dang mo (gop 2 effect cu)
  // - Them dong thu cho HS moi / vua chuyen sang Dang hoc
  // - Doi lop/don gia/cong tac -> cap nhat default (chua sua tay), khoan tat -> ep 0
  useEffect(() => {
    if (!meta || !mData || mData.daChot || !students) return;
    if (mData.__ym !== ym) return; // [Bug2] mData chua khop thang dang xem -> bo qua, tranh tao lai thang da xoa
    let changed = false;
    const fees = { ...mData.fees };
    students.forEach((hs) => {
      if (!TT_THU_PHI[hs.trangThai]) return;
      const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, ym)); if (!lop) return;
      if (!fees[hs.id]) {
        const ngayAn = soNgayHoc(year, month, leData);
        const rec = { ngayAn, buoiT7: 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
        KHOAN.forEach((k) => { const d = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, ngayAn); rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d; });
        fees[hs.id] = rec; changed = true;
      } else {
        const cur = fees[hs.id];
        const nd = { ...cur.khoanDefault }, nk = { ...cur.khoan }; let rc = false;
        KHOAN.forEach((k) => {
          const want = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, cur.ngayAn);
          const od = cur.khoanDefault?.[k.key] ?? 0, ov = cur.khoan?.[k.key] ?? 0;
          if (want !== od) { nd[k.key] = want; if (ov === od || isKhongThu(lop, k.key)) nk[k.key] = want; rc = true; }
        });
        if (rc) { fees[hs.id] = { ...cur, khoan: nk, khoanDefault: nd }; changed = true; }
      }
    });
    if (changed) setMData((m) => { const ndata = { ...m, fees }; flush(`mn5:thang:${ym}`, stripYm(ndata)); return ndata; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, students, ym]);

  // [UX-W] Tu tinh ngay an = so ngay hoc (tru CN + le); HS da sua tay (ngayAnManual) giu nguyen
  useEffect(() => {
    if (!meta || !mData || mData.daChot || !students || leData == null) return;
    if (mData.__ym !== ym) return; // [Bug2] tranh ghi nham thang
    let changed = false;
    const fees = { ...mData.fees };
    Object.keys(fees).forEach((sid) => {
      const cur = fees[sid]; if (cur.ngayAnManual) return;
      const hs = students.find((s) => s.id === sid); if (!hs) return;
      const nhap = ngayNhapHocTrongThang(hs, year, month);
      const snh = nhap <= 26 ? soNgayHoc(year, month, leData, nhap) : 0;
      if (cur.ngayAn === snh) return;
      const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, ym));
      const newDef = isKhongThu(lop, "tienAn") ? 0 : snh * (lop?.tienAn || 0);
      const giuSuaTayTienAn = cur.khoan.tienAn !== cur.khoanDefault.tienAn;
      fees[sid] = { ...cur, ngayAn: snh, khoanDefault: { ...cur.khoanDefault, tienAn: newDef }, khoan: { ...cur.khoan, tienAn: giuSuaTayTienAn ? cur.khoan.tienAn : newDef } };
      changed = true;
    });
    if (changed) setMData((m) => { const ndata = { ...m, fees }; flush(`mn5:thang:${ym}`, stripYm(ndata)); return ndata; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leData, meta, students, ym]);

  // [KT1] No/du luy ke den HET thang truoc.
  // Tim thang da CHOT gan nhat (< ym) -> dung snapshot noLuyKe lam diem xuat phat,
  // chi tinh dong cac thang sau snapshot (chua chot). Khong quet lai tu dau -> nhanh.
  const [prevDebt, setPrevDebt] = useState({});
  useEffect(() => { if (!metaReady || !students) return; (async () => {
    const keys = await sList("mn5:thang:");
    const months = keys.map((k) => k.replace("mn5:thang:", "")).filter((m) => /^\d{4}-\d{2}$/.test(m) && m < ym).sort();
    const datas = await Promise.all(months.map((m) => sGet(`mn5:thang:${m}`)));
    const dds = await Promise.all(months.map((m) => sGet(`mn5:dd:${m}`)));
    // [UX-X] dd cua thang ngay truoc moi thang (de tru nghi); fetch them neu khong nam trong list
    const prevKeys = Array.from(new Set(months.map((m) => { const y = Number(m.slice(0, 4)), mo = Number(m.slice(5)); const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y; return ymKey(py, pm); }).filter((k) => !months.includes(k))));
    const prevVals = await Promise.all(prevKeys.map((k) => sGet(`mn5:dd:${k}`)));
    const ddPrevExtra = {}; prevKeys.forEach((k, i) => { ddPrevExtra[k] = prevVals[i] || {}; });
    // Tim chi so thang chot gan nhat co snapshot
    let snapIdx = -1;
    for (let i = months.length - 1; i >= 0; i--) { if (datas[i]?.daChot && datas[i]?.noLuyKe) { snapIdx = i; break; } }
    const debt = {};
    students.forEach((hs) => { debt[hs.id] = hs.noDauKy || 0; });
    if (snapIdx >= 0) { const snap = datas[snapIdx].noLuyKe; Object.keys(snap).forEach((sid) => { debt[sid] = snap[sid]; }); }
    // Tinh dong cac thang SAU snapshot (chua chot hoac khong co snapshot)
    for (let i = snapIdx + 1; i < months.length; i++) {
      const td = datas[i]; if (!td?.fees) continue;
      const m = months[i], y = Number(m.slice(0, 4)), mo = Number(m.slice(5));
      const ddM = dds[i] || td.att || {};
      // neu thang nay da chot va co snapshot -> lay luon snapshot (chinh xac hon)
      if (td.daChot && td.noLuyKe) { Object.keys(td.noLuyKe).forEach((sid) => { debt[sid] = td.noLuyKe[sid]; }); continue; }
      Object.keys(td.fees).forEach((sid) => {
        const hs = students.find((s) => s.id === sid); if (!hs) return;
        if (debt[sid] === undefined) debt[sid] = hs.noDauKy || 0;
        let rec = td.fees[sid];
        const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, m));
        // [UX-X] tru nghi theo diem danh THANG TRUOC cua thang m
        const ppm = mo === 1 ? 12 : mo - 1, ppy = mo === 1 ? y - 1 : y;
        const ddPrevKey = ymKey(ppy, ppm);
        const idxPrev = months.indexOf(ddPrevKey);
        const ddPrevM = (idxPrev >= 0 ? dds[idxPrev] : null) || ddPrevExtra[ddPrevKey] || {};
        const nghi = Object.keys(ddPrevM[sid] || {}).length;
        if (hs.pl === "T7" && !rec.buoiT7Manual) rec = { ...rec, buoiT7: soBuoiT7Auto(y, mo, ddM[sid]) };
        const ps = tinhPSFromRec(hs, rec, lop, nghi).tong;
        debt[sid] += ps - (Number(rec.thucThu) || 0);
      });
    }
    setPrevDebt(debt);
  })(); }, [ym, metaReady, students, mData, meta]);

  // Luu co debounce, nhung luu THANG ngay lap tuc de tranh mat du lieu khi doi thang
  const q = (k, v) => { clearTimeout(saveT.current[k]); saveT.current[k] = setTimeout(() => sSet(k, v), 400); };
  const flush = (k, v) => { clearTimeout(saveT.current[k]); return sSet(k, v); };
  const upMeta = (m) => { setMeta(m); q("mn5:meta", m); };
  const upStudents = (s) => { setStudents(s); q("mn5:students", s); };
  // Thang: luu NGAY (khong debounce) -> khong bao gio mat khi chuyen thang
  const upMData = (d) => { CHOT_MEM[ym] = !!d.daChot; saveChotMem(); const dd = { ...d, __ym: ym }; setMData(dd); return flush(`mn5:thang:${ym}`, stripYm(dd)); };
  const upDDData = (d) => { setDDData(d); return flush(`mn5:dd:${ym}`, d); };
  const upLeData = (d) => { setLeData(d); flush(`mn5:le:${ym}`, d); };

  const getLop = (id) => meta?.classes.find((c) => c.id === id);
  const locked = mData?.daChot;

  const taoThang = async () => {
    // Lay thang truoc de ke thua khoan CO DINH
    const py = month === 1 ? year - 1 : year;
    const pm = month === 1 ? 12 : month - 1;
    const prev = await sGet(`mn5:thang:${ymKey(py, pm)}`);
    const data = seedThangData(ym, students, meta);
    data.fees = {};
    students.forEach((hs) => {
      if (!TT_THU_PHI[hs.trangThai]) return;
      const lop = getLop(lopOfMonth(hs, ym));
      const nhap = ngayNhapHocTrongThang(hs, year, month);
      const ngayAn = nhap <= 26 ? soNgayHoc(year, month, leData, nhap) : 0;
      const rec = { ngayAn, buoiT7: hs.pl === "T7" ? 4 : 0, thucThu: 0, khoan: {}, khoanDefault: {}, phuThu: [] };
      KHOAN.forEach((k) => {
        const d = isKhongThu(lop, k.key) ? 0 : defaultKhoan(k.key, lop, hs, ngayAn);
        rec.khoan[k.key] = d; rec.khoanDefault[k.key] = d;
      });
      // Ke thua khoan CO DINH thang truoc
      const prevRec = prev?.fees?.[hs.id];
      if (prevRec?.phuThu) rec.phuThu = prevRec.phuThu.filter((p) => p.coDinh).map((p) => ({ ...p, id: uid() }));
      data.fees[hs.id] = rec;
    });
    // [CHI CO DINH] Ke thua chi phi CO_DINH thang truoc (reset Da tra ve 0)
    if (prev?.chiPhi?.length) {
      data.chiPhi = prev.chiPhi.filter((c) => c.loai === "CO_DINH").map((c) => ({ id: uid(), noiDung: c.noiDung, soTien: c.soTien, nguoiChi: c.nguoiChi, loai: "CO_DINH", daTra: 0 }));
    }
    upMData(data);
    toast(`Đã tạo tháng ${month}/${year}.`);
    logAction(`Tạo bảng thu tháng ${month}/${year}`);
  };

  const delThang = async () => {
    if (locked) { toast("Tháng đã chốt — mở khóa trước khi xóa."); return; }
    if (await ask(`Xóa toàn bộ bảng THU tháng ${month}/${year}?\nĐiểm danh tháng này vẫn được GIỮ lại.`, { danger: true, okText: "Xóa bảng thu" })) {
      await sDel(`mn5:thang:${ym}`);
      delete CHOT_MEM[ym]; saveChotMem();
      setMData(null);
      logAction(`Xóa bảng thu tháng ${month}/${year}`);
      toast(`Đã xóa bảng thu. Điểm danh tháng ${month}/${year} vẫn còn.`);
    }
  };

  // Cap nhat ngayAn -> recalc default tienAn (giu sua tay neu da sua)
  const setRec = (sid, patch) => {
    if (locked) return;
    const cur = mData.fees[sid];
    let next = { ...cur, ...patch };
    // [UX-W] tra ve tu dong -> tinh lai ngayAn theo so ngay hoc
    if (patch.ngayAnManual === false) { patch = { ...patch, ngayAn: soNgayHoc(year, month, leData) }; next = { ...cur, ...patch }; }
    if (patch.ngayAn != null) {
      const lop = getLop(lopOfMonth(students.find((s) => s.id === sid), ym));
      const newDef = (patch.ngayAn || 0) * (lop?.tienAn || 0);
      next.khoanDefault = { ...next.khoanDefault, tienAn: newDef };
      // neu truoc do tienAn == default cu -> cap nhat theo default moi
      if (cur.khoan.tienAn === cur.khoanDefault.tienAn) next.khoan = { ...next.khoan, tienAn: newDef };
    }
    upMData({ ...mData, fees: { ...mData.fees, [sid]: next } });
  };
  // Thu du HANG LOAT: gop 1 lan ghi (tranh loi chi luu HS cuoi)
  const thuDuNhieu = (pairs) => {
    if (locked) return;
    const fees = { ...mData.fees };
    pairs.forEach(({ sid, thucThu }) => { if (fees[sid]) fees[sid] = { ...fees[sid], thucThu }; });
    upMData({ ...mData, fees });
    if (pairs.length > 1) logAction(`Thu đủ hàng loạt ${pairs.length} HS (T${month}/${year})`);
  };
  const setKhoan = (sid, key, val) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, khoan: { ...cur.khoan, [key]: val } } } });
  };
  const resetKhoan = (sid, key) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, khoan: { ...cur.khoan, [key]: cur.khoanDefault[key] } } } });
  };
  const resetAllKhoan = (sid) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, khoan: { ...cur.khoanDefault } } } });
  };
  // Ap ngay an cho TAT CA HS dang co rec trong thang (chi sua HS chua chinh tay tienAn)
  const setNgayAnAll = (val, onlyIds) => {
    if (locked) return;
    const fees = { ...mData.fees };
    const ids = onlyIds && onlyIds.length ? onlyIds.filter((id) => fees[id]) : Object.keys(fees);
    ids.forEach((sid) => {
      const cur = fees[sid];
      const lop = getLop(lopOfMonth(students.find((s) => s.id === sid), ym));
      const newDef = (val || 0) * (lop?.tienAn || 0);
      const giuSuaTay = cur.khoan.tienAn !== cur.khoanDefault.tienAn;
      fees[sid] = { ...cur, ngayAn: val, ngayAnManual: true, khoanDefault: { ...cur.khoanDefault, tienAn: newDef }, khoan: { ...cur.khoan, tienAn: giuSuaTay ? cur.khoan.tienAn : newDef } };
    });
    upMData({ ...mData, fees });
    toast(`Đã đặt ${val} ngày ăn cho ${ids.length} HS đang hiển thị.`);
  };
  const addPhuThuHS = (sid, ten, soTien) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, phuThu: [...(cur.phuThu || []), { id: uid(), ten, soTien: Number(soTien) || 0 }] } } });
  };
  const delPhuThuHS = (sid, pid) => {
    if (locked) return;
    const cur = mData.fees[sid];
    upMData({ ...mData, fees: { ...mData.fees, [sid]: { ...cur, phuThu: (cur.phuThu || []).filter((p) => p.id !== pid) } } });
  };

  const allRows = useMemo(() => {
    if (!mData || !students) return [];
    return students.map((hs) => {
      let rec = mData.fees?.[hs.id];
      const lopId = lopOfMonth(hs, ym);
      const lop = getLop(lopId);
      // [UX-X] Tru nghi theo diem danh THANG TRUOC (thu truoc, bu tru sau)
      const nghi = Object.keys(ddPrev?.[hs.id] || {}).length;
      // Buoi T7 tu diem danh thang HIEN TAI (giu nguyen)
      if (rec && hs.pl === "T7" && !rec.buoiT7Manual) {
        const auto = soBuoiT7Auto(year, month, ddData?.[hs.id]);
        if (auto !== rec.buoiT7) rec = { ...rec, buoiT7: auto };
      }
      const ps = rec ? tinhPSFromRec(hs, rec, lop, nghi) : { tong: 0, dong: [], suaCount: 0 };
      const noTruoc = prevDebt[hs.id] || 0;
      const tongPhaiThu = ps.tong + noTruoc; // gom no cu
      return { hs, rec, lopId, lop, nghi, ps, noTruoc, tongPhaiThu, st: rec ? trangThaiThu(tongPhaiThu, rec.thucThu) : null, conNo: rec ? tongPhaiThu - rec.thucThu : 0, coRec: !!rec };
    });
  }, [students, mData, ddData, ddPrev, meta, year, month, prevDebt]);

  // [DIEM DANH] Danh sach HS de diem danh — dung allRows neu co bang thu, neu khong thi dung students dang hoc
  const ddRows = useMemo(() => {
    if (mData) return allRows;
    if (!students || !meta) return [];
    return students.filter((hs) => TT_THU_PHI[hs.trangThai]).map((hs) => {
      const lopId = lopOfMonth(hs, ym);
      return { hs, lopId, lop: meta.classes.find((c) => c.id === lopId), coRec: true };
    });
  }, [mData, allRows, students, meta, ym]);

  const rows = useMemo(() => {
    const s = noDau(search);
    return allRows.filter((r) => {
      if (!r.coRec) return false;
      if (lopFilter !== "all" && r.lopId !== lopFilter) return false;
      if (s && !noDau(r.hs.ten).includes(s) && !r.hs.id.toLowerCase().includes(s)) return false;
      if (thuFilter === "chuaThu") return r.ps.tong > 0 && (r.rec.thucThu || 0) === 0;
      if (thuFilter === "thieu") return r.conNo > 0 && (r.rec.thucThu || 0) > 0;
      if (thuFilter === "noCu") return r.noTruoc > 0;
      if (thuFilter === "thuThua") return r.conNo < 0;
      return true;
    });
  }, [allRows, lopFilter, search, thuFilter]);

  const tk = useMemo(() => {
    const s = { ps: 0, thu: 0, no: 0, A: 0, B: 0, chiA: 0, chiB: 0, traA: 0, traB: 0, noList: [], noAB_AtoB: 0, noAB_BtoA: 0 };
    allRows.forEach((r) => {
      if (!r.coRec) return;
      s.ps += r.ps.tong; s.thu += r.rec.thucThu; // ps = phat sinh thang nay (doanh thu thang)
      if (r.conNo > 0) { s.no += r.conNo; s.noList.push({ ten: r.hs.ten, so: r.conNo, chua: r.rec.thucThu === 0 }); }
      if (r.hs.nguoiThu === "A") s.A += r.rec.thucThu; else if (r.hs.nguoiThu === "B") s.B += r.rec.thucThu;
    });
    (mData?.thuNgoai || []).forEach((k) => {
      const tt = Number(k.thucThu) || 0; s.ps += Number(k.soTien) || 0; s.thu += tt;
      if (k.nguoiThu === "A") s.A += tt; else if (k.nguoiThu === "B") s.B += tt;
      const no = (Number(k.soTien) || 0) - tt; if (no > 0) { s.no += no; s.noList.push({ ten: "(TN) " + k.ten, so: no, chua: tt === 0 }); }
    });
    (mData?.chiPhi || []).forEach((c) => {
      const e = Number(c.soTien) || 0, kk = Number(c.daTra) || 0;
      if (c.loai === "CHUYEN") { if (c.huong === "A->B") { s.A -= e; s.B += e; } else { s.B -= e; s.A += e; } return; }
      if (c.loai === "NO_AB") { if (c.huong === "A->B") s.noAB_AtoB += e - kk; else s.noAB_BtoA += e - kk; return; }
      if (c.loai === "TRA_NO") {
        // Trả nợ NCC: không tính vào chi phí tháng, chỉ tính tiền đã ra khỏi túi
        if (c.nguoiChi === "A") s.traA += kk; else s.traB += kk;
        return;
      }
      if (c.nguoiChi === "A") { s.chiA += e; s.traA += kk; } else { s.chiB += e; s.traB += kk; }
    });
    const dk = meta?.soDuDauKy || {};
    s.noAB_AtoB += (dk.AnoB || 0); s.noAB_BtoA += (dk.BnoA || 0);
    return s;
  }, [allRows, mData, meta]);

  if (loading || !meta || !students)
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.sub, fontFamily: font.body }}>Đang tải dữ liệu…</div>;
  if (!auth) return <LoginScreen meta={meta} onLogin={login} />;

  const prevM = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextM = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };
  const chipsLop = [["all", "Tất cả"], ...meta.classes.map((c) => [c.id, c.ten])];
  const phieuRow = allRows.find((r) => r.hs.id === phieuId && r.coRec) || allRows.find((r) => r.coRec);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font.body, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        input[type=number]::-webkit-inner-spin-button{display:none}
        *{box-sizing:border-box}
        button:active{transform:scale(0.97)}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @media print { .no-print{display:none!important} #phieu-in{box-shadow:none!important} body{background:#fff} }
      `}</style>

      <div className="no-print" style={{ background: C.pine, padding: "16px 16px 14px", color: "#fff" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, lineHeight: 1.25, maxHeight: 38, overflow: "hidden", wordBreak: "break-word" }}>{meta.tenTruong}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{isGV ? `👩‍🏫 ${gvTen}` : `${students.filter((s) => TT_THU_PHI[s.trangThai]).length} đang học · ${meta.classes.length} lớp`}{locked ? " · 🔒" : ""}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(255,255,255,.16)", borderRadius: 999, padding: "4px 4px" }}>
              <button onClick={prevM} style={{ color: "#fff", fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>‹</button>
              <button onClick={() => setMonthPickerOpen(true)} style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, minWidth: 64, textAlign: "center", color: "#fff", background: "none", border: "none", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center", gap: 3 }}>Th{month}/{year} <span style={{ fontSize: 9, opacity: 0.8 }}>▾</span></button>
              <button onClick={nextM} style={{ color: "#fff", fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>›</button>
            </div>
            <button onClick={logout} title="Đăng xuất" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "#fff", borderRadius: 8, padding: "5px 9px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>↩</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 14px 92px" }}>
        {seeded && <div className="no-print" style={{ background: C.pineSoft, border: `1px solid #BFE0D4`, borderRadius: 12, padding: "9px 12px", marginBottom: 12, fontSize: 12.5, color: C.pine }}>👋 Khởi tạo xong! Bắt đầu: vào ⚙️ Cài đặt → Học sinh để thêm/nhập danh sách, rồi tạo bảng thu cho tháng.</div>}

        {["thu", "phieu", "dash"].includes(tab) && !mData && (
          <div className="no-print" style={{ background: C.card, borderRadius: 16, padding: 28, textAlign: "center", border: `1px dashed ${C.line}` }}>
            <div style={{ fontSize: 32 }}>📅</div>
            <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Tháng {month}/{year} chưa có dữ liệu</div>
            {isAdmin ? (<>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>Tạo bảng thu cho HS đang học.</div>
              <button onClick={taoThang} style={{ background: C.pine, color: "#fff", padding: "11px 24px", borderRadius: 99, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: font.display }}>+ Tạo tháng {month}/{year}</button>
            </>) : (
              <div style={{ fontSize: 13, color: C.sub }}>Vui lòng liên hệ kế toán để tạo bảng thu (vẫn điểm danh được bên dưới).</div>
            )}
          </div>
        )}

        {tab === "thu" && mData && (
          <ThuPhiTab {...{ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, openId, setOpenId, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide }} />
        )}
        {tab === "dd" && (
          <DiemDanhTab {...{ allRows: ddRows, chipsLop, lopFilter, setLopFilter, search, setSearch, ddData, upDDData, leData, upLeData, year, month, locked: nextChot, ddLockReason: nextChot, isWide, ym, isGV, gvLopId, gvTen, students }} />
        )}
        {tab === "phieu" && mData && phieuRow && (
          <PhieuThu {...{ phieuRow, allRows, setPhieuId, getLop, meta, month, year, upMeta, mData, upMData }} />
        )}
        {tab === "dash" && mData && (
          <DashTab {...{ tk, mData, upMData, month, year, locked, meta, allRows, delThang, students, ym, upMeta, setTab }} />
        )}
        {tab === "no" && (
          <CongNoTab {...{ students, meta, ym, mData }} />
        )}
        {tab === "caidat" && (
          <CaiDat {...{ meta, upMeta, students, upStudents, ym, reseedAll, isWide }} />
        )}
      </div>

      <div className="no-print" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "center", zIndex: 20 }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 640 }}>
          {(isAdmin ? [["thu", "Thu phí", "₫"], ["dd", "Điểm danh", "✓"], ["no", "Công nợ", "📕"], ["dash", "Tổng quan", "📊"], ["phieu", "Phiếu", "🧾"], ["caidat", "Cài đặt", "⚙️"]] : [["dd", "Điểm danh", "✓"]]).map(([id, lb, ic]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "9px 0 11px", border: "none", background: "none", cursor: "pointer", color: tab === id ? C.pine : C.gray, fontFamily: font.body, fontSize: 10, fontWeight: tab === id ? 700 : 500 }}>
              <div style={{ fontSize: 15, marginBottom: 1 }}>{ic}</div>{lb}
            </button>
          ))}
        </div>
      </div>
      <BottomSheet open={monthPickerOpen} onClose={() => setMonthPickerOpen(false)} title="Chọn tháng xem báo cáo">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(() => {
            const base = new Date();
            const items = [];
            for (let i = -1; i <= 17; i++) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); items.push({ m: d.getMonth() + 1, y: d.getFullYear() }); }
            return items.map(({ m, y }) => {
              const active = m === month && y === year;
              const isNow = m === base.getMonth() + 1 && y === base.getFullYear();
              return (
                <button key={`${y}-${m}`} onClick={() => { setMonth(m); setYear(y); setMonthPickerOpen(false); }} style={{ flex: "1 1 28%", minWidth: 96, padding: "11px 6px", borderRadius: 11, border: `1.5px solid ${active ? C.pine : C.line}`, background: active ? C.pine : C.card, color: active ? "#fff" : C.ink, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  Th{m}/{y}
                  {isNow && <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? "#fff" : C.green }}>● hiện tại</span>}
                </button>
              );
            });
          })()}
        </div>
        <button onClick={() => setMonthPickerOpen(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Xong</button>
      </BottomSheet>
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}

// ====================================================================
// Khoan thu rieng cua 1 HS trong thang (dau nam, dong phuc le...)
function PhuThuHS({ r, locked, addPhuThuHS, delPhuThuHS }) {
  const [ten, setTen] = useState(""); const [so, setSo] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const list = r.rec.phuThu || [];
  const add = () => { if (!ten.trim() || !so) return; addPhuThuHS(r.hs.id, ten.trim(), Number(so)); setTen(""); setSo(""); };
  return (
    <div style={{ marginBottom: 10, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginBottom: 4 }}>Khoản riêng (đầu năm, đồng phục…)</div>
      {list.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 13 }}>
          <span style={{ flex: 1, color: C.ink }}>{p.ten}{p.lop && <span style={{ color: C.blueA, fontSize: 10.5 }}> (cả lớp)</span>}</span>
          <span style={{ fontWeight: 600 }}>{fmt(p.soTien)}</span>
          {!locked && (confirmId === p.id
            ? <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><button onClick={() => { delPhuThuHS(r.hs.id, p.id); setConfirmId(null); }} style={{ border: "none", background: C.coral, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Xóa</button><button onClick={() => setConfirmId(null)} style={{ border: "none", background: "none", color: C.sub, fontSize: 11, cursor: "pointer" }}>Hủy</button></span>
            : <button onClick={() => setConfirmId(p.id)} style={{ border: "none", background: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>)}
        </div>
      ))}
      {!locked && (
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên khoản (VD: Đầu năm)" style={{ flex: "2 1 130px", padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 12.5, minWidth: 0, fontFamily: font.body }} />
          <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 80px", padding: "7px 9px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 12.5, minWidth: 0, fontFamily: font.body }} />
          <button onClick={add} style={{ background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 12.5, padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}>+ Thêm</button>
        </div>
      )}
    </div>
  );
}

// [UX-M] Empty state
function EmptyState({ search, onClear }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px", color: C.sub }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
      <div style={{ fontSize: 14, marginBottom: 12 }}>{search ? "Không tìm thấy học sinh phù hợp" : "Không có học sinh trong bộ lọc này"}</div>
      <button onClick={onClear} style={{ padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body }}>Xóa bộ lọc</button>
    </div>
  );
}

// Thanh "ngay an ca thang"
function NgayAnBar({ onApply, rows }) {
  const [v, setV] = useState(24);
  return (
    <Card style={{ marginBottom: 10, background: C.pineSoft, borderColor: "#BFE0D4", padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.pine }}>🍽️ Số ngày ăn trong tháng:</span>
        <NumInput value={v} onChange={setV} w={62} />
        <span style={{ fontSize: 12.5, color: C.pine }}>ngày</span>
        <button onClick={() => onApply(v, rows.map((r) => r.hs.id))} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}>Áp dụng cho {rows.length} HS đang hiển thị</button>
      </div>
      <div style={{ fontSize: 11, color: C.sub, marginTop: 6 }}>Tiền ăn = số ngày ăn × đơn giá. Chỉ áp cho HS đang lọc; HS đã sửa tay vẫn giữ riêng.</div>
    </Card>
  );
}

// ====== Chi tiết HS trong Thu phí (UI/UX tối ưu mobile) ======
function HSCardDetail({ r, locked, setRec, setKhoan, resetKhoan, resetAllKhoan, addPhuThuHS, delPhuThuHS, setPhieuId, setTab }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKhoan, setSheetKhoan] = useState(null);
  const [sheetVal, setSheetVal] = useState("");
  const [sheetLabel, setSheetLabel] = useState("");
  const [ptTen, setPtTen] = useState("");
  const [ptSo, setPtSo] = useState("");
  const [showPtInput, setShowPtInput] = useState(false);
  const [showChiTiet, setShowChiTiet] = useState(false);

  const openSheet = (k, label) => {
    setSheetKhoan(k);
    setSheetLabel(label || (k ? k.label : ""));
    setSheetVal(String(k ? (r.rec.khoan?.[k.key] ?? 0) : (r.rec.ngayAn || 0)));
    setSheetOpen(true);
  };

  const saveSheet = () => {
    if (sheetKhoan) {
      setKhoan(r.hs.id, sheetKhoan.key, Number(sheetVal) || 0);
    } else {
      setRec(r.hs.id, { ngayAn: Number(sheetVal) || 0, ngayAnManual: true });
    }
    setSheetOpen(false);
  };

  const addPT = () => {
    if (!ptTen.trim() || !ptSo) return;
    addPhuThuHS(r.hs.id, ptTen.trim(), Number(ptSo));
    setPtTen(""); setPtSo(""); setShowPtInput(false);
  };

  const tienAn = r.rec.khoan?.tienAn ?? 0;
  const giaAn = r.rec.ngayAn > 0 ? Math.round(tienAn / r.rec.ngayAn) : (r.lop?.tienAn || 0);

  return (
    <div className="fade-in" style={{ borderTop: `1px dashed ${C.line}`, background: "#FBFDFB", animation: "fadeIn .2s ease" }}>
      {/* Thực thu + Thu đủ cùng hàng */}
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>Thực thu:</span>
          <NumInput value={r.rec.thucThu} onChange={(v) => setRec(r.hs.id, { thucThu: v })} w={140} disabled={locked} />
          {!locked && (r.rec.thucThu || 0) < r.tongPhaiThu && (
            <button onClick={() => setRec(r.hs.id, { thucThu: r.tongPhaiThu })} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: C.green, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>
              ✓ Thu đủ
            </button>
          )}
          {!locked && (r.rec.thucThu || 0) >= r.tongPhaiThu && r.tongPhaiThu > 0 && (
            <span style={{ padding: "10px 14px", borderRadius: 10, background: C.greenSoft, color: C.green, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>✓ Đã thu đủ</span>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ padding: "0 14px 14px" }}>
        {/* Ngày ăn — số trái, nhãn phải, click để sửa */}
        <div onClick={() => !locked && openSheet(null, "Ngày ăn")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.line}`, cursor: locked ? "default" : "pointer" }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.ink, minWidth: 36, textAlign: "center" }}>{r.rec.ngayAn}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Ngày ăn</div>
            <div style={{ fontSize: 12, color: C.sub }}>{fmt(tienAn)} đ{r.rec.ngayAnManual && <span style={{ color: C.amber, marginLeft: 4 }}>· tay</span>}</div>
          </div>
          {!locked && <span style={{ fontSize: 16, color: C.sub }}>✏️</span>}
        </div>

        {/* Khoản phí — icon bút cạnh tên, click mở sheet */}
        {r.hs.pl !== "GV" && r.hs.pl !== "T7" && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Khoản phí</div>
              {!locked && r.ps.suaCount > 0 && (
                <button onClick={() => resetAllKhoan(r.hs.id)} style={{ fontSize: 11, color: C.pine, border: "none", background: "none", cursor: "pointer", fontWeight: 600 }}>↺ Khôi phục</button>
              )}
            </div>
            {KHOAN.filter((k) => k.key !== "tienAn").map((k) => {
              const val = r.rec.khoan?.[k.key] ?? 0;
              const def = r.rec.khoanDefault?.[k.key] ?? 0;
              const sua = val !== def;
              if (val === 0 && def === 0 && k.key !== "hocPhi") return null;
              return (
                <div key={k.key} onClick={() => !locked && openSheet(k)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.line}`, cursor: locked ? "default" : "pointer" }}>
                  <span style={{ flex: 1, fontSize: 14, color: sua ? C.amber : C.ink }}>{k.label}{sua && <span style={{ fontSize: 11, color: C.amber, marginLeft: 4 }}>· đã sửa</span>}</span>
                  <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink }}>{fmt(val)}</span>
                  {!locked && <span style={{ fontSize: 14, color: C.sub }}>✏️</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Khoản riêng (phuThu) */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, whiteSpace: "nowrap" }}>Khoản riêng</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            {!locked && !showPtInput && (
              <button onClick={() => setShowPtInput(true)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>➕ Thêm</button>
            )}
          </div>
          {(r.rec.phuThu || []).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ flex: 1, fontSize: 14, color: C.ink }}>{p.ten}{p.lop && <span style={{ color: C.blueA, fontSize: 10 }}> (cả lớp)</span>}</span>
              <span style={{ fontWeight: 700 }}>{fmt(p.soTien)}</span>
              {!locked && (
                <button onClick={(e) => { e.stopPropagation(); delPhuThuHS(r.hs.id, p.id); }} style={{ border: "none", background: "none", color: C.coral, cursor: "pointer", fontSize: 14 }}>🗑</button>
              )}
            </div>
          ))}
          {(r.rec.phuThu || []).length === 0 && !showPtInput && <div style={{ fontSize: 12, color: C.gray, padding: "2px 0 4px" }}>Chưa có khoản riêng.</div>}
          {!locked && showPtInput && (
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <input value={ptTen} onChange={(e) => setPtTen(e.target.value)} placeholder="Tên khoản" style={{ flex: 2, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body }} />
              <input type="number" value={ptSo} onChange={(e) => setPtSo(e.target.value)} placeholder="Số tiền" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body }} />
              <button onClick={addPT} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12, padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}>Thêm</button>
              <button onClick={() => { setShowPtInput(false); setPtTen(""); setPtSo(""); }} style={{ background: "none", color: C.sub, fontWeight: 700, fontSize: 12, padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.line}`, cursor: "pointer" }}>Hủy</button>
            </div>
          )}
        </div>

        {/* Chi tiết — nhấn vào mở ra hiện tất cả khoản */}
        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: C.card, border: `1px solid ${C.line}` }}>
          <div onClick={() => setShowChiTiet((v) => !v)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>Chi tiết</div>
            <span style={{ fontSize: 12, color: C.sub, transition: "transform .2s", transform: showChiTiet ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </div>

          {showChiTiet && (
            <div style={{ marginTop: 8 }}>
              {r.ps.dong.map(([l, v, sua], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: v < 0 ? C.green : C.ink }}>
                  <span style={{ color: C.sub }}>{l}{sua && <span style={{ color: C.amber }}> ⚠</span>}</span>
                  <span>{fmt(v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: C.sub, marginTop: 4, borderTop: `1px dashed ${C.line}` }}>
                <span>Phát sinh tháng này</span><span>{fmt(r.ps.tong)}</span>
              </div>
              {r.noTruoc !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: r.noTruoc > 0 ? C.coral : C.green }}>
                  <span>{r.noTruoc > 0 ? "+ Nợ tháng trước" : "− Dư tháng trước"}</span>
                  <span>{r.noTruoc > 0 ? fmt(r.noTruoc) : "−" + fmt(-r.noTruoc)}</span>
                </div>
              )}
            </div>
          )}

          {!showChiTiet && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: C.sub }}>
                <span>Phát sinh tháng này</span><span>{fmt(r.ps.tong)}</span>
              </div>
              {r.noTruoc !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13, color: r.noTruoc > 0 ? C.coral : C.green }}>
                  <span>{r.noTruoc > 0 ? "+ Nợ tháng trước" : "− Dư tháng trước"}</span>
                  <span>{r.noTruoc > 0 ? fmt(r.noTruoc) : "−" + fmt(-r.noTruoc)}</span>
                </div>
              )}
            </div>
          )}

          {/* Tổng phải thu */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 6, borderTop: `1.5px solid ${C.line}`, fontWeight: 800, fontSize: 16, fontFamily: font.display }}>
            <span>TỔNG PHẢI THU</span>
            <span>{fmt(r.tongPhaiThu)} đ</span>
          </div>
        </div>
      </div>

      {/* FOOTER STICKY */}
      <div style={{ position: "sticky", bottom: 0, background: "#fff", borderTop: `1.5px solid ${C.line}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, zIndex: 5 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.sub }}>Phát sinh {fmt(r.ps.tong)} · Nợ cũ {fmt(r.noTruoc)}</div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink }}>Tổng {fmt(r.tongPhaiThu)} đ</div>
        </div>
        <button onClick={() => { setPhieuId(r.hs.id); setTab("phieu"); }} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Đến thu tiền →
        </button>
      </div>

      {/* BOTTOM SHEET sửa khoản / ngày ăn */}
      {sheetOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setSheetOpen(false)} style={{ flex: 1, background: "rgba(0,0,0,.4)" }} />
          <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "20px 16px 24px", boxShadow: "0 -4px 20px rgba(0,0,0,.15)" }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.ink, marginBottom: 14 }}>
              Sửa {sheetLabel}
            </div>
            {sheetKhoan && (
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>Mặc định: {fmt(r.rec.khoanDefault?.[sheetKhoan.key] ?? 0)}</div>
            )}
            {!sheetKhoan && (
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>Giá: {fmt(giaAn)} đ/ngày · Tự tính: {soNgayHoc(new Date().getFullYear(), new Date().getMonth()+1, {})} ngày</div>
            )}
            <input type="number" inputMode="numeric" autoFocus value={sheetVal} onChange={(e) => setSheetVal(e.target.value)} placeholder="0" style={{ width: "100%", padding: "14px 12px", borderRadius: 12, border: `1.5px solid ${C.pine}`, fontSize: 18, fontFamily: font.display, fontWeight: 700, color: C.ink, textAlign: "right", marginBottom: 14, outline: "none" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSheetOpen(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Hủy</button>
              <button onClick={saveSheet} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Lưu</button>
            </div>
            {sheetKhoan && (
              <button onClick={() => { resetKhoan(r.hs.id, sheetKhoan.key); setSheetOpen(false); }} style={{ width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 10, border: "none", background: "none", color: C.pine, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                ↺ Khôi phục mặc định
              </button>
            )}
            {!sheetKhoan && (
              <button onClick={() => { setRec(r.hs.id, { ngayAnManual: false }); setSheetOpen(false); }} style={{ width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 10, border: "none", background: "none", color: C.pine, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                ↺ Trả về tự tính
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Bottom Sheet cơ sở =====
function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null);
  const startYRef = useRef(null);
  const startTimeRef = useRef(null);
  const dyRef = useRef(0);
  const draggingRef = useRef(false);

  // dat transform truc tiep len DOM -> bam ngon tay 1:1, khong cho React render, khong tre
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
    const dy = Math.max(0, y - startYRef.current);
    dyRef.current = dy;
    setT(dy, false); // theo ngon tay tuc thi, khong transition
  };
  const onEnd = () => {
    if (startYRef.current == null) return;
    const dy = dyRef.current;
    const dt = Date.now() - (startTimeRef.current || 0);
    const velocity = dy / (dt || 1);
    startYRef.current = null; startTimeRef.current = null; draggingRef.current = false;
    if (dy > 90 || (dy > 30 && velocity > 0.35)) {
      setT((typeof window !== "undefined" ? window.innerHeight : 800), true); // truot xuong roi dong
      setTimeout(onClose, 160);
    } else {
      setT(0, true); // bat lai vi tri cu
    }
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

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,.45)" }} />
      <div ref={sheetRef} style={{
        background: "#fff", borderRadius: "20px 20px 0 0", padding: "0 16px 24px",
        maxHeight: "82vh", overflowY: "auto", boxShadow: "0 -4px 24px rgba(0,0,0,.18)", willChange: "transform",
      }}>
        {/* Vung vuot: nut keo + tieu de, rong rai, touch-action none -> vuot la an lien */}
        <div {...dragProps} style={{ touchAction: "none", cursor: "grab", margin: "0 -16px", padding: "10px 16px 2px", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
          <div style={{ width: 44, height: 5, borderRadius: 99, background: C.line, margin: "0 auto 12px" }} />
          {title && <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.ink, marginBottom: 8 }}>{title}</div>}
          <button onClick={onClose} aria-label="Đóng" style={{ position: "absolute", top: 8, right: 10, width: 32, height: 32, borderRadius: 99, border: "none", background: C.graySoft, color: C.sub, fontSize: 17, lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ paddingTop: 8 }}>{children}</div>
      </div>
    </div>
  );
}

// ===== Sheet chọn lớp =====
function LopFilterSheet({ open, onClose, chipsLop, lopFilter, setLopFilter, allRows }) {
  const [q, setQ] = useState("");
  const stats = useMemo(() => {
    const s = {};
    allRows.forEach((r) => {
      if (!r.coRec) return;
      const id = r.lopId || "none";
      if (!s[id]) s[id] = { count: 0, no: 0 };
      s[id].count++;
      s[id].no += Math.max(0, r.conNo);
    });
    return s;
  }, [allRows]);

  const totalNo = allRows.reduce((a, r) => a + (r.coRec ? Math.max(0, r.conNo) : 0), 0);
  const totalHS = allRows.filter((r) => r.coRec).length;

  const filtered = chipsLop.filter(([id, ten]) => {
    if (!q.trim()) return true;
    return noDau(ten).includes(noDau(q));
  });

  return (
    <BottomSheet open={open} onClose={onClose} title="Chọn lớp học">
      <div>
        {filtered.map(([id, ten]) => {
          const active = lopFilter === id;
          const count = id === "all" ? totalHS : (stats[id]?.count || 0);
          const no = id === "all" ? totalNo : (stats[id]?.no || 0);
          return (
            <div
              key={id}
              onClick={() => { setLopFilter(id); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${active ? C.pine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color .2s" }}>
                {active && <div style={{ width: 12, height: 12, borderRadius: 99, background: C.pine }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink, transition: "color .2s" }}>
                  {id === "all" ? "Tất cả lớp" : ten}
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                  {count} học sinh · Nợ: {fmt(no)} đ
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 20, color: C.sub, fontSize: 13 }}>Không tìm thấy lớp</div>
        )}
      </div>
    </BottomSheet>
  );
}

function ThuPhiTab({ rows, tk, allRows, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, search, setSearch, openId, setOpenId, getLop, setRec, setKhoan, resetKhoan, resetAllKhoan, setNgayAnAll, thuDuNhieu, addPhuThuHS, delPhuThuHS, locked, mData, upMData, setPhieuId, setTab, isWide }) {
  const [fastMode, setFastMode] = useState(false);
  const [lopSheetOpen, setLopSheetOpen] = useState(false);
  const [thuSheetOpen, setThuSheetOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [showNgayAn, setShowNgayAn] = useState(false);
  const [thuLimit, setThuLimit] = useState(50);
  const inputRefs = useRef({});
  const { sentinelRef, shrunk } = useStickyShrink();
  // [UX-I] dem trang thai
  const cnt = { chuaThu: 0, thieu: 0, xong: 0 };
  rows.forEach((r) => {
    if (r.ps.tong > 0 && (r.rec.thucThu || 0) === 0) cnt.chuaThu++;
    else if (r.conNo > 0) cnt.thieu++;
    else if ((r.rec.thucThu || 0) > 0 && r.conNo <= 0) cnt.xong++;
  });
  const batchThuDu = async (onlyNo) => {
    const pairs = rows.filter((r) => !onlyNo || r.conNo > 0).map((r) => ({ sid: r.hs.id, thucThu: r.tongPhaiThu }));
    if (pairs.length === 0) return;
    if (!(await ask(`Đánh "thu đủ" cho ${pairs.length} HS đang hiển thị?\nThao tác này ghi đè số đã thu của từng em.`, { okText: "Thu đủ" }))) return;
    thuDuNhieu(pairs);
    toast(onlyNo ? `Đã thu đủ ${pairs.length} HS còn nợ.` : `Đã thu đủ ${pairs.length} HS đang hiển thị.`);
  };
  const cfgItem = { width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 9, border: "none", background: "none", color: C.ink, fontWeight: 700, fontSize: 13.5, fontFamily: font.body, cursor: "pointer" };
  const selStyle = { padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.card, minWidth: 0, cursor: "pointer" };
  return (
    <>
      {/* [Tong gop] Thẻ tổng toàn trường: Phải thu + % đã thu + Còn nợ + số HS chưa thu */}
      {(() => {
        const pct = tk.ps > 0 ? Math.min(100, Math.round(tk.thu / tk.ps * 100)) : 0;
        const soChuaThu = (tk.noList || []).filter((x) => x.chua).length;
        return (
          <Card style={{ marginBottom: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 12, color: C.sub }}>Phải thu (toàn trường)</span>
              <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.ink }}>{fmt(tk.ps)} đ</span>
            </div>
            <div style={{ height: 9, borderRadius: 99, background: C.line, overflow: "hidden", margin: "9px 0 5px" }}>
              <div style={{ width: pct + "%", height: "100%", background: pct >= 100 ? C.green : C.pine, borderRadius: 99, transition: "width .3s" }} />
            </div>
            <div style={{ fontSize: 12.5, color: C.green, fontWeight: 700 }}>Đã thu {pct}% · {fmt(tk.thu)} đ</div>
            <div style={{ display: "flex", gap: 16, marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.line}`, fontSize: 12.5 }}>
              <span style={{ color: tk.no > 0 ? C.coral : C.green, fontWeight: 700 }}>● Còn nợ: {fmt(tk.no)} đ</span>
              <button onClick={() => setThuFilter(thuFilter === "chuaThu" ? "all" : "chuaThu")} style={{ border: "none", background: "none", color: thuFilter === "chuaThu" ? C.pine : C.coral, fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0, textDecoration: thuFilter === "chuaThu" ? "underline" : "none" }}>● {soChuaThu} chưa thu</button>
            </div>
          </Card>
        );
      })()}
      <div ref={sentinelRef} style={{ height: 1 }} />
      <StickyBar shrunk={shrunk}>
      <SearchBar value={search} onChange={setSearch} />
      {/* Lọc gọn: Lớp + Tình trạng thu */}
      {isWide ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <select value={lopFilter} onChange={(e) => setLopFilter(e.target.value)} style={{ ...selStyle, flex: "1 1 110px" }}>
            {chipsLop.map(([id, ten]) => <option key={id} value={id}>{id === "all" ? "Tất cả lớp" : ten}</option>)}
          </select>
          <select value={thuFilter} onChange={(e) => setThuFilter(e.target.value)} style={{ ...selStyle, flex: "1 1 110px" }}>
            {[["all", "Mọi tình trạng"], ["chuaThu", "Chưa thu"], ["thieu", "Thiếu"], ["noCu", "Nợ cũ"], ["thuThua", "Thu thừa"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {!locked && !fastMode && (
            <button onClick={() => setCfgOpen((v) => !v)} style={{ flexShrink: 0, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${C.pine}`, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: font.body, background: cfgOpen ? C.pine : C.pineSoft, color: cfgOpen ? "#fff" : C.pine }}>⚙️ Cấu hình</button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={() => setLopSheetOpen(true)} style={{ ...selStyle, flex: "1 1 110px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lopFilter === "all" ? "Tất cả lớp" : getLop(lopFilter)?.ten}
              </span>
              <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
            </button>
            <button onClick={() => setThuSheetOpen(true)} style={{ ...selStyle, flex: "1 1 110px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {thuFilter === "all" ? "Mọi tình trạng" : thuFilter === "chuaThu" ? "Chưa thu" : thuFilter === "thieu" ? "Thiếu" : thuFilter === "noCu" ? "Nợ cũ" : thuFilter === "thuThua" ? "Thu thừa" : "Mọi tình trạng"}
              </span>
              <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
            </button>
            {!locked && !fastMode && (
              <button onClick={() => setCfgOpen((v) => !v)} style={{ flexShrink: 0, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${C.pine}`, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: font.body, background: cfgOpen ? C.pine : C.pineSoft, color: cfgOpen ? "#fff" : C.pine }}>⚙️ Cấu hình</button>
            )}
          </div>
          <LopFilterSheet
            open={lopSheetOpen}
            onClose={() => setLopSheetOpen(false)}
            chipsLop={chipsLop}
            lopFilter={lopFilter}
            setLopFilter={setLopFilter}
            allRows={allRows}
          />
          <BottomSheet open={thuSheetOpen} onClose={() => setThuSheetOpen(false)} title="Tình trạng thu">
            {[["all", "Mọi tình trạng"], ["chuaThu", "Chưa thu"], ["thieu", "Thiếu"], ["noCu", "Nợ cũ"], ["thuThua", "Thu thừa"]].map(([v, l]) => {
              const active = thuFilter === v;
              return (
                <div key={v} onClick={() => { setThuFilter(v); setThuSheetOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${active ? C.pine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {active && <div style={{ width: 12, height: 12, borderRadius: 99, background: C.pine }} />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink }}>{l}</div>
                </div>
              );
            })}
          </BottomSheet>
        </>
      )}
      </StickyBar>
      {/* [Cấu hình] gom thao tác hàng loạt vào 1 menu */}
      {!locked && fastMode && (
        <button onClick={() => { setFastMode(false); }} style={{ width: "100%", marginBottom: 10, padding: "11px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13.5, fontFamily: font.body, background: C.pine, color: "#fff" }}>⛔ Tắt chế độ Tích thu nhanh</button>
      )}
      {!locked && !fastMode && cfgOpen && (
        <Card style={{ marginBottom: 10, padding: 6 }}>
          <button onClick={() => setShowNgayAn((v) => !v)} style={{ ...cfgItem, color: showNgayAn ? C.pine : C.ink }}>🍽️ Áp ngày ăn hàng loạt {showNgayAn ? "▲" : "▼"}</button>
          {showNgayAn && <div style={{ padding: "2px 2px 6px" }}><NgayAnBar onApply={setNgayAnAll} rows={rows} /></div>}
          <button onClick={() => { setFastMode(true); setCfgOpen(false); }} style={cfgItem}>⚡ Bật chế độ Tích thu nhanh</button>
          {(() => { const soNo = rows.filter((r) => r.conNo > 0).length; return (
            <button onClick={() => { if (soNo > 0) { batchThuDu(true); setCfgOpen(false); } }} disabled={soNo === 0} style={{ ...cfgItem, color: soNo > 0 ? C.green : C.gray, cursor: soNo > 0 ? "pointer" : "default" }}>💵 Thu đủ {soNo} HS còn nợ đang hiển thị</button>
          ); })()}
        </Card>
      )}
      {locked && <LockNote />}
      {rows.length === 0 && <EmptyState search={search} onClear={() => { setSearch(""); setLopFilter("all"); setThuFilter("all"); }} />}
      {rows.slice(0, thuLimit).map((r) => {
        const open = openId === r.hs.id;
        if (fastMode) {
          const idx = rows.findIndex((x) => x.hs.id === r.hs.id);
          return (
            <div key={r.hs.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.line}`, marginBottom: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.hs.ten}</div>
                <div style={{ fontSize: 11.5, color: C.sub }}>cần {fmt(r.tongPhaiThu)}{r.noTruoc > 0 ? ` · 🔴 nợ ${fmt(r.noTruoc)}` : ""}</div>
              </div>
              <input ref={(el) => (inputRefs.current[r.hs.id] = el)} type="text" inputMode="numeric"
                defaultValue={r.rec.thucThu ? Number(r.rec.thucThu).toLocaleString("vi-VN") : ""}
                onFocus={(e) => { e.target.value = r.rec.thucThu ? String(r.rec.thucThu) : ""; e.target.select(); }}
                onBlur={(e) => { const d = e.target.value.replace(/[^\d]/g, ""); setRec(r.hs.id, { thucThu: d === "" ? 0 : Number(d) }); e.target.value = d ? Number(d).toLocaleString("vi-VN") : ""; }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.target.blur(); const next = rows[idx + 1]; if (next) setTimeout(() => inputRefs.current[next.hs.id]?.focus(), 30); } }}
                placehold