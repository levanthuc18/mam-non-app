import { useState, useMemo, useCallback } from "react";
import { C, font, fmt } from "../lib.js";
import { PhieuThu } from "./PhieuThu.jsx";
import { PhieuTongHop } from "./PhieuTongHop.jsx";
import { AnimatedCounter } from "./AnimatedCounter.jsx";
import { PreflightCheck } from "./PreflightCheck.jsx";
import { ClassList } from "./ClassList.jsx";
import { PrintPreview } from "./PrintPreview.jsx";

export function PhieuThuManager({ allRows, meta, month, year, mData, upMData, upMeta }) {
  const [selectedLop, setSelectedLop] = useState("all");
  const [filters, setFilters] = useState({ onlyConNo: true, onlyChuaDong: false, onlyChuaGuiZalo: false });
  const [includeTongHop, setIncludeTongHop] = useState(true);
  const [previewPage, setPreviewPage] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [mode, setMode] = useState("manager");
  const [singleId, setSingleId] = useState(null);

  const isWide = typeof window !== "undefined" && window.innerWidth >= 820;

  const rowsToPrint = useMemo(() => {
    return allRows.filter((r) => {
      if (!r.coRec) return false;
      if (selectedLop !== "all" && r.lopId !== selectedLop) return false;
      if (filters.onlyConNo && r.conNo <= 0) return false;
      if (filters.onlyChuaDong && (r.rec?.thucThu || 0) > 0) return false;
      if (filters.onlyChuaGuiZalo && r.rec?.daGuiZalo) return false;
      return true;
    });
  }, [allRows, selectedLop, filters]);

  const totalPages = rowsToPrint.length + (includeTongHop ? 1 : 0);
  const tongNo = useMemo(() => rowsToPrint.reduce((a, r) => a + Math.max(0, r.conNo), 0), [rowsToPrint]);
  const tongPhaiThu = useMemo(() => rowsToPrint.reduce((a, r) => a + r.tongPhaiThu, 0), [rowsToPrint]);
  const tongDaThu = useMemo(() => rowsToPrint.reduce((a, r) => a + (r.rec?.thucThu || 0), 0), [rowsToPrint]);

  const handlePrintBatch = useCallback(() => {
    if (rowsToPrint.length === 0) return;
    const newFees = { ...mData.fees };
    const newSoBienLai = { ...(meta.soBienLai || {}) };
    let changed = false;

    rowsToPrint.forEach((r) => {
      if (!r.rec?.bienLai) {
        const nt = r.hs.nguoiThu;
        const next = (newSoBienLai[nt] || 0) + 1;
        newSoBienLai[nt] = next;
        newFees[r.hs.id] = { ...newFees[r.hs.id], bienLai: `BL-${nt}-${String(next).padStart(4, "0")}` };
        changed = true;
      }
    });

    if (changed) {
      upMeta({ ...meta, soBienLai: newSoBienLai });
      upMData({ ...mData, fees: newFees });
      setTimeout(() => window.print(), 300);
    } else {
      window.print();
    }
  }, [rowsToPrint, mData, meta, upMeta, upMData]);

  const singleRow = singleId ? allRows.find((r) => r.hs.id === singleId && r.coRec) : null;

  if (mode === "single" && singleRow) {
    return (
      <div>
        <button 
          onClick={() => setMode("manager")} 
          className="no-print" 
          style={{ 
            marginBottom: 12, 
            padding: "8px 14px", 
            borderRadius: 10, 
            border: `1.5px solid ${C.line}`, 
            background: C.card, 
            color: C.ink, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            gap: 6 
          }}
        >
          ❮ Quay lại quản lý in
        </button>
        <PhieuThu
          phieuRow={singleRow}
          allRows={allRows}
          setPhieuId={(id) => { setSingleId(id); }}
          meta={meta}
          month={month}
          year={year}
          upMeta={upMeta}
          mData={mData}
          upMData={upMData}
        />
      </div>
    );
  }

  const sidebar = (
    <div className="sidebar" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, color: C.pine, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🖨</span> In học phí
        </div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Quản lý & in thông báo học phí</div>
      </div>

      {/* 2 nút chính */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          onClick={() => { 
            const first = allRows.find((r) => r.coRec); 
            if (first) { setSingleId(first.hs.id); setMode("single"); } 
          }}
          style={{ 
            padding: "12px 8px", 
            borderRadius: 12, 
            border: "none", 
            background: C.pine, 
            color: "#fff", 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: "pointer", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: 4 
          }}
        >
          <span style={{ fontSize: 18 }}>🖨</span>
          <span>In phiếu hiện tại</span>
          <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 500 }}>
            {singleRow?.rec?.bienLai || "Chưa có BL"}
          </span>
        </button>
        <button
          onClick={() => { setPreviewPage(0); }}
          style={{ 
            padding: "12px 8px", 
            borderRadius: 12, 
            border: `2px solid ${C.amber}`, 
            background: "#fff", 
            color: C.amber, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: "pointer", 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: 4 
          }}
        >
          <span style={{ fontSize: 18 }}>📦</span>
          <span>In hàng loạt</span>
          <span style={{ fontSize: 10, fontWeight: 500 }}>
            {rowsToPrint.length} phiếu
          </span>
        </button>
      </div>

      {/* Bộ lọc + Chọn lớp - 2 cột */}
      <div style={{ display: "grid", gridTemplateColumns: isWide ? "1fr 1fr" : "1fr", gap: 12 }}>
        {/* Bộ lọc */}
        <div style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13, color: C.pine, marginBottom: 10 }}>
            BỘ LỌC TIẾT KIỆM GIẤY
          </div>
          {[
            { key: "onlyConNo", label: "Chỉ in học sinh còn nợ" },
            { key: "onlyChuaDong", label: "Chỉ in học sinh chưa đóng" },
            { key: "onlyChuaGuiZalo", label: "Chỉ in học sinh chưa gửi Zalo" },
          ].map((f) => (
            <label 
              key={f.key} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                padding: "6px 0", 
                cursor: "pointer", 
                fontSize: 13, 
                color: C.ink 
              }}
            >
              <input
                type="checkbox"
                checked={filters[f.key]}
                onChange={(e) => setFilters((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: C.pine, cursor: "pointer" }}
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>

        {/* Chọn lớp */}
        <div style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13, color: C.pine, marginBottom: 10 }}>
            CHỌN LỚP
          </div>
          <select
            value={selectedLop}
            onChange={(e) => { setSelectedLop(e.target.value); setPreviewPage(0); }}
            style={{ 
              width: "100%", 
              padding: "10px 12px", 
              borderRadius: 10, 
              border: `1.5px solid ${C.line}`, 
              fontSize: 14, 
              color: C.ink, 
              background: "#fff", 
              fontFamily: font.body 
            }}
          >
            <option value="all">Tất cả lớp ({meta.classes.length} lớp)</option>
            {meta.classes.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}
          </select>
        </div>
      </div>

      {/* Xuất dữ liệu + Xem trước - 2 cột */}
      <div style={{ display: "grid", gridTemplateColumns: isWide ? "1fr 1fr" : "1fr", gap: 12 }}>
        {/* Xuất dữ liệu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            style={{ 
              width: "100%", 
              padding: "12px", 
              borderRadius: 10, 
              border: `1.5px solid ${C.line}`, 
              background: C.card, 
              color: C.ink, 
              fontWeight: 700, 
              fontSize: 13, 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between" 
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>⬇️</span> Xuất dữ liệu
            </span>
            <span style={{ fontSize: 10 }}>▾</span>
          </button>
          {showExportMenu && (
            <div style={{ 
              position: "absolute", 
              top: "calc(100% + 4px)", 
              left: 0, 
              right: 0, 
              background: "#fff", 
              border: `1.5px solid ${C.line}`, 
              borderRadius: 10, 
              boxShadow: "0 4px 16px rgba(0,0,0,.1)", 
              zIndex: 50, 
              overflow: "hidden" 
            }}>
              {[
                { icon: "📄", label: "Tải file PDF (Tất cả)" },
                { icon: "🖼", label: "Tải ảnh từng học sinh (ZIP)" },
                { icon: "🖼", label: "Tải ảnh cả lớp (ZIP)" },
                { icon: "📊", label: "Xuất Excel tổng hợp" },
              ].map((item, i) => (
                <button 
                  key={i} 
                  style={{ 
                    width: "100%", 
                    textAlign: "left", 
                    padding: "10px 12px", 
                    border: "none", 
                    background: "none", 
                    cursor: "pointer", 
                    fontSize: 13, 
                    color: C.ink, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8, 
                    borderBottom: i < 3 ? `1px solid ${C.line}` : "none" 
                  }} 
                  onClick={() => setShowExportMenu(false)}
                >
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Xem trước khi in - nút */}
        <button
          onClick={() => { 
            const el = document.querySelector('.preview-area');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{ 
            width: "100%", 
            padding: "12px", 
            borderRadius: 10, 
            border: `1.5px solid ${C.pine}`, 
            background: C.pineSoft, 
            color: C.pine, 
            fontWeight: 700, 
            fontSize: 13, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            gap: 6
          }}
        >
          <span>👁</span> Xem trước khi in
          <span style={{ fontSize: 11, opacity: 0.8 }}>{rowsToPrint.length} phiếu</span>
        </button>
      </div>

      {/* Danh sách lớp */}
      <ClassList meta={meta} rows={rowsToPrint} selectedLop={selectedLop} onSelectLop={setSelectedLop} />

      {/* Tổng quan toàn trường */}
      <div style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "14px" }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13, color: C.pine, marginBottom: 10 }}>
          TỔNG QUAN TOÀN TRƯỜNG
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: C.sub }}>Tổng số</div>
            <div style={{ fontSize: 11, color: C.sub }}>học sinh</div>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, color: C.ink, marginTop: 4 }}>
              <AnimatedCounter value={rowsToPrint.length} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.sub }}>Phải thu</div>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: C.ink, marginTop: 8 }}>
              {fmt(tongPhaiThu)} đ
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.sub }}>Đã thu</div>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: C.green, marginTop: 8 }}>
              {fmt(tongDaThu)} đ
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.sub }}>Còn nợ</div>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: C.coral, marginTop: 8 }}>
              {fmt(tongNo)} đ
            </div>
          </div>
        </div>
      </div>

      {/* Toggle phiếu tổng hợp */}
      <label style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        padding: "10px 14px", 
        cursor: "pointer", 
        fontSize: 13, 
        color: C.ink,
        background: C.card,
        borderRadius: 10,
        border: `1.5px solid ${C.line}`
      }}>
        <input
          type="checkbox"
          checked={includeTongHop}
          onChange={(e) => setIncludeTongHop(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: C.pine, cursor: "pointer" }}
        />
        <span>Có phiếu tổng hợp</span>
      </label>

      {/* Kiểm tra */}
      <PreflightCheck rows={rowsToPrint} meta={meta} onViewIssues={() => setShowIssues(true)} />

      {/* Nút IN */}
      <button
        onClick={handlePrintBatch}
        disabled={rowsToPrint.length === 0}
        style={{
          width: "100%", 
          padding: "16px 0", 
          borderRadius: 12, 
          border: "none",
          background: rowsToPrint.length === 0 ? C.graySoft : C.pine,
          color: rowsToPrint.length === 0 ? C.gray : "#fff",
          fontFamily: font.display, 
          fontWeight: 700, 
          fontSize: 16,
          cursor: rowsToPrint.length === 0 ? "not-allowed" : "pointer",
          boxShadow: rowsToPrint.length === 0 ? "none" : "0 4px 12px rgba(11,107,79,.3)",
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 2
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🖨</span> IN {rowsToPrint.length} PHIẾU
        </span>
        <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>
          {fmt(tongNo)} đ · ({totalPages} trang)
        </span>
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: #fff !important; }
          * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
          }
          .phieu-page { 
            page-break-after: always; 
            break-after: page;
            width: 100%;
          }
          .phieu-page:last-child { 
            page-break-after: auto; 
            break-after: auto;
          }
        }
        @media (min-width: 820px) {
          .phieu-manager { 
            display: grid; 
            grid-template-columns: 380px 1fr; 
            gap: 24px;
            align-items: start;
          }
          .sidebar { 
            position: sticky; 
            top: 14px; 
            max-height: calc(100vh - 28px); 
            overflow-y: auto;
            padding-right: 4px;
          }
          .preview-area { 
            overflow-y: visible;
          }
        }
        @media (max-width: 819px) {
          .phieu-manager { 
            display: flex; 
            flex-direction: column; 
          }
        }
      `}</style>

      <div className="phieu-manager">
        <div className="sidebar">{sidebar}</div>
        <div className="preview-area">
          <PrintPreview
            rows={rowsToPrint}
            meta={meta}
            month={month}
            year={year}
            mData={mData}
            upMData={upMData}
            upMeta={upMeta}
            includeTongHop={includeTongHop}
            page={previewPage}
            onPageChange={setPreviewPage}
          />
        </div>
      </div>

      {/* Print area - hidden, chỉ hiện khi print */}
      <div className="print-only" style={{ display: "none" }}>
        {rowsToPrint.map((r) => (
          <div key={r.hs.id} className="phieu-page">
            <PhieuThu
              phieuRow={r}
              meta={meta}
              month={month}
              year={year}
              mData={mData}
              upMData={upMData}
              upMeta={upMeta}
              isBatch={true}
            />
          </div>
        ))}
        {includeTongHop && rowsToPrint.length > 0 && (
          <div className="phieu-page">
            <PhieuTongHop
              rows={rowsToPrint}
              lopTen={selectedLop === "all" ? "Tất cả các lớp" : meta.classes.find((c) => c.id === selectedLop)?.ten || "Không xác định"}
              month={month}
              year={year}
            />
          </div>
        )}
      </div>

      {/* Issues modal */}
      {showIssues && (
        <div 
          onClick={() => setShowIssues(false)} 
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(0,0,0,.5)", 
            zIndex: 150, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: 20 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: 420, 
              width: "100%", 
              background: "#fff", 
              borderRadius: 16, 
              padding: 20, 
              maxHeight: "80vh", 
              overflow: "auto" 
            }}
          >
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 12 }}>
              ⚠️ Chi tiết lỗi cần sửa
            </div>
            <PreflightCheck rows={rowsToPrint} meta={meta} />
            <button 
              onClick={() => setShowIssues(false)} 
              style={{ 
                width: "100%", 
                marginTop: 14, 
                padding: "12px 0", 
                borderRadius: 11, 
                border: "none", 
                background: C.pine, 
                color: "#fff", 
                fontFamily: font.display, 
                fontWeight: 700, 
                fontSize: 15, 
                cursor: "pointer" 
              }}
            >
              ✓ Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
