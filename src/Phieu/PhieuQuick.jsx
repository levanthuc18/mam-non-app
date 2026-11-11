// PhieuQuick.jsx — xem / in / chia sẻ phiếu thu ngay tại bảng Thu phí (CHỈ máy tính). Dùng lại PhieuThu + sharePhieuAnh có sẵn.
import { useState } from "react";
import { createPortal } from "react-dom";
import { C, font, fileName, toast } from "../lib.js";
import { Ii } from "../Icon.jsx";
import { PhieuThu } from "./PhieuThu.jsx";
import { sharePhieuAnh } from "./shareImage.js";

export function PhieuQuick({ sid, setSid, allRows, meta, upMeta, mData, upMData, month, year, onClose }) {
  const [busy, setBusy] = useState(false);
  const row = allRows.find((r) => r.hs.id === sid && r.coRec);
  if (!row) return null;

  const chiaSe = async () => {
    if (busy) return;
    setBusy(true);
    const ten = row.hs.ten || "Học sinh", lop = row.lop?.ten || "";
    const fn = fileName(`${lop ? lop + " - " : ""}${ten} - T${month}.${year}`) + ".png";
    const r = await sharePhieuAnh(document.getElementById("phieu-in"), { filename: fn, title: `Phiếu học phí — ${ten}`, text: `Phiếu thông báo học phí tháng ${month}/${year} — ${ten}` });
    setBusy(false);
    if (!r.ok) toast("Không tạo được ảnh phiếu — thử lại.");
    else if (r.mode === "download") toast("Đã tải ảnh phiếu về máy — gửi cho phụ huynh qua Zalo.");
  };

  return createPortal(
    <div className="pq-wrap" role="dialog" aria-label={`Phiếu thu — ${row.hs.ten}`} style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <style>{`@media print { .pq-wrap { position: static !important; display: block !important; background: none !important; overflow: visible !important; } .pq-panel { position: static !important; width: auto !important; height: auto !important; overflow: visible !important; box-shadow: none !important; padding: 0 !important; background: none !important; } .pq-back { display: none !important; } }`}</style>
      <div className="pq-back no-print" onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,.35)" }} />
      <div className="pq-panel" style={{ width: 560, maxWidth: "100%", height: "100%", background: C.card, overflowY: "auto", padding: "0 20px 24px", boxShadow: "-8px 0 28px rgba(0,0,0,.18)" }}>
        <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 2, background: C.card, padding: "14px 0 10px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 1, fontFamily: font.display, fontWeight: 700, fontSize: 18, color: C.ink }}>Phiếu thu</div>
          <button onClick={chiaSe} disabled={busy} style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: font.body }}>
            <Ii name="share" size={15} /> {busy ? "Đang tạo ảnh…" : "Chia sẻ ảnh phiếu"}
          </button>
          <button onClick={onClose} aria-label="Đóng" style={{ width: 36, height: 36, borderRadius: 99, border: "none", background: C.graySoft, color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Ii name="x" size={16} /></button>
        </div>
        <PhieuThu phieuRow={row} allRows={allRows} setPhieuId={setSid} meta={meta} month={month} year={year} upMeta={upMeta} mData={mData} upMData={upMData} />
      </div>
    </div>,
    document.body
  );
}
