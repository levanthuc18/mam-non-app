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

  // Tự nén theo số khoản thu để gói gọn 1 trang (không cắt nội dung).
  const nKhoan = phieuRow.ps.dong.length + (phieuRow.noTruoc !== 0 ? 1 : 0);
  const dense = nKhoan >= 10 ? 2 : nKhoan >= 7 ? 1 : 0;
  const rowPad = dense === 2 ? 2.5 : dense === 1 ? 4 : 5.5;
  const rowFont = dense === 2 ? 11.5 : dense === 1 ? 12 : 13;

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
            #phieu-in { box-shadow: none !important; background: #fff !important; max-width: none !important; width: 100% !important; aspect-ratio: auto !important; min-height: 18.6cm !important; }
            .no-print { display: none !important; }
          }
        `}</style>
      )}

      {!isBatch && setPhieuId && (
        <select className="no-print" value={phieuRow.hs.id} onChange={(e) => setPhieuId(e.target.value)} style={{ width: "100%", padding: "11px 12px", borderRadius: 12, marginBottom: 14, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 14, color: C.ink, background: C.card }}>
          {allRows.filter((r) => r.coRec).map((r) => <option key={r.hs.id} value={r.hs.id}>{r.hs.ten} — {r.lop?.ten}</option>)}
        </select>
      )}

      <div id="phieu-in" style={{ ...LIGHT_VARS, background: "#fff", color: C.ink, fontFamily: font.body, width: "100%", maxWidth: 520, margin: "0 auto", aspectRatio: "148 / 210", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>

        {/* ===== ĐỎ: đầu phiếu (bám lề trên) ===== */}
        <div style={{ flexShrink: 0, padding: "7px 16px 5px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <div style={{ flexShrink: 0 }}><Logo mark={false} w={92} /></div>
            <div style={{ fontFamily: '"Times New Roman", Times, Georgia, serif', fontSize: 11.5, color: C.ink, lineHeight: 1.4, textAlign: "right" }}>
              <div style={{ fontSize: 14, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 0.2 }}>{meta.tenTruong || "Mầm Non Tuổi Thần Tiên"}</div>
              <div>Địa chỉ: {meta.diaChi || "Lạc Nông - Mai Đình - Sóc Sơn - Hà Nội"}</div>
              <div>Điện thoại: <b>{meta.dienThoai || "0945.958.222"}</b></div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: font.display, fontWeight: 900, fontSize: 19.5, color: C.ink, letterSpacing: 0.4 }}>PHIẾU THÔNG BÁO HỌC PHÍ</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginTop: 3 }}>Tháng {mm} năm {year}</div>
            <div style={{ fontSize: 11, color: C.sub, fontStyle: "italic", marginTop: 0.5 }}>Năm học {namHoc}</div>
          </div>
        </div>

        {/* ===== GIỮA: học sinh + bảng + tổng (flex:1 đẩy blue xuống đáy; nhiều khoản thì tự cao thêm, không cắt) ===== */}
        <div style={{ flex: "1 1 auto", padding: "0 16px", borderTop: `1px dashed ${C.line}`, paddingTop: 8, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13.5, marginBottom: 8, lineHeight: 1.45 }}>
            <div>Họ và tên trẻ: <b style={{ fontSize: 16 }}>{phieuRow.hs.ten}</b></div>
            <div>Lớp: <b style={{ fontSize: 14 }}>{phieuRow.lop?.ten || ""}</b></div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 5, borderBottom: `2px solid ${C.line}`, fontWeight: 800, fontSize: 12.5 }}>
              <span>Khoản thu</span><span>Thành tiền</span>
            </div>
            {phieuRow.ps.dong.map(([l, v], i) => (
              <div key={i} style={{ ...amtRow, padding: `${rowPad}px 0`, borderBottom: `1px dotted ${C.line}`, fontSize: rowFont }}>
                <span>{l}</span>
                <span style={{ color: v < 0 ? C.coral : C.ink }}>{v < 0 ? "−" + fmt(-v) : fmt(v)} đ</span>
              </div>
            ))}
            {phieuRow.noTruoc !== 0 && (
              <div style={{ ...amtRow, padding: `${rowPad}px 0`, borderBottom: `1px dotted ${C.line}`, fontSize: rowFont, color: phieuRow.noTruoc > 0 ? C.coral : C.green }}>
                <span>{phieuRow.noTruoc > 0 ? "Nợ tháng trước" : "Dư tháng trước"}</span>
                <span>{phieuRow.noTruoc > 0 ? fmt(phieuRow.noTruoc) : "−" + fmt(-phieuRow.noTruoc)} đ</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: dense ? 6 : 9 }}>
            <div style={{ ...amtRow, fontFamily: font.display, fontWeight: 800, fontSize: dense ? 15 : 16 }}>
              <span>TỔNG PHẢI THU</span><span>{fmt(phieuRow.tongPhaiThu)} đ</span>
            </div>
            <div style={{ ...amtRow, fontSize: 13, color: C.sub, marginTop: 4 }}>
              <span>Đã thu</span><span>{fmt(phieuRow.rec.thucThu)} đ</span>
            </div>
            {phieuRow.conNo !== 0 && (
              <div style={{ ...amtRow, fontFamily: font.display, fontWeight: 800, fontSize: dense ? 15 : 16, color: phieuRow.conNo > 0 ? C.coral : C.amber, marginTop: 3 }}>
                <span>{phieuRow.conNo > 0 ? "Còn lại cần đóng" : "Thu thừa"}</span>
                <span>{fmt(Math.abs(phieuRow.conNo))} đ</span>
              </div>
            )}
          </div>
        </div>

        {/* ===== XANH: QR + thông báo + chân (bám lề dưới) ===== */}
        <div style={{ flexShrink: 0, padding: "5px 16px 5px" }}>
          <div style={{ padding: "10px 13px", borderRadius: 12, background: C.pineSoft, border: `1.5px solid ${C.line}`, display: "flex", gap: 13, alignItems: "center" }}>
            <QRBox bank={bank} amount={Math.max(0, phieuRow.conNo)} noiDung={`Hoc phi ${phieuRow.hs.ten} T${month}`} size={dense ? 80 : 90} />
            <div style={{ fontSize: 13, lineHeight: 1.55, minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: C.pine, fontSize: 13, letterSpacing: 0.3, marginBottom: 5 }}>THÔNG TIN CHUYỂN KHOẢN</div>
              <div style={{ marginBottom: 2 }}><span style={{ color: C.sub }}>Chủ tài khoản: </span><b>{bank.chu}</b></div>
              <div><span style={{ color: C.sub }}>Số tài khoản: </span><b>{bank.stk} · {bank.nh}</b></div>
            </div>
          </div>

          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: C.blueASoft, display: "flex", gap: 11, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: C.blueA, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="bell" size={15} color="#fff" />
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.4, color: C.ink }}>
              <div>Phụ huynh đóng tiền từ ngày <b>01/{mm}</b> đến <b>10/{mm}</b> tại văn phòng hoặc giáo viên tại lớp.</div>
              <div style={{ fontStyle: "italic", color: C.blueA, marginTop: 2 }}>Vui lòng kiểm tra thông tin trước khi thanh toán. Xin cảm ơn!</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 10.5, color: C.sub, paddingTop: 7, marginTop: 8, borderTop: `1px dashed ${C.line}` }}>
            <div>Mã phiếu: <b style={{ color: C.ink }}>{bienLai || "(cấp khi in)"}</b></div>
            <div>Ngày {now.getDate()} tháng {String(now.getMonth() + 1).padStart(2, "0")} năm {now.getFullYear()}</div>
          </div>
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
