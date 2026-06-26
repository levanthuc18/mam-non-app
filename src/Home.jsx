import { useState, useEffect, useMemo } from "react";
import { C, font, sGet, TT_THU_PHI, lopOfMonth } from "./lib.js";
import { Card, BottomSheet } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

// ===== Vòng tròn tỉ lệ đi học =====
const ringTextStyle = (size) => ({
  fontFamily: font.display,
  fontWeight: 800,
  fontSize: size * 0.27,
  fill: C.ink
});
const ringSubTextStyle = (size) => ({ fontSize: size * 0.125, fill: C.sub });

function Ring({ pct, color, size = 96, stroke = 11 }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={C.line} strokeWidth={stroke} />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cx})`} />
      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" style={ringTextStyle(size)}>{pct}%</text>
      <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" style={ringSubTextStyle(size)}>Đi học</text>
    </svg>
  );
}

const statRowStyles = {
  wrapper: { display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 11, height: 11, borderRadius: 99, flexShrink: 0 },
  label: { fontSize: 15, color: C.ink },
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

// ===== Thẻ điểm danh (donut + Đi học / Nghỉ) =====
function AttendanceCard({ today, month, onDetail }) {
  const [tab, setTab] = useState("today");
  const currentData = tab === "today" ? today : month;
  const ringColor = currentData.ghost ? C.gray : currentData.pct >= 90 ? C.green : currentData.pct >= 70 ? C.amber : C.coral;
  
  return (
    <Card style={{ padding: 16, borderRadius: 20, marginBottom: C.md }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: C.graySoft, borderRadius: 99, padding: 3 }}>
          {[["today", "Hôm nay"], ["month", "Tháng này"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ 
              border: "none", cursor: "pointer", borderRadius: 99, padding: "6px 13px", 
              fontFamily: font.display, fontWeight: 700, fontSize: 13, 
              background: tab === k ? C.pine : "transparent", 
              color: tab === k ? "#fff" : C.sub 
            }}>{l}</button>
          ))}
        </div>
        <button onClick={onDetail} style={{ border: "none", background: "none", cursor: "pointer", color: C.pine, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          Chi tiết <Icon name="chevronRight" size={15} color={C.pine} />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Ring pct={currentData.pct} color={ringColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {currentData.ghost ? (
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.5 }}>{currentData.ghost}</div>
          ) : (
            <>
              <StatRow color={C.green} label="Đi học" value={currentData.di} />
              <div style={{ height: 12 }} />
              <StatRow color={C.coral} label="Nghỉ" value={currentData.nghi} />
            </>
          )}
        </div>
      </div>
      {currentData.note && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: currentData.noteColor || C.sub }}>
          {currentData.noteIcon && <Icon name={currentData.noteIcon} size={15} color={currentData.noteColor || C.sub} />}{currentData.note}
        </div>
      )}
    </Card>
  );
}

// ===== Ô chức năng (icon nét trong nền mềm) =====
const tileStyle = {
  flex: "1 1 44%", minWidth: 0, background: C.card, border: `1px solid ${C.line}`, borderRadius: 20,
  padding: 16, textAlign: "left", cursor: "pointer", boxShadow: "0 2px 10px rgba(20,60,48,.05)",
  display: "flex", flexDirection: "column", gap: 12,
};

function Tile({ name, tint, iconColor, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={tileStyle}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={name} size={22} color={iconColor} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
      </div>
    </button>
  );
}

// ===== Cảnh báo =====
function AlertRow({ type, message, actionLabel, onAction }) {
  const colors = useMemo(() => ({
    danger: { bg: C.coralSoft, border: "#FFD7D7", fg: C.coral, btn: "#E4573D" },
    warning: { bg: C.amberSoft, border: "#EAD8A0", fg: "#7A5E12", btn: C.amber },
  }), []);
  const c = colors[type] || colors.warning;
  
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: C.r, padding: C.md, marginBottom: C.sm, display: "flex", alignItems: "center", gap: C.md }}>
      <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: c.fg }}>{message}</div>
      <button onClick={onAction} style={{ flexShrink: 0, padding: "10px 16px", borderRadius: 12, border: "none", background: c.btn, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{actionLabel}</button>
    </div>
  );
}

function RecentActivity({ onSeeAll }) {
  const [log, setLog] = useState([]);
  useEffect(() => { 
    sGet("mn5:log").then(d => setLog((d || []).slice(0, 5))).catch(() => {}); 
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
            <b style={{ color: e.who === "Admin" ? C.pine : C.blueA }}>{e.who}</b> · {e.act}
          </span>
        </div>
      ))}
      <button onClick={onSeeAll} style={{ width: "100%", marginTop: C.sm, padding: "8px 0", background: "none", border: "none", color: C.pine, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Xem tất cả nhật ký ›</button>
    </Card>
  );
}

// ===== Component chính =====
export function HomeTab({ store, auth, setTab, setThuFilter, openStudentProfile }) {
  const { allRows, students, month, year, ddData, leData } = store;
  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";
  const gvLopId = auth?.lopId;

  // Khai báo 1 lần object Date duy nhất
  const today = useMemo(() => new Date(), []);
  const todayStr = today.getDate();
  const ymStr = `${year}-${String(month).padStart(2, '0')}`;

  // 1. Lọc dữ liệu cơ bản theo quyền
  const { visibleStudents, visibleRows } = useMemo(() => {
    const vStudents = isGV ? students.filter(s => lopOfMonth(s, ymStr) === gvLopId) : students;
    const vRows = isGV ? allRows.filter(r => r.lopId === gvLopId) : allRows;
    return { visibleStudents: vStudents, visibleRows: vRows };
  }, [isGV, students, allRows, ymStr, gvLopId]);

  const recRows0 = useMemo(() => visibleRows.filter((r) => r.coRec), [visibleRows]);

  // 2. Tính toán Tài chính
  const finances = useMemo(() => {
    const canThuAll = recRows0.reduce((a, r) => a + r.tongPhaiThu, 0);
    const daThuAll = recRows0.reduce((a, r) => a + (r.rec.thucThu || 0), 0);
    const noRows = recRows0.filter((r) => r.conNo > 0);
    const soPhieu = recRows0.filter((r) => (r.rec.thucThu || 0) > 0).length;
    const chuaThu = recRows0.filter((r) => r.ps.tong > 0 && (r.rec.thucThu || 0) === 0).length;
    const ngayAn0 = recRows0.filter((r) => r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec.ngayAn || 0) === 0).length;
    return { canThuAll, daThuAll, noRows, soPhieu, chuaThu, ngayAn0 };
  }, [recRows0]);

  // 3. Thống kê học sinh
  const dashTong = visibleStudents.length;
  const dashDangHoc = useMemo(() => visibleStudents.filter((s) => s.trangThai === "Đang học").length, [visibleStudents]);

  // 4. Điểm danh hôm nay
  const clsOf = (s) => lopOfMonth(s, ymStr);
  const activeStudents = useMemo(() => visibleStudents.filter(s => TT_THU_PHI[s.trangThai]), [visibleStudents]);
  const classesWithStudents = useMemo(() => [...new Set(activeStudents.map(clsOf))].filter(Boolean), [activeStudents]);
  const M = isGV ? 1 : classesWithStudents.length;

  const [ddtsToday, setDdtsToday] = useState(null);
  useEffect(() => {
    let alive = true;
    sGet(`mn5:ddts:${ymStr}`).then((m) => { 
      if (alive) setDdtsToday((m && m[todayStr]) || {}); 
    }).catch(() => { if (alive) setDdtsToday({}); });
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

  // 5. Điểm danh cả tháng (trừ CN + ngày lễ)
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

  // State nhật ký
  const [logOpen, setLogOpen] = useState(false);
  const [fullLog, setFullLog] = useState([]);
  const openFullLog = async () => { 
    const all = await sGet("mn5:log") || []; 
    setFullLog(all); 
    setLogOpen(true); 
  };

  const vnd = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

  // Trích xuất biến để JSX gọn gàng
  const { N, allConfirmed, nghiHomNay, diHocHomNay, pctToday } = todayStats;
  const { absMonth, diMonth, pctMonth } = monthStats;
  const { daThuAll, noRows, soPhieu, chuaThu, ngayAn0 } = finances;

  return (
    <div style={{ paddingBottom: C.lg, marginTop: C.md }}>
      {/* Thẻ điểm danh */}
      <AttendanceCard
        today={{
          pct: pctToday, di: diHocHomNay, nghi: nghiHomNay,
          ghost: N === 0 ? (isGV ? "Lớp chưa điểm danh hôm nay." : "Chưa lớp nào điểm danh hôm nay.") : null,
          note: isGV ? (N >= 1 ? "Đã điểm danh hôm nay" : "Chưa điểm danh") : `${N}/${M} lớp đã điểm danh`,
          noteColor: (isGV ? N >= 1 : allConfirmed) ? C.green : C.amber,
          noteIcon: (isGV ? N >= 1 : allConfirmed) ? "check" : null,
        }}
        month={{ pct: pctMonth, di: diMonth, nghi: absMonth, note: "Đã trừ Chủ nhật & ngày lễ", noteColor: C.sub }}
        onDetail={() => setTab("dd")}
      />

      {/* Cảnh báo (Admin) */}
      {isAdmin && (chuaThu > 0 || ngayAn0 > 0) && (
        <div style={{ marginBottom: C.md }}>
          {chuaThu > 0 && <AlertRow type="danger" message={`${chuaThu} HS chưa thu đủ tiền tháng ${month}`} actionLabel="Thu ngay" onAction={() => { setTab("thu"); setThuFilter("chuaThu"); }} />}
          {ngayAn0 > 0 && <AlertRow type="warning" message={`${ngayAn0} HS có ngày ăn = 0 (chưa tính tiền ăn)`} actionLabel="Cập nhật" onAction={() => setTab("thu")} />}
        </div>
      )}

      {/* Lưới chức năng */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: C.md, marginBottom: C.lg }}>
        {isAdmin && (
          <>
            <Tile name="wallet" tint={C.orangeSoft} iconColor={C.orange} title="Thu phí" sub={vnd(daThuAll)} onClick={() => setTab("thu")} />
            <Tile name="coins" tint={C.orangeSoft} iconColor={C.orange} title="Công nợ" sub={`${noRows.length} học sinh`} onClick={() => setTab("no")} />
            <Tile name="barChart" tint={C.orangeSoft} iconColor={C.orange} title="Báo cáo" sub="Xem chi tiết" onClick={() => setTab("dash")} />
          </>
        )}
        <Tile name="calendarCheck" tint={C.greenSoft} iconColor={C.pine} title="Điểm danh"
          sub={isGV
            ? (N >= 1 ? "Đã điểm danh" : "Chưa điểm danh")
            : (allConfirmed ? `Nghỉ ${nghiHomNay}/${activeStudents.length}` : `Chưa điểm danh đủ (${N}/${M})`)}
          onClick={() => setTab("dd")} />
        <Tile name="users" tint={C.greenSoft} iconColor={C.pine} title={isGV ? "Lớp tôi" : "Học sinh"} sub={`${dashTong} học sinh`} onClick={() => setTab("hs")} />
        {isAdmin && (
          <Tile name="receipt" tint={C.orangeSoft} iconColor={C.orange} title="Phiếu thu" sub={`${soPhieu} đã thu`} onClick={() => setTab("phieu")} />
        )}
      </div>

      {/* Hoạt động gần đây (Admin) */}
      {isAdmin && <RecentActivity onSeeAll={openFullLog} />}

      <BottomSheet open={logOpen} onClose={() => setLogOpen(false)} title="Nhật ký thao tác">
        {fullLog.length === 0 ? <div style={{ textAlign: "center", color: C.sub, padding: 20 }}>Chưa có dữ liệu</div> : (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {fullLog.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: C.md, padding: `${C.md}px 0`, fontSize: 13, borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.sub, whiteSpace: "nowrap", minWidth: 100 }}>{new Date(e.t).toLocaleString("vi-VN")}</span>
                <span style={{ color: C.ink }}><b style={{ color: e.who === "Admin" ? C.pine : C.blueA }}>{e.who}</b> · {e.act}</span>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
