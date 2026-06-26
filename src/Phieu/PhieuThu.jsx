import { C, font, fmt, printWithName, fileName } from "../lib.js";
import { Logo } from "../Brand.jsx";
import { QRBox } from "./QRBox.jsx";

export function PhieuThu({ 
  phieuRow, 
  allRows = [], 
  setPhieuId = null, 
  meta, 
  month, 
  year, 
  upMeta = null, 
  mData = null, 
  upMData = null, 
  isBatch = false 
}) {
  const nguoiThu = phieuRow.hs.nguoiThu;
  const bienLai = phieuRow.rec.bienLai || null;
  const namHoc = month >= 8 ? `${year}–${year + 1}` : `${year - 1}–${year}`;

  const inPhieu = () => {
    const printTitle = fileName(`${phieuRow.lop?.ten ? phieuRow.lop.ten + " - " : ""}${phieuRow.hs.ten} - T${month}.${year}`);
    if (!bienLai && upMeta && upMData) {
      const next = (meta.soBienLai?.[nguoiThu] || 0) + 1;
      const bl = `BL-${nguoiThu}-${String(next).padStart(4, "0")}`;
      upMeta({ ...meta, soBienLai: { ...(meta.soBienLai || {}), [nguoiThu]: next } });
      upMData({ ...mData, fees: { ...mData.fees, [phieuRow.hs.id]: { ...mData.fees[phieuRow.hs.id], bienLai: bl } } });
      printWithName(printTitle, 100);
    } else {
      printWithName(printTitle, 0);
    }
  };

  return (
    <>
      {!isBatch && (
        <style>{`
          @media print {
            @page { size: A5 portrait; margin: 0.4cm 0.6cm; }
            html, body { height: 99%; overflow: hidden; }
            #phieu-in { box-shadow: none !important; background: #fff !important; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
            .no-print { display: none !important; }
          }
        `}</style>
      )}

      {!isBatch && setPhieuId && (
        <select className="no-print" value={phieuRow.hs.id} onChange={(e) => setPhieuId(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 12, marginBottom: 14, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: C.card }}>
          {allRows.filter((r) => r.coRec).map((r) => <option key={r.hs.id} value={r.hs.id}>{r.hs.ten} — {r.lop?.ten}</option>)}
        </select>
      )}

      <div id="phieu-in" style={{ background: "#FFFEF9", padding: "0 0 10px", minHeight: "135mm", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          {!isBatch && <div className="no-print" style={{ height: 6, background: `linear-gradient(45deg, transparent 33.33%, #FFFEF9 33.33%, #FFFEF9 66.66%, transparent 66.66%), linear-gradient(-45deg, transparent 33.33%, #FFFEF9 33.33%, #FFFEF9 66.66%, transparent 66.66%)`, backgroundColor: C.bg, backgroundSize: "14px 20px" }} />}
          
          <div style={{ maxWidth: 420, margin: "0 auto", padding: "8px 10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: 10 }}>
              <div style={{ flexShrink: 0 }}><Logo mark={false} w={90} /></div>
              <div style={{ fontFamily: '"Times New Roman", Times, Georgia, serif', fontSize: "11px", color: C.ink, lineHeight: "1.35", fontWeight: "bold", textAlign: "right" }}>
                <div style={{ fontSize: "12.5px", textTransform: "uppercase" }}>{meta.tenTruong || "Mầm Non Tuổi Thần Tiên"}</div>
                <div>Địa chỉ: {meta.diaChi || "Lạc Nông- Mai Đình- Sóc Sơn - Hà Nội"}</div>
                <div>Điện thoại: {meta.dienThoai || "0945.958.222"}</div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 16.5, color: C.ink, letterSpacing: "0.5px" }}>PHIẾU THÔNG BÁO HỌC PHÍ</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.ink, marginTop: 1 }}>Tháng {month < 10 ? `0${month}` : month} năm {year}</div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 0.5, fontStyle: "italic", fontWeight: 500 }}>Năm học {namHoc}</div>
            </div>

            <div style={{ margin: "8px 0 6px", borderTop: `1px solid ${C.line || "#E2E8F0"}` }} />
            <div style={{ fontSize: 12, color: C.ink, lineHeight: "1.4", marginBottom: 6 }}>
              <div>Họ và tên trẻ: <b>{phieuRow.hs.ten}</b></div><div>Họ và tên trẻ: <b style={{ fontSize: 15 }}>{phieuRow.hs.ten}</b></div>
              <div>Lớp: <b>{phieuRow.lop?.ten || "Sóc Nhí"}</b></div>
            </div>

            <div style={{ fontSize: 12, marginTop: 6 }}>
              {phieuRow.ps.dong.map(([l, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: `1px dotted ${C.line}` }}>
                  <span style={{ color: C.sub }}>{l}</span><span>{fmt(v)}</span>
                </div>
              ))}
              {phieuRow.noTruoc !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: `1px dotted ${C.line}`, color: phieuRow.noTruoc > 0 ? C.coral : C.green }}>
                  <span>{phieuRow.noTruoc > 0 ? "Nợ tháng trước" : "Dư tháng trước"}</span>
                  <span>{phieuRow.noTruoc > 0 ? fmt(phieuRow.noTruoc) : "−" + fmt(-phieuRow.noTruoc)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", fontFamily: font.display, fontWeight: 800, fontSize: 14 }}>
                <span>TỔNG PHẢI THU</span><span>{fmt(phieuRow.tongPhaiThu)} đ</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span style={{ color: C.sub }}>Đã thu</span><span>{fmt(phieuRow.rec.thucThu)} đ</span>
              </div>
              {phieuRow.conNo !== 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: phieuRow.conNo > 0 ? C.coral : C.amber, fontWeight: 600 }}>
                  <span>{phieuRow.conNo > 0 ? "Còn lại cần đóng" : "Thu thừa"}</span>
                  <span>{fmt(Math.abs(phieuRow.conNo))} đ</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: C.pineSoft, display: "flex", gap: 10, alignItems: "center" }}>
              <QRBox bank={meta.bank[nguoiThu]} amount={Math.max(0, phieuRow.conNo)} noiDung={`Hoc phi ${phieuRow.hs.ten} T${month}`} />
              <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                <b>Thông tin tài khoản</b><br />
                {meta.bank[nguoiThu].chu}<br />
                {meta.bank[nguoiThu].stk} · {meta.bank[nguoiThu].nh}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 10px", width: "100%" }}>
          <div style={{ padding: "6px 8px", backgroundColor: "#F8FAFC", borderRadius: 4, fontSize: 10, color: C.sub || "#64748B", lineHeight: "1.4", textAlign: "center", marginBottom: 8 }}>
            <div style={{ marginBottom: 2 }}>Phụ huynh đóng tiền từ ngày <b>01/{month < 10 ? `0${month}` : month}</b> đến <b>10/{month < 10 ? `0${month}` : month}</b> tại văn phòng hoặc giáo viên tại lớp.</div>
            <div style={{ fontStyle: "italic", fontWeight: 500 }}>Vui lòng kiểm tra thông tin trước khi thanh toán. Xin cảm ơn!</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 9.5, color: C.sub, paddingTop: 4, borderTop: `1px dashed ${C.line || "#E2E8F0"}` }}>
            <div>{bienLai ? <span>Mã phiếu: <b style={{ color: C.ink }}>{bienLai}</b></span> : "Mã phiếu: (cấp khi in)"}</div>
            <div>Ngày {new Date().getDate()} tháng {((new Date().getMonth() + 1).toString().padStart(2, '0'))} năm {new Date().getFullYear()}</div>
          </div>
        </div>
      </div>

      {!isBatch && (
        <button className="no-print" onClick={inPhieu} style={{ marginTop: 14, width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {bienLai ? "🖨 In / Lưu PDF" : "✓ Cấp số biên lai & In"}
        </button>
      )}
    </>
  );
}
