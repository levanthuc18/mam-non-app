// ImportHS.jsx — Nhập danh sách học sinh từ file CSV/Excel.
// Component thuần nhận props (meta, students, upStudents, ym) — CaiDat lẫn HocSinh dùng chung.
import { useState } from "react";
import { C, font, uid, toast, noDau, PHAN_LOAI, TRANG_THAI } from "./lib.js";
import { Card } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

export function ImportHSExcel({ meta, students, upStudents, ym }) {
  const [busy, setBusy] = useState(false);
  const [paste, setPaste] = useState("");
  const [tplText, setTplText] = useState("");
  const HEADERS = ["Họ tên", "Lớp", "Phân loại", "Người thu", "SĐT", "Nợ đầu kỳ"];
  const buildTpl = () => {
    const l0 = meta.classes[0]?.ten || "Sóc Nhí", l1 = meta.classes[1]?.ten || l0;
    const rows = [HEADERS, ["Bé Na", l0, "Bthg", "A", "0912000111", "0"], ["Bé Bo", l1, "AE", "B", "", "0"], ["Bé Bi", l0, "", "A", "", "0"]];
    return rows.map((r) => r.join(",")).join("\n");
  };
  const downloadTpl = () => {
    const csv = buildTpl();
    try { const blob = new Blob(["\uFEFF" + "sep=,\n" + csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `mau-nhap-hoc-sinh.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch {}
    setTplText(csv);
  };
  const splitLine = (line, delim) => { const out = []; let cur = "", q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === delim && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((s) => s.trim()); };
  const FIELD_ORDER = ["ten", "lop", "pl", "nguoiThu", "sdt", "noDauKy", "gt"];
  const FIELD_SYN = {
    ten: ["ho ten", "hoten", "ten", "name"], lop: ["lop", "class"],
    pl: ["phan loai", "phanloai", "pl"], nguoiThu: ["nguoi thu", "nguoithu", "thu"],
    sdt: ["sdt", "sdt phu huynh", "so dien thoai", "dien thoai", "phone"],
    noDauKy: ["no dau ky", "nodauky", "no dau", "no"], gt: ["gioi tinh", "gt", "sex", "gender"],
    tt: ["trang thai"], ngayNhap: ["ngay nhap hoc", "ngay nhap"], ngaySinh: ["ngay sinh", "dob"],
  };
  const matchField = (hcell) => {
    const s = noDau(String(hcell || "").toLowerCase()).replace(/\(.*?\)/g, "").trim();
    if (!s) return null;
    for (const f in FIELD_SYN) if (FIELD_SYN[f].some((syn) => s === syn || s.startsWith(syn))) return f;
    return null;
  };
  const normGt = (v) => { const s = noDau(String(v || "").toLowerCase().trim()); if (!s) return ""; if (["nam", "m", "male", "trai", "boy"].includes(s)) return "Nam"; if (["nu", "f", "female", "gai", "girl"].includes(s)) return "Nữ"; return ""; };
  const parse = (text) => {
    let lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    if (lines[0] && /^sep=/i.test(lines[0].trim())) lines = lines.slice(1);
    if (lines.length < 2) return [];
    const h0 = lines[0];
    const cSemi = (h0.match(/;/g) || []).length, cTab = (h0.match(/\t/g) || []).length, cComma = (h0.match(/,/g) || []).length;
    const delim = (cSemi >= cComma && cSemi >= cTab && cSemi > 0) ? ";" : (cTab >= cComma && cTab > 0) ? "\t" : ",";
    const hd = splitLine(lines[0], delim);
    // Ánh xạ cột → field theo TÊN tiêu đề; nếu tiêu đề hỏng font/không khớp → dùng theo VỊ TRÍ.
    const byName = hd.map(matchField);
    const colField = (byName.filter(Boolean).length >= 2) ? byName : hd.map((_, i) => FIELD_ORDER[i] || null);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cells = splitLine(lines[i], delim);
      const o = {};
      colField.forEach((f, idx) => { if (f) o[f] = cells[idx] || ""; });
      rows.push(o);
    }
    return rows;
  };
  const doImport = async (text) => {
    let rows;
    try { rows = parse(text); } catch { rows = []; }
    if (!rows.length) { toast("Không đọc được dòng nào. Kiểm tra lại định dạng file."); return; }
    setBusy(true);
    try {
      let added = 0, skip = 0; const ns = [...students];
      rows.forEach((r) => {
        const ten = (r.ten || "").trim(); if (!ten) { skip++; return; }
        const lopTen = (r.lop || "").trim();
        const lop = meta.classes.find((c) => c.ten === lopTen || noDau(c.ten) === noDau(lopTen)); if (!lop) { skip++; return; }
        const pl = (r.pl || "").trim() || "Bthg";
        const nguoiThu = (r.nguoiThu || "").trim().toUpperCase() === "B" ? "B" : "A";
        const tt = (r.tt || "").trim() || "Đang học";
        const ngayNhap = (r.ngayNhap || "").trim() || ym;
        const ngaySinh = (r.ngaySinh || "").trim();
        const sdt = (r.sdt || "").trim();
        const noDauKy = Number(String(r.noDauKy || "").replace(/[^\d-]/g, "")) || 0;
        ns.push({ id: "hs" + uid(), ten, gt: normGt(r.gt), ngaySinh, lopHistory: [{ tuThang: ngayNhap, lop: lop.id }], pl: PHAN_LOAI.includes(pl) ? pl : "Bthg", nguoiThu, trangThai: TRANG_THAI.includes(tt) ? tt : "Đang học", ngayNhapHoc: ngayNhap, ngayNghiHoc: "", noDauKy, phuHuynh: { ten: "", sdt } });
        added++;
      });
      if (!added) { toast(`Chưa thêm được HS nào — bỏ qua ${skip} dòng (thiếu tên hoặc tên lớp không khớp).`); return; }
      upStudents(ns, true);
      toast(`Đã thêm ${added} HS${skip ? `, bỏ qua ${skip} dòng (thiếu tên/sai lớp)` : ""}.`);
      setPaste("");
    } catch (e) {
      toast("Không nhập được — kiểm tra lại file rồi thử lại.");
    } finally { setBusy(false); }
  };
  const importFile = async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; doImport(await f.text()); };

  return (
    <Card style={{ marginBottom: 12, background: C.blueASoft, borderColor: C.line }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, color: C.blueA, marginBottom: 6, display:"flex", alignItems:"center", gap:6 }}><Icon name="download" size={16} color={C.blueA} /> Nhập hàng loạt từ Excel/CSV</div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>Mỗi dòng = 1 học sinh, cách nhau bằng dấu phẩy, theo thứ tự: <b>Họ tên, Lớp, Phân loại, Người thu, SĐT, Nợ</b>. Chỉ <b>Họ tên</b> + <b>Lớp</b> bắt buộc; ô trống cứ để 2 dấu phẩy liền. Giữ nguyên dòng tiêu đề đầu tiên. Có thể thêm cột <b>Giới tính</b> (Nam/Nữ) — tùy chọn.</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={downloadTpl} style={{ display:"inline-flex", alignItems:"center", gap:6, padding: "9px 14px", borderRadius: 9, border: `1.5px solid ${C.blueA}`, background: C.card, color: C.blueA, fontWeight: 700, fontSize: 13, cursor: "pointer" }}><Icon name="fileText" size={14} color={C.blueA} /> File mẫu CSV</button>
        <label style={{ display: "inline-flex", alignItems:"center", gap:6, padding: "9px 14px", borderRadius: 9, border: `1.5px dashed ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{busy ? "Đang xử lý…" : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="upload" size={14} color={C.sub} /> Chọn file CSV</span>}<input type="file" accept=".csv,text/csv" onChange={importFile} disabled={busy} style={{ display: "none" }} /></label>
      </div>
      {tplText && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>Nếu máy không tải được, copy nội dung mẫu dưới đây dán vào Excel/Sheets:</div>
          <textarea readOnly value={tplText} onFocus={(e) => e.target.select()} style={{ width: "100%", height: 70, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 8, padding: 6, background: C.graySoft }} />
        </div>
      )}
      <div style={{ fontSize: 12, color: C.sub, margin: "6px 0 4px" }}>Hoặc dán nội dung CSV đã điền vào đây rồi bấm Nhập:</div>
      <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'Họ tên,Lớp,Phân loại,Người thu,SĐT,Nợ đầu kỳ\nBé Na,Sóc Nhí,Bthg,A,0912000111,0\nBé Bo,Sơn Ca,,B,,0'} style={{ width: "100%", height: 80, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 8, padding: 6, marginBottom: 8 }} />
      <button onClick={() => doImport(paste)} disabled={busy || !paste.trim()} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: paste.trim() ? C.pine : C.graySoft, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: paste.trim() ? "pointer" : "default" }}>+ Nhập danh sách</button>
    </Card>
  );
}
