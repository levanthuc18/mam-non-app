import { useState, useEffect } from "react";
import { C, font, sGet, TT_THU_PHI, lopOfMonth } from "./lib.js";
import { Card, BottomSheet } from "./ui.jsx";

// Hàm rút gọn số liệu .tr / .k
const fmtKPI = (num) => {
  if (!num) return "0đ";
  if (num >= 1000000) {
    const trieu = num / 1000000;
    return trieu % 1 === 0 ? `${trieu}tr` : `${trieu.toFixed(1)}tr`;
  }
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return num;
};

function KPICard({ icon, label, value, sub, progress, color, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 160, height: 120, flexShrink: 0, padding: C.md, borderRadius: C.r_kpi,
      background: C.card, border: `1px solid ${C.line}`, display: "flex", flexDirection: "column", justifyContent: "space-between",
      boxShadow: "0 2px 8px rgba(0,0,0,.08)", cursor: "pointer"
    }}>
      <div>
        <div style={{ fontSize: 13, color: C.sub }}>{icon} {label}</div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 30, color: color || C.ink, marginTop: 2 }}>{value}</div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>{sub}</div>
        <div style={{ height: 6, borderRadius: 99, background: C.line, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: color || C.pine, borderRadius: 99 }} />
        </div>
      </div>
    </div>
  );
}

function AlertRow({ type, message, actionLabel, onAction }) {
  const colors = {
    danger: { bg: C.coralSoft, border: "#FFD7D7", fg: C.coral, btn: "#E4573D" },
    warning: { bg: C.amberSoft, border: "#EAD8A0", fg: "#7A5E12", btn: C.amber },
  };
  const c = colors[type] || colors.warning;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: C.r,
      padding: C.md, marginBottom: C.md, minHeight: 88,
      display: "flex", alignItems: "center", gap: C.md
    }}>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: c.fg }}>{message}</div>
      <button onClick={onAction} style={{
        flexShrink: 0, width: 120, height: 44, borderRadius: 12,
        border: "none", background: c.btn, color: "#fff", fontWeight: 700, fontSize: 13,
        cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,.1)"
      }}>
        {actionLabel}
      </button>
    </div>
  );
}

function QuickAction({ icon, label, bgColor, txtColor, onClick }) {
  return (
    <button onClick={onClick} style={{
      height: 110, borderRadius: C.r, border: "none", background: bgColor,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: C.sm,
      cursor: "pointer", flex: "1 1 45%"
    }}>
      <div style={{ fontSize: 30 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: txtColor }}>{label}</div>
    </button>
  );
}

function RecentActivity({ onSeeAll }) {
  const [log, setLog] = useState([]);
  useEffect(() => { sGet("mn5:log").then(d => setLog((d || []).slice(0, 5))); }, []);
  
  if (!log.length) return null;
  return (
    <Card style={{ marginBottom: C.md, padding: C.md, borderRadius: C.r }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: C.md }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>🕐 Hoạt động gần đây</div>
      </div>
      {log.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: C.sm, height: 50, borderBottom: i < log.length - 1 ? `1px solid ${C.line}` : "none" }}>
          <span style={{ fontSize: 10 }}>🟢</span>
          <span style={{ fontSize: 11, color: C.sub, whiteSpace: "nowrap" }}>{new Date(e.t).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span>
          <span style={{ fontSize: 13, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b style={{color: e.who === "Admin" ? C.pine : C.blueA}}>{e.who}</b> · {e.act}</span>
        </div>
      ))}
      <button onClick={onSeeAll} style={{ width: "100%", marginTop: C.md, padding: C.sm + "px 0", background: "none", border: "none", color: C.pine, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        Xem tất cả nhật ký ›
      </button>
    </Card>
  );
}

export function HomeTab({ store, auth, setTab, setThuFilter, openStudentProfile }) {
  const { tk, allRows, students, meta, month, year, mData, ddData } = store;
  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";
  const gvLopId = auth?.lopId;

  // Lọc dữ liệu
  const visibleStudents = isGV ? students.filter(s => lopOfMonth(s, `${year}-${String(month).padStart(2, '0')}`) === gvLopId) : students;
  const visibleRows = isGV ? allRows.filter(r => r.lopId === gvLopId) : allRows;
  const recRows0 = visibleRows.filter((r) => r.coRec);

  // KPI Logic
  const canThuAll = recRows0.reduce((a, r) => a + r.tongPhaiThu, 0);
  const daThuAll = recRows0.reduce((a, r) => a + (r.rec.thucThu || 0), 0);
  const tyLeThu = canThuAll > 0 ? Math.round(daThuAll / canThuAll * 100) : 0;
  const noRows = recRows0.filter((r) => r.conNo > 0);
  const conNoAll = noRows.reduce((a, r) => a + r.conNo, 0);

  const dashTong = visibleStudents.length;
  const dashDangHoc = visibleStudents.filter((s) => s.trangThai === "Đang học").length;
  const today = new Date();
  const todayStr = today.getDate();
  const diHocHomNay = visibleStudents.filter(s => TT_THU_PHI[s.trangThai] && !ddData?.[s.id]?.[todayStr]).length;
  const nghiHomNay = visibleStudents.filter(s => TT_THU_PHI[s.trangThai] && ddData?.[s.id]?.[todayStr]).length;

  // Alert Logic
  const chuaThu = recRows0.filter((r) => r.ps.tong > 0 && (r.rec.thucThu || 0) === 0).length;
  const ngayAn0 = recRows0.filter((r) => r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec.ngayAn || 0) === 0).length;

  const [logOpen, setLogOpen] = useState(false);
  const [fullLog, setFullLog] = useState([]);
  const openFullLog = async () => { const all = await sGet("mn5:log") || []; setFullLog(all); setLogOpen(true); };

  return (
    <div style={{ paddingBottom: C.lg }}>
      {/* 2. KPI CAROUSEL */}
      <div style={{ display: "flex", overflowX: "auto", gap: C.md, paddingBottom: C.md, marginTop: C.md, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {isAdmin ? (
          <>
            <KPICard icon="💰" label="Thu tháng" value={`${fmtKPI(daThuAll)}`} sub={`${fmtKPI(daThuAll)} / ${fmtKPI(canThuAll)}`} progress={tyLeThu} color={tyLeThu >= 80 ? C.green : C.amber} onClick={() => setTab("thu")} />
            <KPICard icon="🔴" label="Cần thu" value={fmtKPI(conNoAll)} sub={`${noRows.length} HS đang nợ`} progress={100} color={C.coral} onClick={() => { setTab("thu"); setThuFilter("thieu"); }} />
            <KPICard icon="👶" label="Đang học" value={dashDangHoc} sub={`Tổng ${dashTong} HS`} progress={dashTong > 0 ? 100 : 0} color={C.blueA} onClick={() => setTab("caidat")} />
          </>
        ) : (
          <>
            <KPICard icon="👶" label="Sĩ số lớp" value={dashDangHoc} sub={`Tổng ${dashTong} HS`} progress={100} color={C.blueA} onClick={() => setTab("caidat")} />
            <KPICard icon="✓" label="Đi học hôm nay" value={diHocHomNay} sub={`Ngày ${todayStr}/${month}`} progress={diHocHomNay > 0 ? 100 : 0} color={C.green} onClick={() => setTab("dd")} />
            <KPICard icon="✕" label="Nghỉ hôm nay" value={nghiHomNay} sub={`Ngày ${todayStr}/${month}`} progress={nghiHomNay > 0 ? 100 : 0} color={C.coral} onClick={() => setTab("dd")} />
          </>
        )}
      </div>

      {/* 3. KHỐI CẢNH BÁO (Chỉ Admin) */}
      {isAdmin && (chuaThu > 0 || ngayAn0 > 0) && (
        <div style={{ marginBottom: C.lg }}>
          {chuaThu > 0 && <AlertRow type="danger" message={`${chuaThu} HS chưa thu đủ tiền tháng ${month}`} actionLabel="Thu ngay" onAction={() => setTab("thu")} />}
          {ngayAn0 > 0 && <AlertRow type="warning" message={`${ngayAn0} HS có ngày ăn = 0 (chưa tính tiền ăn)`} actionLabel="Cập nhật" onAction={() => setTab("thu")} />}
        </div>
      )}

      {/* 4. GRID TIỆN ÍCH (2x3) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: C.md, marginBottom: C.lg }}>
        {isAdmin && (
          <>
            <QuickAction icon="💰" label="Thu phí" bgColor={C.greenSoft} txtColor={C.green} onClick={() => setTab("thu")} />
            <QuickAction icon="📊" label="Báo cáo" bgColor={C.pineSoft} txtColor={C.pine} onClick={() => setTab("dash")} />
            <QuickAction icon="🧾" label="Phiếu thu" bgColor={C.graySoft} txtColor={C.ink} onClick={() => setTab("phieu")} />
            <QuickAction icon="📕" label="Công nợ" bgColor={C.coralSoft} txtColor={C.coral} onClick={() => setTab("no")} />
          </>
        )}
        <QuickAction icon="✓" label="Điểm danh" bgColor={C.pineSoft} txtColor={C.pine} onClick={() => setTab("dd")} />
        <QuickAction icon="👶" label={isGV ? "Lớp tôi" : "Học sinh"} bgColor={C.amberSoft} txtColor={C.amber} onClick={() => setTab("caidat")} />
      </div>

      {/* 5. HOẠT ĐỘNG GẦN ĐÂY (Chỉ Admin) */}
      {isAdmin && <RecentActivity onSeeAll={openFullLog} />}

      {/* MODAL Xem tất cả nhật ký */}
      <BottomSheet open={logOpen} onClose={() => setLogOpen(false)} title="📜 Nhật ký thao tác">
        {fullLog.length === 0 ? <div style={{ textAlign: "center", color: C.sub, padding: 20 }}>Chưa có dữ liệu</div> : (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {fullLog.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: C.md, padding: `${C.md}px 0`, fontSize: 13, borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.sub, whiteSpace: "nowrap", minWidth: 100 }}>{new Date(e.t).toLocaleString("vi-VN")}</span>
                <span style={{ color: C.ink }}><b style={{color: e.who === "Admin" ? C.pine : C.blueA}}>{e.who}</b> · {e.act}</span>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
