import { useState, useMemo } from "react";
import { C, font, noDau, logAction, toast, uid, PHAN_LOAI, PL_LABEL, TRANG_THAI, TT_COLOR, lopHienTai } from "./lib.js";
import { Card, ABBtn, SearchBar, BottomSheet, PLBadge } from "./ui.jsx";
import { ImportHSExcel } from "./CaiDat.jsx";

export function HocSinhTab({ meta, students, upStudents, ym, openStudentProfile }) {
  const [hsSearch, setHsSearch] = useState("");
  const [hsFilter, setHsFilter] = useState("all");
  const [showAddHS, setShowAddHS] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  // State cho tính năng Chọn nhiều
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedHS, setSelectedHS] = useState([]);
  const [thaoTacOpen, setThaoTacOpen] = useState(false);
  const [ttView, setTtView] = useState("menu");
  const [bulkThu, setBulkThu] = useState("A");
  const [bulkPl, setBulkPl] = useState("Bthg");
  const [bulkTargetLop, setBulkTargetLop] = useState(meta.classes[0]?.id || "");
  const [bulkTargetTT, setBulkTargetTT] = useState("Đang học");
  const [bulkNgayNhap, setBulkNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [bulkRaNgay, setBulkRaNgay] = useState(new Date().toISOString().slice(0, 10));
  const [xoaText, setXoaText] = useState("");

  // State thêm HS nhanh
  const [ten, setTen] = useState("");
  const [lop, setLop] = useState(meta.classes[0]?.id || "");
  const [pl, setPl] = useState("Bthg");
  const [nguoiThu, setNguoiThu] = useState("A");
  const [ngaySinh, setNgaySinh] = useState("");
  const [phSdt, setPhSdt] = useState("");
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));

  const addHS = async () => {
    const t = ten.trim(); if (!t || !lop) return;
    upStudents([...students, { id: "hs" + uid(), ten: t, ngaySinh, lopHistory: [{ tuThang: ym, lop }], pl, nguoiThu, trangThai: "Đang học", ngayNhapHoc: ngayNhap || new Date().toISOString().slice(0, 10), ngayNghiHoc: "", noDauKy: 0, phuHuynh: { ten: "", sdt: phSdt.trim() } }]);
    setTen(""); setNgaySinh(""); setPhSdt(""); logAction(`Thêm HS "${t}"`); toast("Đã thêm học sinh.");
  };

  const setHS = (id, p) => upStudents(students.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const filteredHS = useMemo(() => students.filter((s) => 
    (hsFilter === "all" || lopHienTai(s) === hsFilter) && 
    (!hsSearch || noDau(s.ten).includes(noDau(hsSearch))) && 
    (s.trangThai !== "Nghỉ học" && s.trangThai !== "Ra trường")
  ), [students, hsFilter, hsSearch]);

  const allFilteredSelected = filteredHS.length > 0 && filteredHS.every((s) => selectedHS.includes(s.id));
  const toggleSelectAll = () => setSelectedHS(allFilteredSelected ? [] : filteredHS.map((s) => s.id));
  
  const closeThaoTac = () => { setThaoTacOpen(false); setTtView("menu"); setXoaText(""); };
  const doneBulk = (logMsg, toastMsg) => { logAction(logMsg); toast(toastMsg); setSelectedHS([]); closeThaoTac(); setBulkMode(false); };
  const bulkPatch = (patch, logMsg, toastMsg) => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ...patch } : s), true); doneBulk(logMsg, toastMsg); };
  const bulkChuyenLop = () => { const tenLop = meta.classes.find((c) => c.id === bulkTargetLop)?.ten; upStudents(students.map((s) => { if (!selectedHS.includes(s.id)) return s; const hist = (s.lopHistory || []).filter((h) => h.tuThang !== ym); hist.push({ tuThang: ym, lop: bulkTargetLop }); hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang)); return { ...s, lopHistory: hist }; }), true); doneBulk(`Chuyển lớp hàng loạt ${selectedHS.length} HS → ${tenLop}`, `Đã chuyển ${selectedHS.length} HS sang lớp ${tenLop}`); };
  const bulkRaTruong = () => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ngayNghiHoc: bulkRaNgay, trangThai: "Ra trường" } : s), true); doneBulk(`Cho ra trường hàng loạt ${selectedHS.length} HS`, `Đã cho ${selectedHS.length} HS ra trường`); };
  const bulkDelete = () => { const n = selectedHS.length; upStudents(students.filter((s) => !selectedHS.includes(s.id)), true); doneBulk(`XÓA VĨNH VIỄN ${n} HS`, `Đã xóa vĩnh viễn ${n} HS`); };

  const inp = { padding: "9px 10px", borderRadius: 9, border: "1.5px solid " + C.line, fontSize: 13, fontFamily: font.body, color: C.ink, background: "#FAFCFA", outline: "none", width: "100%" };

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={() => setShowAddHS(!showAddHS)} style={{ flex: 1, padding: "11px 8px", borderRadius: 12, border: `1.5px solid ${showAddHS ? C.pine : C.line}`, background: showAddHS ? C.pine : C.card, color: showAddHS ? "#fff" : C.pine, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>＋ Thêm HS</button>
        <button onClick={() => setShowImport(!showImport)} style={{ flex: 1, padding: "11px 8px", borderRadius: 12, border: `1.5px solid ${showImport ? C.blueA : C.line}`, background: showImport ? C.blueA : C.card, color: showImport ? "#fff" : C.blueA, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>📥 Nhập CSV</button>
        <button onClick={() => { setBulkMode(!bulkMode); setSelectedHS([]); }} style={{ flex: "0 0 auto", padding: "11px 12px", borderRadius: 12, border: `1.5px solid ${bulkMode ? C.pine : C.line}`, background: bulkMode ? C.pine : C.card, color: bulkMode ? "#fff" : C.sub, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>{bulkMode ? "⛔ Xong" : "☑ Chọn nhiều"}</button>
      </div>

      {showImport && <ImportHSExcel meta={meta} students={students} upStudents={upStudents} ym={ym} />}

      {showAddHS && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 8 }}>+ Thêm học sinh</div>
          <input value={ten} onChange={(e) => setTen(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHS()} placeholder="Họ tên học sinh…" style={{ ...inp, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <select value={lop} onChange={(e) => setLop(e.target.value)} style={{ ...inp, flex: "1 1 110px", minWidth: 0 }}>{meta.classes.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select>
            <select value={pl} onChange={(e) => setPl(e.target.value)} style={{ ...inp, width: 96 }}>{PHAN_LOAI.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            <ABBtn val={nguoiThu} set={setNguoiThu} small />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <input type="date" value={ngaySinh} onChange={(e) => setNgaySinh(e.target.value)} placeholder="Ngày sinh" style={{ ...inp, flex: "1 1 130px" }} />
            <input type="date" value={ngayNhap} onChange={(e) => setNgayNhap(e.target.value)} placeholder="Ngày nhập học" style={{ ...inp, flex: "1 1 130px" }} />
          </div>
          <button onClick={addHS} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer" }}>+ Thêm ngay</button>
        </Card>
      )}

      <SearchBar value={hsSearch} onChange={setHsSearch} />
      
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
        {[["all", "Tất cả"], ...meta.classes.map((c) => [c.id, c.ten])].map(([id, lb]) => (
          <button key={id} onClick={() => setHsFilter(id)} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 99, border: `1.5px solid ${hsFilter === id ? C.pine : C.line}`, cursor: "pointer", background: hsFilter === id ? C.pine : C.card, color: hsFilter === id ? "#fff" : C.sub, fontFamily: font.body, fontSize: 12.5, fontWeight: 600 }}>{lb}</button>
        ))}
      </div>

      {/* THANH CÔNG CỤ CHỌN NHIỀU */}
      {bulkMode && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, padding: "8px 12px", background: C.pineSoft, borderRadius: 10, border: `1.5px solid #BFE0D4` }}>
          <button onClick={toggleSelectAll} style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${allFilteredSelected ? C.pine : C.line}`, background: allFilteredSelected ? C.pine : C.card, color: C.pine, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{allFilteredSelected ? "✕ Bỏ chọn" : "✓ Chọn tất cả"}</button>
          {selectedHS.length > 0 && <span style={{ fontSize: 12, color: C.sub, flex: 1 }}><b>{selectedHS.length}</b> đã chọn</span>}
          {selectedHS.length > 0 && <button onClick={() => setThaoTacOpen(true)} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>⚙️ Thao tác</button>}
        </div>
      )}

      {/* DANH SÁCH HỌC SINH */}
      {filteredHS.map((s) => {
        const lh = lopHienTai(s);
        const isSel = selectedHS.includes(s.id);
        return (
          <div
            key={s.id}
            onClick={() => bulkMode ? setSelectedHS(prev => isSel ? prev.filter(id => id !== s.id) : [...prev, s.id]) : openStudentProfile(s.id, "info")}
            style={{ background: C.card, borderRadius: 14, border: `1px solid ${bulkMode && isSel ? C.pine : C.line}`, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
          >
            {bulkMode && (
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSel ? C.pine : C.line}`, background: isSel ? C.pine : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{isSel ? "✓" : ""}</div>
            )}
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: s.nguoiThu === "B" ? C.violetBSoft : C.blueASoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 700, fontSize: 15, color: s.nguoiThu === "B" ? C.violetB : C.blueA, flexShrink: 0 }}>
              {s.ten.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{s.ten}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 11.5, color: C.sub }}>{meta.classes.find((c) => c.id === lh)?.ten}</span>
                <PLBadge pl={s.pl} />
                <span style={{ fontSize: 11, fontWeight: 600, color: TT_COLOR[s.trangThai], background: TT_COLOR[s.trangThai] + "18", padding: "2px 8px", borderRadius: 99 }}>{s.trangThai}</span>
              </div>
            </div>
            {!bulkMode && (
              <div onClick={(e) => e.stopPropagation()}>
                <ABBtn val={s.nguoiThu} set={(p) => setHS(s.id, { nguoiThu: p })} small />
              </div>
            )}
          </div>
        );
      })}
      {filteredHS.length === 0 && <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 20 }}>Không có học sinh phù hợp.</div>}

      {/* BOTTOM SHEET THAO TÁC HÀNG LOẠT */}
      <BottomSheet open={thaoTacOpen} onClose={closeThaoTac} title={ttView === "menu" ? `Thao tác cho ${selectedHS.length} HS` : ttView === "khac" ? `Khác — ${selectedHS.length} HS` : ttView === "lop" ? `Chuyển ${selectedHS.length} HS sang lớp` : ttView === "tt" ? `Đổi trạng thái ${selectedHS.length} HS` : ttView === "thu" ? `Đổi người thu ${selectedHS.length} HS` : ttView === "pl" ? `Đổi phân loại ${selectedHS.length} HS` : ttView === "ngay" ? `Đặt ngày nhập học ${selectedHS.length} HS` : ttView === "ratruong" ? `Cho ${selectedHS.length} HS ra trường` : `Xóa vĩnh viễn ${selectedHS.length} HS`}>
        {ttView === "menu" && (<div>
          {[["🏫", "Chuyển lớp", "lop"], ["🔖", "Đổi trạng thái", "tt"], ["💰", "Đổi người thu A/B", "thu"], ["🏷️", "Đổi phân loại", "pl"], ["⚙️", "Khác (ngày nhập học, ra trường, xóa)", "khac"]].map(([ic, lb, v]) => (
            <button key={v} onClick={() => setTtView(v)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}><span style={{ fontSize: 18 }}>{ic}</span><span style={{ flex: 1 }}>{lb}</span><span style={{ color: C.gray }}>›</span></button>
          ))}
        </div>)}
        {ttView === "khac" && (<div>
          <button onClick={() => setTtView("menu")} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 8, padding: 0 }}>‹ Quay lại</button>
          {[["📅", "Đặt ngày nhập học", "ngay", false], ["🎓", "Cho ra trường", "ratruong", false], ["🗑", "Xóa vĩnh viễn", "xoa", true]].map(([ic, lb, v, dg]) => (
            <button key={v} onClick={() => setTtView(v)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${dg ? C.coral : C.line}`, background: C.card, color: dg ? C.coral : C.ink, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}><span style={{ fontSize: 18 }}>{ic}</span><span style={{ flex: 1 }}>{lb}</span><span style={{ color: C.gray }}>›</span></button>
          ))}
        </div>)}
        {ttView === "lop" && (<div>
          {meta.classes.map((c) => (<button key={c.id} onClick={() => setBulkTargetLop(c.id)} style={{ display: "block", width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${bulkTargetLop === c.id ? C.pine : C.line}`, background: bulkTargetLop === c.id ? C.pineSoft : C.card, color: C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}>{bulkTargetLop === c.id ? "● " : "○ "}{c.ten}</button>))}
          <button onClick={bulkChuyenLop} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginTop: 4 }}>Áp dụng cho {selectedHS.length} HS</button>
        </div>)}
        {ttView === "tt" && (<div>
          {TRANG_THAI.map((t) => (<button key={t} onClick={() => setBulkTargetTT(t)} style={{ display: "block", width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${bulkTargetTT === t ? C.pine : C.line}`, background: bulkTargetTT === t ? C.pineSoft : C.card, color: C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}>{bulkTargetTT === t ? "● " : "○ "}{t}</button>))}
          <button onClick={() => bulkPatch({ trangThai: bulkTargetTT }, `Đổi trạng thái hàng loạt ${selectedHS.length} HS → ${bulkTargetTT}`, `Đã đổi ${selectedHS.length} HS sang "${bulkTargetTT}"`)} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginTop: 4 }}>Áp dụng cho {selectedHS.length} HS</button>
        </div>)}
        {ttView === "thu" && (<div>
          {[["A", "A — Lê Thị Phương"], ["B", "B — Lê Thị Hậu"]].map(([k, lb]) => (<button key={k} onClick={() => setBulkThu(k)} style={{ display: "block", width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${bulkThu === k ? C.pine : C.line}`, background: bulkThu === k ? C.pineSoft : C.card, color: C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}>{bulkThu === k ? "● " : "○ "}{lb}</button>))}
          <button onClick={() => bulkPatch({ nguoiThu: bulkThu }, `Đổi người thu hàng loạt ${selectedHS.length} HS → ${bulkThu}`, `Đã đổi người thu ${selectedHS.length} HS sang ${bulkThu}`)} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginTop: 4 }}>Áp dụng cho {selectedHS.length} HS</button>
        </div>)}
        {ttView === "pl" && (<div>
          {PHAN_LOAI.map((p) => (<button key={p} onClick={() => setBulkPl(p)} style={{ display: "block", width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${bulkPl === p ? C.pine : C.line}`, background: bulkPl === p ? C.pineSoft : C.card, color: C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}>{bulkPl === p ? "● " : "○ "}{PL_LABEL[p] || p}</button>))}
          <button onClick={() => bulkPatch({ pl: bulkPl }, `Đổi phân loại hàng loạt ${selectedHS.length} HS → ${bulkPl}`, `Đã đổi phân loại ${selectedHS.length} HS sang ${bulkPl}`)} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginTop: 4 }}>Áp dụng cho {selectedHS.length} HS</button>
        </div>)}
        {ttView === "ngay" && (<div>
          <button onClick={() => setTtView("khac")} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 10, padding: 0 }}>‹ Quay lại</button>
          <label style={{ fontSize: 12.5, color: C.sub, display: "block", marginBottom: 6 }}>Ngày nhập học áp cho {selectedHS.length} HS đang chọn:</label>
          <input type="date" value={bulkNgayNhap} onChange={(e) => setBulkNgayNhap(e.target.value)} style={{ ...inp, width: "100%", marginBottom: 12 }} />
          <button onClick={() => bulkPatch({ ngayNhapHoc: bulkNgayNhap }, `Đặt ngày nhập học hàng loạt ${selectedHS.length} HS`, `Đã đặt ngày nhập học cho ${selectedHS.length} HS`)} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body }}>Áp dụng</button>
        </div>)}
        {ttView === "ratruong" && (<div>
          <button onClick={() => setTtView("khac")} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 10, padding: 0 }}>‹ Quay lại</button>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 8, lineHeight: 1.5 }}>Sẽ đặt ngày nghỉ + chuyển trạng thái sang <b>Ra trường</b> cho {selectedHS.length} HS.</div>
          <label style={{ fontSize: 12.5, color: C.sub, display: "block", marginBottom: 6 }}>Ngày ra trường:</label>
          <input type="date" value={bulkRaNgay} onChange={(e) => setBulkRaNgay(e.target.value)} style={{ ...inp, width: "100%", marginBottom: 12 }} />
          <button onClick={bulkRaTruong} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.amber, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body }}>🎓 Cho {selectedHS.length} HS ra trường</button>
        </div>)}
        {ttView === "xoa" && (<div>
          <button onClick={() => setTtView("khac")} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 10, padding: 0 }}>‹ Quay lại</button>
          <div style={{ fontSize: 13, color: C.coral, fontWeight: 700, marginBottom: 6 }}>⚠️ Xóa vĩnh viễn {selectedHS.length} học sinh</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>Mất hẳn dữ liệu, không xem lại được. Gõ <b>XOA</b> để xác nhận.</div>
          <input value={xoaText} onChange={(e) => setXoaText(e.target.value)} placeholder="Gõ XOA" style={{ ...inp, width: "100%", marginBottom: 12, textAlign: "center", fontWeight: 700, letterSpacing: 2 }} />
          <button onClick={bulkDelete} disabled={xoaText.trim().toUpperCase() !== "XOA"} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: xoaText.trim().toUpperCase() === "XOA" ? C.coral : C.graySoft, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: xoaText.trim().toUpperCase() === "XOA" ? "pointer" : "default", fontFamily: font.body }}>🗑 Xóa vĩnh viễn {selectedHS.length} HS</button>
        </div>)}
      </BottomSheet>
    </>
  );
}
