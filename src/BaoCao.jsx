// BaoCao.jsx — Báo cáo & biểu đồ thu/chi theo tháng + xuất CSV.
import { C, font, fmt, toast } from "./lib.js";
import { BottomSheet } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

export function BaoCaoSheet({ open, onClose, lichSu, ym }) {
  const taiFile = (text, name) => { try { const blob = new Blob(["\uFEFF" + text], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch {} };
  const xuatCSV = () => {
    if (!lichSu || !lichSu.length) { toast("Chưa có dữ liệu tháng"); return; }
    const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const head = ["Tháng", "Phải thu", "Đã thu", "Còn nợ HS", "Chi phí", "Đã chi", "Nợ NCC (lũy kế)", "LN kế toán", "LN tiền mặt", "Quỹ A (lũy kế)", "Quỹ B (lũy kế)"];
    const rows = lichSu.map((r) => [r.thang, r.psThang, r.thuThang, r.psThang - r.thuThang, r.chiThang, r.traThang, r.noNCC, r.laiKeToan, r.laiTienMat, r.giuACum, r.giuBCum]);
    const csv = "sep=,\n" + [head, ...rows].map((row) => row.map(esc).join(",")).join("\n");
    taiFile(csv, `bao-cao-tai-chinh-${ym}.csv`);
    toast("Đã xuất CSV");
  };
  return (
      <BottomSheet open={open} onClose={onClose} title="Báo cáo & biểu đồ">
        {!lichSu || !lichSu.length ? <div style={{ textAlign: "center", color: C.sub, padding: 20 }}>Chưa có dữ liệu tháng.</div> : (() => {
          const data = [...lichSu].reverse();
          const maxV = Math.max(1, ...lichSu.map((r) => Math.max(r.thuThang, r.chiThang)));
          return (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 11.5, color: C.sub }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: C.green, display: "inline-block" }} /> Đã thu</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: C.coral, display: "inline-block" }} /> Đã chi</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                {data.map((r) => (
                  <div key={r.thang} style={{ marginBottom: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><b style={{ color: C.pine }}>{r.thang}</b><span style={{ color: r.laiKeToan < 0 ? C.coral : C.green, fontWeight: 700 }}>Lãi {fmt(r.laiKeToan)}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <div style={{ flex: 1, height: 14, background: C.graySoft, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${Math.max(2, r.thuThang / maxV * 100)}%`, height: "100%", background: C.green, borderRadius: 4 }} /></div>
                      <span style={{ fontSize: 11, color: C.sub, minWidth: 80, textAlign: "right" }}>{fmt(r.thuThang)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 14, background: C.graySoft, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${Math.max(2, r.chiThang / maxV * 100)}%`, height: "100%", background: C.coral, borderRadius: 4 }} /></div>
                      <span style={{ fontSize: 11, color: C.sub, minWidth: 80, textAlign: "right" }}>{fmt(r.chiThang)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={xuatCSV} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.pine}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}><Icon name="download" size={16} color={C.pine} /> Xuất báo cáo CSV (mở bằng Excel)</button>
              <div style={{ fontSize: 10.5, color: C.sub, textAlign: "center", marginBottom: 8 }}>CSV gồm: phải thu · đã thu · còn nợ · chi phí · nợ NCC · LN kế toán/tiền mặt · quỹ A/B theo từng tháng.</div>
            </>
          );
        })()}
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Đóng</button>
      </BottomSheet>
  );
}
