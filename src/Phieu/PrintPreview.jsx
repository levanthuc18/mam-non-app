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

  // Thumbnail: hiển thị rõ, scale vừa phải
  const thumbW = isWide ? 140 : 110;
  const thumbH = isWide ? 198 : 155;
  const thumbScale = isWide ? 0.35 : 0.28;

  const visibleThumbs = isWide ? 5 : 3;
  const thumbStart = Math.max(0, Math.min(page - Math.floor(visibleThumbs / 2), totalPages - visibleThumbs));
  const thumbPages = Array.from({ length: Math.min(visibleThumbs, totalPages) }, (_, i) => thumbStart + i);

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.pine, display: "flex", alignItems: "center", gap: 6 }}>
            <span>👁</span> XEM TRƯỚC NỘI DUNG IN
          </div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Cuộn để xem toàn bộ nội dung trước khi in</div>
        </div>
        <span style={{ fontSize: 12, color: C.pine, fontWeight: 700 }}>Tổng cộng: {totalPages} trang</span>
      </div>

      {/* Thumbnail strip - ngang, có thể cuộn */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, overflowX: "auto", padding: "4px 0", scrollbarWidth: "none" }}>
        {thumbPages.map((p) => {
          const pc = getPageContent(p);
          const active = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                flexShrink: 0, width: thumbW, height: thumbH, borderRadius: 10,
                border: `2.5px solid ${active ? C.pine : "transparent"}`,
                background: "#fff", overflow: "hidden", cursor: "pointer",
                position: "relative", padding: 0, boxShadow: active ? "0 2px 8px rgba(11,107,79,.2)" : "0 1px 3px rgba(0,0,0,.08)"
              }}
            >
              <div style={{ 
                transform: `scale(${thumbScale})`, 
                transformOrigin: "top left",
                width: 420,
                height: 595,
              }}>
                {pc.type === "phieu" ? (
                  <PhieuThu phieuRow={pc.row} meta={meta} month={month} year={year} mData={mData} upMData={upMData} upMeta={upMeta} isBatch={true} />
                ) : (
                  <PhieuTongHop rows={rows} lopTen={meta.classes.find(c => c.id === rows[0]?.lopId)?.ten || "Tất cả"} month={month} year={year} />
                )}
              </div>
              {/* Badge số trang */}
              <div style={{
                position: "absolute", bottom: 4, right: 4, fontSize: 9, fontWeight: 700,
                background: active ? C.pine : "rgba(255,255,255,.95)", color: active ? "#fff" : C.ink,
                padding: "2px 6px", borderRadius: 99,
                boxShadow: "0 1px 3px rgba(0,0,0,.1)"
              }}>
                {p + 1}
              </div>
              {/* Badge BL */}
              <div style={{
                position: "absolute", top: 4, left: 4, fontSize: 8, fontWeight: 700,
                background: "rgba(255,255,255,.95)", color: C.sub,
                padding: "1px 4px", borderRadius: 4
              }}>
                {pc.type === "phieu" ? (pc.row.rec?.bienLai || "—") : "Tổng"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main preview - hiển thị to, rõ, không trắng */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ background: C.card, borderRadius: 14, border: `1.5px solid ${C.line}`, padding: "16px", position: "relative" }}
      >
        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button 
            onClick={() => page > 0 && onPageChange(page - 1)} 
            disabled={page === 0} 
            style={{ 
              background: "none", border: "none", 
              color: page === 0 ? C.gray : C.pine, 
              fontSize: 20, cursor: page === 0 ? "default" : "pointer", 
              fontWeight: 700, padding: "4px 12px" 
            }}
          >
            ❮
          </button>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink }}>
            Trang {page + 1} / {totalPages}
          </span>
          <button 
            onClick={() => page < totalPages - 1 && onPageChange(page + 1)} 
            disabled={page === totalPages - 1} 
            style={{ 
              background: "none", border: "none", 
              color: page === totalPages - 1 ? C.gray : C.pine, 
              fontSize: 20, cursor: page === totalPages - 1 ? "default" : "pointer", 
              fontWeight: 700, padding: "4px 12px" 
            }}
          >
            ❯
          </button>
        </div>

        {/* Preview content - scale vừa đủ để đọc được */}
        <div 
          onClick={() => { setModalPage(page); setModalOpen(true); }} 
          style={{ 
            cursor: "zoom-in", 
            borderRadius: 12, 
            overflow: "hidden", 
            border: `1.5px solid ${C.line}`, 
            background: "#fff",
            maxHeight: 520,
            overflowY: "auto"
          }}
        >
          <div style={{ 
            transform: isWide ? "scale(0.75)" : "scale(0.55)", 
            transformOrigin: "top center",
            width: 420,
            margin: "0 auto",
            minHeight: 595
          }}>
            {current.type === "phieu" ? (
              <PhieuThu 
                phieuRow={current.row} 
                meta={meta} 
                month={month} 
                year={year} 
                mData={mData} 
                upMData={upMData} 
                upMeta={upMeta} 
                isBatch={true} 
              />
            ) : (
              <PhieuTongHop 
                rows={rows} 
                lopTen={meta.classes.find(c => c.id === rows[0]?.lopId)?.ten || "Tất cả"} 
                month={month} 
                year={year} 
              />
            )}
          </div>
        </div>

        <button 
          onClick={() => { setModalPage(page); setModalOpen(true); }} 
          style={{ 
            marginTop: 10, 
            width: "100%", 
            padding: "10px 0", 
            borderRadius: 10, 
            border: `1.5px solid ${C.pine}`, 
            background: C.pineSoft, 
            color: C.pine, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: "pointer" 
          }}
        >
          🔍 Phóng to trang này
        </button>
      </div>

      {/* Modal phóng to full */}
      {modalOpen && (
        <div 
          onClick={() => setModalOpen(false)} 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,.8)", 
            zIndex: 200, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: 16 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: 480, 
              width: "100%", 
              maxHeight: "90vh", 
              overflow: "auto", 
              background: "#fff", 
              borderRadius: 16, 
              padding: "16px" 
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink }}>
                Trang {modalPage + 1} / {totalPages}
              </span>
              <button 
                onClick={() => setModalOpen(false)} 
                style={{ 
                  background: C.graySoft, 
                  border: "none", 
                  fontSize: 18, 
                  color: C.sub, 
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  borderRadius: 99,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}>
              {(() => {
                const mc = getPageContent(modalPage);
                return mc.type === "phieu" ? (
                  <PhieuThu 
                    phieuRow={mc.row} 
                    meta={meta} 
                    month={month} 
                    year={year} 
                    mData={mData} 
                    upMData={upMData} 
                    upMeta={upMeta} 
                    isBatch={true} 
                  />
                ) : (
                  <PhieuTongHop 
                    rows={rows} 
                    lopTen={meta.classes.find(c => c.id === rows[0]?.lopId)?.ten || "Tất cả"} 
                    month={month} 
                    year={year} 
                  />
                );
              })()}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <button 
                onClick={() => modalPage > 0 && setModalPage(modalPage - 1)} 
                disabled={modalPage === 0} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: modalPage === 0 ? C.gray : C.pine, 
                  fontSize: 14, 
                  cursor: modalPage === 0 ? "default" : "pointer", 
                  fontWeight: 700,
                  padding: "8px 12px"
                }}
              >
                ❮ Trang trước
              </button>
              <button 
                onClick={() => modalPage < totalPages - 1 && setModalPage(modalPage + 1)} 
                disabled={modalPage === totalPages - 1} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: modalPage === totalPages - 1 ? C.gray : C.pine, 
                  fontSize: 14, 
                  cursor: modalPage === totalPages - 1 ? "default" : "pointer", 
                  fontWeight: 700,
                  padding: "8px 12px"
                }}
              >
                Trang sau ❯
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
