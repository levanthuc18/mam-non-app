import { C, font } from "../lib.js";
import { Ii } from "../Icon.jsx";

export function PreflightCheck({ rows, meta, onViewIssues }) {
  const checks = rows.map((r) => ({
    hsId: r.hs.id,
    ten: r.hs.ten,
    hasQR: !!(meta.bank?.[r.hs.nguoiThu]?.stk && meta.bank?.[r.hs.nguoiThu]?.nh),
    hasBL: !!r.rec?.bienLai,
    hasName: !!r.hs.ten,
    hasLop: !!r.lop?.ten,
  }));

  const noQR = checks.filter((c) => !c.hasQR);
  const noBL = checks.filter((c) => !c.hasBL);
  const issues = [];

  if (noQR.length) issues.push({ type: "warning", mau: "amber", msg: `${noQR.length} phiếu chưa có QR ngân hàng`, detail: noQR });
  if (noBL.length) issues.push({ type: "info", mau: "blue", msg: `${noBL.length} phiếu chưa có số biên lai (sẽ cấp khi in)`, detail: noBL });

  const ready = issues.length === 0;

  return (
    <div style={{ background: ready ? C.greenSoft : C.amberSoft, border: `1.5px solid ${ready ? C.line : C.line}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 8 }}>
        {ready ? <><Ii name="check" size={14} /> KIỂM TRA TRƯỚC KHI IN</> : <><Ii name="alertTriangle" size={14} /> KIỂM TRA TRƯỚC KHI IN</>}
      </div>
      {ready ? (
        <div style={{ fontSize: 13, color: C.greenText, fontWeight: 600 }}>
          <span style={{ fontSize: 16, marginRight: 6 }}><Ii name="check" size={14} /></span> {rows.length} phiếu sẵn sàng — không có lỗi
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {issues.map((iss, i) => (
            <div key={i} style={{ fontSize: 12.5, color: iss.type === "warning" ? C.amberText : C.sub, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, flexShrink: 0, background: iss.mau === "amber" ? C.amber : C.blueA }} />
              <span>{iss.msg}</span>
            </div>
          ))}
          {onViewIssues && (
            <button onClick={onViewIssues} style={{ marginTop: 4, fontSize: 12, color: C.pine, fontWeight: 700, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
              Xem chi tiết lỗi <Ii name="chevronRight" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
