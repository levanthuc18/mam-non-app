import { useState, useMemo, useRef } from "react";
import { C, font, noDau, logAction, toast, uid, PHAN_LOAI, PL_LABEL, TRANG_THAI, TT_COLOR, GIOI_TINH, lopHienTai } from "./lib.js";
import { Card, ABBtn, SearchBar, BottomSheet, PLBadge, useStickyShrink, StickyBar } from "./ui.jsx";
import { Icon } from "./Icon.jsx";
import { Avatar } from "./Avatar.jsx";
import { ImportHSExcel } from "./CaiDat.jsx";
import { StudentProfile } from "./StudentProfile.jsx";

export function HocSinhTab({ meta, students, upStudents, ym, store, isWide, openStudentProfile }) {
  const [hsSearch, setHsSearch] = useState("");
  const [hsFilter, setHsFilter] = useState("all");
  const [hsStatusFilter, setHsStatusFilter] = useState("all");
  const [lopSheetOpen, setLopSheetOpen] = useState(false);
  const [ttSheetOpen, setTtSheetOpen] = useState(false);
  const [expandId, setExpandId] = useState(null);
  const [showAddHS, setShowAddHS] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { sentinelRef, shrunk } = useStickyShrink();

  // State sắp xếp thứ tự
  const [reorderMode, setReorderMode] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPos, setDragOverPos] = useState(null);
  const longPressRef = useRef(null);
  
  // State cho tính năng Chọn nhiều
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedHS, setSelectedHS] = useState([]);
  const [thaoTacOpen, setThaoTacOpen] = useState(false);
  const [ttView, setTtView] = useState("menu");
  const [bulkThu, setBulkThu] = useState("A");
  const [bulkPl, setBulkPl] = useState("Bthg");
  const [bulkGt, setBulkGt] = useState("nam");
  const [bulkTargetLop, setBulkTargetLop] = useState(meta.classes[0]?.id || "");
  const [bulkTargetTT, setBulkTargetTT] = useState("Đang học");
  const [bulkNgayNhap, setBulkNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [bulkRaNgay, setBulkRaNgay] = useState(new Date().toISOString().slice(0, 10));
  const [xoaText, setXoaText] = useState("");

  // State thêm HS nhanh
  const [ten, setTen] = useState("");
  const [lop, setLop] = useState(meta.classes[0]?.id || "");
  const [pl, setPl] = useState("Bthg");
  const [gt, setGt] = useState("");
  const [nguoiThu, setNguoiThu] = useState("A");
  const [ngaySinh, setNgaySinh] = useState("");
  const [phSdt, setPhSdt] = useState("");
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));

  const addHS = async () => {
    const t = ten.trim(); if (!t || !lop) return;
    upStudents([...students, { id: "hs" + uid(), ten: t, gt, ngaySinh, lopHistory: [{ tuThang: ym, lop }], pl, nguoiThu, trangThai: "Đang học", ngayNhapHoc: ngayNhap || new Date().toISOString().slice(0, 10), ngayNghiHoc: "", noDauKy: 0, phuHuynh: { ten: "", sdt: phSdt.trim() } }], true);
    setTen(""); setGt(""); setNgaySinh(""); setPhSdt(""); logAction(`Thêm HS "${t}"`); toast("Đã thêm học sinh.");
  };

  const setHS = (id, p) => upStudents(students.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const filteredHS = useMemo(() => students.filter((s) => 
    (hsFilter === "all" || lopHienTai(s) === hsFilter) && 
    (!hsSearch || noDau(s.ten).includes(noDau(hsSearch))) && 
    (hsStatusFilter === "all" || s.trangThai === hsStatusFilter)
  ), [students, hsFilter, hsSearch, hsStatusFilter]);

  const allFilteredSelected = filteredHS.length > 0 && filteredHS.every((s) => selectedHS.includes(s.id));
  const toggleSelectAll = () => setSelectedHS(allFilteredSelected ? [] : filteredHS.map((s) => s.id));
  
  const closeThaoTac = () => { setThaoTacOpen(false); setTtView("menu"); setXoaText(""); };
  const doneBulk = (logMsg, toastMsg) => { logAction(logMsg); toast(toastMsg); setSelectedHS([]); closeThaoTac(); setBulkMode(false); };
  const bulkPatch = (patch, logMsg, toastMsg) => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ...patch } : s), true); doneBulk(logMsg, toastMsg); };
  const bulkChuyenLop = () => { const tenLop = meta.classes.find((c) => c.id === bulkTargetLop)?.ten; upStudents(students.map((s) => { if (!selectedHS.includes(s.id)) return s; const hist = (s.lopHistory || []).filter((h) => h.tuThang !== ym); hist.push({ tuThang: ym, lop: bulkTargetLop }); hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang)); return { ...s, lopHistory: hist }; }), true); doneBulk(`Chuyển lớp hàng loạt ${selectedHS.length} HS → ${tenLop}`, `Đã chuyển ${selectedHS.length} HS sang lớp ${tenLop}`); };
  const bulkRaTruong = () => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ngayNghiHoc: bulkRaNgay, trangThai: "Ra trường" } : s), true); doneBulk(`Cho ra trường hàng loạt ${selectedHS.length} HS`, `Đã cho ${selectedHS.length} HS ra trường`); };
  const bulkDelete = () => { const n = selectedHS.length; upStudents(students.filter((s) => !selectedHS.includes(s.id)), true); doneBulk(`XÓA VĨNH VIỄN ${n} HS`, `Đã xóa vĩnh viễn ${n} HS`); };

  const inp = { padding: "9px 10px", borderRadius: 9, border: "1.5px solid " + C.line, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.graySoft, outline: "none", width: "100%" };

  return (
    <>
      <div ref={sentinelRef} style={{ height: 1 }} />
      <StickyBar shrunk={shrunk}>
        <div style={{ display: "flex", gap: 8, marginBottom: shrunk ? 0 : 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowAddHS(!showAddHS)} style={{ flex: 1, padding: shrunk ? "9px 6px" : "11px 8px", borderRadius: 12, border: `1.5px solid ${showAddHS ? C.pine : C.line}`, background: showAddHS ? C.pine : C.card, color: showAddHS ? "#fff" : C.pine, fontFamily: font.display, fontWeight: 700, fontSize: shrunk ? 12 : 13.5, cursor: "pointer" }}>{shrunk ? <Icon name="plus" size={15} color={showAddHS ? "#fff" : C.pine} /> : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="plus" size={15} color={showAddHS ? "#fff" : C.pine} /> Thêm HS</span>}</button>
          <button onClick={() => setShowImport(!showImport)} style={{ flex: 1, padding: shrunk ? "9px 6px" : "11px 8px", borderRadius: 12, border: `1.5px solid ${showImport ? C.blueA : C.line}`, background: showImport ? C.blueA : C.card, color: showImport ? "#fff" : C.blueA, fontFamily: font.display, fontWeight: 700, fontSize: shrunk ? 12 : 13.5, cursor: "pointer" }}>{shrunk ? <Icon name="download" size={15} color={showImport ? "#fff" : C.blueA} /> : <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="download" size={15} color={showImport ? "#fff" : C.blueA} /> Nhập CSV</span>}</button>
          <button onClick={() => { setBulkMode(!bulkMode); setSelectedHS([]); }} style={{ flex: "0 0 auto", padding: shrunk ? "9px 10px" : "11px 12px", borderRadius: 12, border: `1.5px solid ${bulkMode ? C.pine : C.line}`, background: bulkMode ? C.pine : C.card, color: bulkMode ? "#fff" : C.sub, fontFamily: font.display, fontWeight: 700, fontSize: shrunk ? 12 : 13.5, cursor: "pointer" }}>{bulkMode ? <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="check" size={15} color="#fff" /> Xong</span> : (shrunk ? <Icon name="checkSquare" size={15} color={C.sub} /> : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="checkSquare" size={15} color={C.sub} /> Chọn nhiều</span>)}</button>
        </div>
      </StickyBar>

      {showImport && <ImportHSExcel meta={meta} students={students} upStudents={upStudents} ym={ym} />}

      {showAddHS && (
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 8 }}>+ Thêm học sinh</div>
          <input value={ten} onChange={(e) => setTen(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHS()} placeholder="Họ tên học sinh…" style={{ ...inp, marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <select value={lop} onChange={(e) => setLop(e.target.value)} style={{ ...inp, flex: "1 1 110px", minWidth: 0 }}>{meta.classes.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select>
            <select value={pl} onChange={(e) => setPl(e.target.value)} style={{ ...inp, width: 96 }}>{PHAN_LOAI.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            <select value={gt} onChange={(e) => setGt(e.target.value)} style={{ ...inp, width: 84 }}><option value="">Giới tính</option>{GIOI_TINH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
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
      
      {isWide ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <select value={hsFilter} onChange={(e) => setHsFilter(e.target.value)} style={{ ...inp, flex: "1 1 130px", minWidth: 0 }}>
            <option value="all">Tất cả lớp</option>
            {meta.classes.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
          </select>
          <select value={hsStatusFilter} onChange={(e) => setHsStatusFilter(e.target.value)} style={{ ...inp, flex: "1 1 130px", minWidth: 0 }}>
            <option value="all">Mọi trạng thái</option>
            {TRANG_THAI.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={() => { setReorderMode((v) => !v); setDragId(null); setExpandId(null); }} style={{ flexShrink: 0, padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${reorderMode ? C.pine : C.line}`, background: reorderMode ? C.pine : C.card, color: reorderMode ? "#fff" : C.sub, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{reorderMode ? <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="check" size={15} color="#fff" /> Xong</span> : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="arrowUpDown" size={15} color={C.sub} /> Sắp xếp</span>}</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
          <button onClick={() => setLopSheetOpen(true)} style={{ ...inp, flex: "1 1 130px", minWidth: 0, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hsFilter === "all" ? "Tất cả lớp" : meta.classes.find((c) => c.id === hsFilter)?.ten}</span>
            <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
          </button>
          <button onClick={() => setTtSheetOpen(true)} style={{ ...inp, flex: "1 1 130px", minWidth: 0, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hsStatusFilter === "all" ? "Mọi trạng thái" : hsStatusFilter}</span>
            <span style={{ fontSize: 10, color: C.sub, marginLeft: 6 }}>▼</span>
          </button>
          <button onClick={() => { setReorderMode((v) => !v); setDragId(null); setExpandId(null); }} style={{ flexShrink: 0, padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${reorderMode ? C.pine : C.line}`, background: reorderMode ? C.pine : C.card, color: reorderMode ? "#fff" : C.sub, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{reorderMode ? <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="check" size={15} color="#fff" /> Xong</span> : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="arrowUpDown" size={15} color={C.sub} /> Sắp xếp</span>}</button>
        </div>
      )}

      {reorderMode && <div style={{ fontSize: 12, color: C.sub, marginBottom: 8 }}>Dùng ▲ ▼ để xê dịch, ⤒ đưa lên đầu (theo danh sách đang lọc). Máy tính vẫn kéo-thả được.</div>}

      {/* THANH CÔNG CỤ CHỌN NHIỀU */}
      {bulkMode && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, padding: "8px 12px", background: C.pineSoft, borderRadius: 10, border: `1.5px solid ${C.line}` }}>
          <button onClick={toggleSelectAll} style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${allFilteredSelected ? C.pine : C.line}`, background: allFilteredSelected ? C.pine : C.card, color: C.pine, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{allFilteredSelected ? <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="x" size={14} color={C.pine} /> Bỏ chọn</span> : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="check" size={14} color={C.pine} /> Chọn tất cả</span>}</button>
          {selectedHS.length > 0 && <span style={{ fontSize: 12, color: C.sub, flex: 1 }}><b>{selectedHS.length}</b> đã chọn</span>}
          {selectedHS.length > 0 && <button onClick={() => setThaoTacOpen(true)} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 8, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="settings" size={14} color="#fff" /> Thao tác</button>}
        </div>
      )}

      {/* DANH SÁCH HỌC SINH */}
      {(() => {
        const ordBtn = { width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
        const moveHS = (sid, dir) => {
          const fIdx = filteredHS.findIndex((x) => x.id === sid);
          if (fIdx < 0) return;
          let anchorId = null, after = false;
          if (dir === "up") { if (fIdx === 0) return; anchorId = filteredHS[fIdx - 1].id; }
          else if (dir === "down") { if (fIdx >= filteredHS.length - 1) return; anchorId = filteredHS[fIdx + 1].id; after = true; }
          else if (dir === "top") { if (fIdx === 0) return; anchorId = filteredHS[0].id; }
          const moved = students.find((x) => x.id === sid);
          if (!moved) return;
          const rest = students.filter((x) => x.id !== sid);
          let insertIdx = rest.findIndex((x) => x.id === anchorId);
          if (insertIdx < 0) insertIdx = rest.length;
          if (after) insertIdx += 1;
          rest.splice(insertIdx, 0, moved);
          upStudents(rest);
        };
        return (<>
          {filteredHS.map((s) => {
            const lh = lopHienTai(s);
            const isSel = selectedHS.includes(s.id);
            const isExpanded = expandId === s.id && !bulkMode && !reorderMode;
            const isDragging = dragId === s.id;
            return (
              <div key={s.id} style={{ marginBottom: 8 }}>
                {dragOverId === s.id && dragOverPos === "before" && (<div style={{ height: 4, background: C.pine, borderRadius: 2, margin: "0 8px 4px" }} />)}
                <div
                  draggable={reorderMode}
                  onDragStart={(e) => { if (!reorderMode) return; e.dataTransfer.setData("text/plain", s.id); setDragId(s.id); }}
                  onDragOver={(e) => { if (!reorderMode) return; e.preventDefault(); const rect = e.currentTarget.getBoundingClientRect(); const midY = rect.top + rect.height / 2; setDragOverId(s.id); setDragOverPos(e.clientY < midY ? "before" : "after"); }}
                  onDrop={(e) => { if (!reorderMode) return; e.preventDefault(); const sourceId = e.dataTransfer.getData("text/plain"); if (sourceId === s.id) { setDragOverId(null); setDragOverPos(null); return; } const sourceIdx = students.findIndex((x) => x.id === sourceId); const targetIdx = students.findIndex((x) => x.id === s.id); if (sourceIdx < 0 || targetIdx < 0) return; const next = [...students]; const [moved] = next.splice(sourceIdx, 1); let insertIdx = targetIdx; if (sourceIdx < targetIdx) insertIdx = targetIdx - 1; if (dragOverPos === "after") insertIdx++; next.splice(insertIdx, 0, moved); upStudents(next); setDragId(null); setDragOverId(null); setDragOverPos(null); }}
                  onClick={() => { if (reorderMode) return; if (bulkMode) setSelectedHS((prev) => isSel ? prev.filter((id) => id !== s.id) : [...prev, s.id]); else setExpandId(isExpanded ? null : s.id); }}
                  onMouseDown={() => { if (reorderMode || bulkMode) return; longPressRef.current = setTimeout(() => { setReorderMode(true); setDragId(s.id); setExpandId(null); }, 2000); }}
                  onMouseUp={() => clearTimeout(longPressRef.current)}
                  onMouseLeave={() => clearTimeout(longPressRef.current)}
                  onTouchStart={() => { if (reorderMode || bulkMode) return; longPressRef.current = setTimeout(() => { setReorderMode(true); setDragId(s.id); setExpandId(null); }, 2000); }}
                  onTouchEnd={() => clearTimeout(longPressRef.current)}
                  style={{ background: C.card, borderRadius: isExpanded ? "14px 14px 0 0" : 14, border: `1px solid ${bulkMode && isSel ? C.pine : isDragging ? C.pine : C.line}`, borderBottom: isExpanded ? "none" : undefined, padding: "12px 14px", cursor: reorderMode ? "grab" : "pointer", display: "flex", alignItems: "center", gap: 10, opacity: isDragging ? 0.6 : 1 }}
                >
                  {bulkMode && (
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSel ? C.pine : C.line}`, background: isSel ? C.pine : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{isSel ? "✓" : ""}</div>
                  )}
                  {reorderMode && <span style={{ fontSize: 16, color: C.gray, userSelect: "none", flexShrink: 0 }}>⋮⋮</span>}
                  <Avatar hs={s} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.ten}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11.5, color: C.sub }}>{meta.classes.find((c) => c.id === lh)?.ten}</span>
                      <PLBadge pl={s.pl} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: TT_COLOR[s.trangThai], background: TT_COLOR[s.trangThai] + "18", padding: "2px 8px", borderRadius: 99 }}>{s.trangThai}</span>
                    </div>
                  </div>
                  {reorderMode ? (
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); moveHS(s.id, "top"); }} title="Lên đầu" style={ordBtn}>⤒</button>
                      <button onClick={(e) => { e.stopPropagation(); moveHS(s.id, "up"); }} title="Lên" style={ordBtn}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveHS(s.id, "down"); }} title="Xuống" style={ordBtn}>▼</button>
                    </div>
                  ) : !bulkMode ? (
                    <span style={{ fontSize: 12, color: C.sub, flexShrink: 0, transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                  ) : null}
                </div>
                {dragOverId === s.id && dragOverPos === "after" && (<div style={{ height: 4, background: C.pine, borderRadius: 2, margin: "4px 8px 0" }} />)}
                {isExpanded && (
                  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: "none", borderRadius: "0 0 14px 14px", padding: "10px 12px 14px" }}>
                    <StudentProfile studentId={s.id} store={store} embedded />
                  </div>
                )}
              </div>
            );
          })}
          {filteredHS.length === 0 && <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 20 }}>Không có học sinh phù hợp.</div>}
        </>);
      })()}

      {/* SHEET CHỌN LỚP / TRẠNG THÁI (mobile) */}
      <BottomSheet open={lopSheetOpen} onClose={() => setLopSheetOpen(false)} title="Chọn lớp">
        {[{ id: "all", ten: "Tất cả lớp" }, ...meta.classes.map((c) => ({ id: c.id, ten: c.ten }))].map((item) => {
          const active = hsFilter === item.id;
          const count = item.id === "all" ? students.length : students.filter((s) => lopHienTai(s) === item.id).length;
          return (
            <div key={item.id} onClick={() => { setHsFilter(item.id); setLopSheetOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${active ? C.pine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{active && <div style={{ width: 12, height: 12, borderRadius: 99, background: C.pine }} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink }}>{item.ten}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{count} học sinh</div>
              </div>
            </div>
          );
        })}
      </BottomSheet>
      <BottomSheet open={ttSheetOpen} onClose={() => setTtSheetOpen(false)} title="Chọn trạng thái">
        {[{ id: "all", ten: "Mọi trạng thái" }, ...TRANG_THAI.map((t) => ({ id: t, ten: t }))].map((item) => {
          const active = hsStatusFilter === item.id;
          const count = item.id === "all" ? students.length : students.filter((s) => s.trangThai === item.id).length;
          return (
            <div key={item.id} onClick={() => { setHsStatusFilter(item.id); setTtSheetOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 4px", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
              <div style={{ width: 22, height: 22, borderRadius: 99, border: `2px solid ${active ? C.pine : C.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{active && <div style={{ width: 12, height: 12, borderRadius: 99, background: C.pine }} />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? C.pine : C.ink }}>{item.ten}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{count} học sinh</div>
              </div>
            </div>
          );
        })}
      </BottomSheet>

      {/* BOTTOM SHEET THAO TÁC HÀNG LOẠT */}
      <BottomSheet open={thaoTacOpen} onClose={closeThaoTac} title={ttView === "menu" ? `Thao tác cho ${selectedHS.length} HS` : ttView === "khac" ? `Khác — ${selectedHS.length} HS` : ttView === "lop" ? `Chuyển ${selectedHS.length} HS sang lớp` : ttView === "tt" ? `Đổi trạng thái ${selectedHS.length} HS` : ttView === "thu" ? `Đổi người thu ${selectedHS.length} HS` : ttView === "pl" ? `Đổi phân loại ${selectedHS.length} HS` : ttView === "gt" ? `Đổi giới tính ${selectedHS.length} HS` : ttView === "ngay" ? `Đặt ngày nhập học ${selectedHS.length} HS` : ttView === "ratruong" ? `Cho ${selectedHS.length} HS ra trường` : `Xóa vĩnh viễn ${selectedHS.length} HS`}>
        {ttView === "menu" && (<div>
          {[["school", "Chuyển lớp", "lop"], ["bookmark", "Đổi trạng thái", "tt"], ["cash", "Đổi người thu A/B", "thu"], ["tag", "Đổi phân loại", "pl"], ["users", "Đổi giới tính", "gt"], ["settings", "Khác (ngày nhập học, ra trường, xóa)", "khac"]].map(([ic, lb, v]) => (
            <button key={v} onClick={() => setTtView(v)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}><Icon name={ic} size={19} color={C.pine} /><span style={{ flex: 1 }}>{lb}</span><span style={{ color: C.gray }}>›</span></button>
          ))}
        </div>)}
        {ttView === "khac" && (<div>
          <button onClick={() => setTtView("menu")} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 8, padding: 0 }}>‹ Quay lại</button>
          {[["calendarCheck", "Đặt ngày nhập học", "ngay", false], ["graduationCap", "Cho ra trường", "ratruong", false], ["trash", "Xóa vĩnh viễn", "xoa", true]].map(([ic, lb, v, dg]) => (
            <button key={v} onClick={() => setTtView(v)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${dg ? C.coral : C.line}`, background: C.card, color: dg ? C.coral : C.ink, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}><Icon name={ic} size={19} color={dg ? C.coral : C.pine} /><span style={{ flex: 1 }}>{lb}</span><span style={{ color: C.gray }}>›</span></button>
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
        {ttView === "gt" && (<div>
          {[["nam", "Nam"], ["nu", "Nữ"], ["", "Chưa rõ (xóa giới tính)"]].map(([v, lb]) => (<button key={v || "none"} onClick={() => setBulkGt(v)} style={{ display: "block", width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${bulkGt === v ? C.pine : C.line}`, background: bulkGt === v ? C.pineSoft : C.card, color: C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}>{bulkGt === v ? "● " : "○ "}{lb}</button>))}
          <button onClick={() => bulkPatch({ gt: bulkGt }, `Đổi giới tính hàng loạt ${selectedHS.length} HS → ${bulkGt === "nam" ? "Nam" : bulkGt === "nu" ? "Nữ" : "—"}`, `Đã đổi giới tính ${selectedHS.length} HS`)} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginTop: 4 }}>Áp dụng cho {selectedHS.length} HS</button>
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
          <button onClick={bulkRaTruong} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.amber, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body }}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="graduationCap" size={15} color="#fff" /> Cho {selectedHS.length} HS ra trường</span></button>
        </div>)}
        {ttView === "xoa" && (<div>
          <button onClick={() => setTtView("khac")} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 10, padding: 0 }}>‹ Quay lại</button>
          <div style={{ fontSize: 13, color: C.coral, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Icon name="alertTriangle" size={15} color={C.coral} /> Xóa vĩnh viễn {selectedHS.length} học sinh</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>Mất hẳn dữ liệu, không xem lại được. Gõ <b>XOA</b> để xác nhận.</div>
          <input value={xoaText} onChange={(e) => setXoaText(e.target.value)} placeholder="Gõ XOA" style={{ ...inp, width: "100%", marginBottom: 12, textAlign: "center", fontWeight: 700, letterSpacing: 2 }} />
          <button onClick={bulkDelete} disabled={xoaText.trim().toUpperCase() !== "XOA"} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: xoaText.trim().toUpperCase() === "XOA" ? C.coral : C.graySoft, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: xoaText.trim().toUpperCase() === "XOA" ? "pointer" : "default", fontFamily: font.body }}><span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name="trash" size={15} color={xoaText.trim().toUpperCase() === "XOA" ? "#fff" : C.sub} /> Xóa vĩnh viễn {selectedHS.length} HS</span></button>
        </div>)}
      </BottomSheet>
    </>
  );
}
