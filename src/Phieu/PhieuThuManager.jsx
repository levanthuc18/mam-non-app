import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Ii } from "../Icon.jsx";
import { C, font, fmt, printWithName, fileName, capSoBienLai, toast, noDau } from "../lib.js";
import { BottomSheet, Segmented, Bar, TieuDeTrang } from "../ui.jsx";
import { Kpi } from "../ThuPhiPC.jsx";
import { makeZip } from "./zip.js";
import { PhieuThu } from "./PhieuThu.jsx";
import { PhieuTongHop } from "./PhieuTongHop.jsx";
import { AnimatedCounter } from "./AnimatedCounter.jsx";
import { PreflightCheck } from "./PreflightCheck.jsx";
import { ClassList } from "./ClassList.jsx";
import { PrintPreview } from "./PrintPreview.jsx";
import { sharePhieuAnh, makePhieuImage, canShareImageFile, shareImageFile, downloadImageUrl, coChiaSeTrucTiep, coSaoChepAnh, saoChepAnhFile, makePhieuImageNhanh } from "./shareImage.js";

const LOC_NGAN = { onlyConNo: "Còn nợ", onlyChuaIn: "Chưa in phiếu", onlyDongThieu: "Đóng thiếu" };
const FILTER_DEFS = [
  { key: "onlyConNo", label: "Còn nợ" },
  { key: "onlyChuaIn", label: "Chưa in phiếu lần nào" },
  { key: "onlyDongThieu", label: "Đóng thiếu" },
];

// Nút GỘP "In + Chia sẻ": bấm phần chính = in; bấm mũi tên = mở thêm lựa chọn (chia sẻ ảnh, tải ảnh…).
function NutInChiaSe({ onIn, items, disabled, children, style }) {
  const [mo, setMo] = useState(false);
  useEffect(() => {
    if (!mo) return;
    const dong = (e) => { if (!e.target.closest?.("[data-nutin]")) setMo(false); };
    document.addEventListener("pointerdown", dong);
    return () => document.removeEventListener("pointerdown", dong);
  }, [mo]);
  const bg = disabled ? C.graySoft : C.pine, fg = disabled ? C.grayText : C.onFill;
  return (
    <div data-nutin="1" className="no-print" style={{ position: "relative", ...style }}>
      {mo && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(100% + 8px)", background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(20,40,58,.18)", overflow: "hidden", zIndex: 20 }}>
          {items.map((it, i) => (
            <button key={it.nhan} onClick={() => { setMo(false); it.chay(); }} disabled={it.tat}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "11px 14px", border: "none", borderTop: i ? `1px solid ${C.line}` : "none", background: "transparent", cursor: it.tat ? "default" : "pointer", fontFamily: font.body, color: it.tat ? C.grayText : C.ink }}>
              <Ii name={it.icon} size={17} />
              <span><span style={{ fontWeight: 700, fontSize: 14, display: "block" }}>{it.nhan}</span><span style={{ fontSize: 12, color: C.sub }}>{it.phu}</span></span>
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", background: bg, boxShadow: disabled ? "none" : "0 4px 12px rgba(13,111,168,.3)" }}>
        <button onClick={onIn} disabled={disabled} style={{ flex: 1, minWidth: 0, padding: "13px 8px", border: "none", background: "transparent", color: fg, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>{children}</button>
        <button onClick={() => setMo((v) => !v)} disabled={disabled} aria-label="Thêm lựa chọn: chia sẻ ảnh" aria-expanded={mo}
          style={{ width: 48, border: "none", borderLeft: "1px solid rgba(255,255,255,.35)", background: "transparent", color: fg, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ display: "inline-flex", transform: mo ? "none" : "rotate(180deg)" }}><Ii name="chevronDown" size={18} /></span>
        </button>
      </div>
    </div>
  );
}

export function PhieuThuManager({ allRows, meta, month, year, mData, upMData, upMeta, phieuId, clearPhieuId }) {
  const [selectedLop, setSelectedLop] = useState("all");
  const [filters, setFilters] = useState({ onlyConNo: true, onlyChuaIn: false, onlyDongThieu: false });
  const [includeTongHop, setIncludeTongHop] = useState(false); // mặc định chỉ in phiếu từng em: 12 phiếu = 12 trang A5
  const [previewPage, setPreviewPage] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [mode, setMode] = useState("batch"); // "single" = In từng phiếu · "batch" = In hàng loạt
  const [tkHS, setTkHS] = useState(""); // ô tìm học sinh (tab In từng phiếu)
  const [lopHS, setLopHS] = useState("all");
  const [shareSignal, setShareSignal] = useState(0); // tín hiệu mở bản phóng to để chia sẻ ảnh (tab hàng loạt)
  const [singleId, setSingleId] = useState(null);
  const [moPhieu, setMoPhieu] = useState(false); // điện thoại: đã bấm một học sinh -> mở phiếu
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [lopSheetOpen, setLopSheetOpen] = useState(false);
  const [sharingSingle, setSharingSingle] = useState(false);
  const [shareModal, setShareModal] = useState(null); // { url, file, title, text, filename }
  const closeShareModal = () => { setShareModal((m) => { if (m && m.url) { try { URL.revokeObjectURL(m.url); } catch {} } return null; }); };
  
  useEffect(() => {
    if (phieuId) {
      const found = allRows.find((r) => r.hs.id === phieuId && r.coRec);
      if (found) { setSingleId(phieuId); setMoPhieu(true); setMode("single"); }
      if (clearPhieuId) clearPhieuId();
    }
  }, [phieuId]);
  const isWide = typeof window !== "undefined" && window.innerWidth >= 1000;
  const activeFilterCount = FILTER_DEFS.filter((f) => filters[f.key]).length;
  const chipBtn = { flex: 1, padding: "11px 12px", borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0 };

  // Lọc phiếu theo bộ lọc f và lớp lop — dùng cho danh sách in VÀ để hiện "số phiếu" bên cạnh từng lựa chọn
  const locRows = useCallback((f, lop) => allRows.filter((r) => {
    if (!r.coRec) return false;
    if (lop !== "all" && r.lopId !== lop) return false;
    if (f.onlyConNo && r.conNo <= 0) return false;
    if (f.onlyChuaIn && r.rec?.bienLai) return false;                                   // đã có mã phiếu = đã in
    if (f.onlyDongThieu && !((r.rec?.thucThu || 0) > 0 && r.conNo > 0)) return false;   // đã đóng một phần, còn thiếu
    return true;
  }), [allRows]);
  const rowsToPrint = useMemo(() => locRows(filters, selectedLop), [locRows, filters, selectedLop]);
  // Số phiếu nếu bật thêm từng bộ lọc (giữ nguyên các bộ lọc khác + lớp đang chọn) / nếu chọn từng lớp
  const demLoc = useMemo(() => Object.fromEntries(FILTER_DEFS.map((f) => [f.key, locRows({ ...filters, [f.key]: true }, selectedLop).length])), [locRows, filters, selectedLop]);
  const demLop = useMemo(() => Object.fromEntries(meta.classes.map((c) => [c.id, locRows(filters, c.id).length])), [locRows, filters, meta]);
  const [moMenu, setMoMenu] = useState(null); // null | "loc" | "lop" — chỉ mở một danh sách
  useEffect(() => {
    if (!moMenu) return;
    const dong = (e) => { if (!e.target.closest?.("[data-boloc]")) setMoMenu(null); };
    document.addEventListener("pointerdown", dong);
    return () => document.removeEventListener("pointerdown", dong);
  }, [moMenu]);

  const totalPages = rowsToPrint.length + (includeTongHop ? 1 : 0);
  const tongNo = useMemo(() => rowsToPrint.reduce((a, r) => a + Math.max(0, r.conNo), 0), [rowsToPrint]);
  const tongPhaiThu = useMemo(() => rowsToPrint.reduce((a, r) => a + r.tongPhaiThu, 0), [rowsToPrint]);
  const tongDaThu = useMemo(() => rowsToPrint.reduce((a, r) => a + (r.rec?.thucThu || 0), 0), [rowsToPrint]);

  const handlePrintBatch = useCallback(async () => {
    if (rowsToPrint.length === 0) return;
    const toAssign = rowsToPrint.filter((r) => !r.rec?.bienLai).map((r) => ({ id: r.hs.id, nguoiThu: r.hs.nguoiThu }));

    const lopName = selectedLop === "all" ? "Tất cả lớp" : (meta.classes.find((c) => c.id === selectedLop)?.ten || "");
    const printTitle = fileName(`Học phí - ${lopName} - T${month}.${year}`);

    if (toAssign.length) {
      let soBienLai, capFor;
      try { ({ soBienLai, capFor } = await capSoBienLai(meta, toAssign)); }
      catch { toast("Không cấp được số biên lai (mạng/phiên) — thử lại sau."); return; }
      const newFees = { ...mData.fees };
      const nlToday = new Date().toISOString().slice(0, 10);
      Object.keys(capFor).forEach((id) => { newFees[id] = { ...newFees[id], bienLai: capFor[id], ngayLap: nlToday }; });
      upMeta({ ...meta, soBienLai });
      upMData({ ...mData, fees: newFees });
      printWithName(printTitle, 300);
    } else {
      printWithName(printTitle, 0);
    }
  }, [rowsToPrint, mData, meta, upMeta, upMData, selectedLop, month, year]);


  // ===== Tải TẤT CẢ ảnh phiếu (.zip): mỗi em một ảnh PNG, dựng lần lượt ngoài màn hình =====
  const zipRef = useRef(null);
  const huyZip = useRef(false);
  const [zipRow, setZipRow] = useState(null);
  const [zipTD, setZipTD] = useState(null); // { i, n }
  const taiZip = async () => {
    if (zipTD || rowsToPrint.length === 0) return;
    huyZip.current = false;
    const lopName = selectedLop === "all" ? "Tất cả lớp" : (meta.classes.find((c) => c.id === selectedLop)?.ten || "");
    const files = [], dung = new Set(), ctx = {};
    let loi = 0;
    for (let i = 0; i < rowsToPrint.length; i++) {
      if (huyZip.current) break;
      const r = rowsToPrint[i];
      setZipTD({ i: i + 1, n: rowsToPrint.length });
      setZipRow(r);
      await new Promise((res) => setTimeout(res, 60)); // chờ phiếu vẽ xong
      let name = fileName(`${r.lop?.ten ? r.lop.ten + " - " : ""}${r.hs.ten} - T${month}.${year}`) + ".png";
      if (dung.has(name)) name = name.replace(/\.png$/, ` (${i + 1}).png`);
      dung.add(name);
      const kq = await makePhieuImageNhanh(zipRef.current, name, ctx);
      if (!kq.ok) { loi++; continue; }
      const buf = await kq.file.arrayBuffer();
      files.push({ name, data: new Uint8Array(buf) });
    }
    const daHuy = huyZip.current;
    setZipRow(null); setZipTD(null);
    if (daHuy) { toast("Đã dừng tải ảnh."); return; }
    if (files.length === 0) { alert("Không tạo được ảnh nào. Thử lại nhé."); return; }
    const url = URL.createObjectURL(makeZip(files));
    downloadImageUrl(url, fileName(`Phiếu học phí - ${lopName} - T${month}.${year}`) + ".zip");
    setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 4000);
    toast(loi ? `Đã tải ${files.length} ảnh (${loi} ảnh lỗi, bỏ qua).` : `Đã tải ${files.length} ảnh phiếu (.zip)`);
  };

  const rowsCo = useMemo(() => allRows.filter((r) => r.coRec), [allRows]);
  const singleRow = rowsCo.find((r) => r.hs.id === singleId) || rowsCo[0] || null;
  const dsChon = useMemo(() => {
    const q = noDau(tkHS || "");
    return rowsCo.filter((r) => (lopHS === "all" || r.lopId === lopHS) && (!q || noDau(r.hs.ten).includes(q)));
  }, [rowsCo, lopHS, tkHS]);

  // Chia sẻ ảnh phiếu của em đang chọn
  const chiaSeAnh = async () => {
    if (sharingSingle || !singleRow) return;
    setSharingSingle(true);
    const node = document.getElementById("phieu-in");
    const ten = singleRow.hs.ten || "Học sinh";
    const lop = singleRow.lop?.ten || "";
    const fn = fileName(`${lop ? lop + " - " : ""}${ten} - T${month}.${year}`) + ".png";
    const r = await makePhieuImage(node, fn);
    setSharingSingle(false);
    if (!r.ok) { alert("Không tạo được ảnh (" + (r.reason || "?") + (r.error && r.error.message ? ": " + r.error.message : "") + "). Thử lại nhé."); return; }
    setShareModal({ url: r.url, file: r.file, filename: fn, title: `Phiếu học phí — ${ten}`, text: `Phiếu thông báo học phí tháng ${month}/${year} — ${ten}` });
  };
  const _nutChiaSeCu = (
    <button onClick={chiaSeAnh} disabled={sharingSingle || !singleRow}
      style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, color: sharingSingle ? C.grayText : C.ink, fontWeight: 700, fontSize: 14, cursor: sharingSingle ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: font.body }}>
      {sharingSingle ? "Đang tạo ảnh…" : <><Ii name="share" size={16} /> Chia sẻ ảnh phiếu</>}
    </button>
  );

  // In phiếu của em đang chọn (cấp số biên lai nếu chưa có) — cùng logic nút in cũ nằm dưới tờ phiếu
  const inPhieuMot = async () => {
    if (!singleRow) return;
    const nguoiThu = singleRow.hs.nguoiThu;
    const bienLai = singleRow.rec?.bienLai || null;
    const printTitle = fileName(`${singleRow.lop?.ten ? singleRow.lop.ten + " - " : ""}${singleRow.hs.ten} - T${month}.${year}`);
    if (!bienLai) {
      let soBienLai, capFor;
      try { ({ soBienLai, capFor } = await capSoBienLai(meta, [{ id: singleRow.hs.id, nguoiThu }])); }
      catch { toast("Không cấp được số biên lai (mạng/phiên) — thử lại sau."); return; }
      const bl = capFor[singleRow.hs.id];
      upMeta({ ...meta, soBienLai });
      upMData({ ...mData, fees: { ...mData.fees, [singleRow.hs.id]: { ...mData.fees[singleRow.hs.id], bienLai: bl, ngayLap: new Date().toISOString().slice(0, 10) } } });
      printWithName(printTitle, 100);
    } else {
      printWithName(printTitle, 0);
    }
  };
  const taiAnhVe = async () => {
    if (sharingSingle || !singleRow) return;
    setSharingSingle(true);
    const fn = fileName(`${singleRow.lop?.ten ? singleRow.lop.ten + " - " : ""}${singleRow.hs.ten} - T${month}.${year}`) + ".png";
    const r = await makePhieuImage(document.getElementById("phieu-in"), fn);
    setSharingSingle(false);
    if (!r.ok) { alert("Không tạo được ảnh (" + (r.reason || "?") + "). Thử lại nhé."); return; }
    downloadImageUrl(r.url, fn);
  };
  const saoChepAnh = async () => {
    if (sharingSingle || !singleRow) return;
    setSharingSingle(true);
    const fn = fileName(`${singleRow.lop?.ten ? singleRow.lop.ten + " - " : ""}${singleRow.hs.ten} - T${month}.${year}`) + ".png";
    const r = await makePhieuImage(document.getElementById("phieu-in"), fn);
    setSharingSingle(false);
    if (!r.ok) { alert("Không tạo được ảnh (" + (r.reason || "?") + "). Thử lại nhé."); return; }
    const kq = await saoChepAnhFile(r.file);
    toast(kq.ok ? "Đã sao chép ảnh phiếu — mở Zalo, chọn chat phụ huynh rồi dán (Ctrl+V)" : "Trình duyệt không cho sao chép ảnh — hãy dùng \"Tải ảnh về máy\".");
  };
  // Lựa chọn thêm theo thiết bị: điện thoại = chia sẻ trực tiếp; máy tính = sao chép ảnh (dán vào Zalo) + tải về
  const dsLuaChon = [];
  if (coChiaSeTrucTiep()) dsLuaChon.push({ nhan: sharingSingle ? "Đang tạo ảnh…" : "Chia sẻ ảnh phiếu", phu: "Gửi qua Zalo, tin nhắn…", icon: "share", chay: chiaSeAnh, tat: sharingSingle });
  else if (coSaoChepAnh()) dsLuaChon.push({ nhan: sharingSingle ? "Đang tạo ảnh…" : "Sao chép ảnh", phu: "Dán (Ctrl+V) vào Zalo, chọn đúng chat phụ huynh", icon: "copy", chay: saoChepAnh, tat: sharingSingle });
  dsLuaChon.push({ nhan: "Tải ảnh về máy", phu: "Lưu thành tệp PNG", icon: "download", chay: taiAnhVe, tat: sharingSingle });
  const nutInMot = (
    <NutInChiaSe onIn={inPhieuMot} disabled={!singleRow}
      items={dsLuaChon}>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Ii name="printer" size={18} /> {singleRow?.rec?.bienLai ? "In / Lưu PDF" : "Cấp số biên lai & In"}</span>
    </NutInChiaSe>
  );
  const nutChiaSe = nutInMot;
  const tabs = <Segmented full className="no-print" items={[["single", "In từng phiếu", "printer"], ["batch", "In hàng loạt", "clipboard"]]} value={mode} onChange={setMode} />;

  const shareModalEl = (
        shareModal && (
          <div onClick={closeShareModal} className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 16, padding: 16, maxWidth: 430, width: "100%", maxHeight: "92vh", overflowY: "auto" }}>
              <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 6 }}>Ảnh phiếu thu</div>
              <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12, lineHeight: 1.5 }}>Muốn gửi <b>đúng chat phụ huynh</b>: bấm <b>Tải ảnh về</b>, rồi mở Zalo phụ huynh và chọn ảnh vừa lưu. Nút "Chia sẻ ngay" mở khay hệ thống — có thể không hiện đúng người.</div>
              <img src={shareModal.url} alt="Phiếu thu" style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.line}`, display: "block" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                {canShareImageFile(shareModal.file) && (
                  <button
                    onClick={async () => { const r = await shareImageFile(shareModal.file, { title: shareModal.title, text: shareModal.text }); if (!r.ok) alert("Không mở được chia sẻ — bạn nhấn giữ vào ảnh để lưu/gửi nhé."); }}
                    style={{ flex: 1, minWidth: 120, padding: "11px 0", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: font.body }}
                  >Chia sẻ ngay</button>
                )}
                <button
                  onClick={() => downloadImageUrl(shareModal.url, shareModal.filename)}
                  style={{ flex: 1, minWidth: 120, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: font.body }}
                >Tải ảnh về</button>
                <button
                  onClick={closeShareModal}
                  style={{ flex: "0 0 auto", padding: "11px 18px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 13.5, cursor: "pointer", fontFamily: font.body }}
                >Đóng</button>
              </div>
            </div>
          </div>
        )
  );

  const sidebar = (
    <div className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {tabs}

      {/* Bộ lọc + Chọn lớp */}
      {isWide ? (
        (() => {
          // Hai ô xổ xuống CÙNG KIỂU: nút → danh sách rộng bằng cả hàng, mỗi dòng có số phiếu bên phải.
          const nhanLoc = FILTER_DEFS.filter((f) => filters[f.key]).map((f) => LOC_NGAN[f.key]).join(" + ") || "Không lọc (tất cả)";
          const tenLop = selectedLop === "all" ? "Tất cả lớp" : (meta.classes.find((c) => c.id === selectedLop)?.ten || "Chọn lớp");
          const nut = (id, nhan, soPhieu) => (
            <button onClick={() => setMoMenu((v) => (v === id ? null : id))} aria-expanded={moMenu === id} title={nhan}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minWidth: 0, padding: "11px 12px", borderRadius: 12, border: `1.5px solid ${moMenu === id ? C.pine : C.line}`, background: C.card, color: C.ink, fontFamily: font.body, fontWeight: 600, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>{nhan}</span>
              <span title="Số phiếu sẽ in" style={{ flexShrink: 0, background: C.pineSoft, color: C.pine, borderRadius: 99, padding: "1px 9px", fontSize: 12, fontWeight: 800 }}>{soPhieu}</span>
              <span style={{ display: "inline-flex", transform: moMenu === id ? "rotate(180deg)" : "none", flexShrink: 0 }}><Ii name="chevronDown" size={16} /></span>
            </button>
          );
          const pill = (on, n) => <span title="Số phiếu sẽ in nếu chọn mục này" style={{ flexShrink: 0, background: on ? C.pine : C.graySoft, color: on ? C.onFill : C.sub, borderRadius: 99, padding: "1px 9px", fontSize: 12, fontWeight: 800 }}>{n}</span>;
          const dong = (k, on, children, n, onClick) => (
            <div key={k} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: C.ink, background: on ? C.pineSoft : "transparent", whiteSpace: "nowrap" }}>
              {children}{pill(on, n)}
            </div>
          );
          const khung = (canPhai) => ({ position: "absolute", top: "calc(100% + 6px)", [canPhai ? "right" : "left"]: 0, minWidth: "100%", width: "max-content", maxWidth: 230, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 10px 30px rgba(20,40,58,.18)", padding: 4, zIndex: 20 });
          return (
            <div data-boloc="1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ position: "relative", minWidth: 0 }}>
                {nut("loc", nhanLoc, rowsToPrint.length)}
                {moMenu === "loc" && (
                  <div style={khung(false)}>
                    {FILTER_DEFS.map((f) => dong(f.key, filters[f.key],
                      <><input type="checkbox" readOnly checked={filters[f.key]} style={{ width: 16, height: 16, accentColor: C.pine, flexShrink: 0, pointerEvents: "none" }} /><span style={{ flex: 1, minWidth: 0 }}>{f.label}</span></>,
                      demLoc[f.key], () => { setFilters((prev) => ({ ...prev, [f.key]: !prev[f.key] })); setPreviewPage(0); }))}
                  </div>
                )}
              </div>
              <div style={{ position: "relative", minWidth: 0 }}>
                {nut("lop", tenLop, rowsToPrint.length)}
                {moMenu === "lop" && (
                  <div style={{ ...khung(true), maxHeight: 320, overflowY: "auto" }}>
                    {[{ id: "all", ten: "Tất cả lớp", n: locRows(filters, "all").length }, ...meta.classes.map((c) => ({ id: c.id, ten: c.ten, n: demLop[c.id] ?? 0 }))].map((l) => dong(l.id, selectedLop === l.id,
                      <><span style={{ width: 16, height: 16, borderRadius: 99, border: `2px solid ${selectedLop === l.id ? C.pine : C.line}`, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{selectedLop === l.id && <span style={{ width: 7, height: 7, borderRadius: 99, background: C.pine }} />}</span><span style={{ flex: 1, minWidth: 0 }}>{l.ten}</span></>,
                      l.n, () => { setSelectedLop(l.id); setPreviewPage(0); setMoMenu(null); }))}
                  </div>
                )}
              </div>
            </div>
          );
        })()
      ) : (
        /* Điện thoại - chip mở BottomSheet (đồng bộ UX với tab Thu phí) */
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setFilterSheetOpen(true)} style={chipBtn}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <Ii name="settings" size={14} /> {FILTER_DEFS.filter((f) => filters[f.key]).map((f) => LOC_NGAN[f.key]).join(" + ") || "Không lọc"}
            </span>
            <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
          </button>
          <button onClick={() => setLopSheetOpen(true)} style={chipBtn}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedLop === "all" ? "Tất cả lớp" : (meta.classes.find((c) => c.id === selectedLop)?.ten || "Chọn lớp")}
            </span>
            <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
          </button>
        </div>
      )}

      
      {/* Danh sách lớp */}
      <ClassList meta={meta} rows={rowsToPrint} selectedLop={selectedLop} onSelectLop={setSelectedLop} />

      {/* Toggle phiếu tổng hợp */}
      <label style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        padding: "10px 14px", 
        cursor: "pointer", 
        fontSize: 13, 
        color: C.ink,
        background: C.card,
        borderRadius: 10,
        border: `1.5px solid ${C.line}`
      }}>
        <input
          type="checkbox"
          checked={includeTongHop}
          onChange={(e) => setIncludeTongHop(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: C.pine, cursor: "pointer" }}
        />
        <span>Có phiếu tổng hợp</span>
      </label>

      {/* Kiểm tra */}
      <PreflightCheck rows={rowsToPrint} meta={meta} onViewIssues={() => setShowIssues(true)} />

      {/* Nút IN + chia sẻ (gộp) */}
      <NutInChiaSe onIn={handlePrintBatch} disabled={rowsToPrint.length === 0}
        items={[
          { nhan: "Tải tất cả ảnh (.zip)", phu: `${rowsToPrint.length} ảnh PNG, mỗi em một ảnh`, icon: "download", chay: taiZip, tat: !!zipTD || rowsToPrint.length === 0 },
          { nhan: coChiaSeTrucTiep() ? `Chia sẻ ảnh phiếu đang xem (trang ${Math.min(previewPage + 1, Math.max(totalPages, 1))})` : `Tải ảnh phiếu đang xem (trang ${Math.min(previewPage + 1, Math.max(totalPages, 1))})`, phu: coChiaSeTrucTiep() ? "Mở bản phóng to để gửi qua Zalo, tin nhắn…" : "Mở bản phóng to, rồi tải ảnh về máy", icon: coChiaSeTrucTiep() ? "share" : "download", chay: () => setShareSignal((n) => n + 1), tat: totalPages === 0 },
        ]}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Ii name="printer" size={20} /> IN {rowsToPrint.length} PHIẾU</span>
        <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>{fmt(tongNo)} đ · ({totalPages} trang)</span>
      </NutInChiaSe>
    </div>
  );

  const sidebarSingle = (
    <div className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {tabs}
      <div style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13, color: C.pine, marginBottom: 10 }}>CHỌN HỌC SINH</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select value={lopHS} onChange={(e) => setLopHS(e.target.value)} style={{ flex: "0 0 38%", minWidth: 0, padding: "10px 8px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 14, color: C.ink, background: C.card, fontFamily: font.body }}>
            <option value="all">Tất cả lớp</option>
            {meta.classes.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}
          </select>
          <input value={tkHS} onChange={(e) => setTkHS(e.target.value)} placeholder="Tìm tên học sinh…" style={{ flex: 1, minWidth: 0, boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: font.body, background: C.card, color: C.ink }} />
        </div>
        <div style={{ maxHeight: isWide ? "calc(100vh - 430px)" : "none", minHeight: 160, overflowY: isWide ? "auto" : "visible", border: `1px solid ${C.line}`, borderRadius: 10 }}>
          {dsChon.length === 0 && <div style={{ padding: 16, textAlign: "center", color: C.sub, fontSize: 13 }}>Không có học sinh phù hợp.</div>}
          {dsChon.map((r) => {
            const on = isWide && singleRow && singleRow.hs.id === r.hs.id;
            return (
              <button key={r.hs.id} onClick={() => { setSingleId(r.hs.id); setMoPhieu(true); }} aria-current={on ? "true" : undefined}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${on ? C.pine : "transparent"}`, background: on ? C.pineSoft : "transparent", cursor: "pointer", fontFamily: font.body }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, overflowWrap: "anywhere", lineHeight: 1.25 }}>{r.hs.ten}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{r.lop?.ten || "—"}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: r.conNo > 0 ? C.coralText : C.greenText }}>{r.conNo > 0 ? `Nợ ${fmt(r.conNo)}` : "Đã đủ"}</span>
              </button>
            );
          })}
        </div>
      </div>
      {isWide && <div style={{ fontSize: 12.5, color: C.sub }}>Mã phiếu: <b style={{ color: C.ink }}>{singleRow?.rec?.bienLai || "(cấp khi in)"}</b></div>}
      {isWide && nutChiaSe}
    </div>
  );

  const kpiRow = (
        <div className="kpi-row" style={{ flex: "1 1 460px" }}>
          <Kpi icon="receipt" tint={C.blueASoft} mau={C.blueAText} nhan="Số phiếu" giaTri={`${rowsToPrint.length}`} phu="phiếu" />
          <Kpi icon="coins" tint={C.pineSoft} mau={C.pine} nhan="Phải thu" giaTri={`${fmt(tongPhaiThu)}đ`} />
          <Kpi icon="check" tint={C.greenSoft} mau={C.greenText} nhan="Đã thu" giaTri={`${fmt(tongDaThu)}đ`} />
          <Kpi icon="alertTriangle" tint={C.coralSoft} mau={C.coralText} nhan="Còn nợ" giaTri={`${fmt(tongNo)}đ`} />
        </div>
  );

  // Điện thoại / máy tính bảng: "In từng phiếu" = danh sách học sinh; bấm một em -> mở phiếu kèm nút In, Chia sẻ.
  if (mode === "single" && !isWide) {
    if (!moPhieu || !singleRow) return <div><div className="no-print" style={{ marginBottom: 10 }}>{kpiRow}</div>{sidebarSingle}</div>;
    return (
      <div>
        <div className="no-print" style={{ marginBottom: 10 }}>
          <button onClick={() => setMoPhieu(false)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 13.5, fontFamily: font.body, cursor: "pointer" }}>
            <Ii name="chevronLeft" size={16} /> Danh sách học sinh
          </button>
        </div>
        <PhieuThu hideNutIn phieuRow={singleRow} allRows={allRows} setPhieuId={(id) => { setSingleId(id); }} meta={meta} month={month} year={year} upMeta={upMeta} mData={mData} upMData={upMData} />
        <div style={{ position: "sticky", bottom: 8, marginTop: 14, zIndex: 5 }}>{nutInMot}</div>
        {shareModalEl}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          /* Ẩn hẳn giao diện quản lý + preview để không chiếm trang */
          .phieu-manager:not(.phieu-single) { display: none !important; }
          /* Hiện khối in */
          * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { 
            display: block !important;
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
          }
          @page { size: A5 portrait; margin: 0; }
          @page tonghop { size: A4 portrait; margin: 10mm; }
          .phieu-page { 
            page-break-after: always; 
            break-after: page;
            width: 148mm;
            height: 210mm;
            overflow: hidden;
            box-sizing: border-box;
          }
          .phieu-page:last-child { 
            page-break-after: auto; 
            break-after: auto;
          }
          /* mỗi phiếu lấp đầy đúng 1 trang A5 (cùng kích thước/lề/độ thu như in từng phiếu) */
          .print-only .phieu-page #phieu-in {
            max-width: none !important; width: 100% !important; aspect-ratio: auto !important;
            height: calc(210mm / .9) !important; min-height: 0 !important; margin: 0 !important;
            padding: 5mm 6mm !important; box-sizing: border-box !important; box-shadow: none !important;
            background: #fff !important; zoom: .9; break-inside: avoid !important; page-break-inside: avoid !important;
          }
          .print-only .phieu-page.phieu-page-th { page: tonghop; width: auto; height: auto; overflow: visible; }
        }
        @media (min-width: 1000px) {
          .phieu-manager { 
            display: grid; 
            grid-template-columns: minmax(300px, 380px) minmax(0, 1fr); 
            gap: 24px;
            align-items: start;
          }
          .sidebar { 
            position: sticky; 
            top: 14px; 
            max-height: calc(100vh - 28px); 
            overflow-y: auto;
            padding-right: 4px;
          }
          .preview-area { 
            overflow-y: visible;
            min-width: 0;
          }
        }
        @media (max-width: 999px) {
          .phieu-manager { 
            display: flex; 
            flex-direction: column; 
          }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "8px 16px", marginBottom: 10 }}>
        {isWide && <TieuDeTrang style={{ flexShrink: 0 }} tieuDe="Phiếu thu - In" phu="In và chia sẻ phiếu thu" />}
        {kpiRow}
      </div>

      <div className={mode === "single" && isWide ? "phieu-manager phieu-single" : "phieu-manager"}>
        <div className={mode === "single" && isWide ? "sidebar no-print" : "sidebar"}>{mode === "single" && isWide ? sidebarSingle : sidebar}</div>
        <div className="preview-area">
          {mode === "single" && isWide && singleRow ? (
            <PhieuThu hideNutIn phieuRow={singleRow} allRows={allRows} setPhieuId={null} meta={meta} month={month} year={year} upMeta={upMeta} mData={mData} upMData={upMData} />
          ) : (
          <PrintPreview
            rows={rowsToPrint}
            meta={meta}
            month={month}
            year={year}
            mData={mData}
            upMData={upMData}
            upMeta={upMeta}
            includeTongHop={includeTongHop}
            page={previewPage}
            onPageChange={setPreviewPage}
            openSignal={shareSignal}
          />
          )}
          {mode === "single" && isWide && shareModalEl}
        </div>
      </div>

      {/* Print area - hidden, chỉ hiện khi print */}
      {zipRow && (
        <div className="no-print" aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, width: 420, pointerEvents: "none" }}>
          <div ref={zipRef} style={{ background: C.card }}>
            <PhieuThu phieuRow={zipRow} meta={meta} month={month} year={year} mData={mData} upMData={upMData} upMeta={upMeta} isBatch={true} />
          </div>
        </div>
      )}
      {zipTD && (
        <div className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(20,40,58,.45)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div role="dialog" aria-modal="true" style={{ background: C.card, borderRadius: 16, padding: 20, width: "100%", maxWidth: 360, boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink, marginBottom: 4 }}>Đang tạo ảnh phiếu…</div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 12 }}>{zipTD.i} / {zipTD.n} phiếu · xong sẽ tự tải tệp .zip</div>
            <Bar pct={Math.round(zipTD.i / zipTD.n * 100)} color={C.pine} h={10} style={{ marginBottom: 14 }} />
            <button onClick={() => { huyZip.current = true; }} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>Dừng</button>
          </div>
        </div>
      )}
      {mode === "batch" && typeof document !== "undefined" && createPortal(
      <div className="print-only" style={{ display: "none" }}>
        {rowsToPrint.map((r) => (
          <div key={r.hs.id} className="phieu-page">
            <PhieuThu
              phieuRow={r}
              meta={meta}
              month={month}
              year={year}
              mData={mData}
              upMData={upMData}
              upMeta={upMeta}
              isBatch={true}
            />
          </div>
        ))}
        {includeTongHop && rowsToPrint.length > 0 && (
          <div className="phieu-page phieu-page-th">
            <PhieuTongHop
              rows={rowsToPrint}
              lopTen={selectedLop === "all" ? "Tất cả các lớp" : meta.classes.find((c) => c.id === selectedLop)?.ten || "Không xác định"}
              month={month}
              year={year}
            />
          </div>
        )}
      </div>,
        document.body
      )}

      {/* BottomSheet: Bộ lọc tiết kiệm giấy (điện thoại) */}
      <BottomSheet open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} title="Bộ lọc tiết kiệm giấy">
        <div>
          {FILTER_DEFS.map((f) => {
            const active = filters[f.key];
            return (
              <div
                key={f.key}
                onClick={() => setFilters((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${active ? C.pine : C.line}`, background: active ? C.pine : C.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s" }}>
                  {active && <span style={{ color: C.onFill, fontSize: 14, fontWeight: 800, lineHeight: 1 }}><Ii name="check" size={14} /></span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink, transition: "color .2s", flex: 1 }}>{f.label}</div>
                <span style={{ background: active ? C.pine : C.graySoft, color: active ? C.onFill : C.sub, borderRadius: 99, padding: "1px 10px", fontSize: 13, fontWeight: 800 }}>{demLoc[f.key]}</span>
              </div>
            );
          })}
          <button
            onClick={() => setFilterSheetOpen(false)}
            style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 12, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Xong ({rowsToPrint.length} phiếu)
          </button>
        </div>
      </BottomSheet>

      {/* BottomSheet: Chọn lớp (điện thoại) */}
      <BottomSheet open={lopSheetOpen} onClose={() => setLopSheetOpen(false)} title="Chọn lớp">
        <div>
          {[{ id: "all", ten: `Tất cả lớp (${meta.classes.length} lớp)` }, ...meta.classes].map((l) => {
            const active = selectedLop === l.id;
            return (
              <div
                key={l.id}
                onClick={() => { setSelectedLop(l.id); setPreviewPage(0); setLopSheetOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${active ? C.pine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color .2s" }}>
                  {active && <div style={{ width: 12, height: 12, borderRadius: 99, background: C.pine }} />}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink, transition: "color .2s" }}>{l.ten}</div>
              </div>
            );
          })}
        </div>
      </BottomSheet>

      {/* Issues modal */}
      {showIssues && (
        <div 
          onClick={() => setShowIssues(false)} 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,.5)", 
            zIndex: 150, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: 20 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: 420, 
              width: "100%", 
              background: C.card, 
              borderRadius: 16, 
              padding: 20, 
              maxHeight: "80vh", 
              overflow: "auto" 
            }}
          >
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>
              <Ii name="alertTriangle" size={14} /> Chi tiết lỗi cần sửa
            </div>
            <PreflightCheck rows={rowsToPrint} meta={meta} />
            <button 
              onClick={() => setShowIssues(false)} 
              style={{ 
                width: "100%", 
                marginTop: 14, 
                padding: "12px 0", 
                borderRadius: 11, 
                border: "none", 
                background: C.pine, 
                color: C.onFill, 
                fontFamily: font.display, 
                fontWeight: 700, 
                fontSize: 15, 
                cursor: "pointer" 
              }}
            >
              <Ii name="check" size={14} /> Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
