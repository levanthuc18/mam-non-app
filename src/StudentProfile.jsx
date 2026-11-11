import { ClassAnimal } from "./Brand.jsx";
import { useState, useEffect, useRef } from "react";
import { C, font, fmt, sGetSafe, sListSafe, sGetSafeCached, cachePut, ymKey, lopOfMonth, tinhPSFromRec, PHAN_LOAI, PL_LABEL, TRANG_THAI, TT_COLOR, GIOI_TINH, GT_LABEL, KHOAN, noDau, logAction, toast } from "./lib.js";
import { tinhNoLuyKe } from "./taichinh.js";
import { Icon, Ii } from "./Icon.jsx";
import { Card, NumInput, ABBtn, PLBadge, BottomSheet, Segmented } from "./ui.jsx";
import { AvatarEditor, Avatar } from "./Avatar.jsx";

export function StudentProfile({ studentId, store, onBack, embedded = false, pc = false, onDirty }) {
  const { meta, students, ym, upStudents } = store;
  const student = students.find(s => s.id === studentId);
  const [activeTab, setActiveTab] = useState("info");
  
  if (!student) return <div style={{ padding: 20, textAlign: "center", color: C.sub }}>Đang tải...</div>;
  const lopTen = meta.classes.find(c => c.id === lopOfMonth(student, ym))?.ten || "?";
  
  const tabs = [
    { id: "info", label: "Thông tin" },
    { id: "thuPhi", label: "Thu phí" },
    { id: "diemDanh", label: "Điểm danh" },
    { id: "congNo", label: "Công nợ" },
    { id: "lichSu", label: "Lịch sử" },
  ];

  const tabBar = (
    <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          style={{
            padding: "6px 12px", borderRadius: 99, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap",
            background: activeTab === t.id ? C.pine : C.graySoft,
            color: activeTab === t.id ? C.onFill : C.sub
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const body = (
    <>
      {activeTab === "info" && (pc ? <InfoFormPC student={student} meta={meta} ym={ym} students={students} upStudents={upStudents} onDirty={onDirty} /> : <InfoTab student={student} meta={meta} ym={ym} students={students} upStudents={upStudents} />)}
      {activeTab === "thuPhi" && <ThuPhiTab student={student} meta={meta} />}
      {activeTab === "diemDanh" && <DiemDanhTab student={student} />}
      {activeTab === "congNo" && <CongNoTab student={student} meta={meta} />}
      {activeTab === "lichSu" && <LichSuTab student={student} />}
    </>
  );

  // Máy tính: hồ sơ nằm bên phải danh sách — đầu hồ sơ + thanh tab gạch chân + nội dung
  if (pc) {
    const mauTT = { "Đang học": [C.greenSoft, C.greenText], "Học thử": [C.blueASoft, C.blueAText], "Bảo lưu": [C.amberSoft, C.amberText], "Nghỉ học": [C.coralSoft, C.coralText], "Ra trường": [C.violetBSoft, C.violetBText] }[student.trangThai] || [C.graySoft, C.sub];
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px 0" }}>
          <Avatar hs={student} size={52} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.ink, lineHeight: 1.2 }}>{student.ten}</div>
            <div style={{ fontSize: 13.5, color: C.sub, marginTop: 4, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ClassAnimal name={lopTen} size={22} />Lớp: <b style={{ color: C.ink }}>{lopTen}</b></span>
              <span style={{ background: mauTT[0], color: mauTT[1], borderRadius: 99, padding: "3px 12px", fontSize: 12.5, fontWeight: 700 }}>{student.trangThai}</span>
              <PLBadge pl={student.pl} />
            </div>
          </div>
        </div>
        <div style={{ padding: "10px 20px 0" }}><Segmented scroll full small items={tabs.map((t) => [t.id, t.label])} value={activeTab} onChange={setActiveTab} /></div>
        <div style={{ padding: "12px 20px 14px" }}>{body}</div>
      </div>
    );
  }

  // Nhúng inline trong danh sách (accordion sổ xuống): bỏ header, chỉ còn tab + nội dung
  if (embedded) {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>{tabBar}</div>
        {body}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 60, overflowY: "auto" }}>
      {/* HEADER */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "14px 14px 10px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack} style={{ border: "none", background: "none", fontSize: 24, cursor: "pointer", color: C.sub, padding: 0, lineHeight: 1 }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{student.ten}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ClassAnimal name={lopTen} size={22} />{lopTen}</span>
              <PLBadge pl={student.pl} />
              <span style={{ fontSize: 11, fontWeight: 600, color: TT_COLOR[student.trangThai] }}>{student.trangThai}</span>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.pineSoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 700, fontSize: 16, color: C.pine }}>
            {student.ten.charAt(0).toUpperCase()}
          </div>
        </div>
        {/* TABS */}
        {tabBar}
      </div>

      {/* BODY */}
      <div style={{ padding: "14px 14px 40px" }}>
        {body}
      </div>
    </div>
  );
}


// 1b. FORM THÔNG TIN CHO MÁY TÍNH — sửa trên BẢN NHÁP, bấm "Lưu thay đổi" mới ghi (Hủy = bỏ). Dữ liệu lấy từ hồ sơ thật.
function InfoFormPC({ student, meta, ym, students, upStudents, onDirty }) {
  const [draft, setDraft] = useState({});
  const [lopMoi, setLopMoi] = useState(null);
  const [daLuu, setDaLuu] = useState(false);
  const lopCu = lopOfMonth(student, ym) || "";
  const dirty = Object.keys(draft).length > 0 || (lopMoi !== null && lopMoi !== lopCu);
  const stu = { ...student, ...draft };
  const lopId = lopMoi !== null ? lopMoi : lopCu;
  useEffect(() => { if (onDirty) onDirty(dirty); }, [dirty]);
  useEffect(() => () => { if (onDirty) onDirty(false); }, []);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const setPH = (k, v) => patch({ phuHuynh: { ...(stu.phuHuynh || {}), [k]: v } });
  const doiTT = (v) => patch(v === "Ra trường" ? { trangThai: v, ngayNghiHoc: stu.ngayNghiHoc || new Date().toISOString().slice(0, 10) } : { trangThai: v, ngayNghiHoc: "" });
  const huy = () => { setDraft({}); setLopMoi(null); };
  const luu = () => {
    if (!dirty) return;
    if (!String(stu.ten || "").trim()) { toast("Nhập họ tên học sinh."); return; }
    const ns = students.map((s) => {
      if (s.id !== student.id) return s;
      let n = { ...s, ...draft };
      if (draft.ten !== undefined) n.ten = String(draft.ten).trim();
      if (lopMoi !== null && lopMoi !== lopCu) {
        const hist = (s.lopHistory || []).filter((h) => h.tuThang !== ym);
        hist.push({ tuThang: ym, lop: lopMoi });
        hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang));
        n.lopHistory = hist;
      }
      return n;
    });
    upStudents(ns, true);
    logAction(`Sửa hồ sơ HS "${student.ten}"${lopMoi !== null && lopMoi !== lopCu ? ` (chuyển lớp từ T${ym})` : ""}`);
    setDraft({}); setLopMoi(null); setDaLuu(true); setTimeout(() => setDaLuu(false), 1800);
  };

  const inp = { padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13.5, fontFamily: font.body, color: C.ink, background: C.card, outline: "none", width: "100%" };
  const fld = (nhan, ctl) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ width: 88, flexShrink: 0, fontSize: 13, color: C.sub }}>{nhan}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{ctl}</div>
    </div>
  );
  const khoi = (icon, tieuDe, children) => (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "color-mix(in srgb, var(--c-pine) 16%, var(--c-card))", fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink }}><Icon name={icon} size={17} color={C.pine} />{tieuDe}</div>
      <div style={{ padding: "8px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 270px), 1fr))", gap: "6px 24px" }}>{children}</div>
    </div>
  );
  const sel = (val, onCh, opts) => <select value={val} onChange={(e) => onCh(e.target.value)} style={{ ...inp, cursor: "pointer" }}>{opts.map(([v, l]) => <option key={v || "none"} value={v}>{l}</option>)}</select>;

  return (
    <div>
      {khoi("users", "Thông tin cá nhân", <>
        <div style={{ gridColumn: "1 / -1" }}><AvatarEditor hs={stu} compact setHS={(p) => upStudents(students.map((x) => (x.id === student.id ? { ...x, ...p } : x)), true)} /></div>
        {fld("Họ và tên", <input value={stu.ten || ""} onChange={(e) => patch({ ten: e.target.value })} style={inp} />)}
        {fld("Giới tính", sel(stu.gt || "", (v) => patch({ gt: v }), [["", "— Chưa rõ"], ...GIOI_TINH]))}
        {fld("Lớp", sel(lopId, (v) => setLopMoi(v), meta.classes.map((c) => [c.id, c.ten])))}
        {fld("Trạng thái", sel(stu.trangThai, doiTT, TRANG_THAI.map((t) => [t, t])))}
        {fld("Phân loại", sel(stu.pl, (v) => patch({ pl: v }), PHAN_LOAI.map((p) => [p, PL_LABEL[p]])))}
        <div style={{ fontSize: 12, color: C.sub, alignSelf: "center" }}>{lopMoi !== null && lopMoi !== lopCu ? `Đổi lớp sẽ có hiệu lực từ tháng ${ym}.` : ""}</div>
      </>)}
      {khoi("school", "Nhập học & học phí", <>
        {fld("Ngày nhập học", <input type="date" value={stu.ngayNhapHoc || ""} onChange={(e) => patch({ ngayNhapHoc: e.target.value })} style={inp} />)}
        {fld("Nợ đầu kỳ (âm = dư)", <NumInput neg value={stu.noDauKy || 0} onChange={(v) => patch({ noDauKy: v })} w="100%" />)}
        {fld("Người thu", sel(stu.nguoiThu || "A", (v) => patch({ nguoiThu: v }), [["A", "A"], ["B", "B"]]))}
        {stu.trangThai === "Ra trường" && fld("Ngày ra trường", <input type="date" value={stu.ngayNghiHoc || ""} onChange={(e) => patch({ ngayNghiHoc: e.target.value })} style={inp} />)}
      </>)}
      {khoi("users", "Liên hệ phụ huynh", <>
        {fld("Tên phụ huynh", <input value={stu.phuHuynh?.ten || ""} onChange={(e) => setPH("ten", e.target.value)} placeholder="(không bắt buộc)" style={inp} />)}
        {fld("Số điện thoại", <input type="tel" inputMode="tel" value={stu.phuHuynh?.sdt || ""} onChange={(e) => setPH("sdt", e.target.value)} placeholder="VD: 0912345678" style={inp} />)}
        {!stu.phuHuynh?.sdt && <div style={{ gridColumn: "1 / -1", fontSize: 12.5, color: C.coralText, fontWeight: 600 }}>Chưa có số điện thoại — cần để nhắc đóng học phí qua Zalo.</div>}
      </>)}

      {(student.lopHistory || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 14px", fontSize: 13, padding: "2px 2px 6px" }}>
          <b style={{ color: C.ink }}>Lịch sử chuyển lớp:</b>
          {student.lopHistory.map((h, i) => <span key={i} style={{ color: C.sub }}>Từ {h.tuThang} · <b style={{ color: C.ink }}>{meta.classes.find((c) => c.id === h.lop)?.ten || h.lop}</b></span>)}
        </div>
      )}

      {(dirty || daLuu) && (
        <div style={{ position: "sticky", bottom: 0, display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end", padding: "10px 0 0", background: C.card, borderTop: `1px solid ${C.line}` }}>
          <span style={{ marginRight: "auto", fontSize: 13.5, fontWeight: 700, color: daLuu && !dirty ? C.greenText : C.amberText }}>{dirty ? "Có thay đổi chưa lưu" : "✓ Đã lưu hồ sơ"}</span>
          {dirty && <button onClick={huy} style={{ padding: "8px 24px", borderRadius: 11, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Hủy</button>}
          {dirty && <button onClick={luu} style={{ padding: "8px 22px", borderRadius: 11, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>Lưu thay đổi</button>}
        </div>
      )}
    </div>
  );
}

// 1. TAB THÔNG TIN
function InfoTab({ student, meta, ym, students, upStudents }) {
  const [saved, setSaved] = useState(false);
  const savedT = useRef(null);
  const flashSaved = () => { setSaved(true); clearTimeout(savedT.current); savedT.current = setTimeout(() => setSaved(false), 1800); };
  const setHS = (p) => {
    const newStudents = students.map(s => s.id === student.id ? { ...s, ...p } : s);
    upStudents(newStudents, true);
    flashSaved();
  };
  
  const chuyenLop = (lopMoi) => {
    const newStudents = students.map(s => {
      if (s.id !== student.id) return s;
      const hist = (s.lopHistory || []).filter(h => h.tuThang !== ym);
      hist.push({ tuThang: ym, lop: lopMoi });
      hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang));
      return { ...s, lopHistory: hist };
    });
    upStudents(newStudents, true);
    logAction(`Chuyển lớp HS "${student.ten}" (T${ym})`);
    flashSaved();
  };

  const inp = { padding: "9px 10px", borderRadius: 10, border: "1.5px solid " + C.line, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.graySoft, outline: "none", width: "100%" };
  const lab = { fontSize: 11.5, color: C.sub, display: "block", marginBottom: 2 };

  // Các ô chọn mở BottomSheet trượt từ dưới (đồng bộ với popup khác trong app)
  const [pick, setPick] = useState(null); // "lop" | "pl" | "gt" | "tt"
  const fieldBtn = (label, valueText, key) => (
    <div style={{ flex: "1 1 140px" }}>
      <label style={lab}>{label}</label>
      <button onClick={() => setPick(key)} style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left", gap: 8 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{valueText}</span>
        <span style={{ color: C.sub, flexShrink: 0 }}>▾</span>
      </button>
    </div>
  );
  const PICKERS = {
    lop: { title: `Chọn lớp (từ tháng ${ym})`, options: meta.classes.map(c => [c.id, c.ten]), current: lopOfMonth(student, ym) || "", onSelect: (v) => chuyenLop(v) },
    pl: { title: "Chọn phân loại", options: PHAN_LOAI.map(p => [p, PL_LABEL[p]]), current: student.pl, onSelect: (v) => setHS({ pl: v }) },
    gt: { title: "Chọn giới tính", options: [["", "— Chưa rõ"], ...GIOI_TINH], current: student.gt || "", onSelect: (v) => { setHS({ gt: v }); logAction(`Đổi giới tính HS "${student.ten}" → ${GT_LABEL[v] || "—"}`); } },
    tt: { title: "Chọn trạng thái", options: TRANG_THAI.map(t => [t, t]), current: student.trangThai, onSelect: (v) => { if (v === "Ra trường") setHS({ trangThai: v, ngayNghiHoc: student.ngayNghiHoc || new Date().toISOString().slice(0, 10) }); else setHS({ trangThai: v, ngayNghiHoc: "" }); } },
  };
  const curPick = pick ? PICKERS[pick] : null;

  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>Thông tin cá nhân</div>
          <span style={{ fontSize: 11.5, color: C.greenText, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, opacity: saved ? 1 : 0, transition: "opacity .2s" }}><Ii name="check" size={14} /> Đã lưu</span>
        </div>
        <AvatarEditor hs={student} setHS={setHS} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 100%" }}>
            <label style={lab}>Họ tên</label>
            <input defaultValue={student.ten} onBlur={(e) => setHS({ ten: e.target.value })} style={inp} />
          </div>
          {fieldBtn(`Lớp (từ tháng ${ym})`, meta.classes.find(c => c.id === (lopOfMonth(student, ym) || ""))?.ten || "—", "lop")}
          {fieldBtn("Phân loại", PL_LABEL[student.pl] || student.pl, "pl")}
          {fieldBtn("Giới tính", GT_LABEL[student.gt] || "—", "gt")}
          {fieldBtn("Trạng thái", student.trangThai, "tt")}
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Người thu</label>
            <div style={{ marginTop: 2 }}><ABBtn val={student.nguoiThu} set={(p) => setHS({ nguoiThu: p })} small /></div>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Nợ đầu kỳ</label>
            <NumInput lazy neg value={student.noDauKy || 0} onChange={(v) => setHS({ noDauKy: v })} w="100%" />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Ngày nhập học</label>
            <input type="date" value={student.ngayNhapHoc || ""} onChange={(e) => setHS({ ngayNhapHoc: e.target.value })} style={inp} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Ngày ra trường</label>
            <input type="date" value={student.ngayNghiHoc || ""} onChange={(e) => setHS(e.target.value ? { ngayNghiHoc: e.target.value, trangThai: "Ra trường" } : { ngayNghiHoc: "", trangThai: student.trangThai === "Ra trường" ? "Đang học" : student.trangThai })} style={inp} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>Tên phụ huynh</label>
            <input value={student.phuHuynh?.ten || ""} onChange={(e) => setHS({ phuHuynh: { ...(student.phuHuynh || {}), ten: e.target.value } })} placeholder="(không bắt buộc)" style={inp} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label style={lab}>SĐT phụ huynh {!student.phuHuynh?.sdt && <span style={{ color: C.coralText, fontWeight: 700 }}>· cần cho Nhắc Zalo</span>}</label>
            <input type="tel" inputMode="tel" value={student.phuHuynh?.sdt || ""} onChange={(e) => setHS({ phuHuynh: { ...(student.phuHuynh || {}), sdt: e.target.value } })} placeholder="VD: 0912345678" style={inp} />
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: C.ink }}>Lịch sử chuyển lớp</div>
        {(student.lopHistory || []).map((h, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < student.lopHistory.length - 1 ? `1px solid ${C.line}` : "none" }}>
            <span style={{ fontSize: 13, color: C.sub }}>Từ {h.tuThang}</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{meta.classes.find(c => c.id === h.lop)?.ten || h.lop}</span>
          </div>
        ))}
      </Card>

      <BottomSheet open={!!pick} onClose={() => setPick(null)} title={curPick?.title || ""}>
        {curPick && curPick.options.map(([v, l]) => {
          const active = v === curPick.current;
          return (
            <button key={v || "none"} onClick={() => { curPick.onSelect(v); setPick(null); }} style={{ display: "block", width: "100%", padding: "13px 14px", borderRadius: 10, border: `1.5px solid ${active ? C.pine : C.line}`, background: active ? C.pineSoft : C.card, color: active ? C.pine : C.ink, fontWeight: active ? 700 : 600, fontSize: 15, cursor: "pointer", fontFamily: font.body, marginBottom: 8, textAlign: "left" }}>{active ? "● " : "○ "}{l}</button>
          );
        })}
      </BottomSheet>
    </div>
  );
}
function ThuPhiTab({ student, meta }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    (async () => {
      // ⛔ Đây là số tiền phụ huynh nợ. Đọc lỗi mà vẫn hiện = phụ huynh bị đòi sai.
      //   Thiếu tháng hoặc thiếu điểm danh → ẩn hết, báo lỗi.
      const kR = await sListSafe("mn5:thang:");
      if (!kR.ok) { setLoi(true); setLoading(false); return; }
      const months = kR.keys.map(k => k.replace("mn5:thang:", "")).filter(m => /^\d{4}-\d{2}$/.test(m)).sort();
      const rows = [];
      for (const m of months) {
        const r = await sGetSafe(`mn5:thang:${m}`);
        if (!r.ok) { setLoi(true); setLoading(false); return; }
        const td = r.value;
        if (!td?.fees?.[student.id]) continue;
        const rec = td.fees[student.id];
        const y = Number(m.slice(0, 4)), mo = Number(m.slice(5));
        const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
        const ddR = await sGetSafe(`mn5:dd:${ymKey(py, pm)}`);
        if (!ddR.ok) { setLoi(true); setLoading(false); return; } // nghỉ=0 → "Phải thu" sai
        const ddPrevM = ddR.value || {};
        const nghi = Object.keys(ddPrevM[student.id] || {}).length;
        const lop = meta.classes.find(c => c.id === lopOfMonth(student, m));
        const ps = tinhPSFromRec(student, rec, lop, nghi).tong;
        const tt = Number(rec.thucThu) || 0;
        rows.push({ thang: m, ps, tt, no: ps - tt, daChot: td.daChot });
      }
      setHistory(rows.reverse());
      setLoading(false);
    })();
  }, [student.id]);

  if (loading) return <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Đang tải...</div>;
  if (loi) return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}><Ii name="wifiOff" size={32} /></div>
      <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Không tải được lịch sử thu phí</div>
      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>Mạng hoặc phiên đăng nhập đang trục trặc. Số liệu đã được <b style={{ color: C.ink }}>tạm ẩn</b> vì có thể sai — <b style={{ color: C.ink }}>đừng đòi tiền theo số này</b>. Mở lại hồ sơ để thử.</div>
    </div>
  );

  return (
    <div>
      {history.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Chưa có dữ liệu thu phí</div>}
      {history.map(h => (
        <Card key={h.thang} style={{ marginBottom: 8, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Tháng {h.thang.slice(5)}/{h.thang.slice(0, 4)}</div>
            {h.daChot && <span style={{ fontSize: 11, background: C.goldSoft, color: C.amberText, display:"inline-flex", alignItems:"center", gap:3, padding: "2px 8px", borderRadius: 99 }}><Icon name="lock" size={11} color={C.amberText} /> Đã chốt</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.sub, padding: "3px 0" }}>
            <span>Phải thu</span><b style={{ color: C.ink }}>{fmt(h.ps)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.sub, padding: "3px 0" }}>
            <span>Đã thu</span><b style={{ color: h.tt >= h.ps ? C.greenText : C.blueAText }}>{fmt(h.tt)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", marginTop: 4, borderTop: `1px solid ${C.line}`, fontWeight: 700 }}>
            <span style={{ color: h.no > 0 ? C.coralText : h.no < 0 ? C.greenText : C.sub }}>
              {h.no > 0 ? "Còn nợ" : h.no < 0 ? "Thu thừa" : "Đủ"}
            </span>
            <span style={{ color: h.no > 0 ? C.coralText : h.no < 0 ? C.greenText : C.sub }}>
              {fmt(Math.abs(h.no))}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 3. TAB ĐIỂM DANH
function DiemDanhTab({ student }) {
  const [history, setHistory] = useState([]);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    (async () => {
      setLoi(false);
      // ⛔ sList/sGet nuốt lỗi → tháng bị bỏ sót thì lịch sử nghỉ học hiện THIẾU mà tưởng đủ.
      const kR = await sListSafe("mn5:dd:");
      if (!kR.ok) { setLoi(true); return; }
      const months = kR.keys.map(k => k.replace("mn5:dd:", "")).filter(m => /^\d{4}-\d{2}$/.test(m)).sort().reverse();
      const rows = [];
      for (const m of months) {
        const r = await sGetSafe(`mn5:dd:${m}`);
        if (!r.ok) { setLoi(true); return; }
        const att = r.value?.[student.id] || {};
        const soNghi = Object.keys(att).length;
        if (soNghi === 0) continue;
        const [y, mo] = m.split("-").map(Number);
        const days = new Date(y, mo, 0).getDate();
        const soNgayHoc = Array.from({ length: days }, (_, i) => i + 1).filter(d => {
          const dw = new Date(y, mo - 1, d).getDay();
          return dw !== 0 && !att[d];
        }).length;
        rows.push({ thang: m, soNghi, soNgayHoc, chiTiet: att });
      }
      setHistory(rows);
    })();
  }, [student.id]);

  if (loi) return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}><Ii name="wifiOff" size={32} /></div>
      <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Không tải được lịch sử điểm danh</div>
      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>Mạng hoặc phiên đăng nhập đang trục trặc. Mở lại hồ sơ để thử.</div>
    </div>
  );

  return (
    <div>
      {history.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Bé chưa nghỉ ngày nào 🎉</div>}
      {history.map(h => (
        <Card key={h.thang} style={{ marginBottom: 8 }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Tháng {h.thang.slice(5)}/{h.thang.slice(0, 4)}</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              Nghỉ <b style={{ color: C.coralText }}>{h.soNghi}</b> buổi · Đi học <b style={{ color: C.greenText }}>{h.soNgayHoc}</b> buổi
            </div>
          </div>
          <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.keys(h.chiTiet).map(d => (
              <span key={d} style={{ fontSize: 12, background: C.coralSoft, color: C.coralText, padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>
                Ngày {d}
              </span>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// 4. TAB CÔNG NỢ
function CongNoTab({ student, meta }) {
  const [debt, setDebt] = useState(null);
  const [err, setErr] = useState(false);
  const [tryN, setTryN] = useState(0);

  useEffect(() => { let huy = false; (async () => {
    setDebt(null); setErr(false);
    // ⛔ sList nuốt lỗi → thiếu tháng → mọi sGetSafeCached dưới đều ok → setErr KHÔNG bật
    //   → hiện số nợ THIẾU như thể đúng. Chốt chặn dòng 344 vô dụng nếu không vá chỗ này.
    const kR = await sListSafe("mn5:thang:");
    if (huy) return;
    if (!kR.ok) { setErr(true); return; }
    const months = kR.keys.map((k) => k.replace("mn5:thang:", "")).filter((m) => /^\d{4}-\d{2}$/.test(m)).sort();
    // Đọc song song + cache tháng đã chốt; lỗi mạng → KHÔNG hiện số nợ sai.
    const dRes = await Promise.all(months.map((m) => sGetSafeCached(`mn5:thang:${m}`)));
    const ddRes = await Promise.all(months.map((m) => sGetSafeCached(`mn5:dd:${m}`)));
    const prevKeys = Array.from(new Set(months.map((m) => { const y = Number(m.slice(0, 4)), mo = Number(m.slice(5)); const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y; return ymKey(py, pm); }).filter((k) => !months.includes(k))));
    const pRes = await Promise.all(prevKeys.map((k) => sGetSafeCached(`mn5:dd:${k}`)));
    if (huy) return;
    if (dRes.some((r) => !r.ok) || ddRes.some((r) => !r.ok) || pRes.some((r) => !r.ok)) { setErr(true); return; }
    months.forEach((m, i) => { if (dRes[i].value?.daChot) { cachePut(`mn5:thang:${m}`, dRes[i].value); cachePut(`mn5:dd:${m}`, ddRes[i].value); } });
    const datas = dRes.map((r) => r.value), dds = ddRes.map((r) => r.value);
    const ddExtra = {}; prevKeys.forEach((k, i) => { ddExtra[k] = pRes[i].value || {}; });
    // DÙNG CHUNG hàm với Thu phí + Công nợ (tôn trọng snapshot chốt tháng) → 4 màn khớp số.
    const { debt: dmap, chiTiet, base, baseThang } = tinhNoLuyKe({ months, datas, dds, ddExtra, students: [student], meta });
    setDebt({ luyKe: dmap[student.id] ?? (student.noDauKy || 0), chiTiet: chiTiet[student.id] || [], base: base[student.id] ?? (student.noDauKy || 0), baseThang: baseThang[student.id] || null });
  })(); return () => { huy = true; }; }, [student.id, tryN]);

  if (err) return <div style={{ textAlign: "center", padding: 20, color: C.coralText, fontSize: 13 }}>Không tải được (lỗi mạng). <button onClick={() => setTryN((n) => n + 1)} style={{ marginLeft: 6, border: "none", background: C.pine, color: C.onFill, borderRadius: 8, padding: "5px 12px", fontWeight: 700, cursor: "pointer" }}>Thử lại</button></div>;
  if (!debt) return <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Đang tính...</div>;

  return (
    <div>
      <Card style={{ marginBottom: 12, background: debt.luyKe > 0 ? C.coralSoft : debt.luyKe < 0 ? C.greenSoft : C.graySoft, borderColor: C.line }}>
        <div style={{ fontSize: 12, color: debt.luyKe > 0 ? C.coralText : debt.luyKe < 0 ? C.greenText : C.sub, fontWeight: 600 }}>
          {debt.luyKe > 0 ? "Còn nợ" : debt.luyKe < 0 ? "Đóng dư" : "Không nợ"}
        </div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 24, color: debt.luyKe > 0 ? C.coralText : debt.luyKe < 0 ? C.greenText : C.ink }}>
          {fmt(Math.abs(debt.luyKe))} đ
        </div>
        {debt.baseThang
          ? (debt.base !== 0 && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Nợ mang sang (hết T{debt.baseThang.slice(5)}/{debt.baseThang.slice(0, 4)} đã chốt): {fmt(debt.base)}</div>)
          : (student.noDauKy > 0 && <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>Nợ đầu kỳ: {fmt(student.noDauKy)}</div>)}
      </Card>

      {debt.chiTiet.map(c => (
        <div key={c.thang} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: C.card, borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
          <span style={{ color: C.sub }}>Tháng {c.thang.slice(5)}/{c.thang.slice(0, 4)}</span>
          <div style={{ textAlign: "right" }}>
            <div>Phải {fmt(c.ps)} · Thu {fmt(c.tt)}</div>
            <div style={{ color: c.no > 0 ? C.coralText : c.no < 0 ? C.greenText : C.sub, fontWeight: 700 }}>
              {c.no > 0 ? `Nợ ${fmt(c.no)}` : c.no < 0 ? `Dư ${fmt(-c.no)}` : "Đủ"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 5. TAB LỊCH SỬ
function LichSuTab({ student }) {
  const [log, setLog] = useState([]);
  const [loi, setLoi] = useState(false);

  useEffect(() => {
    (async () => {
      setLoi(false);
      const r = await sGetSafe("mn5:log");
      if (!r.ok) { setLoi(true); return; } // lỗi → không hiện "chưa có gì", tránh tưởng nhầm rảnh tay
      const all = r.value || [];
      const filtered = all.filter(e => e.act.includes(student.ten) || e.act.includes(student.id));
      setLog(filtered.slice(0, 50));
    })();
  }, [student.id]);

  if (loi) return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}><Ii name="wifiOff" size={32} /></div>
      <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 600, marginBottom: 4 }}>Không tải được lịch sử thao tác</div>
      <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>Mạng hoặc phiên đăng nhập đang trục trặc. Mở lại hồ sơ để thử.</div>
    </div>
  );

  return (
    <div>
      {log.length === 0 && <div style={{ textAlign: "center", padding: 20, color: C.sub }}>Chưa có thao tác nào được ghi</div>}
      {log.map((e, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 14px", background: C.card, borderBottom: `1px solid ${C.line}`, fontSize: 13 }}>
          <span style={{ color: C.sub, fontSize: 11, whiteSpace: "nowrap" }}>{new Date(e.t).toLocaleDateString("vi-VN")}</span>
          <span><b style={{ color: e.who === "Admin" ? C.pine : C.blueAText }}>{e.who}</b> · {e.act}</span>
        </div>
      ))}
    </div>
  );
}
