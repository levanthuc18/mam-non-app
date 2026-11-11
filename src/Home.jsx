import { useState, useEffect, useMemo } from "react";
import { C, font, sGetSafe, toast, TT_THU_PHI, lopOfMonth } from "./lib.js";
import { Card, BottomSheet, Ring, Bar, mauTheoTyLe, Segmented } from "./ui.jsx";
import { Icon } from "./Icon.jsx";
import { ClassAnimal } from "./Brand.jsx";

const RING = 112; // cỡ vòng tròn dùng chung cho 2 thẻ (thẳng hàng, đối xứng)

const statRowStyles = {
  wrapper: { display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 11, height: 11, borderRadius: 99, flexShrink: 0 },
  label: { fontSize: 15, color: C.ink, whiteSpace: "nowrap" },
  value: { marginLeft: "auto", fontFamily: font.display, fontWeight: 800, fontSize: 19, color: C.ink }
};

function StatRow({ color, label, value }) {
  return (
    <div style={statRowStyles.wrapper}>
      <span style={{ ...statRowStyles.dot, background: color }} />
      <span style={statRowStyles.label}>{label}</span>
      <span style={statRowStyles.value}>{value}</span>
    </div>
  );
}


// Ô số nhanh (cùng kiểu thẻ với Tile)
// Ô số: nền Soft + chữ số/biểu tượng cùng tông (giống các ô Phải thu / Đã thu / Còn nợ ở Thu phí); biểu tượng nằm trong vòng tròn trắng
function Kpi({ name, tint, iconColor, value, label, style, sub, subColor, onClick }) {
  return (
    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} onKeyDown={onClick ? (ev) => { if (ev.key === "Enter") onClick(); } : undefined}
      style={{ background: tint, border: `1px solid ${C.line}`, borderRadius: 18, padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0, cursor: onClick ? "pointer" : "default", ...style }}>
      <div style={{ minWidth: 0 }}>
        <div className="kpi-nhan" style={{ fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{label}</div>
        <div className="kpi-val" style={{ fontFamily: font.display, fontWeight: 800, fontSize: "clamp(17px, 1.6vw, 22px)", color: iconColor, lineHeight: 1.15, whiteSpace: "nowrap", marginTop: 1 }}>{value}</div>
        {sub && <div className="kpi-phu" style={{ fontSize: 11.5, color: subColor || C.sub, marginTop: 1, fontWeight: 600 }}>{sub}</div>}
      </div>
      <div className="kpi-ic" style={{ width: 36, height: 36, borderRadius: 99, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={name} size={19} color={iconColor} />
      </div>
    </div>
  );
}

// Biểu đồ thanh ngang xếp chồng theo lớp: số nằm NGAY TRÊN từng đoạn (Đi học / Chưa điểm danh / Nghỉ), có trục số bên dưới (màu theo bảng màu của app)
export function ClassBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.di + r.chua + r.nghi));
  const step = max <= 20 ? 5 : 10;
  const scale = Math.max(step, Math.ceil(max / step) * step);
  const ticks = []; for (let v = 0; v <= scale; v += step) ticks.push(v);
  // Thanh: nền nhạt (Soft) + số và viền cùng tông chữ — cùng quy tắc màu với bảng Thu phí
  const seg = (n, bg, fg) => n > 0 && (
    <div style={{ width: `${n / scale * 100}%`, background: bg, color: fg, border: `1px solid color-mix(in srgb, ${fg} 35%, transparent)`, boxSizing: "border-box", borderRadius: 99, minWidth: 22, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 800, fontSize: 11, lineHeight: 1 }}>{n}</div>
  );
  const lab = { width: 112, flexShrink: 0 };
  return (
    <div>
      {rows.map((r, i) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ ...lab, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <ClassAnimal name={r.ten} index={i} size={22} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.ten}</span>
          </div>
          <div style={{ flex: 1, minWidth: 60, height: 16, display: "flex", gap: 2 }}>
            {seg(r.di, C.greenSoft, C.greenText)}
            {seg(r.chua, C.amberSoft, C.amberText)}
            {seg(r.nghi, C.coralSoft, C.coralText)}
          </div>
        </div>
      ))}
      {/* Trục số */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={lab} />
        <div style={{ flex: 1, position: "relative", height: 16 }}>
          {ticks.map((v) => (
            <span key={v} style={{ position: "absolute", left: `${v / scale * 100}%`, transform: v === 0 ? "none" : v === scale ? "translateX(-100%)" : "translateX(-50%)", fontSize: 11, color: C.sub }}>{v}</span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 8, fontSize: 12, color: C.sub }}>
        {[["Đi học", C.greenText], ["Chưa điểm danh", C.amberText], ["Nghỉ", C.coralText]].map(([l, c]) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 99, background: c }} />{l}</span>
        ))}
      </div>
    </div>
  );
}

// ===== Thẻ điểm danh =====
function AttendanceCard({ today, month, onDetail, classRows, flat }) {
  const [tab, setTab] = useState("today");
  const currentData = tab === "today" ? today : month;
  const ringColor = currentData.ghost ? C.gray : currentData.pct >= 90 ? C.green : currentData.pct >= 70 ? C.amber : C.coral;

  return (
    <Card style={{ padding: 16, borderRadius: 20, marginBottom: flat ? 0 : C.md }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8, height: 38 }}>
        <Segmented small items={[["today", "Hôm nay"], ["month", "Tháng này"]]} value={tab} onChange={setTab} />
        <button onClick={onDetail} style={{ border: "none", background: "none", cursor: "pointer", color: C.pine, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 2, flexShrink: 0, whiteSpace: "nowrap" }}>
          Chi tiết <Icon name="chevronRight" size={15} color={C.pine} />
        </button>
      </div>

      {/* Body: Vòng tròn + Cột số liệu (Tiến độ + Đi học + Nghỉ) */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Ring pct={currentData.pct} color={ringColor} isGhost={!!currentData.ghost} size={RING} sub="Đi học" />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {currentData.ghost ? (
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5 }}>{currentData.ghost}</div>
          ) : (
            <>
              {/* Tiến độ — căn lề trái với Đi học/Nghỉ */}
              {currentData.note && (
                <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700, color: currentData.noteColor || C.sub }}>
                  {currentData.noteIcon && <Icon name={currentData.noteIcon} size={14} color={currentData.noteColor || C.sub} style={{ marginRight: 5, verticalAlign: "middle" }} />}
                  {currentData.note}
                </div>
              )}
              <StatRow color={C.green} label="Đi học" value={currentData.di} />
              <div style={{ height: 6 }} />
              <StatRow color={C.coral} label="Nghỉ" value={currentData.nghi} />
            </>
          )}
        </div>
      </div>

      {tab === "today" && classRows && classRows.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 10 }}>Tình hình điểm danh theo lớp</div>
          {new URLSearchParams(window.location.search).get("mau") === "1" && <div style={{ marginBottom: 10, padding: "6px 10px", borderRadius: 8, background: C.coralSoft, color: C.coralText, fontSize: 12.5, fontWeight: 700 }}>SỐ MẪU để xem giao diện — không phải dữ liệu thật. Bỏ ?mau=1 khỏi địa chỉ để xem số thật.</div>}
          <ClassBars rows={classRows} />
        </div>
      )}
    </Card>
  );
}

// ===== Thẻ "Tổng quan vận hành" (máy tính, cạnh thẻ điểm danh): tỉ lệ thu + tiến độ thu theo lớp =====
export function VanHanhCard({ month, year, can, da, rows, onDetail }) {
  const pct = can > 0 ? Math.min(100, Math.round(da / can * 100)) : 0;
  const mau = mauTheoTyLe(pct);
  const tile = (bg, lab, val, sub, subColor) => (
    <div style={{ flex: "1 1 130px", minWidth: 0, background: bg, borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 13, color: C.sub }}>{lab}</div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: "clamp(15px, 1.6vw, 22px)", color: C.ink, marginTop: 4, whiteSpace: "nowrap" }}>{val}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: subColor || C.sub, marginTop: 2, minHeight: 15 }}>{sub || " "}</div>
    </div>
  );
  const vnd = (n) => (n || 0).toLocaleString("vi-VN") + "đ";
  return (
    <Card style={{ padding: 16, borderRadius: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8, height: 38 }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 17, color: C.ink, minWidth: 0 }}>Tổng quan vận hành — T{month}/{year}</div>
        <button onClick={onDetail} style={{ border: "none", background: "none", cursor: "pointer", color: C.pine, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 2, flexShrink: 0, whiteSpace: "nowrap" }}>
          Chi tiết <Icon name="chevronRight" size={15} color={C.pine} />
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "stretch", gap: 14, minHeight: RING }}>
        <div style={{ display: "flex", alignItems: "center" }}><Ring pct={pct} color={mau} sub="Đã thu" size={RING} /></div>
        {tile(C.amberSoft, "Cần thu", vnd(can), "tổng phải thu tháng này")}
        {tile(pct >= 80 ? C.greenSoft : pct >= 50 ? C.amberSoft : C.coralSoft, "Đã thu", vnd(da), `${pct}% kế hoạch`, pct >= 80 ? C.greenText : pct >= 50 ? C.amberText : C.coralText)}
      </div>
      {rows.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 10 }}>Tiến độ thu theo lớp</div>
          {rows.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 112, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <ClassAnimal name={r.ten} index={i} size={22} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.ten}</span>
              </div>
              <span style={{ width: 48, flexShrink: 0, fontSize: 12, color: C.sub }}>{r.hs} HS</span>
              <Bar pct={r.pct} color={C.pine} h={12} style={{ flex: 1, minWidth: 60 }} />
              <span style={{ width: 40, textAlign: "right", fontSize: 12.5, color: C.sub, fontWeight: 600 }}>{r.pct}%</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Tỷ lệ đã thu trên tổng phải thu của từng lớp</div>
        </div>
      )}
    </Card>
  );
}

// 3. COMPONENT TILE MỚI
function Tile({ name, tint, iconColor, title, sub, onClick }) {
  return (
    <button onClick={onClick} className="active-press-shadow" style={{
      minWidth: 0, background: C.card, border: `1px solid ${C.line}`, borderRadius: 20,
      padding: 16, textAlign: "left", cursor: "pointer", boxShadow: "0 2px 10px rgba(20,60,48,.05)",
      display: "flex", flexDirection: "column", gap: 12,
      width: "100%",
      transition: "transform 0.1s ease"
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={name} size={22} color={iconColor} />
      </div>
      <div style={{ minWidth: 0, width: "100%" }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ 
          fontSize: 12.5, color: C.sub, marginTop: 4, fontWeight: 600,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", whiteSpace: "normal" 
        }}>{sub}</div>
      </div>
    </button>
  );
}

// Giữ lại AlertRow để dự phòng
function AlertRow({ type, message, actionLabel, onAction }) {
  const colors = useMemo(() => ({
    danger: { bg: C.coralSoft, border: `${C.line}`, fg: C.coral, btn: C.coral },
    warning: { bg: C.amberSoft, border: `${C.line}`, fg: C.amber, btn: C.amber },
  }), []);
  const c = colors[type] || colors.warning;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: C.r, padding: C.md, marginBottom: C.sm, display: "flex", alignItems: "center", gap: C.md }}>
      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: c.fg }}>{message}</div>
      <button onClick={onAction} style={{ flexShrink: 0, padding: "10px 16px", borderRadius: 12, border: "none", background: c.btn, color: C.onFill, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{actionLabel}</button>
    </div>
  );
}

function RecentActivity({ onSeeAll }) {
  const [log, setLog] = useState([]);
  useEffect(() => { 
    sGetSafe("mn5:log").then(r => { if (r.ok) setLog((r.value || []).slice(0, 5)); }); // lỗi → giữ [] ban đầu, không hiện sai
  }, []);

  if (!log.length) return null;
  return (
    <Card style={{ marginBottom: C.md, padding: C.md, borderRadius: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: C.sm }}>Hoạt động gần đây</div>
      {log.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: C.sm, height: 46, borderBottom: i < log.length - 1 ? `1px solid ${C.line}` : "none" }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.sub, whiteSpace: "nowrap" }}>{new Date(e.t).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ fontSize: 13, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <b style={{ color: e.who === "Admin" ? C.pine : C.blueAText }}>{e.who}</b> · {e.act}
          </span>
        </div>
      ))}
      <button onClick={onSeeAll} style={{ width: "100%", marginTop: C.sm, padding: "8px 0", background: "none", border: "none", color: C.pine, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Xem tất cả nhật ký ›</button>
    </Card>
  );
}

// ===== Component chính =====
export function HomeTab({ store, auth, setTab, setThuFilter, openStudentProfile, baoPendingCount = 0 }) {
  const { allRows, students, meta, month, year, ddData, leData } = store;
  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";
  const gvLopId = auth?.lopId;

  const today = useMemo(() => new Date(), []);
  const todayStr = today.getDate();
  const ymStr = `${year}-${String(month).padStart(2, '0')}`;

  const { visibleStudents, visibleRows } = useMemo(() => {
    const vStudents = isGV ? students.filter(s => lopOfMonth(s, ymStr) === gvLopId) : students;
    const vRows = isGV ? allRows.filter(r => r.lopId === gvLopId) : allRows;
    return { visibleStudents: vStudents, visibleRows: vRows };
  }, [isGV, students, allRows, ymStr, gvLopId]);

  const recRows0 = useMemo(() => visibleRows.filter((r) => r.coRec), [visibleRows]);

  const finances = useMemo(() => {
    const canThuAll = recRows0.reduce((a, r) => a + r.tongPhaiThu, 0);
    const daThuAll = recRows0.reduce((a, r) => a + (r.rec.thucThu || 0), 0);
    const noRows = recRows0.filter((r) => r.conNo > 0);
    const soPhieu = recRows0.filter((r) => (r.rec.thucThu || 0) > 0).length;
    const chuaThu = recRows0.filter((r) => r.ps.tong > 0 && (r.rec.thucThu || 0) === 0).length;
    const ngayAn0 = recRows0.filter((r) => r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec.ngayAn || 0) === 0).length;
    return { canThuAll, daThuAll, noRows, soPhieu, chuaThu, ngayAn0 };
  }, [recRows0]);

  const dashTong = visibleStudents.length;
  const dashDangHoc = useMemo(() => visibleStudents.filter((s) => s.trangThai === "Đang học").length, [visibleStudents]);

  const clsOf = (s) => lopOfMonth(s, ymStr);
  const activeStudents = useMemo(() => visibleStudents.filter(s => TT_THU_PHI[s.trangThai]), [visibleStudents]);
  const classesWithStudents = useMemo(() => [...new Set(activeStudents.map(clsOf))].filter(Boolean), [activeStudents]);
  const M = isGV ? 1 : classesWithStudents.length;

  const [ddtsToday, setDdtsToday] = useState(null);
  useEffect(() => {
    let alive = true;
    sGetSafe(`mn5:ddts:${ymStr}`).then((r) => {
      if (!alive) return;
      // lỗi → {} (coi như "chưa ai điểm danh hôm nay"): chỉ ảnh hưởng banner nhắc việc, không phải số tiền.
      setDdtsToday(r.ok ? ((r.value && r.value[todayStr]) || {}) : {});
    });
    return () => { alive = false; };
  }, [ymStr, todayStr]);

  const todayStats = useMemo(() => {
    const confirmedSet = new Set(Object.keys(ddtsToday || {}).filter(id => isGV ? id === gvLopId : classesWithStudents.includes(id)));
    const N = confirmedSet.size;
    const allConfirmed = M > 0 && N >= M;
    const confirmedActive = activeStudents.filter(s => confirmedSet.has(clsOf(s)));
    const nghiHomNay = confirmedActive.filter(s => ddData?.[s.id]?.[todayStr]).length;
    const diHocHomNay = confirmedActive.length - nghiHomNay;
    const pctToday = confirmedActive.length > 0 ? Math.round(diHocHomNay / confirmedActive.length * 100) : 0;
    return { N, allConfirmed, nghiHomNay, diHocHomNay, pctToday };
  }, [ddtsToday, isGV, gvLopId, classesWithStudents, M, activeStudents, ddData, todayStr]);

  const monthStats = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    const lastDay = isCurMonth ? todayStr : daysInMonth;
    let schoolDays = 0, absMonth = 0;
    for (let d = 1; d <= lastDay; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      if (dow === 0 || leData?.[d]) continue;
      schoolDays++;
      absMonth += activeStudents.filter(s => ddData?.[s.id]?.[d]).length;
    }
    const monthTotal = schoolDays * dashDangHoc;
    const diMonth = Math.max(0, monthTotal - absMonth);
    const pctMonth = monthTotal > 0 ? Math.round(diMonth / monthTotal * 100) : 0;
    return { absMonth, diMonth, pctMonth };
  }, [year, month, today, todayStr, leData, activeStudents, ddData, dashDangHoc]);

  const [desk, setDesk] = useState(typeof window !== "undefined" && window.innerWidth >= 1024);
  useEffect(() => { const h = () => setDesk(window.innerWidth >= 1024); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);

  // Mỗi lớp: lớp đã xác nhận điểm danh hôm nay → Đi học + Nghỉ; chưa xác nhận → cả lớp là "Chưa điểm danh" (app chỉ đánh nghỉ, nên tính theo lớp)
  const xemMau = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mau") === "1"; // ?mau=1 → số GIẢ để xem giao diện, không ghi gì
  const classRows = useMemo(() => {
    if (isGV) return [];
    return (meta?.classes || []).map((c, ci) => {
      const ss = activeStudents.filter((s) => clsOf(s) === c.id);
      if (ss.length === 0) return null;
      const xacNhan = !!(ddtsToday || {})[c.id];
      // Nghỉ = số em ĐÃ đánh nghỉ hôm nay (lưu ngay khi đánh, không cần chờ xác nhận); lớp đã xác nhận → còn lại là Đi học; chưa xác nhận → còn lại là Chưa điểm danh
      if (xemMau) { // số giả theo sĩ số thật: lớp 1 đã xác nhận + 3 nghỉ, lớp 2 chưa xác nhận + 2 nghỉ, lớp 3 đã xác nhận đủ…
        const ng = [3, 2, 0][ci % 3] > ss.length ? 0 : [3, 2, 0][ci % 3], xn = ci % 3 !== 1;
        return { id: c.id, ten: c.ten, di: xn ? ss.length - ng : 0, chua: xn ? 0 : ss.length - ng, nghi: ng };
      }
      const nghi = ss.filter((s) => ddData?.[s.id]?.[todayStr]).length;
      return { id: c.id, ten: c.ten, di: xacNhan ? ss.length - nghi : 0, chua: xacNhan ? 0 : ss.length - nghi, nghi };
    }).filter(Boolean);
  }, [isGV, meta, activeStudents, ddtsToday, ddData, todayStr, xemMau]);

  // Tiến độ thu theo lớp (đã thu / cần thu của từng lớp)
  const thuRows = useMemo(() => {
    if (isGV) return [];
    return (meta?.classes || []).map((c) => {
      const rr = recRows0.filter((r) => r.lopId === c.id);
      if (rr.length === 0) return null;
      const can = rr.reduce((a, r) => a + r.tongPhaiThu, 0), da = rr.reduce((a, r) => a + (r.rec.thucThu || 0), 0);
      return { id: c.id, ten: c.ten, hs: rr.length, pct: can > 0 ? Math.min(100, Math.round(da / can * 100)) : 0 };
    }).filter(Boolean);
  }, [isGV, meta, recRows0]);

  const [logOpen, setLogOpen] = useState(false);
  const [fullLog, setFullLog] = useState([]);
  const openFullLog = async () => {
    const r = await sGetSafe("mn5:log");
    if (!r.ok) { toast("Không tải được nhật ký (mạng/phiên)."); return; }
    setFullLog(r.value || []);
    setLogOpen(true);
  };

  const vnd = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

  const { N, allConfirmed, nghiHomNay, diHocHomNay, pctToday } = todayStats;
  const { absMonth, diMonth, pctMonth } = monthStats;
  const { daThuAll, noRows, soPhieu, chuaThu, ngayAn0 } = finances;

  // Engine tự động tính "Việc cần xử lý hôm nay"
  const todayTasks = useMemo(() => {
    const tasks = [];
    const deadline = meta?.deadlineThuPhi || 10; 
    const currentDay = today.getDate();

    if (!isAdmin) return tasks;

    if (N < M) {
      tasks.push({
        id: "task_dd",
        type: "danger",
        text: `${M - N} lớp chưa hoàn thành điểm danh hôm nay`,
        action: () => setTab("dd")
      });
    }

    if (chuaThu > 0) {
      const isOverdue = currentDay > deadline;
      tasks.push({
        id: "task_thu",
        type: isOverdue ? "danger" : "warning",
        text: `${chuaThu} học sinh chưa đóng học phí (Hạn:${deadline}/${month})`,
        action: () => { setTab("thu"); setThuFilter("chuaThu"); }
      });
    }

    if (ngayAn0 > 0) {
      tasks.push({
        id: "task_ngayan",
        type: "warning",
        text: `${ngayAn0} học sinh chưa được cấu hình tính tiền ăn`,
        action: () => setTab("thu")
      });
    }

    if (baoPendingCount > 0) {
      tasks.push({
        id: "task_bao",
        type: "warning",
        text: `${baoPendingCount} báo từ Giáo viên chờ duyệt`,
        action: () => setTab("caidat")
      });
    }

    return tasks;
  }, [isAdmin, N, M, chuaThu, ngayAn0, baoPendingCount, meta, today, month, setTab, setThuFilter]);

  // Số học sinh chưa điểm danh = học sinh của các lớp CHƯA xác nhận hôm nay (app chỉ đánh nghỉ nên tính theo lớp)
  const nghiTong = isGV ? activeStudents.filter((s) => ddData?.[s.id]?.[todayStr]).length : classRows.reduce((a, r) => a + r.nghi, 0);
  const diTong = isGV ? diHocHomNay : classRows.reduce((a, r) => a + r.di, 0);
  const chuaDD = isGV ? (N >= 1 ? 0 : activeStudents.length - nghiTong) : classRows.reduce((a, r) => a + r.chua, 0);

  return (
    <div style={{ paddingBottom: C.lg, marginTop: C.md }}>
      {isAdmin ? (
        <div className="kpi-row" style={{ gap: C.md, marginBottom: C.md }}>
          {(() => {
            const gon = (n) => { n = n || 0; return n >= 1e9 ? (n / 1e9).toFixed(2).replace(".", ",") + " tỷ" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(".", ",") + " tr" : n.toLocaleString("vi-VN") + " đ"; };
            const conNoAll = recRows0.reduce((a, r) => a + Math.max(0, r.conNo), 0);
            const daChi = (store.tk?.traA || 0) + (store.tk?.traB || 0), phaiChi = (store.tk?.chiA || 0) + (store.tk?.chiB || 0);
            const mauDD = nghiTong > 0 ? [C.coralSoft, C.coral, C.coralText] : N < M ? [C.amberSoft, C.amber, C.amberText] : [C.greenSoft, C.green, C.greenText];
            return (<>
              <Kpi name="school" tint={C.pineSoft} iconColor={C.pine} value={dashTong} label="Tổng số bé" sub={`${dashDangHoc} đang học`} onClick={() => setTab("hs")} />
              <Kpi name="check" tint={mauDD[0]} iconColor={mauDD[1]} value={`${diTong}/${diTong + chuaDD + nghiTong}`} label="Đi học hôm nay" sub={nghiTong > 0 ? `${nghiTong} bé nghỉ` : N < M ? `${M - N} lớp chưa điểm danh` : `${N}/${M} lớp đã điểm danh`} subColor={mauDD[2]} onClick={() => setTab("dd")} />
              <Kpi name="coins" tint={C.coralSoft} iconColor={C.coral} value={gon(conNoAll)} label="Còn phải thu" sub={`${noRows.length} em còn nợ`} subColor={noRows.length > 0 ? C.coralText : C.greenText} onClick={() => setTab("no")} />
              <Kpi name="wallet" tint={C.violetBSoft} iconColor={C.violetB} value={daChi > 0 ? gon(daChi) : "—"} label="Đã chi tháng này" sub={phaiChi > 0 ? `Phải chi ${gon(phaiChi)}` : "chưa nhập chi tháng này"} onClick={() => setTab("cp")} />
            </>);
          })()}
        </div>
      ) : (
      <div className={desk ? "kpi-row" : undefined} style={desk ? { gap: C.md, marginBottom: C.md, "--kpi-n": isAdmin ? 4 : 4 } : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: C.md, marginBottom: C.md }}>
        <Kpi name="school" tint={C.pineSoft} iconColor={C.pine} value={dashTong} label="Tổng số bé" />
        <Kpi name="check" tint={C.greenSoft} iconColor={C.green} value={diTong} label="Đi học hôm nay" />
        <Kpi name="clock" tint={C.amberSoft} iconColor={C.amber} value={chuaDD} label="Chưa điểm danh" />
        <Kpi name="x" tint={C.coralSoft} iconColor={C.coral} value={nghiTong} label="Nghỉ hôm nay" />
        {isAdmin && <Kpi name="wallet" tint={C.orangeSoft} iconColor={C.orange} value={vnd(daThuAll)} label="Đã thu tháng này" style={desk ? undefined : { gridColumn: "1 / -1" }} />}
      </div>
      )}

      <div style={{ display: desk && isAdmin ? "grid" : "block", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))", gap: C.md, alignItems: "start", marginBottom: C.md }}>
      <AttendanceCard
        classRows={isAdmin ? classRows : null}
        today={{
          pct: pctToday, di: diHocHomNay, nghi: nghiHomNay,
          ghost: N === 0 ? (isGV ? "Lớp chưa điểm danh hôm nay." : "Chưa lớp nào điểm danh hôm nay.") : null,
          note: isGV ? (N >= 1 ? "Đã điểm danh hôm nay" : "Chưa điểm danh") : `${N}/${M} lớp đã điểm danh`,
          noteColor: (isGV ? N >= 1 : allConfirmed) ? C.green : C.amber,
          noteIcon: (isGV ? N >= 1 : allConfirmed) ? "check" : null,
        }}
        month={{ pct: pctMonth, di: diMonth, nghi: absMonth, note: "Đã trừ Chủ nhật & ngày lễ", noteColor: C.sub }}
        onDetail={() => setTab("dd")}
        flat={desk && isAdmin}
      />
        {isAdmin && <VanHanhCard month={month} year={year} can={finances.canThuAll} da={daThuAll} rows={thuRows} onDetail={() => setTab("dash")} />}
      </div>

      {/* UI Khu vực "Việc cần xử lý hôm nay" */}
      {isAdmin && todayTasks.length > 0 && (
        <Card style={{ padding: 16, borderRadius: 20, marginBottom: C.md, border: `1px solid ${C.line}` }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: C.sub, marginBottom: 8, letterSpacing: "0.5px", display:"flex", alignItems:"center", gap:6 }}><Icon name="clipboard" size={14} color={C.sub} /> VIỆC CẦN XỬ LÝ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {todayTasks.map((t) => (
                <div key={t.id} onClick={t.action} className="active-press-shadow" style={{ 
                display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, 
                background: t.type === "danger" ? C.coralSoft : C.amberSoft, cursor: "pointer", transition: "transform 0.1s ease" 
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: t.type === "danger" ? C.coral : C.amber, flexShrink: 0 }} />
                 <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{t.text}</div>
                <Icon name="chevronRight" size={14} color={C.sub} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lối tắt: chỉ giữ mục KHÔNG có trên thanh bên (máy tính) / thanh tab đáy (điện thoại) */}
      {!desk && isAdmin && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: C.md, marginBottom: C.lg }}>
        {isAdmin && (
          <>
            <Tile name="coins" tint={C.orangeSoft} iconColor={C.orange} title="Công nợ" sub={`${noRows.length} học sinh`} onClick={() => setTab("no")} />
            <Tile name="barChart" tint={C.orangeSoft} iconColor={C.orange} title="Báo cáo" sub="Xem chi tiết" onClick={() => setTab("dash")} />
          </>
        )}
        {isAdmin && (
          <Tile name="receipt" tint={C.orangeSoft} iconColor={C.orange} title="Phiếu thu" sub={`${soPhieu} đã thu`} onClick={() => setTab("phieu")} />
        )}
      </div>}

      {isAdmin && <RecentActivity onSeeAll={openFullLog} />}

      <BottomSheet open={logOpen} onClose={() => setLogOpen(false)} title="Nhật ký thao tác">
        {fullLog.length === 0 ? <div style={{ textAlign: "center", color: C.sub, padding: 20 }}>Chưa có dữ liệu</div> : (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {fullLog.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: C.md, padding: `${C.md}px 0`, fontSize: 13, borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.sub, whiteSpace: "nowrap", minWidth: 100 }}>{new Date(e.t).toLocaleString("vi-VN")}</span>
                <span style={{ color: C.ink }}><b style={{ color: e.who === "Admin" ? C.pine : C.blueAText }}>{e.who}</b> · {e.act}</span>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
