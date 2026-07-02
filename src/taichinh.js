// =============================================================
// taichinh.js — BỘ NÃO TIỀN duy nhất của app.
// Mọi phép toán về giao dịch (chiPhi), quỹ A/B, nợ NCC, lãi chia
// nằm ở ĐÂY và CHỈ ở đây.
//
// ➕ Thêm / sửa 1 loại giao dịch:
//    1. Thêm dòng vào GD_META (nhãn + cờ ảnh hưởng)
//    2. Thêm nhánh xử lý trong duyetChiPhi() bên dưới
//    → KHÔNG cần sửa useStore / TongQuan / CongNo.
// =============================================================
import { lopOfMonth, tinhPSFromRec } from "./lib.js";

// ---- Metadata từng loại giao dịch (nhãn hiển thị + cờ) ----
// tinhNCC: khoản này có tham gia tính nợ nhà cung cấp không
// (TRA_NO tham gia với soTien=0, daTra>0 → làm GIẢM nợ NCC)
export const GD_META = {
  PHAT_SINH: { label: "Phát sinh",      tinhNCC: true },
  CO_DINH:   { label: "Cố định",        tinhNCC: true },
  NO_AB:     { label: "Nợ A↔B",         tinhNCC: false },
  CHUYEN:    { label: "🔄 Chuyển tiền", tinhNCC: false },
  TRA_NO:    { label: "💰 Trả nợ NCC",  tinhNCC: true },
  RUT_LOI:   { label: "📤 Rút chia lãi", tinhNCC: false },
  HOAN_UNG:  { label: "↩️ Hoàn ứng",    tinhNCC: false },
};
export const LOAI_CHI = Object.keys(GD_META);

// ---- Reducer DUY NHẤT duyệt mảng chiPhi ----
// Trả về mọi con số dẫn xuất từ chiPhi. Đây là switch(loai) duy nhất
// của toàn app cho phần toán tiền.
export function duyetChiPhi(chiPhi) {
  const r = {
    chiA: 0, chiB: 0,          // chi phí phát sinh theo người nhập
    traA: 0, traB: 0,          // tiền mặt đã trả ra theo người
    rutA: 0, rutB: 0,          // rút lãi trừ vào quỹ người cầm (tuQuy)
    rutNhanA: 0, rutNhanB: 0,  // rút lãi tính cho người hưởng (nhan)
    cInA: 0, cInB: 0,          // tiền nhận qua chuyển/hoàn ứng
    cOutA: 0, cOutB: 0,        // tiền đưa đi qua chuyển/hoàn ứng
    noAB_AtoB: 0, noAB_BtoA: 0,// nợ nội bộ A↔B
    noNCC: 0,                  // nợ NCC phát sinh ròng trong kỳ
  };
  (chiPhi || []).forEach((c) => {
    const e = Number(c.soTien) || 0, kk = Number(c.daTra) || 0;
    if (c.loai === "CHUYEN" || c.loai === "HOAN_UNG") {
      if (c.huong === "A->B") { r.cOutA += e; r.cInB += e; } else { r.cOutB += e; r.cInA += e; }
      return;
    }
    if (c.loai === "NO_AB") {
      if (c.huong === "A->B") r.noAB_AtoB += e - kk; else r.noAB_BtoA += e - kk;
      return;
    }
    if (c.loai === "RUT_LOI") {
      const src = c.tuQuy || "A";
      if (src === "A") r.rutA += kk; else r.rutB += kk;
      const ben = c.nhan || c.nguoiChi || "A";
      if (ben === "A") r.rutNhanA += kk; else r.rutNhanB += kk;
      return;
    }
    // PHAT_SINH / CO_DINH / TRA_NO — các loại có tinhNCC
    if (c.nguoiChi === "A") { r.chiA += (c.loai === "TRA_NO" ? 0 : e); r.traA += kk; }
    else { r.chiB += (c.loai === "TRA_NO" ? 0 : e); r.traB += kk; }
    if (GD_META[c.loai]?.tinhNCC !== false) r.noNCC += (e - kk);
  });
  return r;
}

// ---- Nợ NCC phát sinh ròng của 1 tháng (CongNo dùng) ----
export function tinhNoNCCThang(chiPhi) { return duyetChiPhi(chiPhi).noNCC; }

// ---- Tổng kết tháng hiện tại (useStore.tk dùng) ----
// Giữ NGUYÊN hình dạng object cũ: { ps, thu, no, A, B, chiA, chiB,
// traA, traB, rutA, rutB, noList, noAB_AtoB, noAB_BtoA }
export function tinhTKThang(allRows, mData, meta) {
  const s = { ps: 0, thu: 0, no: 0, A: 0, B: 0, chiA: 0, chiB: 0, traA: 0, traB: 0, rutA: 0, rutB: 0, noList: [], noAB_AtoB: 0, noAB_BtoA: 0 };
  allRows.forEach((r) => {
    if (!r.coRec) return;
    s.ps += r.ps.tong; s.thu += r.rec.thucThu;
    if (r.conNo > 0) { s.no += r.conNo; s.noList.push({ ten: r.hs.ten, so: r.conNo, chua: r.rec.thucThu === 0 }); }
    if (r.hs.nguoiThu === "A") s.A += r.rec.thucThu; else if (r.hs.nguoiThu === "B") s.B += r.rec.thucThu;
  });
  (mData?.thuNgoai || []).forEach((k) => {
    const tt = Number(k.thucThu) || 0; s.ps += Number(k.soTien) || 0; s.thu += tt;
    if (k.nguoiThu === "A") s.A += tt; else if (k.nguoiThu === "B") s.B += tt;
    const no = (Number(k.soTien) || 0) - tt; if (no > 0) { s.no += no; s.noList.push({ ten: "(TN) " + k.ten, so: no, chua: tt === 0 }); }
  });
  const d = duyetChiPhi(mData?.chiPhi);
  s.A += d.cInA - d.cOutA; s.B += d.cInB - d.cOutB;
  s.chiA = d.chiA; s.chiB = d.chiB; s.traA = d.traA; s.traB = d.traB;
  s.rutA = d.rutA; s.rutB = d.rutB;
  s.noAB_AtoB = d.noAB_AtoB; s.noAB_BtoA = d.noAB_BtoA;
  const dk = meta?.soDuDauKy || {};
  s.noAB_AtoB += (dk.AnoB || 0); s.noAB_BtoA += (dk.BnoA || 0);
  return s;
}

// ---- Toàn bộ số liệu tài chính 1 tháng bất kỳ ----
// (vòng lũy kế TongQuan + snapshot Chốt tháng dùng)
// Giữ NGUYÊN hình dạng trả về để tương thích snapTK đã lưu.
export function tinhThangFull(td, m, students, meta, ddPrevM, tyA0) {
  let thuA = 0, thuB = 0, psA = 0, psB = 0, tnPhai = 0, tnThu = 0;
  Object.entries(td.fees || {}).forEach(([sid, rec]) => {
    const hs = students.find((s) => s.id === sid); if (!hs) return;
    const tt = Number(rec.thucThu) || 0;
    if (hs.nguoiThu === "A") thuA += tt; else if (hs.nguoiThu === "B") thuB += tt;
    const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, m));
    const nghi = Object.keys(ddPrevM[sid] || {}).length;
    const ps = tinhPSFromRec(hs, rec, lop, nghi).tong;
    if (hs.nguoiThu === "A") psA += ps; else if (hs.nguoiThu === "B") psB += ps;
  });
  (td.thuNgoai || []).forEach((k) => {
    const tt = Number(k.thucThu) || 0, st = Number(k.soTien) || 0;
    tnPhai += st; tnThu += tt;
    if (k.nguoiThu === "A") { thuA += tt; psA += st; } else if (k.nguoiThu === "B") { thuB += tt; psB += st; }
  });
  const d = duyetChiPhi(td.chiPhi);
  const lkt = (psA + psB) - (d.chiA + d.chiB);
  let dcA, dcB;
  if (td.laiTay) { dcA = Number(td.laiTay.A) || 0; dcB = Number(td.laiTay.B) || 0; }
  else { dcA = Math.round(lkt * tyA0 / 100); dcB = lkt - dcA; }
  return {
    psA, psB, thuA, thuB,
    cInA: d.cInA, cInB: d.cInB, cOutA: d.cOutA, cOutB: d.cOutB,
    chiA: d.chiA, chiB: d.chiB, traA: d.traA, traB: d.traB,
    rutA: d.rutA, rutB: d.rutB, rutNhanA: d.rutNhanA, rutNhanB: d.rutNhanB,
    noNCCThang: d.noNCC, tnPhai, tnThu, lkt, dcA, dcB, laiTay: !!td.laiTay,
  };
}

// ---- Sổ giao dịch: dựng danh sách sự kiện tiền của 1 tháng ----
// (SoGiaoDich.jsx chỉ fetch + render; toàn bộ diễn giải nằm ở đây)
export function buildGiaoDichThang(td, students) {
  const evs = [];
  let hpA = 0, hpB = 0;
  Object.entries(td.fees || {}).forEach(([sid, rec]) => {
    const hs = students.find((s) => s.id === sid); if (!hs) return;
    const tt = Number(rec.thucThu) || 0; if (!tt) return;
    if (hs.nguoiThu === "A") hpA += tt; else if (hs.nguoiThu === "B") hpB += tt;
  });
  if (hpA) evs.push({ ts: null, loai: "THU", nguoi: "A", label: "Thu học phí (gộp cả tháng)", amount: hpA, dau: "+" });
  if (hpB) evs.push({ ts: null, loai: "THU", nguoi: "B", label: "Thu học phí (gộp cả tháng)", amount: hpB, dau: "+" });
  (td.thuNgoai || []).forEach((k) => {
    const tt = Number(k.thucThu) || 0; if (!tt) return;
    evs.push({ ts: k.ts || null, loai: "THU", nguoi: k.nguoiThu || null, label: `Thu ngoài: ${k.noiDung || k.ten || "—"}`, amount: tt, dau: "+" });
  });
  (td.chiPhi || []).forEach((c) => {
    const e = Number(c.soTien) || 0, kk = Number(c.daTra) || 0;
    if (c.loai === "RUT_LOI") { evs.push({ ts: c.ts || null, loai: "RUT_LOI", nguoi: c.nhan || c.nguoiChi || "A", label: `Rút chia lãi · trừ quỹ ${c.tuQuy || "A"}${c.noiDung && c.noiDung !== "Rút chia lãi" ? " · " + c.noiDung : ""}`, amount: kk, dau: "-" }); return; }
    if (c.loai === "HOAN_UNG") { const nl = c.huong === "A->B" ? "B" : "A"; evs.push({ ts: c.ts || null, loai: "HOAN_UNG", nguoi: nl, label: `Hoàn ứng cho ${nl}`, amount: e, dau: "" }); return; }
    if (c.loai === "CHUYEN") { evs.push({ ts: c.ts || null, loai: "CHUYEN", nguoi: null, label: `Chuyển tiền ${c.huong === "A->B" ? "A→B" : "B→A"}`, amount: e, dau: "" }); return; }
    if (c.loai === "NO_AB") { evs.push({ ts: c.ts || null, loai: "NO_AB", nguoi: null, label: `Ghi nợ A↔B ${c.huong || ""}`, amount: e, dau: "" }); return; }
    if (c.loai === "TRA_NO") { if (kk > 0) evs.push({ ts: c.ts || null, loai: "CHI", nguoi: c.nguoiChi || null, label: `Trả nợ NCC: ${c.noiDung || "—"}`, amount: kk, dau: "-" }); return; }
    if (kk > 0) evs.push({ ts: c.ts || null, loai: "CHI", nguoi: c.nguoiChi || null, label: `Chi: ${c.noiDung || "—"}`, amount: kk, dau: "-" });
  });
  evs.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  return evs;
}
