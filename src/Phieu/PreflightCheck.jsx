import { C, font } from "../lib.js";

export function PreflightCheck({ rows, meta, onViewIssues }) {
  const checks = rows.map((r) => ({
    hsId: r.hs.id,
    ten: r.hs.ten,
    hasQR: !!(meta.bank?.[r.hs.nguoiThu]?.stk && meta.bank?.[r.hs.nguoiThu]?.nh),
    hasPhone: !!r.hs.dienThoai,
    hasBL: !!r.rec?.bienLai,
    hasName: !!r.hs.ten,
    hasLop: !!r.lop?.ten,
  }));

  const noQR = checks.filter((c) => !c.hasQR);
  const noPhone = checks.filter((c) => !c.hasPhone);
  const noBL = checks.filter((c) => !c.hasBL);
  const issues = [];

  if (noQR.length) issues.push({ type: "warning", icon: "🟠", msg: `${noQR.length} phiếu chưa có QR ngân hàng`, detail: noQR });
  if (noPhone.length) issues.push({ type: "warning", icon: "🟠", msg: `${noPhone.length} phiếu chưa có số điện thoại`, detail: noPhone });
  if (noBL.length) issues.push({ type: "info", icon: "🔵", msg: `${noBL.length} phiếu chưa có số biên lai (sẽ cấp khi in)`, detail: noBL });

  const ready = issues.length === 0;

  return (
    <div style={{ background: ready ? C.greenSoft : "#FFF8E6", border: `1.5px solid ${ready ? "#BFE3CC" : "#EAD8A0"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 8 }}>
        {ready ? "✅ KIỂM TRA TRƯỚC KHI IN" : "⚠️ KIỂM TRA TRƯỚC KHI IN"}
      </div>
      {ready ? (
        <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>
          <span style={{ fontSize: 16, marginRight: 6 }}>✓</span> {rows.length} phiếu sẵn sàng — không có lỗi
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {issues.map((iss, i) => (
            <div key={i} style={{ fontSize: 12.5, color: iss.type === "warning" ? "#7A5E12" : C.sub, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <span>{iss.icon}</span>
              <span>{iss.msg}</span>
            </div>
          ))}
          {onViewIssues && (
            <button onClick={onViewIssues} style={{ marginTop: 4, fontSize: 12, color: C.pine, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
              Xem chi tiết lỗi ❯
            </button>
          )}
        </div>
      )}
    </div>
  );
}
