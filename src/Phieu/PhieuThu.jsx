import { C, font, fmt, printWithName, fileName, LIGHT_VARS } from "../lib.js";
import { Logo } from "../Brand.jsx";
import { Icon } from "../Icon.jsx";
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
  const namHoc = month >= 8 ? `${year} - ${year + 1}` : `${year - 1} - ${year}`;
  const mm = month < 10 ? `0${month}` : `${month}`;
  const bank = meta.bank[nguoiThu] || {};
  const now = new Date();

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

  const amtRow = { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, whiteSpace: "nowrap" };

  return (
    <>
      {!isBatch && (
        <style>{`
          @media print {
            @page { size: A5 portrait; margin: 0; }
            #phieu-in { box-shadow: none !important; background: #fff !important; max-width: none !important; width: 100% !important; padding: 0.6cm 0.6cm 0.5cm !important; }
            .no-print { display: none !important; }
          }
        `}</style>
      )}

      {!isBatch && setPhieuId && (
        <select className="no-print" value={phieuRow.hs.id} onChange={(e) => setPhieuId(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 12, marginBottom: 14, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: C.card }}>
          {allRows.filter((r) => r.coRec).map((r) => <option key={r.hs.id} value={r.hs.id}>{r.hs.ten} — {r.lop?.ten}</option>)}
        </select>
      )}

      <div id="phieu-in" style={{ ...LIGHT_VARS, background: "#fff", color: C.ink, fontFamily: font.body, width: "100%", maxWidth: 540, margin: "0 auto", padding: "20px 22px 16px", boxSizing: "border-box" }}>

        {/* Header: logo + thông tin trường */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 16 }}>
          <div style={{ flexShrink: 0 }}><Logo mark={false} w={118} /></div>
          <div style={{ fontFamily: '"Times New Roman", Times, Georgia, serif', fontSize: 12.5, color: C.ink, lineHeight: 1.45, textAlign: "right" }}>
            <div style={{ fontSize: 15.5, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.2 }}>{meta.tenTruong || "Mầm Non Tuổi Thần Tiên"}</div>
            <div>Địa chỉ: {meta.diaChi || "Lạc Nông - Mai Đình - Sóc Sơn - Hà Nội"}</div>
            <div>Điện thoại: <b>{meta.dienThoai || "0945.958.222"}</b></div>
          </div>
        </div>

        {/* Tiêu đề */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 23, color: C.ink, letterSpacing: 0.4 }}>PHIẾU THÔNG BÁO HỌC PHÍ</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 5 }}>Tháng {mm} năm {year}</div>
          <div style={{ fontSize: 12, color: C.sub, fontStyle: "italic", marginTop: 1 }}>Năm học {namHoc}</div>
        </div>

        <div style={{ borderTop: `1px dashed ${C.line}`, marginBottom: 14 }} />

        {/* Học sinh */}
        <div style={{ fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>
          <div>Họ và tên trẻ: <b style={{ fontSize: 18 }}>{phieuRow.hs.ten}</b></div>
          <div>Lớp: <b style={{ fontSize: 15 }}>{phieuRow.lop?.ten || ""}</b></div>
        </div>

        {/* Bảng khoản thu */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: `2px solid ${C.line}`, fontWeight: 800, fontSize: 13.5 }}>
            <span>Khoản thu</span><span>Thành tiền</span>
          </div>
          {phieuRow.ps.dong.map(([l, v], i) => (
            <div key={i} style={{ ...amtRow, padding: "9px 0", borderBottom: `1px dotted ${C.line}`, fontSize: 14 }}>
              <span>{l}</span>
              <span style={{ color: v < 0 ? C.coral : C.ink }}>{v < 0 ? "−" + fmt(-v) : fmt(v)} đ</span>
            </div>
          ))}
          {phieuRow.noTruoc !== 0 && (
            <div style={{ ...amtRow, padding: "9px 0", borderBottom: `1px dotted ${C.line}`, fontSize: 14, color: phieuRow.noTruoc > 0 ? C.coral : C.green }}>
              <span>{phieuRow.noTruoc > 0 ? "Nợ tháng trước" : "Dư tháng trước"}</span>
              <span>{phieuRow.noTruoc > 0 ? fmt(phieuRow.noTruoc) : "−" + fmt(-phieuRow.noTruoc)} đ</span>
            </div>
          )}
        </div>

        {/* Tổng */}
        <div style={{ marginTop: 14 }}>
          <div style={{ ...amtRow, fontFamily: font.display, fontWeight: 800, fontSize: 19 }}>
            <span>TỔNG PHẢI THU</span><span>{fmt(phieuRow.tongPhaiThu)} đ</span>
          </div>
          <div style={{ ...amtRow, fontSize: 14, color: C.sub, marginTop: 7 }}>
            <span>Đã thu</span><span>{fmt(phieuRow.rec.thucThu)} đ</span>
          </div>
          {phieuRow.conNo !== 0 && (
            <div style={{ ...amtRow, fontFamily: font.display, fontWeight: 800, fontSize: 19, color: phieuRow.conNo > 0 ? C.coral : C.amber, marginTop: 5 }}>
              <span>{phieuRow.conNo > 0 ? "Còn lại cần đóng" : "Thu thừa"}</span>
              <span>{fmt(Math.abs(phieuRow.conNo))} đ</span>
            </div>
          )}
        </div>

        {/* Thẻ QR chuyển khoản */}
        <div style={{ marginTop: 18, padding: "15px 17px", borderRadius: 14, background: C.pineSoft, border: `1.5px solid ${C.line}`, display: "flex", gap: 16, alignItems: "center" }}>
          <QRBox bank={bank} amount={Math.max(0, phieuRow.conNo)} noiDung={`Hoc phi ${phieuRow.hs.ten} T${month}`} size={108} />
          <div style={{ fontSize: 13, lineHeight: 1.5, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: C.pine, fontSize: 13.5, letterSpacing: 0.3, marginBottom: 7 }}>THÔNG TIN CHUYỂN KHOẢN</div>
            <div style={{ color: C.sub, fontSize: 11.5 }}>Chủ tài khoản</div>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 5 }}>{bank.chu}</div>
            <div style={{ color: C.sub, fontSize: 11.5 }}>Số tài khoản</div>
            <div style={{ fontWeight: 700 }}>{bank.stk} · {bank.nh}</div>
          </div>
        </div>

        {/* Hộp thông báo */}
        <div style={{ marginTop: 14, padding: "13px 15px", borderRadius: 12, background: C.blueASoft, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: C.blueA, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="bell" size={17} color="#fff" />
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: C.ink }}>
            <div>Phụ huynh đóng tiền từ ngày <b>01/{mm}</b> đến <b>10/{mm}</b> tại văn phòng hoặc giáo viên tại lớp.</div>
            <div style={{ fontStyle: "italic", color: C.blueA, marginTop: 4 }}>Vui lòng kiểm tra thông tin trước khi thanh toán. Xin cảm ơn!</div>
          </div>
        </div>

        {/* Chân phiếu */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 11.5, color: C.sub, paddingTop: 12, marginTop: 16, borderTop: `1px dashed ${C.line}` }}>
          <div>Mã phiếu: <b style={{ color: C.ink }}>{bienLai || "(cấp khi in)"}</b></div>
          <div>Ngày {now.getDate()} tháng {String(now.getMonth() + 1).padStart(2, "0")} năm {now.getFullYear()}</div>
        </div>
      </div>

      {!isBatch && (
        <button className="no-print" onClick={inPhieu} style={{ marginTop: 14, width: "100%", padding: "13px 0", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {bienLai ? "In / Lưu PDF" : "Cấp số biên lai & In"}
        </button>
      )}
    </>
  );
}
