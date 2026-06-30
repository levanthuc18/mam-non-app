import { useState, useEffect, useMemo, useRef } from "react";
import { Icon } from "./Icon.jsx";
import {
  C, font, fmt, ymKey, noDau, sGet, sSet, sList, sDel,
  ask, toast, logAction, uid,
  PHAN_LOAI, PL_LABEL, TRANG_THAI, TT_COLOR, TT_THU_PHI, GIOI_TINH, GT_LABEL, normGt,
  lopHienTai, lopOfMonth, ngayNhapHocTrongThang, soNgayHoc, tinhPSFromRec,
  KHOAN, isKhongThu, defaultKhoan, khoanMode, SEED_META,
  THEMES, setTheme, getTheme, applyTheme, EDITABLE_COLORS, currentColor, setCustomColor, resetCustom, getCustom
} from "./lib.js";
import {
  Card, NumInput, ABBtn, SearchBar, BottomSheet, useStickyShrink, StickyBar, PLBadge
} from "./ui.jsx";

export function BackupExport({ meta, students }) {
  const [busy, setBusy] = useState(false);
  const [outText, setOutText] = useState("");
  const [outName, setOutName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const dl = (text, name, type) => { try { const blob = new Blob([type === "csv" ? "\uFEFF" + text : text], { type: type === "csv" ? "text/csv;charset=utf-8;" : "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (e) {} };

  const buildJSON = async () => {
    const keys = await sList("mn5:"); const data = {};
    for (const k of keys) data[k] = await sGet(k);
    return JSON.stringify(data);
  };
  const buildCSV = async () => {
    const keys = (await sList("mn5:thang:")).filter((k) => /mn5:thang:\d{4}-\d{2}$/.test(k)).sort();
    const rows = [["Tháng", "Mã HS", "Tên", "Lớp", "Phải thu", "Đã thu", "Còn nợ"]];
    for (const k of keys) {
      const td = await sGet(k); if (!td?.fees) continue;
      const ym = k.replace("mn5:thang:", ""); const y = Number(ym.slice(0, 4)), mo = Number(ym.slice(5));
      const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
      const ddPrevM = (await sGet(`mn5:dd:${ymKey(py, pm)}`)) || {};
      for (const [sid, rec] of Object.entries(td.fees)) {
        const hs = students.find((s) => s.id === sid); if (!hs) continue;
        const lop = meta.classes.find((c) => c.id === lopOfMonth(hs, ym));
        const nghi = Object.keys(ddPrevM[sid] || {}).length;
        const ps = tinhPSFromRec(hs, rec, lop, nghi).tong; const tt = Number(rec.thucThu) || 0;
        rows.push([ym, sid, hs.ten, lop?.ten || "", ps, tt, ps - tt]);
      }
    }
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  };

  const doExport = async (kind) => {
    setBusy(true);
    try {
      const text = kind === "json" ? await buildJSON() : await buildCSV();
      const name = kind === "json" ? `sao-luu-mamnon-${new Date().toISOString().slice(0, 10)}.json` : `bao-cao-thu-phi-${new Date().toISOString().slice(0, 10)}.csv`;
      dl(text, name, kind);                 
      setOutText(text); setOutName(name);   
    } catch (e) { toast("Lỗi xuất: " + e.message); }
    setBusy(false);
  };

  const copyOut = async () => { try { await navigator.clipboard.writeText(outText); toast("Đã copy."); } catch { toast("Bôi đen ô bên dưới rồi Copy thủ công."); } };

  const restore = async (text) => {
    let data; try { data = JSON.parse(text); } catch { toast("Nội dung không hợp lệ."); return; }
    const n = Object.keys(data).length;
    if (!n) { toast("Không có dữ liệu."); return; }
    if (!(await ask(`Phục hồi ${n} mục?\n⚠️ GHI ĐÈ toàn bộ dữ liệu hiện tại — không hoàn tác được.`, { danger: true, okText: "Phục hồi" }))) return;
    setBusy(true);
    try {
      const old = await sList("mn5:");
      for (const k of old) if (!(k in data)) await sDel(k);
      for (const [k, v] of Object.entries(data)) await sSet(k, v);
      toast("Đã phục hồi. Đang tải lại…");
      setTimeout(() => location.reload(), 800);
    } catch (e) { toast("Lỗi: " + e.message); setBusy(false); }
  };
  const importFile = async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; restore(await f.text()); };

  return (
    <>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="save" size={16} color={C.ink} /> Sao lưu dữ liệu</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>Bấm để xuất. Nếu máy không tự tải file (do trình duyệt/khung xem trước chặn), nội dung sẽ hiện ra ô bên dưới để bạn <b>copy</b> và dán vào ghi chú/Zalo lưu lại.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => doExport("json")} disabled={busy} style={{ display:"inline-flex", alignItems:"center", gap:6, padding: "10px 16px", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Đang xử lý…" : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="download" size={15} color="#fff" /> Sao lưu toàn bộ (JSON)</span>}</button>
          <button onClick={() => doExport("csv")} disabled={busy} style={{ display:"inline-flex", alignItems:"center", gap:6, padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.pine}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1 }}><Icon name="fileText" size={15} color={C.pine} /> Xuất Excel thu phí (CSV)</button>
        </div>
        {outText && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.sub }}>{outName}</span>
              <button onClick={copyOut} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: C.blueA, display:"inline-flex", alignItems:"center", gap:5, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}><Icon name="clipboard" size={13} color="#fff" /> Copy</button>
            </div>
            <textarea readOnly value={outText} onFocus={(e) => e.target.select()} style={{ width: "100%", height: 110, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: 8, resize: "vertical", color: C.ink, background: C.graySoft }} />
          </div>
        )}
      </Card>
      <Card>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4, display:"flex", alignItems:"center", gap:6 }}><Icon name="refresh" size={16} color={C.ink} /> Phục hồi</div>
        <div style={{ fontSize: 12, color: C.coral, fontWeight: 600, marginBottom: 10, display:"flex", alignItems:"center", gap:6 }}><Icon name="alertTriangle" size={13} color={C.coral} /> Ghi đè toàn bộ dữ liệu hiện tại.</div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Cách 1 — dán nội dung bản sao lưu JSON vào đây:</div>
        <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder='Dán nội dung JSON đã sao lưu...' style={{ width: "100%", height: 90, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: 8, resize: "vertical", marginBottom: 8 }} />
        <button onClick={() => restore(pasteText)} disabled={busy || !pasteText.trim()} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding: "10px 16px", borderRadius: 10, border: "none", background: pasteText.trim() ? C.coral : C.graySoft, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: pasteText.trim() ? "pointer" : "default" }}><Icon name="refresh" size={15} color={pasteText.trim() ? "#fff" : C.sub} /> Phục hồi từ nội dung dán</button>
        <div style={{ fontSize: 12, color: C.sub, margin: "12px 0 6px" }}>Cách 2 — chọn file .json (chỉ chạy khi mở app thật):</div>
        <label style={{ display: "inline-block", padding: "10px 16px", borderRadius: 10, border: `1.5px dashed ${C.line}`, fontSize: 13.5, color: C.sub, cursor: "pointer" }}>Chọn file .json<input type="file" accept=".json,application/json" onChange={importFile} disabled={busy} style={{ display: "none" }} /></label>
      </Card>
    </>
  );
}

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
  const parse = (text) => {
    let lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    if (lines[0] && /^sep=/i.test(lines[0].trim())) lines = lines.slice(1);
    if (lines.length < 2) return [];
    const h0 = lines[0];
    const cSemi = (h0.match(/;/g) || []).length, cTab = (h0.match(/\t/g) || []).length, cComma = (h0.match(/,/g) || []).length;
    const delim = (cSemi >= cComma && cSemi >= cTab && cSemi > 0) ? ";" : (cTab >= cComma && cTab > 0) ? "\t" : ",";
    const hd = splitLine(lines[0], delim);
    const rows = [];
    for (let i = 1; i < lines.length; i++) { if (!lines[i].trim()) continue; const cells = splitLine(lines[i], delim); const o = {}; hd.forEach((h, idx) => (o[h.replace(/^\uFEFF/, "")] = cells[idx] || "")); rows.push(o); }
    return rows;
  };
  const get = (o, keys) => { for (const k of keys) if (o[k] != null && o[k] !== "") return o[k]; return ""; };
  const doImport = async (text) => {
    const rows = parse(text);
    if (!rows.length) { toast("Không đọc được dòng nào."); return; }
    setBusy(true);
    let added = 0, skip = 0; const ns = [...students];
    rows.forEach((r) => {
      const ten = get(r, ["Họ tên", "Ho ten", "Ten"]); if (!ten) { skip++; return; }
      const lopTen = get(r, ["Lớp", "Lop"]);
      const lop = meta.classes.find((c) => c.ten === lopTen || noDau(c.ten) === noDau(lopTen)); if (!lop) { skip++; return; }
      const pl = get(r, ["Phân loại (Bthg/AE/GV/T7)", "Phân loại", "Phan loai"]) || "Bthg";
      const nguoiThu = get(r, ["Người thu (A/B)", "Người thu", "Nguoi thu"]) || "A";
      const tt = get(r, ["Trạng thái", "Trang thai"]) || "Đang học";
      const ngayNhap = get(r, ["Ngày nhập học (YYYY-MM-DD)", "Ngày nhập học", "Ngay nhap hoc"]) || ym;
      const ngaySinh = get(r, ["Ngày sinh (YYYY-MM-DD)", "Ngày sinh", "Ngay sinh"]);
      const sdt = get(r, ["SĐT phụ huynh", "SDT phu huynh", "SĐT"]);
      const noDauKy = Number(get(r, ["Nợ đầu kỳ", "No dau ky"]) || 0) || 0;
      const gt = normGt(get(r, ["Giới tính", "Gioi tinh", "GT", "Sex"]));
      ns.push({ id: "hs" + uid(), ten, gt, ngaySinh, lopHistory: [{ tuThang: ngayNhap || ym, lop: lop.id }], pl: PHAN_LOAI.includes(pl) ? pl : "Bthg", nguoiThu: nguoiThu === "B" ? "B" : "A", trangThai: TRANG_THAI.includes(tt) ? tt : "Đang học", ngayNhapHoc: ngayNhap || ym, ngayNghiHoc: "", noDauKy, phuHuynh: { ten: "", sdt } });
      added++;
    });
    upStudents(ns, true);
    toast(`Đã thêm ${added} HS${skip ? `, bỏ qua ${skip} dòng (thiếu tên/sai lớp)` : ""}.`);
    setPaste(""); setBusy(false);
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

export function HSDetail({ s, meta, ym, setHS, chuyenLop, inp, onRename }) {
  const lopThang = lopOfMonth(s, ym);
  const lab = { fontSize: 11.5, color: C.sub, display: "block", marginBottom: 2 };
  const wrap = { flex: "1 1 140px", minWidth: 0 };
  const sel = { ...inp, width: "100%", marginTop: 2 };
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
      <div style={{ flex: "1 1 100%", minWidth: 0 }}>
        <label style={lab}>Tên học sinh</label>
        <input defaultValue={s.ten} onBlur={(e) => onRename(s.id, e.target.value)} style={sel} />
      </div>
      <div style={wrap}>
        <label style={lab}>Lớp (từ tháng {ym})</label>
        <select value={lopThang || ""} onChange={(e) => chuyenLop(s.id, e.target.value)} style={sel}>
          {meta.classes.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}
        </select>
      </div>
      <div style={wrap}>
        <label style={lab}>Phân loại</label>
        <select value={s.pl} onChange={(e) => { setHS(s.id, { pl: e.target.value }); logAction(`Đổi phân loại HS "${s.ten}" → ${e.target.value} (T${ym})`); }} style={sel}>
          {PHAN_LOAI.map((p) => <option key={p} value={p}>{PL_LABEL[p] || p}</option>)}
        </select>
      </div>
      <div style={wrap}>
        <label style={lab}>Trạng thái</label>
        <select value={s.trangThai} onChange={(e) => { setHS(s.id, { trangThai: e.target.value }); logAction(`Đổi trạng thái HS "${s.ten}" → ${e.target.value} (T${ym})`); }} style={sel}>
          {TRANG_THAI.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={wrap}>
        <label style={lab}>Nợ đầu kỳ (đ)</label>
        <NumInput value={s.noDauKy || 0} onChange={(v) => setHS(s.id, { noDauKy: v })} w={130} />
      </div>
      <div style={wrap}>
        <label style={lab}>Giới tính</label>
        <select value={s.gt || ""} onChange={(e) => { setHS(s.id, { gt: e.target.value }); logAction(`Đổi giới tính HS "${s.ten}" → ${GT_LABEL[e.target.value] || "—"}`); }} style={sel}>
          <option value="">—</option>
          {GIOI_TINH.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div style={wrap}>
        <label style={lab}>Ngày sinh</label>
        <input type="date" value={s.ngaySinh || ""} onChange={(e) => setHS(s.id, { ngaySinh: e.target.value })} style={sel} />
      </div>
      <div style={wrap}>
        <label style={lab}>Ngày nhập học</label>
        <input type="date" value={s.ngayNhapHoc || ""} onChange={(e) => setHS(s.id, { ngayNhapHoc: e.target.value })} style={sel} />
      </div>
      <div style={wrap}>
        <label style={lab}>Ngày nghỉ học</label>
        <input type="date" value={s.ngayNghiHoc || ""} onChange={(e) => setHS(s.id, { ngayNghiHoc: e.target.value })} style={sel} />
      </div>
      <div style={wrap}>
        <label style={lab}>SĐT phụ huynh</label>
        <input type="tel" inputMode="tel" value={s.phuHuynh?.sdt || ""} onChange={(e) => setHS(s.id, { phuHuynh: { ...(s.phuHuynh || {}), sdt: e.target.value } })} placeholder="(không bắt buộc)" style={sel} />
      </div>
      <div style={wrap}>
        <label style={lab}>Tên phụ huynh</label>
        <input value={s.phuHuynh?.ten || ""} onChange={(e) => setHS(s.id, { phuHuynh: { ...(s.phuHuynh || {}), ten: e.target.value } })} placeholder="(không bắt buộc)" style={sel} />
      </div>
    </div>
  );
}

export function AuditLog() {
  const [log, setLog] = useState(null);
  const [limit, setLimit] = useState(100);
  const load = async () => { setLog((await sGet("mn5:log")) || []); setLimit(100); };
  useEffect(() => { load(); }, []);
  const fmtT = (iso) => { try { const d = new Date(iso); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } catch { return iso; } };
  const clear = async () => { if (await ask("Xóa toàn bộ nhật ký thao tác?", { danger: true, okText: "Xóa" })) { await sSet("mn5:log", []); setLog([]); toast("Đã xóa nhật ký."); } };
  if (log == null) return <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 24 }}>Đang tải nhật ký…</div>;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: C.sub }}>Ghi lại các thao tác quan trọng (thêm/xóa/chuyển lớp/chốt tháng…). Lưu tối đa 800 dòng gần nhất.</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={load} style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>↻ Tải lại</button>
        {log.length > 0 && <button onClick={clear} style={{ display:"inline-flex", alignItems:"center", gap:6, padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${C.coral}`, background: C.card, color: C.coral, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}><Icon name="trash" size={14} color={C.coral} /> Xóa nhật ký</button>}
      </div>
      {log.length === 0 ? (
        <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 24 }}>Chưa có thao tác nào được ghi.</div>
      ) : (<>
        {log.slice(0, limit).map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", marginBottom: 6, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 13 }}>
            <div style={{ color: C.sub, fontSize: 11.5, whiteSpace: "nowrap", flexShrink: 0, minWidth: 76 }}>{fmtT(e.t)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, color: e.who === "Admin" ? C.pine : C.blueA }}>{e.who}</span>
              <span style={{ color: C.ink }}> · {e.act}</span>
            </div>
          </div>
        ))}
        {log.length > limit && (
          <button onClick={() => setLimit((l) => l + 100)} style={{ width: "100%", padding: "11px 0", borderRadius: 12, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Xem thêm ({Math.min(limit, log.length)}/{log.length})
          </button>
        )}
      </>)}
    </>
  );
}

export function CaiDat({ meta, upMeta, students, upStudents, ym, reseedAll, isWide }) {
  const [sec, setSec] = useState("lop");
  const [theme, setThemeState] = useState(getTheme());
  const [custom, setCustomState] = useState(getCustom());
  const [pending, setPending] = useState(null); // {kind:'preset'|'color', id?, key?, label?, val?}
  const previewVar = (key, val) => { try { const r = document.documentElement; r.style.setProperty(`--c-${key}`, val); if (key === "bg") r.style.background = val; } catch {} };
  const confirmChange = () => {
    if (!pending) return;
    if (pending.kind === "preset") { setTheme(pending.id); setThemeState(pending.id); setCustomState({}); }
    else { setCustomColor(pending.key, pending.val); setCustomState(getCustom()); }
    setPending(null); toast("Đã áp dụng màu mới");
  };
  const cancelChange = () => { applyTheme(getTheme()); setPending(null); };
  const [ten, setTen] = useState("");
  const [lop, setLop] = useState(meta.classes[0]?.id || "");
  const [pl, setPl] = useState("Bthg");
  const [gt, setGt] = useState("");
  const [nguoiThu, setNguoiThu] = useState("A");
  const [ngaySinh, setNgaySinh] = useState("");
  const [phSdt, setPhSdt] = useState("");
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [tenLopMoi, setTenLopMoi] = useState("");
  const [gvTen, setGvTen] = useState("");
  const [gvPin, setGvPin] = useState("");
  const [gvLop, setGvLop] = useState(meta.classes[0]?.id || "");
  const [editHS, setEditHS] = useState(null);
  const [hsFilter, setHsFilter] = useState("all");
  const [hsSearch, setHsSearch] = useState("");
  const [showAddHS, setShowAddHS] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [hsStatusFilter, setHsStatusFilter] = useState("all");
  const [showLeft, setShowLeft] = useState(false); 
  const [thaoTacOpen, setThaoTacOpen] = useState(false);
  const [ttView, setTtView] = useState("menu"); 
  const [bulkThu, setBulkThu] = useState("A");
  const [bulkPl, setBulkPl] = useState("Bthg");
  const [bulkGt, setBulkGt] = useState("nam");
  const [bulkNgayNhap, setBulkNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [bulkRaNgay, setBulkRaNgay] = useState(new Date().toISOString().slice(0, 10));
  const [xoaText, setXoaText] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedHS, setSelectedHS] = useState([]);
  const [bulkTargetLop, setBulkTargetLop] = useState(meta.classes[0]?.id || "");
  const [bulkTargetTT, setBulkTargetTT] = useState("Đang học");
  const [hsLimit, setHsLimit] = useState(50);
  const [reorderMode, setReorderMode] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragOverPos, setDragOverPos] = useState(null);
  const [lopSheetOpen, setLopSheetOpen] = useState(false);
  const [ttSheetOpen, setTtSheetOpen] = useState(false);
  const longPressRef = useRef(null);
  const sentinelRef = useRef(null);
  const [headerShrunk, setHeaderShrunk] = useState(false);
  
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderShrunk(!entry.isIntersecting),
      { root: null, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const normTen = (x) => noDau(x || "").replace(/\s+/g, " ").trim();
  const dupHS = (name, exceptId) => students.find((s) => s.id !== exceptId && normTen(s.ten) === normTen(name));
  const addHS = async () => {
    const t = ten.trim(); if (!t || !lop) return;
    const dup = dupHS(t);
    if (dup) {
      const lopTen = meta.classes.find((c) => c.id === lopHienTai(dup))?.ten || "?";
      if (!(await ask(`Đã có học sinh "${dup.ten}" (lớp ${lopTen}, ${dup.trangThai}). Vẫn thêm em mới?`, { okText: "Vẫn thêm" }))) return;
    }
    upStudents([...students, { id: "hs" + uid(), ten: t, gt, ngaySinh, lopHistory: [{ tuThang: ym, lop }], pl, nguoiThu, trangThai: "Đang học", ngayNhapHoc: ngayNhap || new Date().toISOString().slice(0, 10), ngayNghiHoc: "", noDauKy: 0, phuHuynh: { ten: "", sdt: phSdt.trim() } }], true);
    setTen(""); setGt(""); setNgaySinh(""); setPhSdt(""); logAction(`Thêm HS "${t}"`); toast("Đã thêm học sinh.");
  };
  const renameHS = async (id, newName) => {
    const t = (newName || "").trim(); const cur = students.find((s) => s.id === id);
    if (!cur || !t || cur.ten === t) return;
    const dup = dupHS(t, id);
    if (dup) {
      const lopTen = meta.classes.find((c) => c.id === lopHienTai(dup))?.ten || "?";
      if (!(await ask(`Đã có học sinh "${dup.ten}" (lớp ${lopTen}, ${dup.trangThai}). Vẫn đổi tên thành tên này?`, { okText: "Vẫn đổi" }))) return;
    }
    setHS(id, { ten: t }); logAction(`Đổi tên HS "${cur.ten}" → "${t}"`);
  };
  const delHS = async (id) => { const hs = students.find((s) => s.id === id); if (await ask("Xóa học sinh này? (mất cả lịch sử)", { danger: true, okText: "Xóa" })) { const newList = students.filter((s) => s.id !== id); upStudents(newList, true); logAction(`Xóa HS "${hs?.ten || id}"`); toast("Đã xóa học sinh", hs ? () => upStudents([...newList, hs], true) : undefined); } };
  const setHS = (id, p) => upStudents(students.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const filteredHS = useMemo(() => students.filter((s) => (hsFilter === "all" || lopHienTai(s) === hsFilter) && (!hsSearch || noDau(s.ten).includes(noDau(hsSearch))) && (hsStatusFilter === "all" || s.trangThai === hsStatusFilter) && (showLeft || hsStatusFilter !== "all" || (s.trangThai !== "Nghỉ học" && s.trangThai !== "Ra trường"))), [students, hsFilter, hsSearch, hsStatusFilter, showLeft]);
  const allFilteredSelected = filteredHS.length > 0 && filteredHS.every((s) => selectedHS.includes(s.id));
  const toggleSelectAll = () => setSelectedHS(allFilteredSelected ? [] : filteredHS.map((s) => s.id));
  const closeThaoTac = () => { setThaoTacOpen(false); setTtView("menu"); setXoaText(""); };
  const doneBulk = (logMsg, toastMsg) => { logAction(logMsg); toast(toastMsg); setSelectedHS([]); closeThaoTac(); };
  const bulkPatch = (patch, logMsg, toastMsg) => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ...patch } : s), true); doneBulk(logMsg, toastMsg); };
  const bulkChuyenLop = () => { const tenLop = meta.classes.find((c) => c.id === bulkTargetLop)?.ten; upStudents(students.map((s) => { if (!selectedHS.includes(s.id)) return s; const hist = (s.lopHistory || []).filter((h) => h.tuThang !== ym); hist.push({ tuThang: ym, lop: bulkTargetLop }); hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang)); return { ...s, lopHistory: hist }; }), true); doneBulk(`Chuyển lớp hàng loạt ${selectedHS.length} HS → ${tenLop} (từ T${ym})`, `Đã chuyển ${selectedHS.length} HS sang lớp ${tenLop}`); };
  const bulkRaTruong = () => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ngayNghiHoc: bulkRaNgay, trangThai: "Ra trường" } : s), true); doneBulk(`Cho ra trường hàng loạt ${selectedHS.length} HS (ngày ${bulkRaNgay})`, `Đã cho ${selectedHS.length} HS ra trường`); };
  const bulkDelete = () => { const n = selectedHS.length; upStudents(students.filter((s) => !selectedHS.includes(s.id)), true); doneBulk(`XÓA VĨNH VIỄN ${n} HS`, `Đã xóa vĩnh viễn ${n} HS`); };
  const chuyenLop = (id, lopMoi) => {
    const hs = students.find((s) => s.id === id);
    const tenLop = meta.classes.find((c) => c.id === lopMoi)?.ten || lopMoi;
    upStudents(students.map((s) => {
      if (s.id !== id) return s;
      const hist = (s.lopHistory || []).filter((h) => h.tuThang !== ym);
      hist.push({ tuThang: ym, lop: lopMoi });
      hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang));
      return { ...s, lopHistory: hist };
    }));
    if (hs) logAction(`Chuyển lớp HS "${hs.ten}" → ${tenLop} (từ T${ym})`);
  };
  const themLop = () => { const t = tenLopMoi.trim(); if (!t) return; upMeta({ ...meta, classes: [...meta.classes, { id: "c" + uid(), ten: t, hocPhi: 800000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dauNam: 1200000 }] }); setTenLopMoi(""); logAction(`Thêm lớp "${t}"`); };
  const xoaLop = async (id) => { if (students.some((s) => lopHienTai(s) === id)) { toast("Lớp còn HS — chuyển HS trước."); return; } if (meta.classes.length === 1) { toast("Phải còn ít nhất 1 lớp."); return; } const lopCu = meta.classes.find((c) => c.id === id); if (await ask("Xóa lớp này?", { danger: true, okText: "Xóa" })) { const newClasses = meta.classes.filter((c) => c.id !== id); upMeta({ ...meta, classes: newClasses }); logAction(`Xóa lớp "${lopCu?.ten || id}"`); toast("Đã xóa lớp", lopCu ? () => upMeta({ ...meta, classes: [...newClasses, lopCu] }) : undefined); } };
  const setLopGia = (id, k, v) => upMeta({ ...meta, classes: meta.classes.map((c) => (c.id === id ? { ...c, [k]: v } : c)) });
  const cycleKhoan = (id, key) => {
    const cur = khoanMode(meta.classes.find((c) => c.id === id), key);
    const next = cur === "thu" ? "khong" : "thu";
    upMeta({ ...meta, classes: meta.classes.map((c) => (c.id === id ? { ...c, lapLai: { ...(c.lapLai || {}), [key]: next } } : c)) });
  };
  const setBank = (p, k, v) => upMeta({ ...meta, bank: { ...meta.bank, [p]: { ...meta.bank[p], [k]: v } } });
  const themGV = () => { const t = gvTen.trim(), p = gvPin.trim(); if (!t || !p || !gvLop) { toast("Nhập đủ tên, PIN, lớp."); return; } if ((meta.giaoVien || []).some((g) => g.pin === p)) { toast("PIN này đã dùng — chọn PIN khác."); return; } upMeta({ ...meta, giaoVien: [...(meta.giaoVien || []), { id: "gv" + uid(), ten: t, pin: p, lopId: gvLop }] }); setGvTen(""); setGvPin(""); logAction(`Thêm giáo viên "${t}"`); toast("Đã thêm giáo viên."); };
  const xoaGV = async (id) => { const gv = (meta.giaoVien || []).find((g) => g.id === id); if (await ask("Xóa giáo viên này?", { danger: true, okText: "Xóa" })) { const newGV = (meta.giaoVien || []).filter((g) => g.id !== id); upMeta({ ...meta, giaoVien: newGV }); logAction(`Xóa giáo viên "${gv?.ten || id}"`); toast("Đã xóa giáo viên", gv ? () => upMeta({ ...meta, giaoVien: [...newGV, gv] }) : undefined); } };
  const setDK = (k, v) => upMeta({ ...meta, soDuDauKy: { ...meta.soDuDauKy, [k]: v } });

  // === Báo từ Giáo viên (Admin nhận + duyệt) ===
  const [baoList, setBaoList] = useState([]);
  const loadBao = async () => { try { setBaoList((await sGet("mn5:bao")) || []); } catch { setBaoList([]); } };
  useEffect(() => { loadBao(); }, []);
  const baoPending = baoList.filter((b) => !b.done);
  const _today = () => new Date().toISOString().slice(0, 10);
  const baoTypeLabel = (t) => t === "thoihoc" ? "Thôi học" : t === "chuyenlop" ? "Chuyển lớp" : t === "moi" ? "Cháu mới" : "Báo";
  const markBaoDone = async (id) => {
    const cur = (await sGet("mn5:bao")) || [];
    const next = cur.map((b) => b.id === id ? { ...b, done: true, doneTs: Date.now() } : b);
    await sSet("mn5:bao", next); setBaoList(next);
  };
  const duyetBao = async (b) => {
    if (b.type === "thoihoc") {
      if (!students.some((s) => s.id === b.hsId)) { toast("Không tìm thấy cháu này (có thể đã xử lý)."); await markBaoDone(b.id); return; }
      upStudents(students.map((s) => s.id === b.hsId ? { ...s, trangThai: "Ra trường", ngayNghiHoc: _today() } : s), true);
      logAction(`Duyệt báo GV (${b.gv || "GV"}): cho "${b.hsTen}" thôi học`);
    } else if (b.type === "chuyenlop") {
      const tenLop = meta.classes.find((c) => c.id === b.lop)?.ten || b.lopTen || "";
      if (!students.some((s) => s.id === b.hsId)) { toast("Không tìm thấy cháu này."); await markBaoDone(b.id); return; }
      upStudents(students.map((s) => {
        if (s.id !== b.hsId) return s;
        const hist = (s.lopHistory || []).filter((h) => h.tuThang !== ym);
        hist.push({ tuThang: ym, lop: b.lop });
        hist.sort((a, z) => a.tuThang.localeCompare(z.tuThang));
        return { ...s, lopHistory: hist };
      }), true);
      logAction(`Duyệt báo GV (${b.gv || "GV"}): chuyển "${b.hsTen}" sang lớp ${tenLop}`);
    } else if (b.type === "moi") {
      const lop0 = meta.classes[0]?.id || "";
      upStudents([...students, { id: "hs" + uid(), ten: b.hsTen, gt: "", ngaySinh: "", lopHistory: [{ tuThang: ym, lop: lop0 }], pl: "Bthg", nguoiThu: "A", trangThai: "Đang học", ngayNhapHoc: _today(), ngayNghiHoc: "", noDauKy: 0, phuHuynh: { ten: "", sdt: "" } }], true);
      logAction(`Duyệt báo GV (${b.gv || "GV"}): thêm cháu mới "${b.hsTen}"${b.note ? " — " + b.note : ""}`);
    }
    await markBaoDone(b.id);
    toast("Đã duyệt ✓");
  };
  const boQuaBao = async (b) => {
    if (!(await ask(`Bỏ qua báo "${baoTypeLabel(b.type)}: ${b.hsTen || ""}"?`, { okText: "Bỏ qua" }))) return;
    await markBaoDone(b.id);
    logAction(`Bỏ qua báo GV (${b.gv || "GV"}): ${b.hsTen || ""} — ${baoTypeLabel(b.type)}`);
    toast("Đã bỏ qua.");
  };

  const inp = { padding: "9px 10px", borderRadius: 9, border: "1.5px solid " + C.line, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.graySoft, outline: "none" };

  return (
    <>
      {baoPending.length > 0 && (
        <Card style={{ marginBottom: 12, background: C.amberSoft, borderColor: C.line }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="bell" size={17} color={C.coral} />
            <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14.5, color: C.ink }}>Báo từ Giáo viên</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#fff", background: C.coral, borderRadius: 99, padding: "1px 8px" }}>{baoPending.length}</span>
          </div>
          {baoPending.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).map((b) => {
            const col = b.type === "thoihoc" ? C.coral : b.type === "chuyenlop" ? C.blueA : C.green;
            const tg = b.ts ? new Date(b.ts) : null;
            const tgStr = tg ? `${String(tg.getHours()).padStart(2, "0")}:${String(tg.getMinutes()).padStart(2, "0")} ${tg.getDate()}/${tg.getMonth() + 1}` : "";
            return (
              <div key={b.id} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px", marginBottom: 9, background: C.card }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: col, borderRadius: 6, padding: "1px 7px" }}>{baoTypeLabel(b.type)}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{b.hsTen || "(chưa tên)"}</span>
                  {b.type === "chuyenlop" && <span style={{ fontSize: 12.5, color: C.sub }}>→ {meta.classes.find((c) => c.id === b.lop)?.ten || b.lopTen || ""}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: C.gray, marginBottom: b.note ? 4 : 8 }}>{b.gv || "Giáo viên"}{tgStr ? " · " + tgStr : ""}</div>
                {b.note && <div style={{ fontSize: 12.5, color: C.sub, background: C.bg, borderRadius: 7, padding: "5px 9px", marginBottom: 8 }}>{b.note}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => duyetBao(b)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="check" size={14} color="#fff" /> Duyệt</button>
                  <button onClick={() => boQuaBao(b)} style={{ flex: "0 0 auto", padding: "8px 16px", borderRadius: 9, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body }}>Bỏ qua</button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {[
          ["lop", "Lớp"], ["gv", "Giáo viên"], ["bank", "Tài khoản"], ["dk", "Số dư đầu kỳ"], ["giaodien", "Giao diện"], ["backup", "Sao lưu"], ["log", "Nhật ký"], ["data", "Dữ liệu"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setSec(k)} style={{ padding: "8px 15px", borderRadius: 999, border: `1.5px solid ${sec === k ? C.pine : C.line}`, background: sec === k ? C.pine : C.card, color: sec === k ? "#fff" : C.sub, fontFamily: font.body, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {sec === "lop" && (
        <>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 12, lineHeight: 1.55 }}>Thêm lớp = thêm 1 dòng, mọi tính toán tự nhận lớp mới.</div>
          {meta.classes.map((l) => (
            <Card key={l.id} style={{ padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <input value={l.ten} onChange={(e) => setLopGia(l.id, "ten", e.target.value)} style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, border: "none", background: "none", color: C.ink, outline: "none", width: "70%" }} />
                <button onClick={() => xoaLop(l.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", fontSize: 14 }}><Icon name="trash" size={16} color={C.coral} /></button>
              </div>
              <label style={{ fontSize: 11, color: C.sub, display: "block", marginBottom: 10 }}>Buổi T7 (giá/buổi)
                <input type="number" value={l.t7 || 0} onFocus={(e) => e.target.select()} onChange={(e) => setLopGia(l.id, "t7", Number(e.target.value) || 0)} style={{ width: "100%", marginTop: 3, padding: "6px 7px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 13, color: C.ink, background: C.graySoft, outline: "none" }} /></label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {KHOAN.map((k) => {
                  const mode = khoanMode(l, k.key);
                  const badge = mode === "thu" ? { t: "✓ Thu", bg: C.greenSoft, fg: C.green } : { t: "Không thu", bg: C.coralSoft, fg: C.coral };
                  return (
                    <div key={k.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ flex: 1, fontSize: 11, color: C.sub }}>{k.label}
                        <input type="number" value={l[k.key] || 0} disabled={mode === "khong"} onFocus={(e) => e.target.select()} onChange={(e) => setLopGia(l.id, k.key, Number(e.target.value) || 0)} style={{ width: "100%", marginTop: 3, padding: "6px 7px", borderRadius: 8, border: `1.5px solid ${C.line}`, fontFamily: font.body, fontSize: 13, color: C.ink, background: mode === "khong" ? C.graySoft : C.card, outline: "none" }} /></label>
                      <button onClick={() => cycleKhoan(l.id, k.key)} title="Chạm để đổi: Thu / Không thu" style={{ alignSelf: "flex-end", marginBottom: 1, whiteSpace: "nowrap", padding: "6px 9px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: font.body, background: badge.bg, color: badge.fg, minWidth: 92, textAlign: "center" }}>{badge.t}</button>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 8 }}>Chạm nút bên phải để bật/tắt. Đổi giá hoặc tắt khoản sẽ cập nhật ngay vào tháng đang xem (trừ HS đã sửa tay & tháng đã chốt).</div>
            </Card>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <input value={tenLopMoi} onChange={(e) => setTenLopMoi(e.target.value)} placeholder="Tên lớp mới" style={{ ...inp, flex: 1, minWidth: 0 }} />
            <button onClick={themLop} style={{ padding: "0 18px", borderRadius: 12, border: "none", background: C.pine, color: "#fff", fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Thêm lớp</button>
          </div>
        </>
      )}

      {sec === "gv" && (
        <>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>Mỗi giáo viên có 1 PIN + 1 lớp. Khi đăng nhập bằng PIN, GV chỉ điểm danh lớp được giao (không thấy tiền, không đặt ngày lễ).</div>
          {(meta.giaoVien || []).map((gv) => (
            <Card key={gv.id} style={{ marginBottom: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{gv.ten}</div>
                <div style={{ fontSize: 12, color: C.sub }}>PIN: <b style={{ color: C.ink }}>{gv.pin}</b> · Lớp: {meta.classes.find((c) => c.id === gv.lopId)?.ten || "?"}</div>
              </div>
              <button onClick={() => xoaGV(gv.id)} style={{ color: C.coral, border: "none", background: "none", cursor: "pointer", display:"inline-flex", alignItems:"center" }}><Icon name="trash" size={16} color={C.coral} /></button>
            </Card>
          ))}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <input value={gvTen} onChange={(e) => setGvTen(e.target.value)} placeholder="Tên GV" style={{ ...inp, flex: "2 1 120px", minWidth: 0 }} />
            <input value={gvPin} onChange={(e) => setGvPin(e.target.value)} placeholder="PIN" inputMode="numeric" style={{ ...inp, flex: "1 1 70px", width: 80, minWidth: 0 }} />
            <select value={gvLop} onChange={(e) => setGvLop(e.target.value)} style={{ ...inp, flex: "1 1 100px" }}>{meta.classes.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select>
            <button onClick={themGV} style={{ padding: "0 16px", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontWeight: 700, cursor: "pointer" }}>+ Thêm</button>
          </div>
        </>
      )}

      {sec === "bank" && (
        <>
          <input value={meta.tenTruong} onChange={(e) => upMeta({ ...meta, tenTruong: e.target.value })} placeholder="Tên trường" style={{ ...inp, width: "100%", marginBottom: 12, fontFamily: font.display, fontWeight: 700 }} />
          {["A", "B"].map((p) => (
            <Card key={p} style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, color: p === "A" ? C.blueA : C.violetB, marginBottom: 8 }}>Người {p} (in lên phiếu)</div>
              {[["Chủ TK", "chu"], ["Số TK", "stk"], ["Ngân hàng", "nh"]].map(([lb, k]) => (<label key={k} style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 7 }}>{lb}<input value={meta.bank[p][k]} onChange={(e) => setBank(p, k, e.target.value)} style={{ ...inp, width: "100%", marginTop: 3 }} /></label>))}
            </Card>
          ))}
        </>
      )}

      {sec === "dk" && (
        <Card>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>Số dư đầu kỳ (tiền & nợ nội bộ)</div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>A nợ B và B nợ A không cùng &gt; 0 (cấn trừ trước). Nợ học phí đầu kỳ của từng HS nhập ở thẻ HS.</div>
          {[["Tiền mặt A đang giữ", "tienMatA"], ["Tiền mặt B đang giữ", "tienMatB"], ["A nợ B", "AnoB"], ["B nợ A", "BnoA"]].map(([lb, k]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.line}` }}><span style={{ fontSize: 13.5, color: C.sub }}>{lb}</span><NumInput value={(meta.soDuDauKy || {})[k] || 0} onChange={(v) => setDK(k, v)} w={130} /></div>
          ))}
        </Card>
      )}

      {sec === "giaodien" && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Icon name="settings" size={16} color={C.ink} />
            <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 15, color: C.ink }}>Giao diện màu nền</span>
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>Chọn 1 nền có sẵn, hoặc tự chỉnh từng màu bên dưới. Đổi tới đâu cả app đồng bộ tới đó — phải bấm <b>Xác nhận</b> mới lưu.</div>

          {/* 5 nền có sẵn */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {THEMES.map((t) => {
              const active = theme === t.id && Object.keys(custom).length === 0;
              const dark = t.id === "dem";
              const swatch = { trangsua: "#FAFAF8", xanhkhoi: "#E2F0EB", kemam: "#F0EADC", xamnhe: "#E9EBEE", dem: "#16241E" }[t.id];
              return (
                <button key={t.id}
                  onClick={() => { applyTheme(t.id); setPending({ kind: "preset", id: t.id, label: t.label }); }}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 14px 9px 10px", borderRadius: 999, cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13.5, border: `2px solid ${active ? C.pine : C.line}`, background: active ? C.pineSoft : C.card, color: C.ink }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: swatch, border: `1.5px solid ${dark ? "#000" : C.line}`, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {active && <Icon name="check" size={13} color={dark ? "#fff" : C.pine} />}
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tự chỉnh từng màu */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14, color: C.ink, marginBottom: 2 }}>Tự chỉnh màu</div>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 10 }}>Chạm vào ô màu để chọn. Có thể chỉnh đè lên nền đang chọn.</div>
            {EDITABLE_COLORS.map((grp) => (
              <div key={grp.group} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>{grp.group}</div>
                {grp.items.map((it) => {
                  const shown = (pending && pending.kind === "color" && pending.key === it.key) ? pending.val : (custom[it.key] || currentColor(it.key));
                  return (
                    <div key={it.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "7px 0" }}>
                      <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{it.label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11.5, color: C.sub, fontFamily: "monospace" }}>{String(shown).toUpperCase()}</span>
                        <label style={{ width: 46, height: 30, borderRadius: 8, border: `1.5px solid ${C.line}`, background: shown, cursor: "pointer", position: "relative", overflow: "hidden", flexShrink: 0 }}>
                          <input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(shown) ? shown : "#000000"}
                            onChange={(e) => { const v = e.target.value; previewVar(it.key, v); setPending({ kind: "color", key: it.key, label: it.label, val: v }); }}
                            style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer", border: "none" }} />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {Object.keys(custom).length > 0 && !pending && (
              <button onClick={async () => { if (await ask("Khôi phục về màu của nền đang chọn? Mọi màu tự chỉnh sẽ bị xoá.", { okText: "Khôi phục" })) { resetCustom(); setCustomState({}); toast("Đã khôi phục màu nền"); } }}
                style={{ marginTop: 4, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.coral, fontFamily: font.body, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="refresh" size={14} color={C.coral} /> Khôi phục màu gốc
              </button>
            )}
          </div>

          {/* Thanh xác nhận - cố định đáy màn hình để luôn thấy */}
          {pending && (
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 200, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: C.card, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 -6px 20px rgba(0,0,0,0.18)" }}>
              <span style={{ flex: 1, fontSize: 13, color: C.ink }}>
                Xem trước <b>{pending.label}</b>. Áp dụng?
              </span>
              <button onClick={cancelChange} style={{ padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontFamily: font.body, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Huỷ</button>
              <button onClick={confirmChange} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: C.pine, color: "#fff", fontFamily: font.body, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="check" size={15} color="#fff" /> Xác nhận
              </button>
            </div>
          )}
        </Card>
      )}
      {sec === "backup" && <BackupExport meta={meta} students={students} />}
      {sec === "log" && <AuditLog />}

      {sec === "data" && (
        <Card>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>Xóa sạch & bắt đầu lại</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>Đưa app về trạng thái mới: giữ 6 lớp + đơn giá + tài khoản + giáo viên mẫu, nhưng <b style={{ color: C.coral }}>xóa toàn bộ học sinh, điểm danh và các tháng đã nhập.</b> Dùng khi muốn làm lại từ đầu.</div>
          <button onClick={async () => { if (await ask("Xóa TOÀN BỘ học sinh + điểm danh + các tháng, đưa về trạng thái mới?\n⚠️ Không hoàn tác. Nên Sao lưu trước.", { danger: true, okText: "Xóa sạch" })) { await reseedAll(); toast("Đã xóa sạch. Bắt đầu thêm học sinh ở Cài đặt → Học sinh."); } }} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: `1.5px solid ${C.coral}`, background: C.coralSoft, color: C.coral, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>↻ Xóa sạch & bắt đầu lại</button>
        </Card>
      )}
    </>
  );
}
