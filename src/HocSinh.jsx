import { useState, useMemo } from "react";
import { C, font, noDau, logAction, toast, uid, PHAN_LOAI, PL_LABEL, TRANG_THAI, TT_COLOR, lopHienTai } from "./lib.js";
import { Card, NumInput, ABBtn, SearchBar, PLBadge } from "./ui.jsx";
import { ImportHSExcel } from "./CaiDat.jsx";

export function HocSinhTab({ meta, students, upStudents, ym, openStudentProfile }) {
  const [hsSearch, setHsSearch] = useState("");
  const [hsFilter, setHsFilter] = useState("all");
  const [showAddHS, setShowAddHS] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
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

  const inp = { padding: "9px 10px", borderRadius: 9, border: "1.5px solid " + C.line, fontSize: 13, fontFamily: font.body, color: C.ink, background: "#FAFCFA", outline: "none", width: "100%" };

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={() => setShowAddHS(!showAddHS)} style={{ flex: 1, padding: "11px 8px", borderRadius: 12, border: `1.5px solid ${showAddHS ? C.pine : C.line}`, background: showAddHS ? C.pine : C.card, color: showAddHS ? "#fff" : C.pine, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>＋ Thêm HS</button>
        <button onClick={() => setShowImport(!showImport)} style={{ flex: 1, padding: "11px 8px", borderRadius: 12, border: `1.5px solid ${showImport ? C.blueA : C.line}`, background: showImport ? C.blueA : C.card, color: showImport ? "#fff" : C.blueA, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>📥 Nhập CSV</button>
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

      {filteredHS.map((s) => {
        const lh = lopHienTai(s);
        return (
          <div
            key={s.id}
            onClick={() => openStudentProfile(s.id, "info")}
            style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.line}`, padding: "12px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
          >
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
            <div onClick={(e) => e.stopPropagation()}>
              <ABBtn val={s.nguoiThu} set={(p) => setHS(s.id, { nguoiThu: p })} small />
            </div>
          </div>
        );
      })}
      {filteredHS.length === 0 && <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 20 }}>Không có học sinh phù hợp.</div>}
    </>
  );
}
