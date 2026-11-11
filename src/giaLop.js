// giaLop.js — Giá/khoản thu của lớp THEO MỐC THÁNG (logic thuần, có kiểm riêng ở giaLop.test.mjs).
// Giá gốc nằm ở các trường chính của lớp (hocPhi, banTru, ...). Khi Lưu, thay đổi được ghi thành mốc:
//   lop.gia = [{ tuThang: "YYYY-MM", v: { hocPhi: 900000, lapLai: { banTru: "khong" } } }]
// Giá hiệu lực ở tháng ym = giá gốc + mọi mốc có tuThang <= ym (theo thứ tự). Vì vậy:
//   "Áp dụng ngay"   → mốc tại tháng đang xem;  "Từ tháng sau" → mốc tại tháng sau.
//   Tháng cũ giữ giá cũ; tháng đã chốt vốn đã đóng băng đơn giá.
import { ymNext } from "./khoanThem.js";

export const GIA_F = ["t7", "hocPhi", "banTru", "tienAn", "veSinh", "tiengAnh", "ngoaiKhoa", "dongPhuc", "dauNam"];

export function lopTai(lop, ym) {
  if (!lop || !Array.isArray(lop.gia) || lop.gia.length === 0) return lop;
  const o = { ...lop };
  [...lop.gia].sort((a, b) => (a.tuThang < b.tuThang ? -1 : a.tuThang > b.tuThang ? 1 : 0)).forEach((e) => {
    if (e.tuThang > ym) return;
    Object.keys(e.v || {}).forEach((f) => {
      if (f === "lapLai") o.lapLai = { ...(o.lapLai || {}), ...e.v.lapLai };
      else o[f] = e.v[f];
    });
  });
  return o;
}

const mode = (l, k) => (l && l.lapLai && l.lapLai[k]) || "thu";

/** Khác biệt giá/công tắc giữa lớp hiệu lực và bản nháp: {v, n} (n = số thay đổi). */
export function khacGia(eff, draft) {
  const v = {}; let n = 0;
  GIA_F.forEach((f) => { if ((draft[f] || 0) !== (eff[f] || 0)) { v[f] = draft[f] || 0; n++; } });
  const keys = new Set([...Object.keys(draft.lapLai || {}), ...Object.keys(eff.lapLai || {})]);
  const lap = {};
  keys.forEach((k) => { if (mode(draft, k) !== mode(eff, k)) { lap[k] = mode(draft, k); n++; } });
  if (Object.keys(lap).length) v.lapLai = lap;
  return { v, n };
}

export const coDoiGia = (draft, goc, ym) => draft.some((c) => { const g = goc.find((x) => x.id === c.id); return g ? khacGia(lopTai(g, ym), c).n > 0 : false; });
export const demDoiGia = (draft, goc, ym) => draft.reduce((a, c) => { const g = goc.find((x) => x.id === c.id); return a + (g ? khacGia(lopTai(g, ym), c).n : 0); }, 0);

/** Chốt giá khi bấm Lưu: trả danh sách lớp mới (trường chính giữ NGUYÊN, thay đổi thành mốc tại ym hoặc tháng sau). */
export function chotGiaLop(draft, goc, ym, apNgay) {
  const tu = apNgay ? ym : ymNext(ym);
  return draft.map((c) => {
    const g = goc.find((x) => x.id === c.id);
    if (!g) return c;                                            // lớp mới: giá gốc = giá nhập
    const { v, n } = khacGia(lopTai(g, ym), c);
    const r = { ...c };
    GIA_F.forEach((f) => { if (g[f] === undefined) delete r[f]; else r[f] = g[f]; });
    if (g.lapLai === undefined) delete r.lapLai; else r.lapLai = g.lapLai;
    let gia = (g.gia || []).map((e) => ({ ...e, v: { ...e.v } }));
    if (n > 0) {
      const e = gia.find((x) => x.tuThang === tu);
      if (e) { const { lapLai, ...rest } = v; Object.assign(e.v, rest); if (lapLai) e.v.lapLai = { ...(e.v.lapLai || {}), ...lapLai }; }
      else gia.push({ tuThang: tu, v });
    }
    if (gia.length) r.gia = gia; else delete r.gia;
    return r;
  });
}
