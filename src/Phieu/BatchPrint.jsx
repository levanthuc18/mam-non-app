import { useState, useMemo } from "react";
import { C, font } from "../lib.js";
import { PhieuThu } from "./PhieuThu.jsx";
import { PhieuTongHop } from "./PhieuTongHop.jsx";

export function BatchPrint({ allRows, meta, month, year, mData, upMData, upMeta, onClose }) {
  const [selectedLop, setSelectedLop] = useState("all");
  const [includeTongHop, setIncludeTongHop] = useState(true);

  const lopOptions = meta.classes || [];
  
  // Fix lỗi 4: Dùng r.lopId thay vì r.lop?.id
  const rowsToPrint = useMemo(() => {
    return allRows.filter((r) => {
      if (!r.coRec) return false;
      if (selectedLop === "all") return true;
      return r.lopId === selectedLop;
    });
  }, [allRows, selectedLop]);

  const handlePrintBatch = () => {
    if (rowsToPrint.length === 0) return;
    
    const newFees = { ...mData.fees };
    const newSoBienLai = { ...(meta.soBienLai || {}) };
    let changed = false;

    rowsToPrint.forEach((r) => {
      if (!r.rec.bienLai) {
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
      setTimeout(() => window.print(), 200);
    } else {
      window.print();
    }
  };

  const lopTen = selectedLop === "all" 
    ? "Tất cả các lớp" 
    : lopOptions.find(l => l.id === selectedLop)?.ten || "Không xác định";

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .phieu-page { 
            page-break-after: always; 
            break-after: page; 
          }
          .phieu-page:last-child { 
            page-break-after: auto; 
            break-after: auto;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ position: "sticky", top: 0, background: "#fff", padding: "12px 0", borderBottom: `1px solid ${C.line}`, zIndex: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select 
            value={selectedLop} 
            onChange={(e) => setSelectedLop(e.target.value)} 
            style={{ padding: "10px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontSize: 14 }}
          >
            <option value="all">Tất cả các lớp</option>
            {lopOptions.map((l) => <option key={l.id} value={l.id}>{l.ten}</option>)}
          </select>
          
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={includeTongHop} onChange={(e) => setIncludeTongHop(e.target.checked)} />
            Bao gồm bảng tổng hợp
          </label>

          {/* Fix lỗi 5: Disable nút khi không có dữ liệu */}
          <button 
            onClick={handlePrintBatch} 
            disabled={rowsToPrint.length === 0}
            style={{ 
              marginLeft: "auto", 
              padding: "10px 16px", 
              borderRadius: 8, 
              border: "none", 
              background: rowsToPrint.length === 0 ? C.graySoft : C.pine, 
              color: rowsToPrint.length === 0 ? C.gray : "#fff", 
              fontWeight: 700, 
              cursor: rowsToPrint.length === 0 ? "not-allowed" : "pointer" 
            }}
          >
            🖨 In {rowsToPrint.length} phiếu
          </button>
          <button 
            onClick={onClose} 
            style={{ padding: "10px 16px", borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff", color: C.ink, fontWeight: 700, cursor: "pointer" }}
          >
            Đóng
          </button>
        </div>
        
        {/* Hiển thị số lượng */}
        <div style={{ marginTop: 8, fontSize: 12, color: C.sub }}>
          {rowsToPrint.length === 0 ? (
            <span style={{ color: C.coral }}>⚠️ Không có học sinh nào trong lớp này</span>
          ) : (
            <span>✓ {rowsToPrint.length} học sinh sẵn sàng in</span>
          )}
        </div>
      </div>

      <div className="print-area" style={{ paddingTop: 20 }}>
        {rowsToPrint.map((r) => (
          <div key={r.hs.id} className="phieu-page" style={{ marginBottom: 30 }}>
            <PhieuThu 
              phieuRow={r} 
              meta={meta} month={month} year={year} 
              mData={mData} upMData={upMData} upMeta={upMeta}
              isBatch={true} 
            />
          </div>
        ))}

        {includeTongHop && rowsToPrint.length > 0 && (
          <div className="phieu-page" style={{ pageBreakBefore: "always" }}>
            <PhieuTongHop 
              rows={rowsToPrint} 
              lopTen={lopTen}
              month={month} 
              year={year} 
            />
          </div>
        )}
      </div>
    </>
  );
}
