// Luong.jsx — Bảng lương & Chấm công giáo viên (chỉ hiện ở bản máy tính, trong "Chi phí & lương").
// Dữ liệu CỘNG THÊM vào dữ liệu tháng (mData): luong[gvId] = {cb, pc, kt, paid}, chamCong[gvId] = {ngay, ghiChu}.
// Quy tắc (giả định đã báo người dùng): Thực lãnh = Lương cơ bản + Phụ cấp − Khấu trừ (KHÔNG tự trừ theo ngày công; ngày công chỉ để ghi nhận).
// Nối vào quỹ: khoản chi cố định "Lương giáo viên" tự có Phải trả = tổng Thực lãnh, Đã trả = tổng các dòng đã "Xác nhận chi".
import { C, font, fmt } from "./lib.js";
import { Card, NumInput } from "./ui.jsx";
import { Icon } from "./Icon.jsx";
import { Kpi } from "./ThuPhiPC.jsx";

const TEN_KHOAN = "Lương giáo viên";

export function LuongPanel({ mode, meta, mData, upMData, locked, month, year }) {
  const gvs = meta.giaoVien || [];
  const luong = mData.luong || {};
  const cc = mData.chamCong || {};
  const get = (id) => ({ cb: 0, pc: 0, kt: 0, paid: false, ...(luong[id] || {}) });
  const thucLanh = (id) => { const v = get(id); return (Number(v.cb) || 0) + (Number(v.pc) || 0) - (Number(v.kt) || 0); };

  // Ghi 1 lần duy nhất: dữ liệu lương + đồng bộ khoản chi "Lương giáo viên" (cùng một upMData → không lệch)
  const commit = (nextLuong, nextCC) => {
    const l = nextLuong || luong;
    const tong = gvs.reduce((a, g) => a + ((Number((l[g.id] || {}).cb) || 0) + (Number((l[g.id] || {}).pc) || 0) - (Number((l[g.id] || {}).kt) || 0)), 0);
    const daChi = gvs.reduce((a, g) => a + ((l[g.id] || {}).paid ? ((Number((l[g.id] || {}).cb) || 0) + (Number((l[g.id] || {}).pc) || 0) - (Number((l[g.id] || {}).kt) || 0)) : 0), 0);
    const chiPhi = (mData.chiPhi || []).map((c) => (c.loai === "CO_DINH" && c.noiDung === TEN_KHOAN) ? { ...c, soTien: tong, daTra: daChi } : c);
    upMData({ ...mData, luong: l, chamCong: nextCC || cc, chiPhi });
  };
  const setL = (id, p) => { if (!locked) commit({ ...luong, [id]: { ...get(id), ...p } }); };
  const setCC = (id, p) => { if (!locked) commit(null, { ...cc, [id]: { ngay: 0, ghiChu: "", ...(cc[id] || {}), ...p } }); };

  const coKhoan = (mData.chiPhi || []).some((c) => c.loai === "CO_DINH" && c.noiDung === TEN_KHOAN);
  const ngayChuan = (() => { let n = 0; const d = new Date(year, month, 0).getDate(); for (let i = 1; i <= d; i++) if (new Date(year, month - 1, i).getDay() !== 0) n++; return n; })();
  const th = (right) => ({ padding: "10px 14px", fontWeight: 700, textAlign: right ? "right" : "left", whiteSpace: "nowrap" });
  const td = (right) => ({ padding: "8px 14px", textAlign: right ? "right" : "left", verticalAlign: "middle" });

  if (gvs.length === 0) return <Card style={{ padding: 20, color: C.sub, textAlign: "center" }}>Chưa có giáo viên. Thêm giáo viên ở Cài đặt → Giáo viên.</Card>;

  if (mode === "cc") {
    return (
      <Card style={{ padding: 0, overflow: "clip", marginBottom: 12 }}>
        <div style={{ padding: "12px 14px", fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, borderBottom: `1px solid ${C.line}` }}>Chấm công tháng {month}/{year} <span style={{ fontWeight: 500, fontSize: 12.5, color: C.sub }}>· {ngayChuan} ngày (trừ Chủ nhật)</span></div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, fontFamily: font.body }}>
            <thead><tr style={{ background: C.graySoft, color: C.sub, fontSize: 12.5 }}><th style={th()}>Giáo viên</th><th style={th(true)}>Ngày công</th><th style={th()}>Ghi chú</th></tr></thead>
            <tbody>
              {gvs.map((g) => (
                <tr key={g.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ ...td(), fontWeight: 700, color: C.ink }}>{g.ten}</td>
                  <td style={td(true)}><NumInput lazy value={(cc[g.id] || {}).ngay || 0} onChange={(v) => setCC(g.id, { ngay: v })} w={90} disabled={locked} /></td>
                  <td style={td()}><input defaultValue={(cc[g.id] || {}).ghiChu || ""} disabled={locked} onBlur={(e) => { if (e.target.value !== ((cc[g.id] || {}).ghiChu || "")) setCC(g.id, { ghiChu: e.target.value }); }} placeholder="Ghi chú (nghỉ phép, dạy thay…)" style={{ width: "100%", minWidth: 200, padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: font.body, background: C.card, color: C.ink }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "10px 14px", fontSize: 12, color: C.sub }}>Ngày công chỉ để ghi nhận, chưa tự trừ vào lương.</div>
      </Card>
    );
  }

  const tongLanh = gvs.reduce((a, g) => a + thucLanh(g.id), 0);
  const tongDaChi = gvs.reduce((a, g) => a + (get(g.id).paid ? thucLanh(g.id) : 0), 0);
  return (<>
    <div className="kpi-row" style={{ marginBottom: 12, "--kpi-min": "150px" }}>
      <Kpi icon="banknote" tint={C.pineSoft} mau={C.pine} nhan="Tổng thực lãnh" giaTri={`${fmt(tongLanh)} đ`} />
      <Kpi icon="check" tint={C.greenSoft} mau={C.greenText} nhan="Đã chi" giaTri={`${fmt(tongDaChi)} đ`} />
    </div>
    <Card style={{ padding: 0, overflow: "clip", marginBottom: 12 }}>
      <div style={{ padding: "12px 14px", fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, borderBottom: `1px solid ${C.line}` }}>
        Bảng lương tháng {month}/{year}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, fontFamily: font.body }}>
          <thead><tr style={{ background: C.graySoft, color: C.sub, fontSize: 12.5 }}>
            <th style={th()}>Giáo viên</th><th style={th(true)}>Lương cơ bản</th><th style={th(true)}>Phụ cấp</th><th style={th(true)}>Khấu trừ</th><th style={th(true)}>Thực lãnh</th><th style={th()}>Trạng thái</th>
          </tr></thead>
          <tbody>
            {gvs.map((g) => {
              const v = get(g.id);
              return (
                <tr key={g.id} style={{ borderTop: `1px solid ${C.line}` }}>
                  <td style={{ ...td(), fontWeight: 700, color: C.ink }}>{g.ten}</td>
                  <td style={td(true)}><NumInput lazy value={v.cb} onChange={(x) => setL(g.id, { cb: x })} w={120} disabled={locked} /></td>
                  <td style={td(true)}><NumInput lazy value={v.pc} onChange={(x) => setL(g.id, { pc: x })} w={110} disabled={locked} /></td>
                  <td style={td(true)}><NumInput lazy value={v.kt} onChange={(x) => setL(g.id, { kt: x })} w={110} disabled={locked} /></td>
                  <td style={{ ...td(true), fontWeight: 800, fontVariantNumeric: "tabular-nums", color: C.ink }}>{fmt(thucLanh(g.id))}</td>
                  <td style={td()}>
                    {v.paid
                      ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ background: C.greenSoft, color: C.greenText, borderRadius: 99, padding: "3px 10px", fontSize: 12.5, fontWeight: 700 }}>Đã chi</span>{!locked && <button onClick={() => setL(g.id, { paid: false })} style={{ border: "none", background: "none", color: C.sub, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Hoàn tác</button>}</span>
                      : <button onClick={() => setL(g.id, { paid: true })} disabled={locked || thucLanh(g.id) <= 0} style={{ background: C.pine, color: C.onFill, border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", opacity: (locked || thucLanh(g.id) <= 0) ? 0.5 : 1 }}>Xác nhận chi</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "10px 14px", fontSize: 12, color: C.sub, lineHeight: 1.55 }}>
        Thực lãnh = Lương cơ bản + Phụ cấp − Khấu trừ (chưa tự trừ theo ngày công).{" "}
        {coKhoan
          ? <>Khoản chi cố định <b>"{TEN_KHOAN}"</b> được tự cập nhật: Phải trả = tổng thực lãnh, Đã trả = tổng các dòng đã xác nhận chi.</>
          : <span style={{ color: C.amberText }}><Icon name="alertTriangle" size={12} color={C.amber} /> Chưa có khoản chi cố định "{TEN_KHOAN}" nên lương chưa nối vào quỹ — bấm "+ 5 khoản cố định mẫu" ở tab Chi phí tháng.</span>}
      </div>
    </Card>
  </>);
}
