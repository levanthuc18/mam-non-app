import { useState, useEffect, useMemo, memo } from "react";
import {
  C, font, noDau, soNgayHoc, ngayNhapHocTrongThang, logAction,
  ymKey, TT_THU_PHI, TUAN, lopOfMonth, sGet, sSet, uid, toast, ask
} from "./lib.js";
import {
  Card, Chips, SearchBar, useStickyShrink, StickyBar, Badge, LockNote, BottomSheet
} from "./ui.jsx";

export function DiemDanhTab({ allRows, chipsLop, lopFilter, setLopFilter, search, setSearch, ddData, upDDData, leData, upLeData, year, month, locked, ddLockReason, isWide, ym, isGV, gvLopId, gvTen, students }) {
  const today = new Date();
  const isCurMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const days = new Date(year, month, 0).getDate();
  const [viewDay, setViewDay] = useState(isCurMonth ? today.getDate() : 1);
  const [mode, setMode] = useState(isWide ? "thang" : "ngay");
  const att = ddData || {};
  const { sentinelRef, shrunk } = useStickyShrink();
  const [saveState, setSaveState] = useState(null);
  const [chiVang, setChiVang] = useState(false); 
  const baoLops = chipsLop.filter(([id]) => id !== "all");
  const [baoOpen, setBaoOpen] = useState(false);
  const [baoView, setBaoView] = useState("menu");
  const [baoHs, setBaoHs] = useState(null);
  const [baoLop, setBaoLop] = useState("");
  const [baoNote, setBaoNote] = useState("");
  const [baoMoiTen, setBaoMoiTen] = useState("");

  const guiBao = async (bao) => {
    const cur = (await sGet("mn5:bao")) || [];
    await sSet("mn5:bao", [...cur, { id: "b" + uid(), ts: Date.now(), gv: gvTen || "Giáo viên", done: false, ...bao }]);
    setBaoOpen(false); setBaoView("menu"); setBaoNote(""); setBaoMoiTen("");
    toast("Đã gửi báo cho quản lý.");
  };
  const openBao = (hs) => { setBaoHs({ id: hs.id, ten: hs.ten }); setBaoLop(baoLops[0]?.[0] || ""); setBaoNote(""); setBaoView("menu"); setBaoOpen(true); };
  const xacNhanDD = async () => {
    setSaveState("saving");
    const ok = await upDDData(att); 
    setSaveState(ok ? "ok" : "err");
  };
  useEffect(() => { setSaveState(null); setChiVang(false); }, [viewDay, mode]); 

  const studentRows = useMemo(() => {
    const s = noDau(search);
    const effLop = isGV ? gvLopId : lopFilter; 
    return allRows.filter((r) => r.coRec && (effLop === "all" || r.lopId === effLop) && (!s || noDau(r.hs.ten).includes(s)));
  }, [allRows, lopFilter, search, isGV, gvLopId]);

  const toggle = (sid, d) => {
    if (locked) return;
    const hs = studentRows.find((r) => r.hs.id === sid)?.hs;
    const nhap = ngayNhapHocTrongThang(hs, year, month);
    if (nhap !== 1 && d < nhap) return; 
    if (nhap === 99) return;             
    const cur = { ...(att[sid] || {}) }; if (cur[d]) delete cur[d]; else cur[d] = true; upDDData({ ...att, [sid]: cur });
    setSaveState(null); 
  };
  
  const toggleLe = (d) => {
    if (locked || isGV) return;
    const cur = { ...(leData || {}) };
    const isAdding = !cur[d];
    if (cur[d]) delete cur[d]; else cur[d] = true;
    upLeData(cur);
    logAction(`${isAdding ? "Đặt" : "Bỏ"} ngày lễ ${d}/${month}/${year}`);
  };
  const lopTen = isGV ? (allRows.find((r) => r.lopId === gvLopId)?.lop?.ten || "?") : "";

  const dow = new Date(year, month - 1, viewDay).getDay();
  const dowLabel = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][dow];
  const soNghiNgay = studentRows.filter((r) => att[r.hs.id]?.[viewDay]).length;
  const isLeNgay = (leData || {})[viewDay];

  return (
    <>
      {isGV && <div style={{ fontSize: 13.5, color: C.pine, fontWeight: 700, marginBottom: 10, padding: "10px 14px", background: C.pineSoft, borderRadius: 10 }}>
            👩‍🏫 {gvTen} — Lớp {lopTen}
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4, fontWeight: 500 }}>
              {studentRows.length} cháu trong lớp · Toàn trường {students.filter(s => TT_THU_PHI[s.trangThai]).length} cháu đang học
            </div>
          </div>}
      {!isGV && <SearchBar value={search} onChange={setSearch} />}
      <div ref={sentinelRef} style={{ height: 1 }} />
      <StickyBar shrunk={shrunk}>
        {!isGV && <Chips items={chipsLop} val={lopFilter} set={setLopFilter} compact />}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={() => setMode("ngay")} style={{ flex: 1, padding: "6px 0", borderRadius: 9, border: `1.5px solid ${mode === "ngay" ? C.pine : C.line}`, background: mode === "ngay" ? C.pine : C.card, color: mode === "ngay" ? "#fff" : C.sub, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body }}>Theo ngày</button>
          <button onClick={() => setMode("thang")} style={{ flex: 1, padding: "6px 0", borderRadius: 9, border: `1.5px solid ${mode === "thang" ? C.pine : C.line}`, background: mode === "thang" ? C.pine : C.card, color: mode === "thang" ? "#fff" : C.sub, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body }}>Cả tháng (bảng)</button>
        </div>
      </StickyBar>
      {locked && (ddLockReason
        ? <div style={{ background: C.goldSoft, border: `1px solid #EAD8A0`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12.5, color: "#7A5E12" }}>🔒 Điểm danh tháng {month} đã khóa vì tháng {month === 12 ? 1 : month + 1} đã chốt (đã dùng để tính tiền). Mở khóa tháng sau để sửa.</div>
        : <LockNote />)}

      {mode === "ngay" ? (
        <>
          <Card style={{ marginBottom: 12, padding: "16px 14px", border: `1.5px solid ${C.pineSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <button onClick={() => setViewDay(Math.max(1, viewDay - 1))} style={{ fontSize: 28, lineHeight: 1, color: C.pine, border: "none", background: "none", cursor: "pointer", padding: "0 8px" }}>‹</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: dow === 0 ? C.gray : isLeNgay ? C.amber : C.ink }}>{dowLabel}, {viewDay}/{month}</div>
                <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>{dow === 0 ? "Chủ nhật — nghỉ" : isLeNgay ? "Ngày lễ — nghỉ cả trường" : `Nghỉ: ${soNghiNgay}/${studentRows.length} cháu`}{isCurMonth && viewDay === today.getDate() ? " · hôm nay" : ""}</div>
              </div>
              <button onClick={() => setViewDay(Math.min(days, viewDay + 1))} style={{ fontSize: 28, lineHeight: 1, color: C.pine, border: "none", background: "none", cursor: "pointer", padding: "0 8px" }}>›</button>
            </div>
            <input type="range" min={1} max={days} value={viewDay} onChange={(e) => setViewDay(Number(e.target.value))} style={{ width: "100%", marginTop: 10, accentColor: C.pine }} />
            {dow !== 0 && !locked && !isGV && <button onClick={() => toggleLe(viewDay)} style={{ width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: font.body, background: isLeNgay ? C.amber : C.amberSoft, color: isLeNgay ? "#fff" : C.amber }}>{isLeNgay ? "✓ Đang là ngày lễ — chạm để bỏ" : "📅 Đặt ngày này là ngày lễ (nghỉ cả trường)"}</button>}
            {dow !== 0 && !isLeNgay && soNghiNgay > 0 && <button onClick={() => setChiVang((v) => !v)} style={{ width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 9, border: `1.5px solid ${chiVang ? C.coral : C.line}`, cursor: "pointer", fontWeight: 700, fontSize: 12.5, fontFamily: font.body, background: chiVang ? C.coral : C.card, color: chiVang ? "#fff" : C.coral }}>{chiVang ? "↩ Xem tất cả các cháu" : `👀 Chỉ xem cháu nghỉ (${soNghiNgay})`}</button>}
          </Card>
          {isGV && dow !== 0 && !isLeNgay && <button onClick={() => { setBaoView("moi"); setBaoMoiTen(""); setBaoNote(""); setBaoOpen(true); }} style={{ width: "100%", marginBottom: 10, padding: "10px 0", borderRadius: 11, border: `1.5px dashed ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body }}>➕ Báo cháu mới (chưa có trong danh sách)</button>}
          {dow === 0 || isLeNgay ? (
            <div style={{ textAlign: "center", color: isLeNgay ? C.amber : C.gray, fontSize: 13.5, padding: 24 }}>{isLeNgay ? "Ngày lễ — cả trường nghỉ, không điểm danh." : "Chủ nhật — không điểm danh."}</div>
          ) : studentRows.length === 0 ? (
            <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 20 }}>Không có học sinh.</div>
          ) : (
            (chiVang ? studentRows.filter((r0) => att[r0.hs.id]?.[viewDay]) : studentRows).map((r) => {
              const nhap = ngayNhapHocTrongThang(r.hs, year, month);
              const chuaNhap = nhap !== 1 && viewDay < nhap;
              const chuaNhapThang = nhap === 99;
              const nghi = !chuaNhap && !chuaNhapThang ? att[r.hs.id]?.[viewDay] : false;
              const disabled = locked || chuaNhap || chuaNhapThang;
              return (
                <div key={r.hs.id} onClick={() => !disabled && toggle(r.hs.id, viewDay)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginBottom: 6, borderRadius: 12, background: C.card, border: `1.5px solid ${disabled ? C.gray : nghi ? C.coral : C.line}`, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.65 : 1 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: disabled ? C.graySoft : nghi ? C.coralSoft : C.greenSoft, color: disabled ? C.gray : nghi ? C.coral : C.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{disabled ? "·" : (nghi ? "✕" : "✓")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{r.hs.ten}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{r.lop?.ten}{chuaNhap && <span style={{ color: C.amber, marginLeft: 4 }}>· nhập {nhap}</span>}{chuaNhapThang && <span style={{ color: C.amber, marginLeft: 4 }}>· chưa nhập</span>}</div>
                  </div>
                  <Badge s={disabled ? { t: "—", c: C.gray, bg: C.graySoft } : nghi ? { t: "Nghỉ", c: C.coral, bg: C.coralSoft } : { t: "Đi học", c: C.green, bg: C.greenSoft }} />
                  {isGV && <button onClick={(e) => { e.stopPropagation(); openBao(r.hs); }} style={{ flexShrink: 0, border: "none", background: "none", color: C.gray, fontSize: 20, fontWeight: 700, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>⋮</button>}
                </div>
              );
            })
          )}
        </>
      ) : (
        <DiemDanhBang studentRows={studentRows} att={att} toggle={toggle} le={leData || {}} toggleLe={toggleLe} year={year} month={month} days={days} locked={locked} isGV={isGV} />
      )}
      {!locked && studentRows.length > 0 && (mode === "thang" || (dow !== 0 && !isLeNgay)) && (
        <div style={{ position: "sticky", bottom: 0, zIndex: 5, marginTop: 8, paddingTop: 8, paddingBottom: 8, background: "linear-gradient(to top, " + C.bg + " 72%, rgba(245,247,243,0))" }}>
          {saveState === "err" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: C.coralSoft, border: `1.5px solid ${C.coral}`, color: C.coral, fontSize: 13.5, fontWeight: 600, fontFamily: font.body }}>
              <span style={{ flex: 1 }}>⚠️ Chưa lưu được — kiểm tra mạng rồi thử lại</span>
              <button onClick={xacNhanDD} style={{ padding: "6px 14px", borderRadius: 9, border: "none", background: C.coral, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body, flexShrink: 0 }}>Thử lại</button>
            </div>
          ) : saveState === "ok" ? (
            <div style={{ padding: "11px 14px", borderRadius: 12, background: C.greenSoft, border: `1.5px solid ${C.green}`, color: C.green, fontSize: 13.5, fontWeight: 700, fontFamily: font.body, textAlign: "center" }}>{mode === "ngay" ? `✓ Đã lưu điểm danh ${dowLabel}, ${viewDay}/${month}` : `✓ Đã lưu điểm danh tháng ${month}`}</div>
          ) : (
            <button onClick={xacNhanDD} disabled={saveState === "saving"} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: saveState === "saving" ? C.gray : C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: saveState === "saving" ? "default" : "pointer", fontFamily: font.body, boxShadow: "0 4px 14px rgba(23,107,91,0.28)" }}>{saveState === "saving" ? "💾 Đang lưu…" : "✓ Xác nhận đã điểm danh"}</button>
          )}
        </div>
      )}
      <BottomSheet open={baoOpen} onClose={() => { setBaoOpen(false); setBaoView("menu"); }} title={baoView === "moi" ? "Báo cháu mới" : baoView === "chuyenlop" ? `Báo chuyển lớp: ${baoHs?.ten || ""}` : `Báo về: ${baoHs?.ten || ""}`}>
        {baoView === "menu" && (<div>
          <button onClick={() => setBaoView("chuyenlop")} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}><span style={{ fontSize: 18 }}>🏫</span><span style={{ flex: 1 }}>Báo chuyển lớp</span><span style={{ color: C.gray }}>›</span></button>
          <button onClick={async () => { if (await ask(`Báo cho quản lý: cháu "${baoHs.ten}" thôi học (nghỉ hẳn)?`, { okText: "Gửi báo" })) guiBao({ type: "thoihoc", hsId: baoHs.id, hsTen: baoHs.ten }); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${C.coral}`, background: C.card, color: C.coral, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, textAlign: "left" }}><span style={{ fontSize: 18 }}>🚪</span><span style={{ flex: 1 }}>Báo thôi học (nghỉ hẳn)</span></button>
        </div>)}
        {baoView === "chuyenlop" && (<div>
          <button onClick={() => setBaoView("menu")} style={{ border: "none", background: "none", color: C.pine, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 8, padding: 0 }}>‹ Quay lại</button>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6 }}>Chuyển sang lớp:</div>
          {baoLops.map(([id, ten]) => (<button key={id} onClick={() => setBaoLop(id)} style={{ display: "block", width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${baoLop === id ? C.pine : C.line}`, background: baoLop === id ? C.pineSoft : C.card, color: C.ink, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}>{baoLop === id ? "● " : "○ "}{ten}</button>))}
          <textarea value={baoNote} onChange={(e) => setBaoNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" rows={2} style={{ width: "100%", padding: "9px 11px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13.5, fontFamily: font.body, marginBottom: 10, boxSizing: "border-box" }} />
          <button onClick={() => guiBao({ type: "chuyenlop", hsId: baoHs.id, hsTen: baoHs.ten, lop: baoLop, lopTen: baoLops.find(([i]) => i === baoLop)?.[1], note: baoNote })} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body }}>Gửi báo cho quản lý</button>
        </div>)}
        {baoView === "moi" && (<div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 6 }}>Tên cháu mới:</div>
          <input value={baoMoiTen} onChange={(e) => setBaoMoiTen(e.target.value)} placeholder="Họ tên cháu" style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: font.body, marginBottom: 10, boxSizing: "border-box" }} />
          <textarea value={baoNote} onChange={(e) => setBaoNote(e.target.value)} placeholder="Ghi chú (lớp, ngày bắt đầu...)" rows={2} style={{ width: "100%", padding: "9px 11px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13.5, fontFamily: font.body, marginBottom: 10, boxSizing: "border-box" }} />
          <button onClick={() => { if (!baoMoiTen.trim()) { toast("Nhập tên cháu đã."); return; } guiBao({ type: "moi", hsTen: baoMoiTen.trim(), note: baoNote }); }} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer", fontFamily: font.body }}>Gửi báo cho quản lý</button>
        </div>)}
      </BottomSheet>
    </>
  );
}

const DDRow = memo(function DDRow({ r, att, toggle, le, year, month, days, locked, index, todayD }) {
  const a = att[r.hs.id] || {};
  const soNghi = Object.keys(a).length;
  const nhap = ngayNhapHocTrongThang(r.hs, year, month);
  return (
    <tr style={{ background: index % 2 ? "#FAFCFA" : "#fff" }}>
      <td style={{ position: "sticky", left: 0, background: "inherit", padding: "5px 6px", fontWeight: 600, whiteSpace: "nowrap", zIndex: 1, borderRight: `1px solid ${C.line}` }}>{r.hs.ten}{nhap > 1 && nhap < 99 && <span style={{ fontSize: 9, color: C.amber, marginLeft: 4 }}>(nhập {nhap})</span>}</td>
      {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
        const dw = new Date(year, month - 1, d).getDay();
        const isCN = dw === 0; const isLe = le[d]; const off = a[d]; const closed = isCN || isLe;
        const chuaNhap = nhap !== 1 && d < nhap; 
        const chuaNhapThang = nhap === 99;      
        const disabled = closed || locked || chuaNhap || chuaNhapThang;
        return (
          <td key={d} onClick={() => !disabled && toggle(r.hs.id, d)}
            title={chuaNhap || chuaNhapThang ? "Chưa nhập học" : ""}
            style={{ width: 34, height: 38, fontSize: 15, textAlign: "center", cursor: disabled ? "default" : "pointer",
              background: isCN ? "#EFEFEC" : isLe ? C.amberSoft : chuaNhap || chuaNhapThang ? C.graySoft : off ? C.coralSoft : "transparent",
              color: chuaNhap || chuaNhapThang ? C.gray : C.coral, fontWeight: 700, border: `1px solid ${C.line}`, userSelect: "none",
              outline: d === todayD ? `1.5px solid ${C.pine}` : "none", outlineOffset: -1 }}>
            {chuaNhap || chuaNhapThang ? "·" : (off && !closed ? "✕" : "")}
          </td>
        );
      })}
      <td style={{ position: "sticky", right: 0, background: "inherit", zIndex: 1, textAlign: "center", fontWeight: 700, color: soNghi ? C.coral : C.sub, padding: "0 6px", borderLeft: `1px solid ${C.line}` }}>{soNghi}</td>
    </tr>
  );
});

export function DiemDanhBang({ studentRows, att, toggle, le, toggleLe, year, month, days, locked, isGV }) {
  const dayArr = Array.from({ length: days }, (_, i) => i + 1);
  const today = new Date();
  const isCurMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayD = isCurMonth ? today.getDate() : null;
  if (studentRows.length === 0) return <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 20 }}>Không có học sinh.</div>;
  return (
    <Card style={{ padding: 8, overflowX: "auto" }}>
      <div style={{ fontSize: 12, color: C.sub, margin: "2px 0 6px 4px" }}>Chạm ô để đánh <b style={{ color: C.coral }}>nghỉ ✕</b>{!isGV && <> · chạm <b style={{ color: C.amber }}>số ngày trên đầu cột</b> để đặt ngày lễ (nghỉ cả trường)</>}</div>
      <table style={{ borderCollapse: "collapse", fontSize: 11.5, fontFamily: font.body }}>
        <thead><tr>
          <th style={{ position: "sticky", left: 0, background: C.card, textAlign: "left", padding: "4px 6px", minWidth: 106, zIndex: 2 }}>Học sinh</th>
          {dayArr.map((d) => { const dw = new Date(year, month - 1, d).getDay(); const isCN = dw === 0; const isLe = le[d]; return (
            <th key={d} onClick={() => !isCN && !locked && toggleLe(d)} title={isCN ? "Chủ nhật" : "Chạm đặt/bỏ ngày lễ"} style={{ padding: "2px 0", width: 34, minWidth: 34, cursor: isCN || locked ? "default" : "pointer", background: isLe ? C.amberSoft : d === todayD ? C.pineSoft : "transparent", color: isCN ? "#B6BDB8" : isLe ? C.amber : d === todayD ? C.pine : dw === 6 ? C.blueA : C.sub, fontWeight: 600, borderBottom: d === todayD ? `2px solid ${C.pine}` : undefined }}>
              <div style={{ fontSize: 9, opacity: 0.8 }}>{TUAN[dw]}</div><div>{d}</div>{isLe && <div style={{ fontSize: 8 }}>lễ</div>}
            </th>); })}
          <th style={{ position: "sticky", right: 0, background: C.card, zIndex: 2, padding: "0 6px", color: C.coral, fontWeight: 700, borderLeft: `1px solid ${C.line}` }}>Nghỉ</th>
        </tr></thead>
        <tbody>
          {studentRows.map((r, ri) => (
            <DDRow key={r.hs.id} r={r} att={att} toggle={toggle} le={le} year={year} month={month} days={days} locked={locked} index={ri} todayD={todayD} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
