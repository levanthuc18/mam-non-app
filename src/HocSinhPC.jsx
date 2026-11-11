// HocSinhPC.jsx — Màn Học sinh cho MÁY TÍNH: danh sách bên trái + hồ sơ bên phải (dùng lại StudentProfile).
// Điện thoại vẫn dùng giao diện danh sách cũ trong HocSinh.jsx.
import { useState, useMemo, useRef, useEffect } from "react";
import { C, font, ask, lopOfMonth, TRANG_THAI, TT_COLOR, PHAN_LOAI, PL_LABEL } from "./lib.js";
import { PLBadge, TieuDeTrang } from "./ui.jsx";
import { Icon } from "./Icon.jsx";
import { Avatar } from "./Avatar.jsx";
import { ClassAnimal } from "./Brand.jsx";
import { StudentProfile } from "./StudentProfile.jsx";

const selS = { padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontFamily: font.body, fontSize: 14, cursor: "pointer", minWidth: 0 };
const nutPhu = (on) => ({ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${on ? C.pine : C.line}`, background: on ? C.pineSoft : C.card, color: on ? C.pine : C.ink, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" });

export function badgeTT(tt) {
  const m = { "Đang học": [C.greenSoft, C.greenText], "Học thử": [C.blueASoft, C.blueAText], "Bảo lưu": [C.amberSoft, C.amberText], "Nghỉ học": [C.coralSoft, C.coralText], "Ra trường": [C.violetBSoft, C.violetBText] }[tt] || [C.graySoft, C.sub];
  return <span style={{ background: m[0], color: m[1], borderRadius: 99, padding: "3px 10px", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{tt}</span>;
}

export function HsDeskHeader({ showAddHS, setShowAddHS, showImport, setShowImport, bulkMode, toggleBulk }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      <TieuDeTrang style={{ marginRight: "auto" }} tieuDe="Học sinh" phu="Quản lý hồ sơ, lớp học và tình trạng học phí." />
      <button onClick={() => setShowAddHS(!showAddHS)} style={{ ...nutPhu(false), background: C.pine, borderColor: C.pine, color: C.onFill }}><Icon name="plus" size={16} color={C.onFill} /> Thêm HS</button>
      <button onClick={() => setShowImport(!showImport)} style={nutPhu(showImport)}><Icon name="upload" size={16} color={showImport ? C.pine : C.ink} /> Nhập CSV</button>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: C.sub, cursor: "pointer", userSelect: "none" }}>
        <input type="checkbox" checked={bulkMode} onChange={toggleBulk} style={{ width: 16, height: 16, accentColor: "var(--c-pine)" }} /> Chọn nhiều
      </label>
    </div>
  );
}

const SORTS = [["goc", "Thứ tự gốc"], ["ten", "Tên A → Z"], ["lop", "Theo lớp"], ["tt", "Theo trạng thái"]];
const tenRieng = (s) => String(s.ten || "").trim().split(/\s+/).pop() || "";

export function HsDeskMaster({ meta, ym, store, filteredHS, hsSearch, setHsSearch, hsFilter, setHsFilter, hsStatusFilter, setHsStatusFilter, bulkMode, selectedHS, setSelectedHS, allFilteredSelected, toggleSelectAll, setThaoTacOpen, tong, onReorder }) {
  const [sort, setSort] = useState("goc");
  const [plFilter, setPlFilter] = useState("all");
  const [selId, setSelId] = useState(null);
  const dirtyRef = useRef(false);

  const ds = useMemo(() => {
    const a = filteredHS.filter((s) => plFilter === "all" || (s.pl || "Bthg") === plFilter);
    const tenLop = (s) => meta.classes.find((c) => c.id === lopOfMonth(s, ym))?.ten || "";
    if (sort === "ten") a.sort((x, y) => tenRieng(x).localeCompare(tenRieng(y), "vi") || String(x.ten).localeCompare(String(y.ten), "vi"));
    else if (sort === "lop") a.sort((x, y) => tenLop(x).localeCompare(tenLop(y), "vi") || tenRieng(x).localeCompare(tenRieng(y), "vi"));
    else if (sort === "tt") a.sort((x, y) => TRANG_THAI.indexOf(x.trangThai) - TRANG_THAI.indexOf(y.trangThai) || tenRieng(x).localeCompare(tenRieng(y), "vi"));
    return a;
  }, [filteredHS, sort, plFilter, meta, ym]);

  const hien = ds.find((s) => s.id === selId) || ds[0] || null;

  // Kéo-thả: nhấn giữ chuột ~0,45s vào 1 HS rồi kéo lên/xuống (chỉ khi đang "Thứ tự gốc").
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null); // { id, after }
  const overRef = useRef(null);
  const press = useRef(null);
  const vuaKeo = useRef(false);
  const coKeo = sort === "goc" && !bulkMode && !!onReorder;
  const batDauNhan = (e, id) => {
    if (!coKeo || e.button !== 0 || e.pointerType !== "mouse") return;
    press.current = { id, x: e.clientX, y: e.clientY, t: setTimeout(() => { press.current = null; setDragId(id); }, 450) };
  };
  useEffect(() => {
    const huyNhan = () => { if (press.current) { clearTimeout(press.current.t); press.current = null; } };
    const di = (e) => {
      if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 6) huyNhan();
      if (!dragId) return;
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-sid]");
      if (!el) { overRef.current = null; setOver(null); return; }
      const r = el.getBoundingClientRect();
      const o = { id: el.getAttribute("data-sid"), after: e.clientY > r.top + r.height / 2 };
      overRef.current = o; setOver(o);
    };
    const nha = () => {
      huyNhan();
      if (!dragId) return;
      const o = overRef.current;
      vuaKeo.current = true; setTimeout(() => { vuaKeo.current = false; }, 0);
      setDragId(null); setOver(null); overRef.current = null;
      if (o && o.id !== dragId) onReorder(dragId, o.id, o.after);
    };
    const esc = (e) => { if (e.key === "Escape") { huyNhan(); setDragId(null); setOver(null); overRef.current = null; } };
    window.addEventListener("pointermove", di); window.addEventListener("pointerup", nha); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointermove", di); window.removeEventListener("pointerup", nha); window.removeEventListener("keydown", esc); };
  }, [dragId, onReorder]);

  const chon = async (id) => {
    if (vuaKeo.current) return;
    if (bulkMode) { setSelectedHS((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); return; }
    if (hien && id === hien.id) return;
    if (dirtyRef.current && !(await ask("Hồ sơ đang sửa chưa lưu. Bỏ thay đổi và chuyển sang học sinh khác?", { okText: "Bỏ thay đổi", cancelText: "Ở lại" }))) return;
    dirtyRef.current = false; setSelId(id);
  };

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Icon name="search" size={16} color={C.sub} /></span>
          <input value={hsSearch} onChange={(e) => setHsSearch(e.target.value)} placeholder="Tìm tên học sinh…" aria-label="Tìm tên học sinh" style={{ ...selS, width: "100%", paddingLeft: 36, cursor: "text" }} />
        </div>
        <select value={hsFilter} onChange={(e) => setHsFilter(e.target.value)} aria-label="Lọc theo lớp" style={{ ...selS, flex: "0 0 170px" }}>
          <option value="all">Tất cả lớp</option>
          {meta.classes.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
        </select>
        <select value={hsStatusFilter} onChange={(e) => setHsStatusFilter(e.target.value)} aria-label="Lọc theo trạng thái" style={{ ...selS, flex: "0 0 170px" }}>
          <option value="all">Mọi trạng thái</option>
          {TRANG_THAI.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={plFilter} onChange={(e) => setPlFilter(e.target.value)} aria-label="Lọc theo phân loại" style={{ ...selS, flex: "0 0 170px" }}>
          <option value="all">Mọi phân loại</option>
          {PHAN_LOAI.map((p) => <option key={p} value={p}>{PL_LABEL[p]}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sắp xếp" style={{ ...selS, flex: "0 0 170px" }}>
          {SORTS.map(([k, l]) => <option key={k} value={k}>Sắp xếp: {l}</option>)}
        </select>
      </div>

      {bulkMode && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, padding: "8px 14px", background: C.pineSoft, borderRadius: 12, border: `1px solid ${C.line}` }}>
          <button onClick={toggleSelectAll} style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${allFilteredSelected ? C.pine : C.line}`, background: allFilteredSelected ? C.pine : C.card, color: allFilteredSelected ? C.onFill : C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{allFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}</button>
          <span style={{ fontSize: 13, color: C.sub, flex: 1 }}>{selectedHS.length > 0 ? <><b>{selectedHS.length}</b> đã chọn</> : "Bấm vào học sinh để chọn"}</span>
          {selectedHS.length > 0 && <button onClick={() => setThaoTacOpen(true)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Thao tác</button>}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, color: C.ink }}>Danh sách học sinh</span>
            <span style={{ marginLeft: "auto", background: "color-mix(in srgb, var(--c-pine) 16%, var(--c-card))", color: C.pine, borderRadius: 99, padding: "2px 10px", fontWeight: 800, fontSize: 13 }}>{ds.length}{ds.length !== tong ? `/${tong}` : ""}</span>
          </div>
          <div>
            {ds.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.sub, fontSize: 13.5 }}>Không có học sinh phù hợp.</div>}
            {ds.map((s) => {
              const lop = meta.classes.find((c) => c.id === lopOfMonth(s, ym));
              const on = !bulkMode && hien && hien.id === s.id;
              const chonRoi = selectedHS.includes(s.id);
              return (
                <button key={s.id} data-sid={s.id} onClick={() => chon(s.id)} onPointerDown={(e) => batDauNhan(e, s.id)} aria-current={on ? "true" : undefined} title={coKeo ? "Nhấn giữ rồi kéo để đổi thứ tự" : undefined}
                  style={{ userSelect: dragId ? "none" : undefined, opacity: dragId === s.id ? 0.45 : 1, cursor: dragId ? "grabbing" : "pointer", boxShadow: over && over.id === s.id && dragId && over.id !== dragId ? `inset 0 ${over.after ? -3 : 3}px 0 ${C.pine}` : undefined, display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderBottom: `1px solid ${C.line}`, borderLeft: `4px solid ${on ? C.pine : "transparent"}`, background: on ? "color-mix(in srgb, var(--c-pine) 16%, var(--c-card))" : (bulkMode && chonRoi ? "color-mix(in srgb, var(--c-pine) 16%, var(--c-card))" : "transparent"), fontFamily: font.body }}>
                  {bulkMode && <input type="checkbox" readOnly checked={chonRoi} style={{ width: 16, height: 16, accentColor: "var(--c-pine)", flexShrink: 0 }} />}
                  <Avatar hs={s} size={40} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink, overflowWrap: "anywhere", lineHeight: 1.25 }}>{s.ten}</div>
                    <div style={{ fontSize: 12.5, color: C.sub, display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}><ClassAnimal name={lop?.ten || ""} size={14} />{lop?.ten || "—"}<PLBadge pl={s.pl} /></div>
                  </div>
                  {badgeTT(s.trangThai)}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, position: "sticky", top: 12, alignSelf: "start", maxHeight: "calc(100vh - 24px)", overflowY: "auto" }}>
          {hien
            ? <StudentProfile key={hien.id} studentId={hien.id} store={store} pc onDirty={(d) => { dirtyRef.current = d; }} />
            : <div style={{ padding: 40, textAlign: "center", color: C.sub }}>Chọn một học sinh ở danh sách bên trái để xem hồ sơ.</div>}
        </div>
      </div>
    </>
  );
}
