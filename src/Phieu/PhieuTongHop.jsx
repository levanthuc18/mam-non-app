import { C, font, fmt } from "../lib.js";

export function PhieuTongHop({ rows, lopTen, month, year }) {
  const tongTien = rows.reduce((a, r) => a + r.tongPhaiThu, 0);
  
  return (
    <div style={{ background: "#FFFEF9", padding: "20px", minHeight: "135mm", fontFamily: font.body, color: C.ink }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2 style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, textTransform: "uppercase" }}>
          Bảng tổng hợp thu tiền
        </h2>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Lớp: {lopTen}</div>
        <div style={{ fontSize: 12, color: C.sub }}>Tháng {month}/{year}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.pineSoft }}>
            <th style={{ border: `1px solid ${C.line}`, padding: "8px", textAlign: "center" }}>STT</th>
            <th style={{ border: `1px solid ${C.line}`, padding: "8px", textAlign: "left" }}>Họ và tên</th>
            <th style={{ border: `1px solid ${C.line}`, padding: "8px", textAlign: "right" }}>Số tiền</th>
            <th style={{ border: `1px solid ${C.line}`, padding: "8px", textAlign: "center", width: "80px" }}>Ký nhận</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.hs.id}>
              <td style={{ border: `1px solid ${C.line}`, padding: "8px", textAlign: "center" }}>{i + 1}</td>
              <td style={{ border: `1px solid ${C.line}`, padding: "8px" }}>{r.hs.ten}</td>
              <td style={{ border: `1px solid ${C.line}`, padding: "8px", textAlign: "right" }}>{fmt(r.tongPhaiThu)} đ</td>
              <td style={{ border: `1px solid ${C.line}`, padding: "8px" }}></td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: "bold", background: "#F8FAFC" }}>
            <td colSpan={2} style={{ border: `1px solid ${C.line}`, padding: "10px 8px", textAlign: "right" }}>
              TỔNG CỘNG ({rows.length} HS)
            </td>
            <td style={{ border: `1px solid ${C.line}`, padding: "10px 8px", textAlign: "right", color: C.pine, fontFamily: font.display }}>
              {fmt(tongTien)} đ
            </td>
            <td style={{ border: `1px solid ${C.line}` }}></td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <div style={{ textAlign: "center" }}>
          <div>Giáo viên thu</div>
          <div style={{ fontStyle: "italic", fontSize: 11, color: C.sub }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: "60px" }}></div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div>Phụ huynh</div>
          <div style={{ fontStyle: "italic", fontSize: 11, color: C.sub }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: "60px" }}></div>
        </div>
      </div>
    </div>
  );
}
