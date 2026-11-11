// khoanThem.js — "Khoản thu thêm theo lớp": logic THUẦN (không đụng store/UI), có kiểm riêng.
// Lưu trong cấu hình lớp: lop.khoanThem = [{ id, ten, soTien, bat, tuThang?, ketThuc?, cu? }]
//  - tuThang  "YYYY-MM": từ tháng này mới áp (khoản mới khi chọn "Từ tháng sau")
//  - ketThuc  "YYYY-MM": áp đến hết tháng này (xoá khi chọn "Từ tháng sau")
//  - cu       {ten, soTien, bat, den}: giá trị CŨ dùng đến hết tháng `den` (sửa khi chọn "Từ tháng sau")
// Hoá đơn của HS: rec.phuThu có thêm dòng {lopKhoan: <id khoản>}; rec.boKhoanLop = [id khoản] nếu quản lý đã xoá tay khoản đó khỏi HS này.

export const ymNext = (ym) => { const [y, m] = String(ym).split("-").map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`; };

/** Giá trị hiệu lực của 1 khoản ở tháng ym; null nếu không áp tháng đó. */
export function giaTriKhoan(k, ym) {
  if (!k) return null;
  if (k.tuThang && ym < k.tuThang) return null;
  if (k.ketThuc && ym > k.ketThuc) return null;
  const v = (k.cu && ym <= k.cu.den) ? k.cu : k;
  if (v.bat === false) return null;
  const soTien = Number(v.soTien) || 0;
  if (soTien <= 0 || !String(v.ten || "").trim()) return null;
  return { id: k.id, ten: String(v.ten).trim(), soTien };
}

export const khoanThemHieuLuc = (lop, ym) => (lop?.khoanThem || []).map((k) => giaTriKhoan(k, ym)).filter(Boolean);

/** Đồng bộ phuThu của 1 hoá đơn với cấu hình lớp (CHỈ gọi cho tháng chưa chốt). Trả {phuThu, changed}. */
export function dongBoPhuThuLop(rec, lop, ym, mkId) {
  const want = khoanThemHieuLuc(lop, ym);
  const skip = rec.boKhoanLop || [];
  const cur = rec.phuThu || [];
  const next = []; let changed = false;
  cur.forEach((p) => {
    if (!p.lopKhoan) { next.push(p); return; }
    const w = want.find((x) => x.id === p.lopKhoan && !skip.includes(x.id));
    if (!w) { changed = true; return; }                       // khoản đã tắt / xoá / hết hạn → bỏ khỏi hoá đơn
    if (p.ten !== w.ten || p.soTien !== w.soTien) { changed = true; next.push({ ...p, ten: w.ten, soTien: w.soTien }); }
    else next.push(p);
  });
  want.forEach((w) => {
    if (skip.includes(w.id) || cur.some((p) => p.lopKhoan === w.id)) return;
    next.push({ id: mkId(), ten: w.ten, soTien: w.soTien, lopKhoan: w.id }); changed = true;
  });
  return { phuThu: next, changed };
}

/** Dòng phụ thu cho HS mới / tháng mới tạo. */
export const phuThuLopMoi = (lop, ym, mkId) => khoanThemHieuLuc(lop, ym).map((k) => ({ id: mkId(), ten: k.ten, soTien: k.soTien, lopKhoan: k.id }));

const so = (k) => JSON.stringify([k.ten, Number(k.soTien) || 0, k.bat !== false]);

/** Có thay đổi khoản thu thêm giữa 2 danh sách lớp không (so theo id lớp). */
export function coDoiKhoanThem(draft, goc) {
  return draft.some((c) => {
    const g = goc.find((x) => x.id === c.id);
    return JSON.stringify((c.khoanThem || []).map((k) => [k.id, so(k)])) !== JSON.stringify(((g && g.khoanThem) || []).map((k) => [k.id, so(k)]));
  });
}
export function demDoiKhoanThem(draft, goc) {
  let n = 0;
  draft.forEach((c) => {
    const g = goc.find((x) => x.id === c.id); const gk = (g && g.khoanThem) || [];
    (c.khoanThem || []).forEach((k) => { const o = gk.find((x) => x.id === k.id); if (!o || so(o) !== so(k)) n++; });
    gk.forEach((o) => { if (!(c.khoanThem || []).some((k) => k.id === o.id)) n++; });
  });
  return n;
}

/** Chốt bản nháp khi bấm Lưu. apNgay=true: áp từ tháng đang xem (ym); false: từ tháng sau. Trả danh sách lớp mới để ghi vào meta. */
export function chotKhoanThem(draft, goc, ym, apNgay) {
  const sau = ymNext(ym);
  return draft.map((c) => {
    const g = goc.find((x) => x.id === c.id); const gk = (g && g.khoanThem) || [];
    const ds = c.khoanThem || [];
    const out = [];
    ds.forEach((k) => {
      const { moi, ...kk } = k;
      const o = gk.find((x) => x.id === k.id);
      if (!o) { out.push({ ...kk, tuThang: apNgay ? ym : sau }); return; }              // khoản mới
      if (so(o) === so(k)) { out.push(kk); return; }                                   // không đổi
      if (apNgay) { const { cu, ...r } = kk; out.push(r); return; }                    // sửa, áp ngay
      out.push({ ...kk, cu: { ten: o.ten, soTien: o.soTien, bat: o.bat !== false, den: ym } }); // sửa, từ tháng sau: tháng này giữ giá trị cũ
    });
    gk.forEach((o) => {
      if (ds.some((k) => k.id === o.id)) return;                                        // bị xoá
      if (!apNgay) out.push({ ...o, ketThuc: (o.ketThuc && o.ketThuc < ym) ? o.ketThuc : ym }); // xoá từ tháng sau: còn áp đến hết tháng này
    });
    const r = { ...c };
    if (out.length) r.khoanThem = out; else delete r.khoanThem;
    return r;
  });
}
