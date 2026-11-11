import { useState, useRef, useEffect } from "react";
import { Ii } from "../Icon.jsx";
import { C, font, fileName } from "../lib.js";
import { PhieuThu } from "./PhieuThu.jsx";
import { PhieuTongHop } from "./PhieuTongHop.jsx";
import { sharePhieuAnh } from "./shareImage.js";

export function PrintPreview({ rows, meta, month, year, mData, upMData, upMeta, includeTongHop, page, onPageChange, openSignal = 0 }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(0);
  const [sharing, setSharing] = useState(false);
  const captureRef = useRef(null);
  const bigRef = useRef(null);
  useEffect(() => { if (modalOpen && bigRef.current) { try { bigRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch {} } }, [modalOpen, modalPage]);
  // openSignal tăng lên → mở bản phóng to của trang đang chọn (nơi có nút chia sẻ ảnh)
  useEffect(() => { if (openSignal > 0) { setModalPage(page); setModalOpen(true); } }, [openSignal]);
  const totalPages = rows.length + (includeTongHop ? 1 : 0);
  useEffect(() => {
    if (!modalOpen) return;
    const phim = (e) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft" && modalPage > 0) { setModalPage(modalPage - 1); onPageChange(modalPage - 1); }
      else if (e.key === "ArrowRight" && modalPage < totalPages - 1) { setModalPage(modalPage + 1); onPageChange(modalPage + 1); }
      else if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", phim);
    return () => window.removeEventListener("keydown", phim);
  }, [modalOpen, modalPage, totalPages]);

  const getPageContent = (p) => {
    if (p < rows.length) return { type: "phieu", row: rows[p], idx: p };
    return { type: "tonghop", idx: p };
  };

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
            <Ii name="eye" size={15} /> XEM TRƯỚC NỘI DUNG IN
          </div>
          <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Bấm vào trang để phóng to ngay tại đây</div>
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
              onClick={() => { onPageChange(p); setModalPage(p); setModalOpen(true); }}
              style={{
                flexShrink: 0, width: thumbW, height: thumbH, borderRadius: 10,
                border: `2.5px solid ${active ? C.pine : "transparent"}`,
                background: C.card, overflow: "hidden", cursor: "pointer",
                position: "relative", padding: 0, boxShadow: active ? "0 2px 8px rgba(13,111,168,.2)" : "0 1px 3px rgba(0,0,0,.08)"
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
                background: active ? C.pine : "rgba(255,255,255,.95)", color: active ? C.onFill : C.ink,
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

      {/* Main preview lớn đã bỏ - bấm thumbnail để phóng to */}

      {/* Modal phóng to full */}
      {modalOpen && (
          <div key={modalPage} ref={bigRef} className="pv-big"
            style={{ maxWidth: 520, width: "100%", margin: "0 auto 14px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, boxShadow: "0 10px 30px rgba(20,40,58,.14)", boxSizing: "border-box" }}
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
                <Ii name="x" size={14} />
              </button>
            </div>
            <div style={{ position: "relative" }}>
            <div ref={captureRef} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}`, background: C.card }}>
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
              {[[-1, "chevronLeft", "Phiếu trước", { left: -20 }], [1, "chevronRight", "Phiếu sau", { right: -20 }]].map(([d, icon, nhan, pos]) => {
                const tat = modalPage + d < 0 || modalPage + d > totalPages - 1;
                return (
                  <button key={d} aria-label={nhan} title={nhan + " (phím " + (d < 0 ? "←" : "→") + ")"} disabled={tat}
                    onClick={() => { if (!tat) { setModalPage(modalPage + d); onPageChange(modalPage + d); } }}
                    style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", ...pos, width: 40, height: 40, borderRadius: 99, border: `1px solid ${C.line}`, background: tat ? C.graySoft : C.card, color: tat ? C.grayText : C.pine, boxShadow: tat ? "none" : "0 4px 14px rgba(20,40,58,.22)", cursor: tat ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, zIndex: 3 }}>
                    <Ii name={icon} size={20} />
                  </button>
                );
              })}
            </div>

            {/* Nút chia sẻ ảnh */}
            <button
              onClick={async () => {
                if (sharing) return;
                setSharing(true);
                const mc = getPageContent(modalPage);
                let filename, title, text;
                if (mc.type === "phieu") {
                  const ten = mc.row.hs.ten || "Học sinh";
                  const lop = mc.row.lop?.ten || "";
                  filename = fileName(`${lop ? lop + " - " : ""}${ten} - T${month}.${year}`) + ".png";
                  title = `Phiếu học phí — ${ten}`;
                  text = `Phiếu thông báo học phí tháng ${month}/${year} — ${ten}`;
                } else {
                  const lop = meta.classes.find((c) => c.id === rows[0]?.lopId)?.ten || "Tất cả lớp";
                  filename = fileName(`Tổng hợp - ${lop} - T${month}.${year}`) + ".png";
                  title = "Bảng tổng hợp học phí";
                  text = `Bảng tổng hợp học phí tháng ${month}/${year}`;
                }
                const res = await sharePhieuAnh(captureRef.current, { filename, title, text });
                setSharing(false);
                if (!res.ok) alert("Không tạo được ảnh (" + (res.reason || "?") + (res.error && res.error.message ? ": " + res.error.message : "") + "). Thử lại nhé.");
                else if (res.mode === "download") alert("Thiết bị không hỗ trợ chia sẻ trực tiếp — ảnh đã được tải về.");
              }}
              disabled={sharing}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                background: sharing ? C.graySoft : C.pine,
                color: sharing ? C.grayText : C.onFill,
                fontFamily: font.display,
                fontWeight: 700,
                fontSize: 15,
                cursor: sharing ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {sharing ? "Đang tạo ảnh…" : <><Ii name="share" size={15} /> Chia sẻ ảnh phiếu</>}
            </button>

          </div>
      )}
    </div>
  );
}
