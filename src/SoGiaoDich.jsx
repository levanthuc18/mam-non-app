// SoGiaoDich.jsx — Sổ giao dịch tiền (timeline theo tháng + lọc người/loại).
// Diễn giải giao dịch nằm ở taichinh.buildGiaoDichThang; file này chỉ fetch + render.
import { useState, useEffect } from "react";
import { C, font, fmt, sGet, sList } from "./lib.js";
import { BottomSheet } from "./ui.jsx";
import { buildGiaoDichThang } from "./taichinh.js";

export function SoGiaoDichSheet({ open, onClose, ym, students }) {
  const [soGD, setSoGD] = useState(null);
  const [gdNguoi, setGdNguoi] = useState("ALL");
  const [gdLoai, setGdLoai] = useState("ALL");
  useEffect(() => {
    if (!open) return;
    let huy = false;
    (async () => {
      const keys = (await sList("mn5:thang:")).filter((k) => /mn5:thang:\d{4}-\d{2}$/.test(k)).map((k) => k.replace("mn5:thang:", "")).filter((m) => m <= ym).sort().reverse();
      const out = [];
      for (const m of keys) {
        const td = await sGet(`mn5:thang:${m}`); if (!td) continue;
        const evs = buildGiaoDichThang(td, students);
        if (evs.length) out.push({ thang: m, label: `T${Number(m.slice(5))}/${m.slice(0, 4)}`, evs });
      }
      if (!huy) setSoGD(out);
    })();
    return () => { huy = true; };
  }, [open, ym, students]);
  return (
      <BottomSheet open={open} onClose={onClose} title="Sổ giao dịch tiền">
        <div style={{ display: "flex", gap: 6, marginBottom: 7, flexWrap: "wrap" }}>
          {[["ALL", "Tất cả"], ["A", "Người A"], ["B", "Người B"]].map(([v, l]) => (
            <button key={v} onClick={() => setGdNguoi(v)} style={{ padding: "5px 12px", borderRadius: 99, border: `1.5px solid ${gdNguoi === v ? C.pine : C.line}`, background: gdNguoi === v ? C.pineSoft : C.card, color: gdNguoi === v ? C.pine : C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {[["ALL", "Tất cả"], ["THU", "Thu"], ["CHI", "Chi"], ["CHUYEN", "Chuyển"], ["RUT_LOI", "Rút lãi"], ["HOAN_UNG", "Hoàn ứng"]].map(([v, l]) => (
            <button key={v} onClick={() => setGdLoai(v)} style={{ padding: "5px 12px", borderRadius: 99, border: `1.5px solid ${gdLoai === v ? C.pine : C.line}`, background: gdLoai === v ? C.pineSoft : C.card, color: gdLoai === v ? C.pine : C.sub, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
        {soGD === null ? <div style={{ textAlign: "center", color: C.sub, padding: 20 }}>Đang tải…</div> : (() => {
          const fmtNgay = (ts) => { const d = new Date(ts); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; };
          const colorOf = (dau) => dau === "+" ? C.green : dau === "-" ? C.coral : C.blueA;
          let any = false;
          const blocks = soGD.map((g) => {
            const evs = g.evs.filter((ev) => (gdNguoi === "ALL" || ev.nguoi === gdNguoi) && (gdLoai === "ALL" || ev.loai === gdLoai));
            if (!evs.length) return null;
            any = true;
            const tThu = evs.filter((e) => e.dau === "+").reduce((a, e) => a + e.amount, 0);
            const tChi = evs.filter((e) => e.dau === "-").reduce((a, e) => a + e.amount, 0);
            return (
              <div key={g.thang} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: C.pine }}>{g.label}</span>
                  <span style={{ fontSize: 11, color: C.sub }}>{tThu > 0 && <span style={{ color: C.green }}>+{fmt(tThu)} </span>}{tChi > 0 && <span style={{ color: C.coral }}>−{fmt(tChi)}</span>}</span>
                </div>
                <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
                  {evs.map((ev, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderTop: i ? `1px solid ${C.line}` : "none" }}>
                      <span style={{ fontSize: 10.5, color: C.sub, minWidth: 32, fontWeight: 600 }}>{ev.ts ? fmtNgay(ev.ts) : "—"}</span>
                      {ev.nguoi && <span style={{ fontSize: 10.5, fontWeight: 800, color: ev.nguoi === "A" ? C.blueA : C.violetB }}>[{ev.nguoi}]</span>}
                      <span style={{ flex: 1, fontSize: 12.5, color: C.ink }}>{ev.label}</span>
                      <b style={{ fontSize: 12.5, color: colorOf(ev.dau), whiteSpace: "nowrap" }}>{ev.dau}{fmt(ev.amount)}</b>
                    </div>
                  ))}
                </div>
              </div>
            );
          });
          return any ? <div>{blocks}</div> : <div style={{ textAlign: "center", color: C.sub, padding: 20 }}>Không có giao dịch khớp bộ lọc.</div>;
        })()}
        <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2, marginBottom: 8, textAlign: "center" }}>Học phí gộp theo tháng (không có ngày). Giao dịch nhập từ giờ có ngày cụ thể.</div>
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>✓ Đóng</button>
      </BottomSheet>
  );
}
