// ThuPhiPC.jsx — Màn Thu phí cho MÁY TÍNH: ô số, thanh công cụ, bảng "Chi tiết khoản thu" (cuộn ngang) / "Bảng gọn".
// Số liệu lấy từ hóa đơn thật (rows: r.ps.dong, r.rec, r.noTruoc, r.conNo...). Điện thoại vẫn dùng danh sách thẻ trong ThuPhi.jsx.
import { useMemo, useRef, useState, useEffect, createContext, useContext } from "react";
import { C, font, fmt, KHOAN, toast } from "./lib.js";
import { Icon } from "./Icon.jsx";
import { ClassAnimal } from "./Brand.jsx";
import { PLBadge, TieuDeTrang, Segmented } from "./ui.jsx";

const DAM = "color-mix(in srgb, var(--c-pine) 16%, var(--c-card))";

// Nhãn dòng hóa đơn → cột. Dòng không thuộc 8 khoản chuẩn (T7, phụ thu, trừ nghỉ...) gộp vào "Khác".
const colOf = (nhan) => {
  const k = KHOAN.find((x) => x.label === nhan);
  if (k) return k.key;
  if (String(nhan).startsWith("Ăn")) return "tienAn";
  return "khac";
};
const NHAN_COT = Object.fromEntries(KHOAN.map((k) => [k.key, k.label])); NHAN_COT.khac = "Khác";

export function trangThaiHang(r) {
  const thu = r.rec?.thucThu || 0;
  if (r.tongPhaiThu <= 0) return ["Khỏi thu", C.graySoft, C.sub];
  if (r.conNo <= 0 && thu > 0) return ["Đã thu đủ", C.greenSoft, C.greenText];
  if (thu > 0) return ["Thu thiếu", C.amberSoft, C.amberText];
  return ["Chưa thu", C.coralSoft, C.coralText];
}
const Badge = ({ r }) => { const t = trangThaiHang(r); return <span style={{ background: t[1], color: t[2], borderRadius: 99, padding: "3px 10px", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{t[0] === "Đã thu đủ" ? "✓ " : ""}{t[0]}</span>; };

// Giá trị từng cột khoản của 1 hóa đơn
function theoCot(r) {
  const m = {};
  (r.ps?.dong || []).forEach(([nhan, so]) => { const c = colOf(nhan); m[c] = (m[c] || 0) + (Number(so) || 0); });
  return m;
}
const DANH_SACH_COT = [...KHOAN.map((k) => k.key), "khac"];

export function cotHienThi(rows) {
  const co = new Set();
  rows.forEach((r) => { const m = theoCot(r); DANH_SACH_COT.forEach((c) => { if ((m[c] || 0) !== 0) co.add(c); }); });
  return DANH_SACH_COT.filter((c) => co.has(c));
}

export function xuatCSV(rows, cot, month, year) {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const dau = ["Học sinh", "Lớp", ...cot.map((c) => NHAN_COT[c]), "Nợ cũ", "Phải thu", "Đã thu", "Còn nợ", "Trạng thái"];
  const dong = rows.map((r) => { const m = theoCot(r); return [r.hs.ten, r.lop?.ten || "", ...cot.map((c) => m[c] || 0), r.noTruoc || 0, r.tongPhaiThu, r.rec?.thucThu || 0, r.conNo, trangThaiHang(r)[0]]; });
  const noi = "﻿" + [dau, ...dong].map((a) => a.map(q).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([noi], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `thu-phi-${year}-${String(month).padStart(2, "0")}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast(`Đã xuất ${rows.length} dòng (mở bằng Excel).`);
}

const selS = { padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontFamily: font.body, fontSize: 14, cursor: "pointer", minWidth: 0 };

export function Kpi({ icon, tint, mau, nhan, giaTri, phu }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: tint, border: `1px solid ${C.line}`, borderRadius: 14, padding: "8px clamp(8px, 1.4cqw, 12px)", minWidth: 0 }}>
      <div className="kpi-ic" style={{ width: 34, height: 34, borderRadius: 99, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={icon} size={18} color={mau} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-nhan" style={{ fontSize: 12, color: C.sub, fontWeight: 600, lineHeight: 1.2 }}>{nhan}</div>
        <div className="kpi-val" style={{ fontFamily: font.display, fontWeight: 800, fontSize: 17, color: mau, lineHeight: 1.2, display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 5 }}><span style={{ whiteSpace: "nowrap" }}>{giaTri}</span>{phu && <span className="kpi-phu" style={{ fontSize: 11.5, fontWeight: 500, color: C.sub }}>{phu}</span>}</div>
      </div>
    </div>
  );
}
const Vach = () => <span aria-hidden="true" style={{ width: 1, height: 28, background: C.line, flexShrink: 0 }} />;

export function ThuPhiDeskHead({ tk, allRows, rows, chipCounts, search, setSearch, chipsLop, lopFilter, setLopFilter, thuFilter, setThuFilter, che, setChe, onXuat }) {
  const coRec = allRows.filter((r) => r.coRec);
  const xong = coRec.filter((r) => r.conNo <= 0 && r.ps.tong > 0).length;
  const pct = coRec.length ? (xong / coRec.length * 100).toFixed(1).replace(".", ",") : "0";
  return (
    <>
      <div className="no-print" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "8px 16px", marginBottom: 10 }}>
      <TieuDeTrang style={{ flexShrink: 0 }} tieuDe="Danh sách" phu="Đối soát khoản thu theo học sinh" />
      <div className="kpi-row" style={{ flex: "1 1 400px" }}>
        <Kpi icon="coins" tint={C.pineSoft} mau={C.pine} nhan="Phải thu" giaTri={`${fmt(tk.ps)}đ`} />
        <Kpi icon="check" tint={C.greenSoft} mau={C.greenText} nhan="Đã thu" giaTri={`${fmt(tk.thu)}đ`} />
        <Kpi icon="alertTriangle" tint={C.coralSoft} mau={C.coralText} nhan="Còn nợ" giaTri={`${fmt(tk.no)}đ`} />
        <Kpi icon="users" tint={C.blueASoft} mau={C.blueAText} nhan="Hoàn thành thu" giaTri={`${xong}/${coRec.length}`} phu={`học sinh (${pct}%)`} />
      </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 8, marginBottom: 10 }}>
        <Segmented items={[["chitiet", "Chi tiết khoản thu", "receipt"], ["gon", "Bảng gọn", "clipboard"]]} value={che} onChange={setChe} />
        <Vach />
        <div style={{ position: "relative", flex: "1 1 150px", minWidth: 130 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Icon name="search" size={16} color={C.sub} /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm học sinh (tên, …)" aria-label="Tìm học sinh" style={{ ...selS, width: "100%", paddingLeft: 36, cursor: "text" }} />
        </div>
        <select value={lopFilter} onChange={(e) => setLopFilter(e.target.value)} aria-label="Lọc theo lớp" style={{ ...selS, flex: "0 0 130px" }}>
          {chipsLop.map(([id, ten]) => <option key={id} value={id}>{id === "all" ? "Tất cả lớp" : ten}</option>)}
        </select>
        <select value={thuFilter} onChange={(e) => setThuFilter(e.target.value)} aria-label="Lọc theo trạng thái" style={{ ...selS, flex: "0 0 160px" }}>
          <option value="all">Tất cả trạng thái ({chipCounts.all})</option>
          <option value="chuaThu">Chưa thu ({chipCounts.chuaThu})</option>
          <option value="thieu">Thu thiếu ({chipCounts.thieu})</option>
          <option value="noCu">Có nợ cũ ({chipCounts.noCu})</option>
          <option value="thuThua">Thu thừa ({chipCounts.thuThua})</option>
        </select>
        <span style={{ flex: "1 1 0" }} />
        <Vach />
        <button onClick={onXuat} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 12, border: `1.5px solid ${C.pine}`, background: C.card, color: C.pine, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}><Icon name="download" size={16} color={C.pine} /> Xuất Excel</button>
      </div>
    </>
  );
}

const CotCtx = createContext(null);
const TH0 = { padding: "8px 12px", fontWeight: 700, fontSize: 13, color: C.ink, background: C.graySoft, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", position: "sticky", zIndex: 2 };
function ThCot({ k, children, style, ...rest }) {
  const c = useContext(CotCtx);
  return (
    <th {...rest} style={{ ...TH0, ...style }}>
      {children}
      <span role="separator" aria-orientation="vertical" title="Kéo để đổi độ rộng cột" onPointerDown={c.bat(k)} onPointerMove={c.di} onPointerUp={c.xong} onPointerCancel={c.xong}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, cursor: "col-resize", touchAction: "none", borderRight: `2px solid ${C.line}` }} />
    </th>
  );
}

// Độ rộng mặc định từng cột (px). Kéo mép phải tiêu đề cột để đổi; được nhớ cho lần sau.
const RONG_MD = { ten: 210, nocu: 110, phai: 130, da: 120, con: 130, tt: 120, xem: 110, kt: 140, tac: 200 };
const rongMD = (k) => RONG_MD[k] || 104; // cột khoản thu

// Ô số sửa được bằng nhấp đúp: Enter/rời ô = lưu, Esc = hủy.
// daSua: khác mặc định → chữ vàng + chấm "sửa tay"; onReset: nút ↺ về mặc định (như form Sửa khoản thu); hauTo: đơn vị (vd "ngày" cho Tiền ăn).
function OSo({ giaTri, hienThi, style, onLuu, choSua, title, daSua, onReset, hauTo, nen }) {
  const [dang, setDang] = useState(false);
  const [v, setV] = useState("");
  const huy = useRef(false);
  const luu = () => {
    setDang(false);
    if (huy.current) { huy.current = false; return; }
    const s = String(v).replace(/[.,\s]/g, "");
    if (s === "" || s === "-" || !/^-?\d+$/.test(s)) return;
    const n = Number(s);
    if (n !== giaTri) onLuu(n);
  };
  if (dang) return (
    <td style={{ ...style, padding: "3px 6px", background: C.card, boxShadow: `inset 0 0 0 2px ${C.pine}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onFocus={(e) => e.target.select()} onBlur={luu}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); else if (e.key === "Escape") { huy.current = true; setDang(false); } }}
          inputMode="numeric" style={{ flex: 1, minWidth: 0, boxSizing: "border-box", textAlign: "right", border: "none", outline: "none", background: "transparent", color: C.ink, fontFamily: font.body, fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }} />
        {hauTo && <span style={{ fontSize: 11, color: C.sub, fontWeight: 600 }}>{hauTo}</span>}
        {daSua && onReset && <button title="Về mặc định" onMouseDown={(e) => { e.preventDefault(); huy.current = true; setDang(false); onReset(); }} style={{ border: `1px solid ${C.line}`, background: C.card, borderRadius: 6, padding: "0 6px", cursor: "pointer", color: C.sub, fontSize: 14, lineHeight: "20px" }}>↺</button>}
      </div>
    </td>
  );
  return (
    <td title={choSua ? (title || "Nhấp đúp để sửa") : undefined} onDoubleClick={() => { if (!choSua) return; huy.current = false; setV(String(giaTri || 0)); setDang(true); }}
      style={{ ...style, cursor: choSua ? "cell" : style.cursor, ...(daSua ? { color: C.amberText } : null), ...(nen ? { background: nen } : null) }}>
      {daSua && <span title="Đã sửa tay" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 99, background: C.amber, marginRight: 6, verticalAlign: "middle" }} />}{hienThi}
    </td>
  );
}

// Nền chỉ ở ô TÊN (theo phân loại) và Ô ĐÃ SỬA TAY (vàng). Pha màu gốc với nền thẻ để đậm vừa phải.
const TINT_PL = { AE: () => C.blueASoft, GV: () => C.violetBSoft, T7: () => C.greenSoft }; // đúng bảng màu "Soft" của app
const NEN_SUA = () => C.amberSoft;
// Số ngày ăn khác "số ngày chuẩn" của tháng (số phổ biến nhất) cũng coi là sửa tay.
const lechNgayAn = (r, nc) => nc != null && r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec?.ngayAn || 0) !== nc;
const suaTay = (r, nc) => (r.ps?.suaCount || 0) > 0 || (r.rec?.phuThu || []).some((p) => !p.lopKhoan) || lechNgayAn(r, nc);
const nenTen = (r, nc) => {
  const pl = TINT_PL[r.hs.pl] ? TINT_PL[r.hs.pl]() : null, sua = suaTay(r, nc) ? NEN_SUA() : null;
  if (pl && sua) return `linear-gradient(90deg, ${pl} 50%, ${sua} 50%)`;
  return pl || sua || undefined;
};
// Phụ thu thêm tay: ô cột tương ứng được tô
const cotPhuThuTay = (r) => new Set((r.rec?.phuThu || []).filter((p) => !p.lopKhoan).map((p) => colOf(p.ten)));

export function ThuPhiBang({ rows, che, locked, onXem, onThu, onPhieu, onSuaKhoan, onResetKhoan, onSuaNgayAn, onSuaDaThu }) {
  const cot = useMemo(() => cotHienThi(rows), [rows]);
  const ngayChuan = useMemo(() => { const dem = {}; rows.forEach((r) => { if (r.rec && r.hs.pl !== "GV" && r.hs.pl !== "T7") { const n = r.rec.ngayAn || 0; dem[n] = (dem[n] || 0) + 1; } }); const k = Object.keys(dem).sort((a, b) => dem[b] - dem[a])[0]; return k == null ? null : Number(k); }, [rows]);
  const KEY = "mn5:thuphiCotRong";
  const [wd, setWd] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } });
  const wref = useRef(wd); wref.current = wd;
  const dr = useRef(null);
  const rong = (k) => Math.max(56, wd[k] ?? rongMD(k));

  const keoBat = (k) => (e) => { e.preventDefault(); e.stopPropagation(); dr.current = { k, sx: e.clientX, w: rong(k) }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} };
  const keoDi = (e) => { const d = dr.current; if (!d) return; setWd((p) => ({ ...p, [d.k]: Math.max(56, Math.round(d.w + e.clientX - d.sx)) })); };
  const keoXong = () => { if (dr.current) { try { localStorage.setItem(KEY, JSON.stringify(wref.current)); } catch {} } dr.current = null; };

  const th0 = TH0;
  const td = { padding: "8px 12px", borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontVariantNumeric: "tabular-nums", fontSize: 14, textAlign: "right" };
  const dinhTrai = { position: "sticky", left: 0, background: C.card, zIndex: 1, textAlign: "left", boxShadow: "2px 0 0 " + C.line };
  const so = (n) => (n ? fmt(n) : "-");
  const ctx = { bat: keoBat, di: keoDi, xong: keoXong };
  const ten = (r) => (
    <td style={{ ...td, ...dinhTrai, background: nenTen(r, ngayChuan) || C.card, fontFamily: font.body }}>
      <button onClick={() => onXem(r.hs.id)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, textAlign: "left", fontFamily: font.body, maxWidth: "100%" }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: C.ink, whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: 1.25 }}>{r.hs.ten}</div>
        <div style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 5 }}><ClassAnimal name={r.lop?.ten || ""} size={14} />{r.lop?.ten || "—"}{r.hs.pl && r.hs.pl !== "Bthg" && <PLBadge pl={r.hs.pl} />}</div>
      </button>
    </td>
  );
  const conNo = (r) => <td style={{ ...td, fontWeight: 700, color: r.conNo > 0 ? C.coralText : r.conNo < 0 ? C.blueAText : C.sub }}>{r.conNo < 0 ? `Dư ${fmt(-r.conNo)}` : so(r.conNo)}</td>;
  const chuThich = (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", margin: "0 2px 8px", fontSize: 12.5, color: C.sub }}>
      {[["Anh em (AE)", TINT_PL.AE()], ["Con GV", TINT_PL.GV()], ["Chỉ thứ 7", TINT_PL.T7()], ["Ô sửa tay", NEN_SUA()]].map(([t, c]) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: c, border: `1px solid ${C.line}` }} />{t}</span>
      ))}
    </div>
  );
  const khung = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "auto", maxHeight: "calc(100vh - 270px)" };
  const bang = (keys) => ({ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", width: Math.max(...[keys.reduce((a, k) => a + rong(k), 0)]), minWidth: "100%", fontFamily: font.body });
  const colgroup = (keys) => <colgroup>{keys.map((k) => <col key={k} style={{ width: rong(k) }} />)}</colgroup>;

  if (che === "gon") {
    const keys = ["ten", "phai", "da", "con", "tt", "kt", "tac"];
    return (
      <CotCtx.Provider value={ctx}>
      {chuThich}
      <div style={khung}>
        <table style={bang(keys)}>
          {colgroup(keys)}
          <thead><tr>
            <ThCot k="ten" style={{ top: 0, left: 0, zIndex: 3, textAlign: "left" }}>Học sinh</ThCot>
            <ThCot k="phai" style={{ top: 0, textAlign: "right" }}>Phải thu</ThCot>
            <ThCot k="da" style={{ top: 0, textAlign: "right" }}>Đã thu</ThCot>
            <ThCot k="con" style={{ top: 0, textAlign: "right" }}>Còn nợ</ThCot>
            <ThCot k="tt" style={{ top: 0 }}>Trạng thái</ThCot>
            <ThCot k="kt" style={{ top: 0 }}>Khoản thu</ThCot>
            <ThCot k="tac" style={{ top: 0, textAlign: "center" }}>Thao tác</ThCot>
          </tr></thead>
          <tbody>
            {rows.map((r) => {
              const n = (r.ps?.dong || []).filter((d) => (Number(d[1]) || 0) !== 0).length;
              return (
                <tr key={r.hs.id}>
                  {ten(r)}
                  <td style={{ ...td, fontWeight: 700 }}>{so(r.tongPhaiThu)}</td>
                  <td style={{ ...td, color: C.greenText, fontWeight: 700 }}>{so(r.rec?.thucThu || 0)}</td>
                  {conNo(r)}
                  <td style={{ ...td, textAlign: "left" }}><Badge r={r} /></td>
                  <td style={{ ...td, textAlign: "left" }}>{n} khoản · <button onClick={() => onXem(r.hs.id)} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, cursor: "pointer", fontFamily: font.body, fontSize: 14, padding: 0 }}>Xem</button></td>
                  <td style={{ ...td, textAlign: "center", overflow: "visible" }}>
                    <button onClick={() => onThu(r.hs.id)} disabled={locked} style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontWeight: 700, fontSize: 13, cursor: locked ? "default" : "pointer", opacity: locked ? 0.5 : 1, marginRight: 6 }}>Thu tiền</button>
                    <button onClick={() => onPhieu(r.hs.id)} style={{ padding: "6px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="printer" size={14} color={C.sub} />Phiếu</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </CotCtx.Provider>
    );
  }

  const keys = ["ten", ...cot, "nocu", "phai", "da", "con", "tt", "xem"];
  const H1 = 38;
  return (
    <CotCtx.Provider value={ctx}>
    {chuThich}
      <div style={khung}>
      <table style={bang(keys)}>
        {colgroup(keys)}
        <thead>
          <tr>
            <ThCot k="ten" rowSpan={2} style={{ top: 0, left: 0, zIndex: 3, textAlign: "left" }}>Học sinh</ThCot>
            {cot.length > 0 && <th colSpan={cot.length} style={{ ...th0, top: 0, height: H1, textAlign: "center", background: DAM, color: C.pine }}>Khoản thu tháng này</th>}
            <ThCot k="nocu" rowSpan={2} style={{ top: 0, textAlign: "right" }}>Nợ cũ</ThCot>
            <ThCot k="phai" rowSpan={2} style={{ top: 0, textAlign: "right" }}>Phải thu</ThCot>
            <ThCot k="da" rowSpan={2} style={{ top: 0, textAlign: "right" }}>Đã thu</ThCot>
            <ThCot k="con" rowSpan={2} style={{ top: 0, textAlign: "right" }}>Còn nợ</ThCot>
            <ThCot k="tt" rowSpan={2} style={{ top: 0, textAlign: "left" }}>Trạng thái</ThCot>
            <ThCot k="xem" rowSpan={2} style={{ top: 0, textAlign: "center" }}>Xem chi tiết</ThCot>
          </tr>
          {cot.length > 0 && <tr>{cot.map((c) => <ThCot key={c} k={c} style={{ top: H1, textAlign: "right", fontWeight: 600 }}>{NHAN_COT[c]}</ThCot>)}</tr>}
        </thead>
        <tbody>
          {rows.map((r) => {
            const m = theoCot(r);
            return (
              <tr key={r.hs.id}>
                {ten(r)}
                {cot.map((c) => {
                  const sua = !locked && c !== "khac" && onSuaKhoan && r.coRec !== false && r.hs.pl !== "GV" && r.hs.pl !== "T7" && !!r.rec;
                  const hien = m[c] ? (m[c] < 0 ? "−" + fmt(-m[c]) : fmt(m[c])) : "-";
                  if (c === "tienAn") {
                    // Tiền ăn sửa theo SỐ NGÀY ĂN (như form Sửa khoản thu): tiền = ngày × giá, đánh dấu "sửa tay".
                    const ngay = r.rec?.ngayAn || 0, mdNgay = r.rec?.ngayAnDefault ?? ngay;
                    const gia = r.rec?.giaAn ?? r.rec?.khoanDefault?.giaAn ?? r.lop?.tienAn ?? 0;
                    return <OSo key={c} style={td} giaTri={ngay} hauTo="ngày" choSua={sua} title={`${ngay} ngày × ${fmt(gia)} · nhấp đúp để sửa số ngày ăn`} daSua={(!!r.rec?.ngayAnManual && ngay !== mdNgay) || lechNgayAn(r, ngayChuan)} nen={(r.rec?.ngayAnManual && ngay !== mdNgay) || lechNgayAn(r, ngayChuan) ? NEN_SUA() : undefined}
                      onLuu={(n) => onSuaNgayAn(r.hs.id, Math.max(0, n))} onReset={() => onSuaNgayAn(r.hs.id, null)} hienThi={hien} />;
                  }
                  const giaTri = c === "khac" ? (m[c] || 0) : (r.rec?.khoan?.[c] ?? m[c] ?? 0);
                  const md = r.rec?.khoanDefault?.[c] ?? 0;
                  const ptay = cotPhuThuTay(r).has(c);
                  return <OSo key={c} style={td} giaTri={giaTri} choSua={sua && !ptay} title={ptay ? "Phụ thu thêm tay (sửa trong Sửa khoản thu)" : `Mặc định: ${fmt(md)} · nhấp đúp để sửa`} nen={(c !== "khac" && giaTri !== md) || ptay ? NEN_SUA() : (c === "hocPhi" && r.hs.pl === "AE" ? TINT_PL.AE() : undefined)} daSua={c !== "khac" && giaTri !== md} onReset={() => onResetKhoan(r.hs.id, c)} onLuu={(n) => onSuaKhoan(r.hs.id, c, n)} hienThi={hien} />;
                })}
                <td style={{ ...td, color: r.noTruoc > 0 ? C.coralText : C.sub }}>{r.noTruoc ? fmt(r.noTruoc) : "-"}</td>
                <td style={{ ...td, fontWeight: 800, background: C.pineSoft }}>{so(r.tongPhaiThu)}</td>
                <OSo style={{ ...td, fontWeight: 700, color: C.greenText, background: (r.rec?.thucThu || 0) > 0 ? C.greenSoft : undefined }} giaTri={r.rec?.thucThu || 0} choSua={!locked && !!onSuaDaThu && !!r.rec} onLuu={(n) => onSuaDaThu(r.hs.id, Math.max(0, n))} hienThi={so(r.rec?.thucThu || 0)} />
                {conNo(r)}
                <td style={{ ...td, textAlign: "left" }}><Badge r={r} /></td>
                <td style={{ ...td, textAlign: "center", overflow: "visible" }}><button onClick={() => onXem(r.hs.id)} style={{ padding: "5px 18px", borderRadius: 10, border: `1.5px solid ${C.pine}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Xem</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </CotCtx.Provider>
  );
}

// Nút tròn tia sét "Thao tác hàng loạt": bấm = mở menu; nhấn giữ rồi kéo = di chuyển (nhớ vị trí).
export function NutThaoTac({ open, setOpen, children }) {
  const KEY = "mn5:thaoTacViTri";
  const [vt, setVt] = useState(() => { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && typeof j.r === "number" && typeof j.b === "number") return j; } catch {} return { r: 28, b: 28 }; });
  const [keo, setKeo] = useState(false);
  const ref = useRef(vt); ref.current = vt;
  const drag = useRef(null);
  const kep = (r, b) => ({ r: Math.min(Math.max(8, r), window.innerWidth - 60), b: Math.min(Math.max(8, b), window.innerHeight - 60) });
  useEffect(() => { if (!open) return; const k = (e) => { if (e.key === "Escape") setOpen(false); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open]);
  const down = (e) => { if (e.button !== undefined && e.button !== 0) return; drag.current = { sx: e.clientX, sy: e.clientY, r: ref.current.r, b: ref.current.b, moved: false }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} };
  const move = (e) => { const d = drag.current; if (!d) return; const dx = e.clientX - d.sx, dy = e.clientY - d.sy; if (!d.moved && Math.hypot(dx, dy) < 5) return; d.moved = true; setKeo(true); setVt(kep(d.r - dx, d.b - dy)); };
  const up = () => { const d = drag.current; drag.current = null; setKeo(false); if (d && d.moved) { try { localStorage.setItem(KEY, JSON.stringify(ref.current)); } catch {} } else setOpen((v) => !v); };
  const huongXuong = vt.b > window.innerHeight - 290;
  const popover = { position: "fixed", right: Math.min(vt.r, window.innerWidth - 320), width: 304, zIndex: 41, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, boxShadow: "0 10px 30px rgba(0,0,0,.2)", overflow: "hidden", ...(huongXuong ? { top: window.innerHeight - vt.b + 8 } : { bottom: vt.b + 60 }) };
  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
      {open && !keo && <div role="menu" style={popover}>{children}</div>}
      <button onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; setKeo(false); }}
        title="Thao tác hàng loạt — bấm để mở, nhấn giữ rồi kéo để di chuyển" aria-label="Thao tác hàng loạt" aria-expanded={open}
        style={{ position: "fixed", right: vt.r, bottom: vt.b, width: 52, height: 52, borderRadius: 99, border: "none", background: C.inkBg, color: C.onInk, display: "flex", alignItems: "center", justifyContent: "center", cursor: keo ? "grabbing" : "grab", boxShadow: "0 6px 18px rgba(0,0,0,.28)", zIndex: 42, touchAction: "none", userSelect: "none" }}>
        <Icon name="zap" size={24} color="currentColor" />
      </button>
    </>
  );
}
