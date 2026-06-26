import { useState, useRef } from "react";
import { C, font } from "../lib.js";
import { PhieuThu } from "./PhieuThu.jsx";
import { PhieuTongHop } from "./PhieuTongHop.jsx";

export function PrintPreview({ rows, meta, month, year, mData, upMData, upMeta, includeTongHop, page, onPageChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(0);
  const touchStart = useRef(null);
  const totalPages = rows.length + (includeTongHop ? 1 : 0);

  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && page < totalPages - 1) onPageChange(page + 1);
      else if (diff < 0 && page > 0) onPageChange(page - 1);
    }
    touchStart.current = null;
  };

  const getPageContent = (p) => {
    if (p < rows.length) return { type: "phieu", row: rows[p], idx: p };
    return { type: "tonghop", idx: p };
  };

  const current = getPageContent(page);
  const isWide = typeof window !== "undefined" && window.innerWidth >= 820;
  const thumbScale = isWide ? 0.28 : 0.23;
  const thumbW = Math.round(148 * thumbScale * 10);
  const thumbH = Math.round(210 * thumbScale * 10);

  const visibleThumbs = isWide ? 5 : 3;
  const thumbStart = Math.max(0, Math.min(page - Math.floor(visibleThumbs / 2), totalPages - visibleThumbs));
  const thumbPages = Array.from({ length: Math.min(visibleThumbs, totalPages) }, (_, i) => thumbStart + i);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13.5, color: C.ink, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15 }}>👁</span> XEM TRƯỚC NỘI DUNG IN
        </div>
        <span style={{ fontSize: 12, color: C.sub }}>Tổng cộng: {totalPages} trang</span>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 10, overflowX: "auto", padding: "4px 0" }}>
        {thumbPages.map((p) => {
          const pc = getPageContent(p);
          const active = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                flexShrink: 0, width: thumbW, height: thumbH, borderRadius: 8,
                border: `2px solid ${active ? C.pine : C.line}`,
                background: "#fff", overflow: "hidden", cursor: "pointer",
                position: "relative", padding: 0
              }}
            >
              <div style={{ transform: `scale(${thumbScale})`, transformOrigin: "top left", width: 148 * 10, height: 210 * 10 }}>
                {pc.type === "phieu" ? (
                  <PhieuThu phieuRow={pc.row} meta={meta} month={month} year={year} mData={mData} upMData={upMData} upMeta={upMeta} isBatch={true} />
                ) : (
                  <PhieuTongHop rows={rows} lopTen={meta.classes.find(c => c.id === rows[0]?.lopId)?.ten || "Tất cả"} month={month} year={year} />
                )}
              </div>
              <div style={{
                position: "absolute", bottom: 4, right: 4, fontSize: 8, fontWeight: 700,
                background: active ? C.pine : "rgba(255,255,255,.9)", color: active ? "#fff" : C.sub,
                padding: "2px 5px", borderRadius: 4, border: `1px solid ${active ? C.pine : C.line}`
              }}>
                {pc.type === "phieu" ? (pc.row.rec?.bienLai || `BL-${p + 1}`) : "Tổng hợp"}
              </div>
              <div style={{
                position: "absolute", top: 4, left: 4, fontSize: 8, fontWeight: 700,
                background: "rgba(255,255,255,.9)", color: C.sub, padding: "2px 5px", borderRadius: 4
              }}>
                {p + 1}
              </div>
            </button>
          );
        })}
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ background: C.card, borderRadius: 12, border: `1.5px solid ${C.line}`, padding: "12px", position: "relative" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button onClick={() => page > 0 && onPageChange(page - 1)} disabled={page === 0} style={{ background: "none", border: "none", color: page === 0 ? C.gray : C.pine, fontSize: 18, cursor: page === 0 ? "default" : "pointer", fontWeight: 700 }}>❮</button>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13, color: C.ink }}>Trang {page + 1} / {totalPages}</span>
          <button onClick={() => page < totalPages - 1 && onPageChange(page + 1)} disabled={page === totalPages - 1} style={{ background: "none", border: "none", color: page === totalPages - 1 ? C.gray : C.pine, fontSize: 18, cursor: page === totalPages - 1 ? "default" : "pointer", fontWeight: 700 }}>❯</button>
        </div>

        <div onClick={() => { setModalPage(page); setModalOpen(true); }} style={{ cursor: "zoom-in", borderRadius: 8, overflow: "hidden", border: `1px solid ${C.line}`, background: "#fff" }}>
          <div style={{ transform: "scale(0.55)", transformOrigin: "top left", width: 148 * 10, height: 210 * 10, margin: "0 auto" }}>
            {current.type === "phieu" ? (
              <PhieuThu phieuRow={current.row} meta={meta} month={month} year={year} mData={mData} upMData={upMData} upMeta={upMeta} isBatch={true} />
            ) : (
              <PhieuTongHop rows={rows} lopTen={meta.classes.find(c => c.id === rows[0]?.lopId)?.ten || "Tất cả"} month={month} year={year} />
            )}
          </div>
        </div>

        <button onClick={() => { setModalPage(page); setModalOpen(true); }} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 8, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
          🔍 Phóng to trang này
        </button>
      </div>

      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: "100%", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 16, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink }}>Trang {modalPage + 1} / {totalPages}</span>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, color: C.sub, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.line}` }}>
              {(() => {
                const mc = getPageContent(modalPage);
                return mc.type === "phieu" ? (
                  <PhieuThu phieuRow={mc.row} meta={meta} month={month} year={year} mData={mData} upMData={upMData} upMeta={upMeta} isBatch={true} />
                ) : (
                  <PhieuTongHop rows={rows} lopTen={meta.classes.find(c => c.id === rows[0]?.lopId)?.ten || "Tất cả"} month={month} year={year} />
                );
              })()}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
              <button onClick={() => modalPage > 0 && setModalPage(modalPage - 1)} disabled={modalPage === 0} style={{ background: "none", border: "none", color: modalPage === 0 ? C.gray : C.pine, fontSize: 16, cursor: modalPage === 0 ? "default" : "pointer", fontWeight: 700 }}>❮ Trang trước</button>
              <button onClick={() => modalPage < totalPages - 1 && setModalPage(modalPage + 1)} disabled={modalPage === totalPages - 1} style={{ background: "none", border: "none", color: modalPage === totalPages - 1 ? C.gray : C.pine, fontSize: 16, cursor: modalPage === totalPages - 1 ? "default" : "pointer", fontWeight: 700 }}>Trang sau ❯</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
