import { useState, useEffect } from "react";
import { C, font, fmt, sGet } from "./lib.js";
import { Card, PLBadge } from "./ui.jsx";

function KPICard({ icon, value, label, sub, color, bg, onClick }) {
  return (
    <div onClick={onClick} style={{
      minWidth: 140, flex: "0 0 auto", padding: "14px 12px", borderRadius: 14,
      background: bg || C.card, border: `1px solid ${C.line}`, marginRight: 10,
      cursor: onClick ? "pointer" : "default", boxShadow: "0 2px 8px -4px rgba(0,0,0,0.05)"
    }}>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 6 }}>{icon} {label}</div>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: color || C.ink }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.sub, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>}
    </div>
  );
}

function AlertCard({ type, message, actionLabel, onAction }) {
  const colors = {
    danger: { bg: C.coralSoft, border: "#EFC9BF", fg: C.coral },
    warning: { bg: C.amberSoft, border: "#EAD8A0", fg: "#7A5E12" },
    success: { bg: C.greenSoft, border: "#BFE3CC", fg: C.green },
  };
  const c = colors[type] || colors.warning;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12,
      padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10
    }}>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.fg }}>{message}</div>
      {actionLabel && (
        <button onClick={onAction} style={{
          padding: "6px 12px", borderRadius: 8, border: "none",
          background: c.fg, color: "#fff", fontWeight: 700, fontSize: 12,
          cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap"
        }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 6, padding: "14px 8px", borderRadius: 14, border: `1.5px solid ${C.line}`,
      background: C.card, cursor: "pointer", flex: "1 1 30%", minWidth: 0
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: color || C.ink, textAlign: "center" }}>{label}</div>
    </button>
  );
}

function RecentActivity() {
  const [log, setLog] = useState([]);
  useEffect(() => { sGet("mn5:log").then(d => setLog((d || []).slice(0, 5))); }, []);
  if (!log.length) return null;
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: C.ink }}>🕐 Hoạt động gần đây</div>
      {log.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 12.5, borderBottom: i < log.length - 1 ? `1px solid ${C.line}` : "none" }}>
          <span style={{ color: C.sub, whiteSpace: "nowrap" }}>{new Date(e.t).toLocaleDateString("vi-VN")}</span>
          <span style={{ color: C.ink }}><b style={{color: e.who === "Admin" ? C.pine : C.blueA}}>{e.who}</b> · {e.act}</span>
        </div>
      ))}
    </Card>
  );
}

export function HomeTab({ store, auth, setTab, setThuFilter, openStudentProfile }) {
  const { tk, allRows, students, meta, month, year, mData, ddData } = store;
  const isAdmin = auth?.role === "admin";
  const isGV = auth?.role === "gv";

  // Tính toán dữ liệu cho KPI
  const recRows0 = allRows.filter((r) => r.coRec);
  const canThuAll = recRows0.reduce((a, r) => a + r.tongPhaiThu, 0);
  const daThuAll = recRows0.reduce((a, r) => a + (r.rec.thucThu || 0), 0);
  const tyLeThu = canThuAll > 0 ? Math.round(daThuAll / canThuAll * 100) : 0;
  
  const noRows = recRows0.filter((r) => r.conNo > 0);
  const conNoAll = noRows.reduce((a, r) => a + r.conNo, 0);

  const dashTong = students.length;
  const dashDangHoc = students.filter((s) => s.trangThai === "Đang học").length;

  // Cảnh báo
  const chuaThu = recRows0.filter((r) => r.ps.tong > 0 && (r.rec.thucThu || 0) === 0).length;
  const ngayAn0 = recRows0.filter((r) => r.hs.pl !== "GV" && r.hs.pl !== "T7" && (r.rec.ngayAn || 0) === 0).length;

  return (
    <div>
      {/* 1. KPI Cards */}
      <div style={{ display: "flex", overflowX: "auto", paddingBottom: 6, marginBottom: 12, marginTop: 12 }}>
        <KPICard
          icon="💰"
          label="Thu tháng"
          value={`${tyLeThu}%`}
          sub={`${fmt(daThuAll)} / ${fmt(canThuAll)}`}
          color={tyLeThu >= 80 ? C.green : C.amber}
          onClick={() => setTab("thu")}
        />
        <KPICard
          icon="👶"
          label="Đang học"
          value={dashDangHoc}
          sub={`Tổng ${dashTong} HS`}
          color={C.blueA}
          onClick={() => setTab("hs")}
        />
        <KPICard
          icon="🔴"
          label="Cần thu"
          value={fmt(conNoAll)}
          sub={`${noRows.length} HS nợ`}
          color={C.coral}
          bg={C.coralSoft}
          onClick={() => { setTab("thu"); setThuFilter("thieu"); }}
        />
      </div>

      {/* 2. Cảnh báo / Todo list */}
      {isAdmin && (chuaThu > 0 || ngayAn0 > 0) && (
        <div style={{ marginBottom: 12 }}>
          {chuaThu > 0 && (
            <AlertCard
              type="danger"
              message={`${chuaThu} HS chưa thu đủ tháng ${month}`}
              actionLabel="Thu ngay →"
              onAction={() => setTab("thu")}
            />
          )}
          {ngayAn0 > 0 && (
            <AlertCard
              type="warning"
              message={`${ngayAn0} HS có ngày ăn = 0 (chưa tính tiền ăn)`}
              actionLabel="Sửa →"
              onAction={() => setTab("thu")}
            />
          )}
        </div>
      )}

      {/* 3. Quick Actions */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {isAdmin && (
          <>
            <QuickAction icon="💰" label="Thu phí" color={C.pine} onClick={() => setTab("thu")} />
            <QuickAction icon="📊" label="Báo cáo" color={C.violetB} onClick={() => setTab("dash")} />
            <QuickAction icon="🧾" label="Phiếu thu" color={C.amber} onClick={() => setTab("phieu")} />
            <QuickAction icon="📕" label="Công nợ" color={C.coral} onClick={() => setTab("no")} />
          </>
        )}
        <QuickAction icon="✓" label="Điểm danh" color={C.green} onClick={() => setTab("dd")} />
        <QuickAction icon="👶" label="Học sinh" color={C.blueA} onClick={() => setTab("caidat")} />
      </div>

      {/* 4. Hoạt động gần đây */}
      {isAdmin && <RecentActivity />}

      {/* 5. Thông tin nhanh */}
      <Card style={{ marginBottom: 12, background: C.pineSoft, border: `1px solid #BFE0D4` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 24 }}>📅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: C.pine }}>
              Tháng {month}/{year}
            </div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>
              {mData ? `Đã có bảng thu (${recRows0.length} HS)` : "Chưa có bảng thu tháng này"}
            </div>
          </div>
          {!mData && isAdmin && (
            <button onClick={store.taoThang} style={{ background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, padding: "8px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}>+ Tạo</button>
          )}
        </div>
      </Card>
    </div>
  );
}
