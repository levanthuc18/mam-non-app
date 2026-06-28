import { useState, useEffect } from "react";
import { C, font, TT_THU_PHI, setCurrentActor, sGet, sSet, sDel, setAskRef, setToastRef, fmt } from "./lib.js";
import { BottomSheet } from "./ui.jsx";
import { useStore } from "./useStore.js";
import { HomeTab } from "./Home.jsx";
import { ThuPhiTab } from "./ThuPhi.jsx";
import { DiemDanhTab } from "./DiemDanh.jsx";
import { CongNoTab } from "./CongNo.jsx";
import { DashTab } from "./TongQuan.jsx";
import { PhieuThu } from "./Phieu/PhieuThu.jsx";
import { PhieuThuManager } from "./Phieu/PhieuThuManager.jsx";
import { CaiDat } from "./CaiDat.jsx";
import { HocSinhTab } from "./HocSinh.jsx";
import { StudentProfile } from "./StudentProfile.jsx";
import { MoreMenu } from "./MoreMenu.jsx";
import { Splash } from "./Splash.jsx";
import { LoginScreen } from "./LoginScreen.jsx";
import { Icon } from "./Icon.jsx";
import { Logo } from "./Brand.jsx";

function ConfirmHost() {
  const [state, setState] = useState(null);
  useEffect(() => { setAskRef((s) => setState(s)); return () => setAskRef(null); }, []);import { useState, useEffect, useMemo, memo } from "react";
import {
  C, font, noDau, soNgayHoc, ngayNhapHocTrongThang, logAction,
  ymKey, TT_THU_PHI, TUAN, lopOfMonth, sGet, sSet, uid, toast, ask
} from "./lib.js";
import {
  Card, Chips, SearchBar, useStickyShrink, StickyBar, Badge, LockNote, BottomSheet
} from "./ui.jsx";
import { Icon } from "./Icon.jsx";

// Component Donut (tùy chỉnh kích thước)
function Donut({ pct, color, size = 60 }) {
  const r = (size - 10) / 2, c = size / 2, circ = 2 * Math.PI * r;
  const dash = circ * Math.min(100, pct) / 100;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={C.graySoft} strokeWidth={6} />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`} />
      <text x={c} y={c + (size > 70 ? 5 : 4)} textAnchor="middle" fontSize={size > 70 ? 16 : 11} fontWeight={800} fill={C.ink} fontFamily={font.display}>{pct}%</text>
    </svg>
  );
}

// Bảng tổng hợp điểm danh các lớp (Sửa lại layout theo ảnh)
function DiemDanhTongHop({ students, classes, ddData, year, month, viewDay, isGV, gvLopId, lastSaved, setLopFilter, collapsed, onToggle, ddTimes }) {
  const effClasses = isGV ? classes.filter(c => c.id === gvLopId) : classes;
  const dt = ddTimes || {};
  const lopTime = (id) => { const iso = dt[id]; if (!iso) return null; const d = new Date(iso); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
  const stats = effClasses.map(c => {
    const hsInClass = students.filter(s => lopOfMonth(s, `${year}-${String(month).padStart(2, '0')}`) === c.id && TT_THU_PHI[s.trangThai]);
    let nghi = 0;
    hsInClass.forEach(s => {
      if (ddData?.[s.id]?.[viewDay]) nghi++;
    });
    return { ...c, siSo: hsInClass.length, nghi, diHoc: hsInClass.length - nghi };
  });

  const totalHS = stats.reduce((a, c) => a + c.siSo, 0);
  const totalNghi = stats.reduce((a, c) => a + c.nghi, 0);
  const totalDiHoc = totalHS - totalNghi;
  const pct = totalHS > 0 ? Math.round(totalDiHoc / totalHS * 100) : 100;
  const daDD = effClasses.filter(c => dt[c.id]).length;
  const fmtTime = (d) => d ? `Lúc ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : "Chưa xác nhận";

  return (
    <Card style={{ marginBottom: 12, padding: collapsed ? "11px 14px" : 14 }}>
      {/* TIÊU ĐỀ KHỐI + CÔNG TẮC */}
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: collapsed ? 0 : 12 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: C.pine, display:"inline-flex",alignItems:"center",gap:8 }}><Icon name="barChart" size={17} color={C.pine} /> Tổng quan quản lý</div>
        <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{collapsed ? "Chi tiết ▼" : "Thu gọn ▲"}</span>
      </div>

      {collapsed ? (
        <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600 }}>
          <span style={{ color: pct >= 90 ? C.green : pct >= 70 ? C.amber : C.coral, fontWeight: 800 }}>{pct}% đi học</span>
          <span style={{ color: C.sub, fontWeight: 500 }}> · {totalDiHoc} đi học · </span>
          <span style={{ color: totalNghi > 0 ? C.coral : C.sub }}>{totalNghi} nghỉ</span>
          <span style={{ color: C.sub, fontWeight: 500 }}> · {fmtTime(lastSaved)}</span>
        </div>
      ) : (<>
      {/* Layout chia 2 cột: Biểu đồ (1/3) và Thông tin (2/3) */}
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: "0 0 33%", display: "flex", justifyContent: "center" }}>
          <Donut pct={pct} color={pct >= 90 ? C.green : pct >= 70 ? C.amber : C.coral} size={isGV ? 60 : 100} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Tổng quan ngày {viewDay}/{month}</div>
          <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8 }}>Đã điểm danh {daDD}/{effClasses.length} lớp · {fmtTime(lastSaved)}</div>
          <div style={{ display: "flex", gap: 10, fontSize: 13, flexWrap: "wrap" }}>
            <span style={{ color: C.green, fontWeight: 700 }}>● Đi học: {totalDiHoc}</span>
            <span style={{ color: C.coral, fontWeight: 700 }}>● Nghỉ: {totalNghi}</span>
            <span style={{ color: C.sub }}>Tổng: {totalHS}</span>
          </div>
        </div>
      </div>

      {/* Danh sách lớp bên dưới biểu đồ (Chỉ Admin thấy) */}
      {!isGV && stats.length > 1 && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {stats.map(c => (
            <div 
              key={c.id} 
              onClick={() => setLopFilter(c.id)} 
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", cursor: "pointer" }}
            >
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>{c.ten}</span>
                <span style={{ fontSize: 11.5, color: lopTime(c.id) ? C.sub : C.amber, marginLeft: 8 }}>{lopTime(c.id) ? <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><Icon name="clock" size={12} color={C.sub} /> {lopTime(c.id)}</span> : "• chưa điểm danh"}</span>
              </div>
              <span style={{ fontSize: 13, color: c.nghi > 0 ? C.coral : C.green, fontWeight: 700, flexShrink: 0 }}>
                {c.nghi > 0 ? `Nghỉ ${c.nghi}/${c.siSo}` : `Đủ ${c.siSo}`}
              </span>
            </div>
          ))}
        </div>
      )}
      </>)}
    </Card>
  );
}

export function DiemDanhTab({ allRows, chipsLop, lopFilter, setLopFilter, search, setSearch, ddData, upDDData, leData, upLeData, year, month, setMonth, setYear, locked, ddLockReason, isWide, ym, isGV, gvLopId, gvTen, students, onSelectStudent }) {
  const today = new Date();
  const isCurMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const days = new Date(year, month, 0).getDate();
  const [viewDay, setViewDay] = useState(isCurMonth ? today.getDate() : 1);
  const [mode, setMode] = useState(isWide ? "thang" : "ngay");
  const att = ddData || {};
  const { sentinelRef, shrunk } = useStickyShrink();
  const [saveState, setSaveState] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [openTQ, setOpenTQ] = useState(!isGV);
  const [openDD, setOpenDD] = useState(true);
  const [ddTimes, setDdTimes] = useState({});
  const [dirty, setDirty] = useState(false);
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
    if (ok) {
      setSaveState(null);
      setDirty(false);
      const now = new Date();
      setLastSaved(now);
      const eff = isGV ? gvLopId : lopFilter;
      const lopIds = eff === "all" ? [...new Set(studentRows.map((r) => r.lopId))] : [eff];
      const prev = (await sGet(`mn5:ddts:${ym}`)) || {};
      const dayMap = { ...(prev[viewDay] || {}) };
      lopIds.forEach((id) => { dayMap[id] = now.toISOString(); });
      sSet(`mn5:ddts:${ym}`, { ...prev, [viewDay]: dayMap });
      setDdTimes(dayMap);
    } else {
      setSaveState("err");
    }
  };
  useEffect(() => {
    setSaveState(null); setChiVang(false); setDirty(false);
    let alive = true;
    const eff = isGV ? gvLopId : lopFilter;
    sGet(`mn5:ddts:${ym}`).then((m) => {
      if (!alive) return;
      const dayMap = (m && m[viewDay]) || {};
      setDdTimes(dayMap);
      const iso = eff === "all" ? Object.values(dayMap).sort().slice(-1)[0] : dayMap[eff];
      setLastSaved(iso ? new Date(iso) : null);
    });
    return () => { alive = false; };
  }, [viewDay, mode, ym, lopFilter, isGV, gvLopId]);

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
    setSaveState(null); setDirty(true); 
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
      {/* 1. KHỐI TỔNG QUAN QUẢN LÝ (ẩn với GV) */}
      {!isGV && <DiemDanhTongHop 
        students={students} 
        classes={chipsLop.filter(c => c[0] !== "all").map(c => ({ id: c[0], ten: c[1] }))} 
        ddData={ddData} 
        year={year} month={month} 
        viewDay={viewDay} 
        isGV={isGV} gvLopId={gvLopId} 
        lastSaved={lastSaved}
        setLopFilter={setLopFilter}
        collapsed={!openTQ}
        onToggle={() => setOpenTQ(v => !v)}
        ddTimes={ddTimes}
      />}

      {/* 2. KHỐI ĐIỂM DANH (thu gọn/mở) */}
      <div onClick={() => setOpenDD(v => !v)} style={{ position: "relative", textAlign: "center", cursor: "pointer", padding: "8px 4px", marginBottom: openDD ? 8 : 4 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.pine, display:"inline-flex", alignItems:"center", gap:8 }}><Icon name="checkSquare" size={20} color={C.pine} /> Điểm danh{isGV ? ` — ${lopTen}` : ""}</div>
        {!openDD && <div style={{ fontSize: 12, color: C.sub, marginTop: 2, fontWeight: 600 }}>{studentRows.length} cháu · {soNghiNgay} nghỉ · Mở rộng ▼</div>}
        {openDD && <span style={{ position: "absolute", right: 6, top: 12, fontSize: 12.5, color: C.sub, fontWeight: 600 }}>Thu gọn ▲</span>}
      </div>

      {openDD && (<>
      {/* THANH TÌM KIẾM & LỚP */}
      {isGV && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, padding: "10px 14px", background: C.pineSoft, borderRadius: 10 }}>
            <div style={{ fontSize: 13.5, color: C.pine, fontWeight: 700, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 6 }}><Icon name="graduationCap" size={16} color={C.pine} /> {gvTen}</div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: soNghiNgay > 0 ? C.coral : C.green }}>{soNghiNgay > 0 ? `Nghỉ ${soNghiNgay}/${studentRows.length}` : `Đủ ${studentRows.length}`}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: (lastSaved && !dirty) ? C.green : C.amber, marginTop: 1, display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>{(lastSaved && !dirty) ? <><Icon name="check" size={12} color={C.green} /> Đã điểm danh · {String(lastSaved.getHours()).padStart(2,"0")}:{String(lastSaved.getMinutes()).padStart(2,"0")}</> : <><Icon name="clock" size={12} color={C.amber} /> Chưa điểm danh</>}</div>
            </div>
          </div>}
      {isGV && <SearchBar value={search} onChange={setSearch} />}
      <div ref={sentinelRef} style={{ height: 1 }} />
      <StickyBar shrunk={shrunk}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={() => setMode("ngay")} style={{ flex: 1, padding: "6px 0", borderRadius: 9, border: `1.5px solid ${mode === "ngay" ? C.pine : C.line}`, background: mode === "ngay" ? C.pine : C.card, color: mode === "ngay" ? "#fff" : C.sub, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body }}>Theo ngày</button>
          <button onClick={() => setMode("thang")} style={{ flex: 1, padding: "6px 0", borderRadius: 9, border: `1.5px solid ${mode === "thang" ? C.pine : C.line}`, background: mode === "thang" ? C.pine : C.card, color: mode === "thang" ? "#fff" : C.sub, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: font.body }}>Cả tháng (bảng)</button>
        </div>
      </StickyBar>
      {locked && (ddLockReason
        ? <div style={{ background: C.goldSoft, border: `1px solid #EAD8A0`, borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12.5, color: "#7A5E12" }}>🔒 Điểm danh tháng {month} đã khóa vì tháng {month === 12 ? 1 : month + 1} đã chốt. Mở khóa tháng sau để sửa.</div>
        : <LockNote />)}

      {/* 3. CHỌN NGÀY & DANH SÁCH HS */}
      {mode === "ngay" ? (
        <>
          <Card style={{ marginBottom: 12, padding: "12px 12px", border: `1.5px solid ${C.pine}`, background: C.pineSoft }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <button onClick={() => setViewDay(Math.max(1, viewDay - 1))} style={{ fontSize: 22, lineHeight: 1, color: C.pine, border: "none", background: "#fff", cursor: "pointer", width: 38, height: 38, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.1)", flexShrink: 0 }}>‹</button>
              <label style={{ position: "relative", textAlign: "center", cursor: "pointer", flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 19, color: dow === 0 ? C.gray : isLeNgay ? C.amber : C.pine, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Icon name="calendarCheck" size={16} color={C.pine} />{dowLabel}, {viewDay}/{month}/{year}<span style={{ fontSize: 12, color: C.sub }}>▾</span>
                </div>
                <input type="date" value={`${year}-${String(month).padStart(2, "0")}-${String(viewDay).padStart(2, "0")}`} onChange={(e) => { const v = e.target.value.split("-").map(Number); if (!v[0]) return; setYear(v[0]); setMonth(v[1]); setViewDay(v[2]); }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none" }} />
              </label>
              {/* Icon ngày lễ (chỉ admin) */}
              {dow !== 0 && !locked && !isGV && (
                <button onClick={() => toggleLe(viewDay)} title={isLeNgay ? "Đang là ngày lễ — chạm để bỏ" : "Đặt ngày lễ (nghỉ cả trường)"} style={{ fontSize: 17, lineHeight: 1, border: "none", background: isLeNgay ? C.amber : "#fff", cursor: "pointer", width: 38, height: 38, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.1)", flexShrink: 0 }}>🎌</button>
              )}
              <button onClick={() => setViewDay(Math.min(days, viewDay + 1))} style={{ fontSize: 22, lineHeight: 1, color: C.pine, border: "none", background: "#fff", cursor: "pointer", width: 38, height: 38, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.1)", flexShrink: 0 }}>›</button>
            </div>
            {/* Dòng dưới: GV = Báo cháu mới + chip nghỉ; Admin = sĩ số + chip nghỉ */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
              {isGV ? (
                dow !== 0 && !isLeNgay ? (
                  <button onClick={() => { setBaoView("moi"); setBaoMoiTen(""); setBaoNote(""); setBaoOpen(true); }} style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 99, border: `1.5px dashed ${C.pine}`, background: "#fff", color: C.pine, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: font.body, whiteSpace: "nowrap", display:"inline-flex", alignItems:"center", gap:5 }}><Icon name="plus" size={13} color={C.pine} /> Báo cháu mới</button>
                ) : (
                  <span style={{ fontSize: 12.5, color: C.amber, fontWeight: 600 }}>{dow === 0 ? "Chủ nhật — nghỉ" : "🎌 Ngày lễ — nghỉ cả trường"}</span>
                )
              ) : (
                <span style={{ fontSize: 12.5, color: dow === 0 || isLeNgay ? C.amber : C.sub, fontWeight: 600 }}>
                  {dow === 0 ? "Chủ nhật — nghỉ" : isLeNgay ? "🎌 Ngày lễ — nghỉ cả trường" : `Nghỉ: ${soNghiNgay}/${studentRows.length} cháu`}{isCurMonth && viewDay === today.getDate() ? " · hôm nay" : ""}
                </span>
              )}
              {dow !== 0 && !isLeNgay && soNghiNgay > 0 && (
                <button onClick={() => setChiVang((v) => !v)} style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 99, border: `1.5px solid ${C.coral}`, cursor: "pointer", fontWeight: 700, fontSize: 11.5, fontFamily: font.body, background: chiVang ? C.coral : "#fff", color: chiVang ? "#fff" : C.coral, whiteSpace: "nowrap" }}>{chiVang ? "↩ Xem tất cả" : `👀 Cháu nghỉ (${soNghiNgay})`}</button>
              )}
            </div>
          </Card>
          
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
                  {isGV && <button onClick={(e) => { e.stopPropagation(); openBao(r.hs); }} style={{ flexShrink: 0, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: "6px 10px", borderRadius: 9, fontFamily: font.body }}>Khác</button>}
                </div>
              );
            })
          )}
        </>
      ) : (
        <DiemDanhBang studentRows={studentRows} att={att} toggle={toggle} le={leData || {}} toggleLe={toggleLe} year={year} month={month} days={days} locked={locked} isGV={isGV} onSelectStudent={onSelectStudent} />
      )}
      
      {!locked && studentRows.length > 0 && (mode === "thang" || (dow !== 0 && !isLeNgay)) && (
        <div style={{ position: "sticky", bottom: 0, zIndex: 5, marginTop: 8, paddingTop: 8, paddingBottom: 8, background: "linear-gradient(to top, " + C.bg + " 72%, rgba(245,247,243,0))" }}>
          {saveState === "err" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: C.coralSoft, border: `1.5px solid ${C.coral}`, color: C.coral, fontSize: 13.5, fontWeight: 600, fontFamily: font.body }}>
              <span style={{ flex: 1, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="alertTriangle" size={15} color={C.coral} /> Chưa lưu được — kiểm tra mạng rồi thử lại</span>
              <button onClick={xacNhanDD} style={{ padding: "6px 14px", borderRadius: 9, border: "none", background: C.coral, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body, flexShrink: 0 }}>Thử lại</button>
            </div>
          ) : (lastSaved && !dirty) ? (
            <div style={{ padding: "11px 14px", borderRadius: 12, background: C.greenSoft, border: `1.5px solid ${C.green}`, color: C.green, fontSize: 13.5, fontWeight: 700, fontFamily: font.body, textAlign: "center" }}>✓ Đã điểm danh{mode === "ngay" ? ` ${dowLabel}, ${viewDay}/${month}` : ` tháng ${month}`} · Lúc {String(lastSaved.getHours()).padStart(2,"0")}:{String(lastSaved.getMinutes()).padStart(2,"0")}</div>
          ) : (
            <button onClick={xacNhanDD} disabled={saveState === "saving"} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: saveState === "saving" ? C.gray : C.pine, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: saveState === "saving" ? "default" : "pointer", fontFamily: font.body, boxShadow: "0 4px 14px rgba(23,107,91,0.28)" }}>{saveState === "saving" ? <span style={{display:"inline-flex",alignItems:"center",gap:8,justifyContent:"center"}}><Icon name="save" size={16} color="#fff" /> Đang lưu…</span> : <span style={{display:"inline-flex",alignItems:"center",gap:8,justifyContent:"center"}}><Icon name="check" size={16} color="#fff" /> Xác nhận đã điểm danh</span>}</button>
          )}
        </div>
      )}
      </>)}

      <BottomSheet open={baoOpen} onClose={() => { setBaoOpen(false); setBaoView("menu"); }} title={baoView === "moi" ? "Báo cháu mới" : baoView === "chuyenlop" ? `Báo chuyển lớp: ${baoHs?.ten || ""}` : `Báo về: ${baoHs?.ten || ""}`}>
        {baoView === "menu" && (<div>
          <button onClick={() => setBaoView("chuyenlop")} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}><Icon name="school" size={19} color={C.pine} /><span style={{ flex: 1 }}>Báo chuyển lớp</span><span style={{ color: C.gray }}>›</span></button>
          <button onClick={async () => { if (await ask(`Báo cho quản lý: cháu "${baoHs.ten}" thôi học (nghỉ hẳn)?`, { okText: "Gửi báo" })) guiBao({ type: "thoihoc", hsId: baoHs.id, hsTen: baoHs.ten }); }} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${C.coral}`, background: C.card, color: C.coral, fontWeight: 600, fontSize: 14.5, cursor: "pointer", fontFamily: font.body, textAlign: "left" }}><Icon name="logOut" size={19} color={C.coral} /><span style={{ flex: 1 }}>Báo thôi học (nghỉ hẳn)</span></button>
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

const DDRow = memo(function DDRow({ r, att, toggle, le, year, month, days, locked, index, todayD, onSelectStudent }) {
  const a = att[r.hs.id] || {};
  const soNghi = Object.keys(a).length;
  const nhap = ngayNhapHocTrongThang(r.hs, year, month);
  return (
    <tr style={{ background: index % 2 ? "#FAFCFA" : "#fff" }}>
      <td style={{ position: "sticky", left: 0, background: "inherit", padding: "5px 6px", fontWeight: 600, whiteSpace: "nowrap", zIndex: 1, borderRight: `1px solid ${C.line}` }}>
        <span onClick={() => onSelectStudent && onSelectStudent(r.hs.id)} style={{ cursor: "pointer" }}>{r.hs.ten}</span>
        {nhap > 1 && nhap < 99 && <span style={{ fontSize: 9, color: C.amber, marginLeft: 4 }}>(nhập {nhap})</span>}
      </td>
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

export function DiemDanhBang({ studentRows, att, toggle, le, toggleLe, year, month, days, locked, isGV, onSelectStudent }) {
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
            <DDRow key={r.hs.id} r={r} att={att} toggle={toggle} le={le} year={year} month={month} days={days} locked={locked} index={ri} todayD={todayD} onSelectStudent={onSelectStudent} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
  if (!state) return null;
  const close = (v) => { state.res(v); setState(null); };
  const danger = state.opts.danger;
  return (
    <div onClick={() => close(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,40,30,.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, maxWidth: 380, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 14.5, color: C.ink, whiteSpace: "pre-line", lineHeight: 1.55, marginBottom: 18 }}>{state.msg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => close(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.cancelText || "Hủy"}</button>
          <button onClick={() => close(true)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: danger ? C.coral : C.pine, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font.body }}>{state.opts.okText || "Đồng ý"}</button>
        </div>
      </div>
    </div>
  );
}

function ToastHost() {
  const [state, setState] = useState(null);
  const tRef = useState({})[0]; 
  useEffect(() => { setToastRef((s) => { setState(s); clearTimeout(tRef.current); tRef.current = setTimeout(() => setState(null), s && s.undo ? 6000 : 2600); }); return () => setToastRef(null); }, []);
  if (!state) return null;
  return (
    <div style={{ position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: C.ink, color: "#fff", padding: "11px 18px", borderRadius: 99, fontSize: 13.5, fontWeight: 600, maxWidth: "90%", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10 }}>
      <span>{state.msg}</span>
      {state.undo && <button onClick={() => { state.undo(); clearTimeout(tRef.current); setState(null); }} style={{ background: "#fff", color: C.ink, border: "none", borderRadius: 99, padding: "4px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>↩ Hoàn tác</button>}
    </div>
  );
}

function NotificationSheet({ open, onClose, alerts, onAction }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="🔔 Trung tâm thông báo">
      {alerts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: C.green, fontWeight: 600 }}>✓ Tuyệt vời! Hệ thống không có cảnh báo nào.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {alerts.map((a, i) => {
            const c = a.type === 'danger' ? { bg: C.coralSoft, border: "#EFC9BF", fg: C.coral } : a.type === 'warning' ? { bg: C.amberSoft, border: "#EAD8A0", fg: "#7A5E12" } : { bg: C.greenSoft, border: "#BFE3CC", fg: C.green };
            return (
              <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 16 }}>{a.icon}</div>
                <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: c.fg }}>{a.msg}</div>
                <button onClick={() => { onAction(a.tab, a.filter); onClose(); }} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: c.fg, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", width: 100, textAlign: "center" }}>
                  {a.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </BottomSheet>
  );
}

export default function App() {
  const [tab, setTab] = useState("home"); 
  const [auth, setAuth] = useState(null);
  const [splashDone, setSplashDone] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [phieuId, setPhieuId] = useState(null);
  const [lopFilter, setLopFilter] = useState("all");
  const [thuFilter, setThuFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isWide, setIsWide] = useState(typeof window !== "undefined" && window.innerWidth >= 820);
  const [viewStudentId, setViewStudentId] = useState(null); 
  const [notifOpen, setNotifOpen] = useState(false); 
  
  const store = useStore();
  const { meta, students, loading } = store;

  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";
  const gvLopId = auth?.lopId || null;
  const gvTen = auth?.ten || "";
  setCurrentActor(isAdmin ? "Admin" : (isGV ? gvTen : "?"));

  useEffect(() => {
    const h = () => setIsWide(window.innerWidth >= 820);
    window.addEventListener("resize", h); return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => { setOpenId(null); }, [tab]);
  useEffect(() => { if (isGV && !["dd", "home", "hs", "more"].includes(tab)) setTab("home"); }, [isGV, tab]);

  const login = (a) => { setAuth(a); sSet("mn5:auth", a); };
  const logout = () => { setAuth(null); sDel("mn5:auth"); setTab("home"); };

  useEffect(() => { (async () => { const a = await sGet("mn5:auth"); if (a && (a.role === "admin" || a.role === "gv")) setAuth(a); })(); }, []);

  if (!splashDone) return <Splash onDone={() => setSplashDone(true)} />;
  if (loading || !meta || !students)
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.sub, fontFamily: font.body }}>Đang tải dữ liệu…</div>;
  if (!auth) return <LoginScreen meta={meta} onLogin={login} />;

  const prevM = () => { if (store.month === 1) { store.setMonth(12); store.setYear(store.year - 1); } else store.setMonth(store.month - 1); };
  const nextM = () => { if (store.month === 12) { store.setMonth(1); store.setYear(store.year + 1); } else store.setMonth(store.month + 1); };
  const chipsLop = [["all", "Tất cả"], ...meta.classes.map((c) => [c.id, c.ten])];

  const recRows0 = store.allRows.filter((r) => r.coRec);
  const chuaThu = recRows0.filter((r) => r.ps.tong > 0 && (r.rec.thucThu || 0) === 0).length;
  const ngayAn0 = recRows0.filter((r) => r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec.ngayAn || 0) === 0).length;
  const noRows = recRows0.filter((r) => r.conNo > 0);
  
  const sysAlerts = [];
  if (chuaThu > 0) sysAlerts.push({ type: 'danger', icon: '🔴', msg: `${chuaThu} HS chưa thu đủ tháng ${store.month}`, actionLabel: 'Thu ngay', tab: 'thu', filter: 'chuaThu' });
  if (ngayAn0 > 0) sysAlerts.push({ type: 'warning', icon: '🟠', msg: `${ngayAn0} HS có ngày ăn = 0 (chưa tính tiền)`, actionLabel: 'Sửa', tab: 'thu', filter: 'all' });
  if (noRows.length > 0) sysAlerts.push({ type: 'danger', icon: '🔴', msg: `${noRows.length} HS đang nợ tiền`, actionLabel: 'Xem', tab: 'thu', filter: 'thieu' });
  
  const handleNotifAction = (targetTab, filter) => {
    setTab(targetTab);
    if (filter) setThuFilter(filter);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font.body, color: C.ink }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
        input[type=number]::-webkit-inner-spin-button{display:none}
        *{box-sizing:border-box}
        button:active{transform:scale(0.97)}
        .active-press-shadow {
          will-change: transform;
        }
        .active-press-shadow:active {
          transform: scale(0.97);
          box-shadow: 0 1px 4px rgba(20, 60, 48, 0.02) !important;
        }
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @media print { .no-print{display:none!important} #phieu-in{box-shadow:none!important} body{background:#fff} }
      `}</style>

      <div className="no-print" style={{ background: C.bg, padding: "14px 16px", color: C.ink, minHeight: 70, display: "flex", flexDirection: "column", justifyContent: "center", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Logo mark style={{ height: 34, width: "auto", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: C.pine, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.tenTruong}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              {isGV ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><Icon name="graduationCap" size={13} color={C.sub} /> {gvTen} - Lớp {meta.classes.find(c=>c.id===gvLopId)?.ten || "?"}</span> : `${students.filter((s) => TT_THU_PHI[s.trangThai]).length} học sinh · ${meta.classes.length} lớp`}
              {store.locked && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>· <Icon name="lock" size={12} color={C.sub} /></span>}
            </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: C.graySoft, border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 4px" }}>
              <button onClick={prevM} style={{ color: C.sub, fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>‹</button>
              <button onClick={() => setMonthPickerOpen(true)} style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, minWidth: 64, textAlign: "center", color: C.ink, background: "none", border: "none", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center", gap: 3 }}>Th{store.month}/{store.year} <span style={{ fontSize: 9, color: C.sub }}>▾</span></button>
              <button onClick={nextM} style={{ color: C.sub, fontSize: 18, padding: "0 8px", border: "none", background: "none", cursor: "pointer" }}>›</button>
            </div>
            
            {isAdmin && sysAlerts.length > 0 && (
              <button onClick={() => setNotifOpen(true)} style={{ position: "relative", background: "none", border: "none", borderRadius: 8, padding: "5px 7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={C.pine} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                <span style={{ position: "absolute", top: -1, right: -1, background: C.orange, color: "#fff", fontSize: 9, fontWeight: 800, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${C.bg}` }}>{sysAlerts.length}</span>
              </button>
            )}
            
            
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 14px 92px" }}>
        {store.seeded && tab === "home" && <div className="no-print" style={{ background: C.pineSoft, border: `1px solid #BFE0D4`, borderRadius: 12, padding: "9px 12px", marginBottom: 12, fontSize: 12.5, color: C.pine }}>👋 Khởi tạo xong! Bắt đầu: vào ⚙️ Cài đặt → Học sinh để thêm/nhập danh sách, rồi tạo bảng thu cho tháng.</div>}

        {tab === "home" && (
          <HomeTab store={store} auth={auth} setTab={setTab} setThuFilter={setThuFilter} openStudentProfile={setViewStudentId} setNotifOpen={setNotifOpen} />
        )}

        {tab === "thu" && store.mData && (
          <ThuPhiTab 
            rows={store.allRows.filter((r) => {
              if (!r.coRec) return false;
              if (lopFilter !== "all" && r.lopId !== lopFilter) return false;
              const s = (search || "").toLowerCase(); 
              if (s && !r.hs.ten.toLowerCase().includes(s) && !r.hs.id.toLowerCase().includes(s)) return false;
              if (thuFilter === "chuaThu") return r.ps.tong > 0 && (r.rec.thucThu || 0) === 0;
              if (thuFilter === "thieu") return r.conNo > 0 && (r.rec.thucThu || 0) > 0;
              if (thuFilter === "noCu") return r.noTruoc > 0;
              if (thuFilter === "thuThua") return r.conNo < 0;
              return true;
            })}
            tk={store.tk} allRows={store.allRows} chipsLop={chipsLop} 
            lopFilter={lopFilter} setLopFilter={setLopFilter} thuFilter={thuFilter} setThuFilter={setThuFilter}
            search={search} setSearch={setSearch} openId={openId} setOpenId={setOpenId}
            getLop={store.getLop} setRec={store.setRec} setKhoan={store.setKhoan}
            resetKhoan={store.resetKhoan} resetAllKhoan={store.resetAllKhoan}
            setNgayAnAll={store.setNgayAnAll} thuDuNhieu={store.thuDuNhieu}
            addPhuThuHS={store.addPhuThuHS} delPhuThuHS={store.delPhuThuHS}
            locked={store.locked} mData={store.mData} upMData={store.upMData}
            setPhieuId={setPhieuId} setTab={setTab} isWide={isWide} onSelectStudent={setViewStudentId}
          />
        )}
        
        {tab === "dd" && (
          <DiemDanhTab 
            allRows={store.ddRows} chipsLop={chipsLop} lopFilter={lopFilter} setLopFilter={setLopFilter}
            search={search} setSearch={setSearch} ddData={store.ddData} upDDData={store.upDDData}
            leData={store.leData} upLeData={store.upLeData} year={store.year} month={store.month}
            setMonth={store.setMonth} setYear={store.setYear}
            locked={store.nextChot} ddLockReason={store.nextChot} isWide={isWide} ym={store.ym}
            isGV={isGV} gvLopId={gvLopId} gvTen={gvTen} students={students} 
            onSelectStudent={setViewStudentId}
          />
        )}
        
        {/* ===== TAB PHIẾU THU: In đơn + In theo lớp ===== */}
                {/* ===== TAB PHIẾU THU: In đơn + In theo lớp ===== */}
               {/* ===== TAB IN HỌC PHÍ ===== */}
        {tab === "phieu" && store.mData && (
          <PhieuThuManager
            allRows={store.allRows}
            meta={meta}
            month={store.month}
            year={store.year}
            mData={store.mData}
            upMData={store.upMData}
            upMeta={store.upMeta}
            phieuId={phieuId}
            clearPhieuId={() => setPhieuId(null)}
          />
        )}
        
        {tab === "dash" && store.mData && (
          <DashTab tk={store.tk} mData={store.mData} upMData={store.upMData} month={store.month} year={store.year} locked={store.locked} meta={meta} allRows={store.allRows} delThang={store.delThang} students={students} ym={store.ym} upMeta={store.upMeta} setTab={setTab} />
        )}
        
        {tab === "no" && (
          <CongNoTab students={students} meta={meta} ym={store.ym} mData={store.mData} />
        )}
        
        {tab === "caidat" && (
          <CaiDat meta={meta} upMeta={store.upMeta} students={students} upStudents={store.upStudents} ym={store.ym} reseedAll={store.reseedAll} isWide={isWide} />
        )}

        {tab === "hs" && (
          <HocSinhTab 
            meta={meta} 
            students={students} 
            upStudents={store.upStudents} 
            ym={store.ym} 
            store={store}
            isWide={isWide}
            openStudentProfile={setViewStudentId} 
          />
        )}

        {tab === "more" && (
          <MoreMenu setTab={setTab} onLogout={logout} />
        )}

        {["thu", "phieu", "dash", "no", "caidat"].includes(tab) && !store.mData && !["caidat", "no", "more", "hs"].includes(tab) && (
          <div className="no-print" style={{ background: C.card, borderRadius: 16, padding: 28, textAlign: "center", border: `1px dashed ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}><Icon name="calendarCheck" size={36} color={C.gray} strokeWidth={1.6} /></div>
            <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Tháng {store.month}/{store.year} chưa có dữ liệu</div>
            {isAdmin ? (
              <>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>Tạo bảng thu cho HS đang học.</div>
                <button onClick={store.taoThang} style={{ background: C.pine, color: "#fff", padding: "11px 24px", borderRadius: 99, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: font.display }}>+ Tạo tháng {store.month}/{store.year}</button>
              </>
            ) : (
              <div style={{ fontSize: 13, color: C.sub }}>Vui lòng liên hệ kế toán để tạo bảng thu.</div>
            )}
          </div>
        )}
      </div>

      <div className="no-print" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.card, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "center", zIndex: 20 }}>
        <div style={{ display: "flex", width: "100%", maxWidth: 640 }}>
          {(isAdmin 
            ? [["home", "Trang chủ", "home"], ["thu", "Thu phí", "wallet"], ["dd", "Điểm danh", "calendarCheck"], ["hs", "Học sinh", "users"], ["more", "Thêm", "more"]] 
            : [["home", "Trang chủ", "home"], ["dd", "Điểm danh", "calendarCheck"], ["hs", "Học sinh", "users"], ["more", "Thêm", "more"]]
          ).map(([id, lb, ic]) => (
            <button 
              key={id} 
              onClick={() => setTab(id)} 
              style={{ flex: 1, padding: "8px 0 10px", border: "none", background: "none", cursor: "pointer", color: tab === id ? C.pine : C.gray, fontFamily: font.body, fontSize: 10, fontWeight: tab === id ? 700 : 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
            >
              <Icon name={ic} size={22} color={tab === id ? C.pine : C.gray} strokeWidth={tab === id ? 2.4 : 2} />{lb}
            </button>
          ))}
        </div>
      </div>

      <BottomSheet open={monthPickerOpen} onClose={() => setMonthPickerOpen(false)} title="Chọn tháng xem báo cáo">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(() => {
            const base = new Date();
            const items = [];
            for (let i = -1; i <= 17; i++) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); items.push({ m: d.getMonth() + 1, y: d.getFullYear() }); }
            return items.map(({ m, y }) => {
              const active = m === store.month && y === store.year;
              const isNow = m === base.getMonth() + 1 && y === base.getFullYear();
              return (
                <button key={`${y}-${m}`} onClick={() => { store.setMonth(m); store.setYear(y); setMonthPickerOpen(false); }} style={{ flex: "1 1 28%", minWidth: 96, padding: "11px 6px", borderRadius: 11, border: `1.5px solid ${active ? C.pine : C.line}`, background: active ? C.pine : C.card, color: active ? "#fff" : C.ink, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  Th{m}/{y}
                  {isNow && <span style={{ fontSize: 9.5, fontWeight: 600, color: active ? "#fff" : C.green }}>● hiện tại</span>}
                </button>
              );
            });
          })()}
        </div>
        <button onClick={() => setMonthPickerOpen(false)} style={{ width: "100%", marginTop: 14, padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Xong</button>
      </BottomSheet>

      {isAdmin && (
        <NotificationSheet open={notifOpen} onClose={() => setNotifOpen(false)} alerts={sysAlerts} onAction={handleNotifAction} />
      )}

      {viewStudentId && (
        <StudentProfile studentId={viewStudentId} store={store} onBack={() => setViewStudentId(null)} />
      )}
      
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
