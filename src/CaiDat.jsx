import { ClassAnimal } from "./Brand.jsx";
import { coDoiKhoanThem, demDoiKhoanThem, chotKhoanThem, ymNext } from "./khoanThem.js";
import { lopTai, coDoiGia, demDoiGia, chotGiaLop, khacGia } from "./giaLop.js";
import { useState, useEffect, useMemo, useRef } from "react";
import { Icon, Ii } from "./Icon.jsx";
import {
  C, font, fmt, ymKey, noDau, sGetSafe, sSet, sListSafe, sDel, SUPABASE_URL, SB_H, sbEnsureFresh, snapshotTruoc,
  ask, toast, logAction, uid, hoiXoa, baoDaXoa,
  PHAN_LOAI, PL_LABEL, TRANG_THAI, TT_COLOR, TT_THU_PHI, GIOI_TINH, GT_LABEL, normGt,
  lopHienTai, lopOfMonth, ngayNhapHocTrongThang, soNgayHoc, tinhPSFromRec,
  KHOAN, isKhongThu, defaultKhoan, khoanMode, SEED_META,
  THEMES, setTheme, getTheme, applyTheme, EDITABLE_COLORS, currentColor, setCustomColor, resetCustom, getCustom,
  sha256Hex, getPinHash, setPinHash, sbSignOut, getSbEmail
} from "./lib.js";
import {
  Segmented,
  Card, NumInput, ABBtn, SearchBar, BottomSheet, DragDialog, Button, TieuDeTrang, useStickyShrink, StickyBar, PLBadge
} from "./ui.jsx";

const REDACT = "__REDACTED__";
export function BackupExport({ meta, students }) {
  const [busy, setBusy] = useState(false);
  const [outText, setOutText] = useState("");
  const [outName, setOutName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [incSecret, setIncSecret] = useState(false);
  // Bản sao lưu TỰ ĐỘNG 17h (Supabase giữ 35 bản). null = đang tải, "loi" = không tải được.
  const [banTD, setBanTD] = useState(null);
  const goiRpc = async (ten, body) => {
    await sbEnsureFresh();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${ten}`, { method: "POST", headers: SB_H, body: JSON.stringify(body || {}) });
    if (!r.ok) throw new Error("rpc-" + r.status);
    return r.json();
  };
  const taiBanTD = async () => { setBanTD(null); try { setBanTD(await goiRpc("sao_luu_ds")); } catch { setBanTD("loi"); } };
  useEffect(() => { taiBanTD(); }, []);
  const gioVN = (iso) => { try { return new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return iso; } };
  const phucHoiBanTD = async (b) => {
    let data; try { data = await goiRpc("sao_luu_lay", { p_id: b.id }); } catch { toast("Không lấy được bản sao lưu (mạng/phiên). Thử lại."); return; }
    if (!data) { toast("Bản sao lưu này không còn nữa."); taiBanTD(); return; }
    restore(JSON.stringify(data)); // dùng đúng chốt chặn + xác nhận + bản tự lưu trước khi ghi đè của "Phục hồi"
  };
  const dl = (text, name, type) => { try { const blob = new Blob([type === "csv" ? "\uFEFF" + text : text], { type: type === "csv" ? "text/csv;charset=utf-8;" : "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); const d = new Date(); const hh = String(d.getHours()).padStart(2, "0"), mi = String(d.getMinutes()).padStart(2, "0"); try { localStorage.setItem("mn5:lastBackup", `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${hh}:${mi}`); } catch {} } catch (e) {} };

  const buildJSON = async (includeSecrets) => {
    // ⛔ sList nuốt lỗi → key bị bỏ sót thì vòng lặp dưới không đụng tới → không throw →
    //   xuất ra bản sao lưu THIẾU mà trông như hoàn chỉnh. Phao cứu sinh cuối cùng, không được thủng.
    const kR = await sListSafe("mn5:");
    if (!kR.ok) throw new Error("backup-read-fail");
    const keys = kR.keys; const data = {};
    for (const k of keys) {
      const r = await sGetSafe(k);
      if (!r.ok) throw new Error("backup-read-fail"); // mạng/phiên lỗi → HỦY, tuyệt đối không xuất bản thiếu
      data[k] = r.value;
    }
    if (!includeSecrets) {
      // Ẩn PIN khỏi bản sao lưu (dùng sentinel để lúc phục hồi KHÔNG xóa PIN đang có).
      if ("mn5:pinhash" in data) data["mn5:pinhash"] = REDACT;
      if (data["mn5:meta"]) {
        const m = JSON.parse(JSON.stringify(data["mn5:meta"])); // clone — KHÔNG sửa state đang chạy
        if (Array.isArray(m.giaoVien)) m.giaoVien = m.giaoVien.map((g) => ({ ...g, pin: REDACT }));
        data["mn5:meta"] = m;
      }
    }
    return JSON.stringify(data);
  };
  const buildCSV = async () => {
    // ⛔ Cùng lỗi với buildJSON: sList thiếu tháng → báo cáo thiếu tháng mà không báo lỗi.
    const kR = await sListSafe("mn5:thang:");
    if (!kR.ok) throw new Error("backup-read-fail");
    const keys = kR.keys.filter((k) => /mn5:thang:\d{4}-\d{2}$/.test(k)).sort();
    const rows = [["Tháng", "Mã HS", "Tên", "Lớp", "Phải thu", "Đã thu", "Còn nợ"]];
    for (const k of keys) {
      const tdR = await sGetSafe(k); if (!tdR.ok) throw new Error("backup-read-fail");
      const td = tdR.value; if (!td?.fees) continue;
      const ym = k.replace("mn5:thang:", ""); const y = Number(ym.slice(0, 4)), mo = Number(ym.slice(5));
      const pm = mo === 1 ? 12 : mo - 1, py = mo === 1 ? y - 1 : y;
      // ⛔ Đọc lỗi → nghỉ=0 → "Phải thu"/"Còn nợ" SAI trong báo cáo mà không ai biết. Hủy như dòng trên.
      const ddPrevR = await sGetSafe(`mn5:dd:${ymKey(py, pm)}`);
      if (!ddPrevR.ok) throw new Error("backup-read-fail");
      const ddPrevM = ddPrevR.value || {};
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
    if (kind === "json") {
      const msg = incSecret
        ? "⚠️ File này chứa MẬT KHẨU (PIN) đăng nhập + số tài khoản ngân hàng + toàn bộ tài chính.\n\nTUYỆT ĐỐI KHÔNG gửi qua Zalo/tin nhắn. Chỉ lưu ở nơi riêng tư (máy của bạn)."
        : "File chứa danh sách học sinh + học phí + công nợ + số tài khoản (PIN đã được ẩn).\n\nVẫn là dữ liệu nhạy cảm — cẩn thận khi chia sẻ.";
      if (!(await ask(msg, { danger: incSecret, okText: "Tôi hiểu, tải xuống" }))) return;
    }
    setBusy(true);
    try {
      const text = kind === "json" ? await buildJSON(incSecret) : await buildCSV();
      const name = kind === "json" ? `sao-luu-mamnon-${new Date().toISOString().slice(0, 10)}.json` : `bao-cao-thu-phi-${new Date().toISOString().slice(0, 10)}.csv`;
      dl(text, name, kind);                 
      setOutText(text); setOutName(name);   
    } catch (e) { toast("Không xuất được — thử lại giúp mình."); }
    setBusy(false);
  };

  const copyOut = async () => { try { await navigator.clipboard.writeText(outText); toast("Đã copy."); } catch { toast("Bôi đen ô bên dưới rồi Copy thủ công."); } };

  const restore = async (text) => {
    let data; try { data = JSON.parse(text); } catch { toast("Nội dung không hợp lệ."); return; }
    if (!data || typeof data !== "object" || Array.isArray(data)) { toast("Nội dung không phải bản sao lưu."); return; }
    // ⛔ CHỐT CHẶN: chỉ phục hồi khi ĐÚNG là bản sao lưu thật (có HS + có lớp).
    // Tránh dán nhầm 1 đoạn JSON hợp lệ nhưng thiếu → xóa sạch dữ liệu.
    const st = data["mn5:students"], mt = data["mn5:meta"];
    const okSt = Array.isArray(st) && st.length > 0;
    const okMt = mt && Array.isArray(mt.classes) && mt.classes.length > 0;
    if (!okSt || !okMt) { toast("Không phải bản sao lưu hợp lệ (thiếu học sinh hoặc lớp). Đã hủy để bảo vệ dữ liệu."); return; }
    const n = Object.keys(data).length;
    if (!(await ask(`Phục hồi ${st.length} học sinh · ${mt.classes.length} lớp (${n} mục)?\n⚠️ GHI ĐÈ toàn bộ dữ liệu hiện tại.`, { danger: true, okText: "Phục hồi" }))) return;
    // ⛔ Phục hồi = GHI ĐÈ toàn bộ. Không có bản tự lưu thì không có đường lùi nếu bản sao lưu này sai.
    if (!(await snapshotTruoc("Trước khi phục hồi từ sao lưu"))) {
      toast("Không tạo được bản tự lưu (mạng/phiên) — hủy phục hồi để an toàn. Thử lại."); return;
    }
    setBusy(true);
    try {
      // Bản sao lưu ẩn PIN: KHÔNG ghi đè PIN đang có bằng giá trị ẩn.
      // - PIN GV bị ẩn → giữ PIN hiện tại (khớp theo id); máy mới thì để trống.
      if (data["mn5:meta"] && Array.isArray(data["mn5:meta"].giaoVien)) {
        const curGV = (meta && meta.giaoVien) || [];
        data["mn5:meta"] = { ...data["mn5:meta"], giaoVien: data["mn5:meta"].giaoVien.map((g) => {
          if (g.pin !== REDACT) return g;
          const old = curGV.find((x) => x.id === g.id);
          return { ...g, pin: old ? old.pin : "" };
        }) };
      }
      // Ghi dữ liệu mới TRƯỚC (lỗi giữa chừng vẫn còn dữ liệu tốt), rồi MỚI xóa key thừa.
      for (const [k, v] of Object.entries(data)) {
        if (k === "mn5:pinhash" && v === REDACT) continue; // PIN admin bị ẩn → giữ nguyên bản đang có
        await sSet(k, v);
      }
      // GIỮ các key không có trong bản sao lưu (vd tháng tạo sau khi backup) — không xóa gì cả.
      // Chỉ là toast thông báo số lượng — sList thiếu key ở đây không gây mất dữ liệu, bỏ qua im lặng nếu lỗi.
      const oldR = await sListSafe("mn5:");
      if (oldR.ok) {
        const giuLai = oldR.keys.filter((k) => !(k in data));
        if (giuLai.length) toast(`Giữ nguyên ${giuLai.length} mục không có trong bản sao lưu (tháng/dữ liệu mới hơn).`);
      }
      logAction(`Phục hồi từ sao lưu (${st.length} HS, ${mt.classes.length} lớp)`);
      toast("Đã phục hồi. Đang tải lại…");
      setTimeout(() => location.reload(), 800);
    } catch (e) { toast("Không phục hồi được — kiểm tra mạng rồi thử lại."); setBusy(false); }
  };
  const importFile = async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; restore(await f.text()); };

  return (
    <>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4, display:"inline-flex", alignItems:"center", gap:6 }}><Icon name="save" size={16} color={C.ink} /> Sao lưu dữ liệu</div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10 }}>Bấm để xuất. Nếu máy không tự tải file (do trình duyệt/khung xem trước chặn), nội dung sẽ hiện ra ô bên dưới để bạn <b>copy</b> lưu lại. <b style={{ color: C.coralText }}>File chứa dữ liệu nhạy cảm — cẩn thận khi chia sẻ.</b></div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.ink, marginBottom: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={incSecret} onChange={(e) => setIncSecret(e.target.checked)} style={{ accentColor: C.pine, width: 16, height: 16 }} />
          <span>Bao gồm PIN đăng nhập trong bản sao lưu <span style={{ color: C.sub }}>(mặc định ẩn — chỉ bật nếu lưu riêng tư, đừng chia sẻ)</span></span>
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => doExport("json")} disabled={busy} style={{ display:"inline-flex", alignItems:"center", gap:6, padding: "10px 16px", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Đang xử lý…" : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="download" size={15} color={C.onFill} /> Sao lưu toàn bộ (JSON)</span>}</button>
          <button onClick={() => doExport("csv")} disabled={busy} style={{ display:"inline-flex", alignItems:"center", gap:6, padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${C.pine}`, background: C.card, color: C.pine, fontWeight: 700, fontSize: 13.5, cursor: "pointer", opacity: busy ? 0.6 : 1 }}><Icon name="fileText" size={15} color={C.pine} /> Xuất Excel thu phí (CSV)</button>
        </div>
        {outText && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.sub }}>{outName}</span>
              <button onClick={copyOut} style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: C.blueA, display:"inline-flex", alignItems:"center", gap:5, color: C.onFill, fontWeight: 700, fontSize: 12, cursor: "pointer" }}><Icon name="clipboard" size={13} color={C.onFill} /> Copy</button>
            </div>
            <textarea readOnly value={outText} onFocus={(e) => e.target.select()} style={{ width: "100%", height: 110, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: 8, resize: "vertical", color: C.ink, background: C.graySoft }} />
          </div>
        )}
      </Card>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={16} color={C.ink} /> Bản sao lưu tự động</div>
          <button onClick={taiBanTD} style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Tải lại</button>
        </div>
        <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10 }}>Hệ thống tự lưu <b>17:00 mỗi ngày</b>, giữ 35 bản mới nhất. PIN được ẩn; khi phục hồi, PIN hiện tại được giữ nguyên.</div>
        {banTD == null && <div style={{ fontSize: 13, color: C.sub, padding: "8px 0" }}>Đang tải danh sách…</div>}
        {banTD === "loi" && <div style={{ fontSize: 13, color: C.coralText, padding: "8px 0" }}>Không tải được danh sách (kiểm tra mạng / đăng nhập). Bấm "Tải lại" để thử lần nữa.</div>}
        {Array.isArray(banTD) && banTD.length === 0 && <div style={{ fontSize: 13, color: C.sub, padding: "8px 0" }}>Chưa có bản nào.</div>}
        {Array.isArray(banTD) && banTD.length > 0 && (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
            {banTD.map((b, i) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 12px", borderTop: i ? `1px solid ${C.line}` : "none", background: C.card }}>
                <div style={{ flex: "1 1 150px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{gioVN(b.tao_luc)}</div>
                  <div style={{ fontSize: 12, color: C.sub }}>{b.so_hs} học sinh · {b.so_muc} mục</div>
                </div>
                <button onClick={() => phucHoiBanTD(b)} disabled={busy} style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.coral}`, background: C.card, color: C.coralText, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>Phục hồi</button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4, display:"flex", alignItems:"center", gap:6 }}><Icon name="refresh" size={16} color={C.ink} /> Phục hồi</div>
        <div style={{ fontSize: 12, color: C.coralText, fontWeight: 600, marginBottom: 10, display:"flex", alignItems:"center", gap:6 }}><Icon name="alertTriangle" size={13} color={C.coral} /> Ghi đè toàn bộ dữ liệu hiện tại.</div>
        <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Cách 1 — dán nội dung bản sao lưu JSON vào đây:</div>
        <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder='Dán nội dung JSON đã sao lưu...' style={{ width: "100%", height: 90, fontSize: 11, fontFamily: "monospace", border: `1.5px solid ${C.line}`, borderRadius: 10, padding: 8, resize: "vertical", marginBottom: 8 }} />
        <button onClick={() => restore(pasteText)} disabled={busy || !pasteText.trim()} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding: "10px 16px", borderRadius: 10, border: "none", background: pasteText.trim() ? C.coral : C.graySoft, color: C.onFill, fontWeight: 700, fontSize: 13.5, cursor: pasteText.trim() ? "pointer" : "default" }}><Icon name="refresh" size={15} color={pasteText.trim() ? C.onFill : C.sub} /> Phục hồi từ nội dung dán</button>
        <div style={{ fontSize: 12, color: C.sub, margin: "12px 0 6px" }}>Cách 2 — chọn file .json (chỉ chạy khi mở app thật):</div>
        <label style={{ display: "inline-block", padding: "10px 16px", borderRadius: 10, border: `1.5px dashed ${C.line}`, fontSize: 13.5, color: C.sub, cursor: "pointer" }}>Chọn file .json<input type="file" accept=".json,application/json" onChange={importFile} disabled={busy} style={{ display: "none" }} /></label>
      </Card>
    </>
  );
}

export function AuditLog() {
  const [log, setLog] = useState(null);
  const [limit, setLimit] = useState(100);
  const load = async () => { const r = await sGetSafe("mn5:log"); if (!r.ok) { toast("Không tải được nhật ký (mạng/phiên)."); return; } setLog(r.value || []); setLimit(100); };
  useEffect(() => { load(); }, []);
  const fmtT = (iso) => { try { const d = new Date(iso); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } catch { return iso; } };
  const clear = async () => { if (await hoiXoa("toàn bộ nhật ký thao tác")) { await sSet("mn5:log", []); setLog([]); baoDaXoa("nhật ký thao tác"); } };
  if (log == null) return <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 24 }}>Đang tải nhật ký…</div>;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: C.sub }}>Ghi lại các thao tác quan trọng (thêm/xóa/chuyển lớp/chốt tháng…). Lưu tối đa 800 dòng gần nhất.</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={load} style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>↻ Tải lại</button>
        {log.length > 0 && <button onClick={clear} style={{ display:"inline-flex", alignItems:"center", gap:6, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.coral}`, background: C.card, color: C.coralText, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}><Icon name="trash" size={14} color={C.coral} /> Xóa nhật ký</button>}
      </div>
      {log.length === 0 ? (
        <div style={{ textAlign: "center", color: C.sub, fontSize: 13.5, padding: 24 }}>Chưa có thao tác nào được ghi.</div>
      ) : (<>
        {log.slice(0, limit).map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", marginBottom: 6, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 13 }}>
            <div style={{ color: C.sub, fontSize: 11.5, whiteSpace: "nowrap", flexShrink: 0, minWidth: 76 }}>{fmtT(e.t)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, color: e.who === "Admin" ? C.pine : C.blueAText }}>{e.who}</span>
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

// Badge cảnh báo: các cú ghi-rỗng bị khiên server (trigger) chặn trong 7 ngày qua
function AuditWipeBadge() {
  const [rows, setRows] = useState(null);
  useEffect(() => { (async () => {
    try {
      await sbEnsureFresh();
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const r = await fetch(`${SUPABASE_URL}/rest/v1/audit_wipe?select=ts,key,op,actor&ts=gte.${encodeURIComponent(since)}&order=ts.desc&limit=20`, { headers: SB_H, cache: "no-store" });
      if (r.ok) setRows(await r.json());
    } catch {}
  })(); }, []);
  if (!rows || !rows.length) return null;
  return (
    <Card>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.coralText, marginBottom: 6 }}><Ii name="alertTriangle" size={14} /> Khiên dữ liệu đã chặn {rows.length} lần ghi rỗng (7 ngày)</div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 8, lineHeight: 1.5 }}>Server đã tự từ chối các cú ghi làm trống dữ liệu. Nếu con số này tăng đều, có máy đang chạy bản cũ hoặc phiên hết hạn — báo lại để kiểm tra.</div>
      {rows.slice(0, 5).map((r, i) => (
        <div key={i} style={{ fontSize: 12, color: C.ink, padding: "5px 0", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span>{r.key} · {r.op}</span>
          <span style={{ color: C.sub, flexShrink: 0 }}>{new Date(r.ts).toLocaleString("vi-VN")}</span>
        </div>
      ))}
    </Card>
  );
}

export function CaiDat({ meta, upMeta, students, upStudents, ym, reseedAll, khoiPhucTruoc, isWide, onlySec, isDesk }) {
  const [resetText, setResetText] = useState("");
  const [sec, setSec] = useState(onlySec || "gv"); // onlySec="lop": màn Lớp học riêng (không chip, không khối báo)
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
  const [lopMo, setLopMo] = useState(null);
  const [renameLop, setRenameLop] = useState(null);
  const [lopDraft, setLopDraft] = useState(null);
  const [lopTim, setLopTim] = useState("");      // PC: ô Tìm lớp
  const [themMo, setThemMo] = useState(false);   // PC: hàng nhập tên lớp mới
  const [lopMenu, setLopMenu] = useState(null);   // PC: menu "…" của lớp
  const [hoiApDung, setHoiApDung] = useState(false); // hỏi "Áp dụng ngay / Từ tháng sau" khi Lưu có đổi khoản thu thêm
  const [suaTenKhoan, setSuaTenKhoan] = useState(null); // "lopId:khoanId" đang sửa tên
  const [luaFlash, setLuuFlash] = useState(false);
  const GIA_FIELDS = ["t7", "hocPhi", "banTru", "tienAn", "veSinh", "tiengAnh", "ngoaiKhoa", "dongPhuc", "dauNam"];
  const lopEff = useMemo(() => meta.classes.map((c) => lopTai(c, ym)), [meta.classes, ym]); // giá hiệu lực ở tháng đang xem
  const clsView = lopDraft || lopEff;
  const eqCls = (a, b) => a.length === b.length && a.every((c, i) => { const d = b[i]; if (!d || c.id !== d.id) return false; if (GIA_FIELDS.some((f) => (c[f] || 0) !== (d[f] || 0))) return false; return JSON.stringify(c.lapLai || {}) === JSON.stringify(d.lapLai || {}) && JSON.stringify(c.khoanThem || []) === JSON.stringify(d.khoanThem || []); });
  const demThayDoi = () => (lopDraft ? demDoiGia(lopDraft, meta.classes, ym) + demDoiKhoanThem(lopDraft, meta.classes) : 0);
  const editCls = (id, k, v) => {
    const base = lopDraft || lopEff;
    const next = base.map((c) => (c.id === id ? { ...c, [k]: v } : c));
    setLopDraft(eqCls(next, lopEff) ? null : next);
  };
  const luuLop = (apNgay = true) => {
    if (!lopDraft) return;
    const doiKhoan = coDoiKhoanThem(lopDraft, meta.classes), doiGia = coDoiGia(lopDraft, meta.classes, ym);
    let classes = lopDraft;
    if (doiKhoan) classes = chotKhoanThem(classes, meta.classes, ym, apNgay);
    if (doiGia) classes = chotGiaLop(classes, meta.classes, ym, apNgay);
    upMeta({ ...meta, classes });
    logAction(`Cập nhật ${doiGia ? "bảng giá" : ""}${doiGia && doiKhoan ? " + " : ""}${doiKhoan ? "khoản thu thêm" : ""} lớp (${apNgay ? "áp ngay từ " + ym : "từ tháng sau, " + ymNext(ym)})`);
    setLopDraft(null); setHoiApDung(false); setLuuFlash(true); setTimeout(() => setLuuFlash(false), 1200);
  };
  const GIA_NHAN = { t7: "Buổi T7", hocPhi: "Học phí", banTru: "Bán trú", tienAn: "Tiền ăn", veSinh: "Vệ sinh", tiengAnh: "Tiếng Anh", ngoaiKhoa: "Ngoại khóa", dongPhuc: "Đồng phục", dauNam: "Đầu năm" };
  const tomTatDoi = () => {
    if (!lopDraft) return [];
    const out = [];
    lopDraft.forEach((c) => {
      const g = meta.classes.find((x) => x.id === c.id); if (!g) return;
      const eff = lopTai(g, ym); const { v } = khacGia(eff, c);
      Object.keys(v).forEach((f) => {
        if (f === "lapLai") Object.keys(v.lapLai).forEach((k) => out.push(`${c.ten} · ${GIA_NHAN[k] || k}: ${v.lapLai[k] === "khong" ? "Tắt thu" : "Bật thu"}`));
        else out.push(`${c.ten} · ${GIA_NHAN[f] || f}: ${fmt(eff[f] || 0)}đ → ${fmt(v[f])}đ`);
      });
      const gk = g.khoanThem || [], ck = c.khoanThem || [];
      ck.forEach((k) => {
        const o = gk.find((x) => x.id === k.id);
        if (!o) out.push(`${c.ten} · Thêm "${k.ten || "(chưa đặt tên)"}": ${fmt(k.soTien || 0)}đ`);
        else if (o.ten !== k.ten || (o.soTien || 0) !== (k.soTien || 0) || (o.bat !== false) !== (k.bat !== false)) out.push(`${c.ten} · ${k.ten || o.ten}: ${fmt(o.soTien || 0)}đ → ${k.bat === false ? "Tắt thu" : fmt(k.soTien || 0) + "đ"}`);
      });
      gk.forEach((o) => { if (!ck.some((k) => k.id === o.id)) out.push(`${c.ten} · Xóa khoản "${o.ten}"`); });
    });
    return out;
  };
  const HoiBox = isDesk ? DragDialog : BottomSheet; // máy tính: hộp thoại giữa màn hình kéo được; điện thoại: bảng trượt từ dưới
  const bamLuu = () => { if (!lopDraft) return; if (coDoiKhoanThem(lopDraft, meta.classes) || coDoiGia(lopDraft, meta.classes, ym)) setHoiApDung(true); else luuLop(true); };
  // Khoản thu thêm theo lớp (sửa trên bản nháp; chỉ ghi khi bấm Lưu)
  const sửaLop = (lopId, fn) => { const base = lopDraft || lopEff; const next = base.map((c) => (c.id === lopId ? fn(c) : c)); setLopDraft(eqCls(next, lopEff) ? null : next); };
  const themKhoanThem = (lopId) => { const id = "k" + uid(); sửaLop(lopId, (c) => ({ ...c, khoanThem: [...(c.khoanThem || []), { id, ten: "", soTien: 0, bat: true, moi: true }] })); setSuaTenKhoan(`${lopId}:${id}`); };
  const suaKhoanThem = (lopId, kid, patch) => sửaLop(lopId, (c) => ({ ...c, khoanThem: (c.khoanThem || []).map((k) => (k.id === kid ? { ...k, ...patch } : k)) }));
  const xoaKhoanThem = async (lopId, kid) => {
    const k0 = (meta.classes.find((c) => c.id === lopId)?.khoanThem || []).find((k) => k.id === kid);
    if (!(await hoiXoa(`khoản thu thêm "${k0?.ten || ""}"`, "Khoản này chỉ biến mất sau khi bạn bấm Lưu thay đổi."))) return;
    sửaLop(lopId, (c) => ({ ...c, khoanThem: (c.khoanThem || []).filter((k) => k.id !== kid) }));
  };
  const [gvTen, setGvTen] = useState("");
  const [gvPin, setGvPin] = useState("");
  const [showPinId, setShowPinId] = useState(null); // PIN GV ẩn mặc định — chỉ hiện khi bấm, mỗi lúc 1 người
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
  const delHS = async (id) => { const hs = students.find((s) => s.id === id); if (await hoiXoa(`học sinh "${hs?.ten || ""}"`, "Mất cả lịch sử của em này.")) { const newList = students.filter((s) => s.id !== id); upStudents(newList, true); logAction(`Xóa HS "${hs?.ten || id}"`); baoDaXoa("học sinh", hs ? () => upStudents([...newList, hs], true) : undefined); } };
  const setHS = (id, p) => upStudents(students.map((s) => (s.id === id ? { ...s, ...p } : s)));
  const filteredHS = useMemo(() => students.filter((s) => (hsFilter === "all" || lopHienTai(s) === hsFilter) && (!hsSearch || noDau(s.ten).includes(noDau(hsSearch))) && (hsStatusFilter === "all" || s.trangThai === hsStatusFilter) && (showLeft || hsStatusFilter !== "all" || (s.trangThai !== "Nghỉ học" && s.trangThai !== "Ra trường"))), [students, hsFilter, hsSearch, hsStatusFilter, showLeft]);
  const allFilteredSelected = filteredHS.length > 0 && filteredHS.every((s) => selectedHS.includes(s.id));
  const toggleSelectAll = () => setSelectedHS(allFilteredSelected ? [] : filteredHS.map((s) => s.id));
  const closeThaoTac = () => { setThaoTacOpen(false); setTtView("menu"); setXoaText(""); };
  const doneBulk = (logMsg, toastMsg) => { logAction(logMsg); toast(toastMsg); setSelectedHS([]); closeThaoTac(); };
  const bulkPatch = (patch, logMsg, toastMsg) => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ...patch } : s), true); doneBulk(logMsg, toastMsg); };
  const bulkChuyenLop = () => { const tenLop = meta.classes.find((c) => c.id === bulkTargetLop)?.ten; upStudents(students.map((s) => { if (!selectedHS.includes(s.id)) return s; const hist = (s.lopHistory || []).filter((h) => h.tuThang !== ym); hist.push({ tuThang: ym, lop: bulkTargetLop }); hist.sort((a, b) => a.tuThang.localeCompare(b.tuThang)); return { ...s, lopHistory: hist }; }), true); doneBulk(`Chuyển lớp hàng loạt ${selectedHS.length} HS → ${tenLop} (từ T${ym})`, `Đã chuyển ${selectedHS.length} HS sang lớp ${tenLop}`); };
  const bulkRaTruong = () => { upStudents(students.map((s) => selectedHS.includes(s.id) ? { ...s, ngayNghiHoc: bulkRaNgay, trangThai: "Ra trường" } : s), true); doneBulk(`Cho ra trường hàng loạt ${selectedHS.length} HS (ngày ${bulkRaNgay})`, `Đã cho ${selectedHS.length} HS ra trường`); };
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
  // Đổi vị trí lớp (thứ tự này cũng là thứ tự lớp trong danh sách Học sinh / Thu phí).
  const luuTenLop = () => {
    const r = renameLop; if (!r) return;
    setRenameLop(null);
    const t = r.ten.trim();
    if (!t || t === meta.classes.find((c) => c.id === r.id)?.ten) return;
    if (lopDraft) { toast("Lưu hoặc Hủy thay đổi giá đang sửa trước."); return; }
    upMeta({ ...meta, classes: meta.classes.map((c) => (c.id === r.id ? { ...c, ten: t } : c)) });
    setLopDraft(null); logAction(`Đổi tên lớp → "${t}"`);
  };
  const doiViTriLop = (id, dir) => {
    if (lopDraft) { toast("Lưu hoặc Hủy thay đổi giá đang sửa trước."); return; }
    const cls = [...meta.classes]; const i = cls.findIndex((c) => c.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= cls.length) return;
    [cls[i], cls[j]] = [cls[j], cls[i]];
    upMeta({ ...meta, classes: cls }); logAction(`Đổi vị trí lớp "${cls[j].ten}"`);
  };
  const themLop = () => { const t = tenLopMoi.trim(); if (!t) return; if (lopDraft) { toast("Lưu hoặc Hủy thay đổi giá đang sửa trước."); return; } const base = meta.classes; upMeta({ ...meta, classes: [...base, { id: "c" + uid(), ten: t, hocPhi: 800000, banTru: 200000, tienAn: 30000, t7: 80000, veSinh: 20000, tiengAnh: 100000, ngoaiKhoa: 100000, dauNam: 1200000 }] }); setLopDraft(null); setTenLopMoi(""); logAction(`Thêm lớp "${t}"`); };
  const xoaLop = async (id) => { if (students.some((s) => lopHienTai(s) === id)) { toast("Lớp còn HS — chuyển HS trước."); return; } if (meta.classes.length === 1) { toast("Phải còn ít nhất 1 lớp."); return; } const lopCu = meta.classes.find((c) => c.id === id); if (lopDraft) { toast("Lưu hoặc Hủy thay đổi giá đang sửa trước."); return; } if (await hoiXoa(`lớp "${lopCu?.ten || ""}"`)) { const base = meta.classes; const newClasses = base.filter((c) => c.id !== id); upMeta({ ...meta, classes: newClasses }); setLopDraft(null); logAction(`Xóa lớp "${lopCu?.ten || id}"`); baoDaXoa("lớp", lopCu ? () => upMeta({ ...meta, classes: [...newClasses, lopCu] }) : undefined); } };
  const setLopGia = (id, k, v) => editCls(id, k, v);
  const cycleKhoan = (id, key) => {
    const cur = khoanMode((lopDraft || lopEff).find((c) => c.id === id), key);
    const next = cur === "thu" ? "khong" : "thu";
    const base = lopDraft || lopEff;
    const nx = base.map((c) => (c.id === id ? { ...c, lapLai: { ...(c.lapLai || {}), [key]: next } } : c));
    setLopDraft(eqCls(nx, lopEff) ? null : nx);
  };
  const setBank = (p, k, v) => upMeta({ ...meta, bank: { ...meta.bank, [p]: { ...meta.bank[p], [k]: v } } });
  const themGV = () => { const t = gvTen.trim(), p = gvPin.trim(); if (!t || !p || !gvLop) { toast("Nhập đủ tên, PIN, lớp."); return; } if ((meta.giaoVien || []).some((g) => g.pin === p)) { toast("PIN này đã dùng — chọn PIN khác."); return; } upMeta({ ...meta, giaoVien: [...(meta.giaoVien || []), { id: "gv" + uid(), ten: t, pin: p, lopId: gvLop }] }); setGvTen(""); setGvPin(""); logAction(`Thêm giáo viên "${t}"`); toast("Đã thêm giáo viên."); };
  const xoaGV = async (id) => { const gv = (meta.giaoVien || []).find((g) => g.id === id); if (await hoiXoa(`giáo viên "${gv?.ten || ""}"`)) { const newGV = (meta.giaoVien || []).filter((g) => g.id !== id); upMeta({ ...meta, giaoVien: newGV }); logAction(`Xóa giáo viên "${gv?.ten || id}"`); baoDaXoa("giáo viên", gv ? () => upMeta({ ...meta, giaoVien: [...newGV, gv] }) : undefined); } };
  const setDK = (k, v) => upMeta({ ...meta, soDuDauKy: { ...meta.soDuDauKy, [k]: v } });

  // === Báo từ Giáo viên (Admin nhận + duyệt) ===
  const [baoList, setBaoList] = useState([]);
  const loadBao = async () => { try { const r = await sGetSafe("mn5:bao"); if (r.ok) setBaoList(r.value || []); } catch {} };
  useEffect(() => { loadBao(); }, []);
  const baoPending = baoList.filter((b) => !b.done);
  const _today = () => new Date().toISOString().slice(0, 10);
  const baoTypeLabel = (t) => t === "thoihoc" ? "Thôi học" : t === "chuyenlop" ? "Chuyển lớp" : t === "moi" ? "Cháu mới" : "Báo";
  const markBaoDone = async (id) => {
    const curR = await sGetSafe("mn5:bao");
    if (!curR.ok) { toast("Không cập nhật được (mạng/phiên) — thử lại."); return; }
    const cur = curR.value || [];
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

  const inp = { padding: "9px 10px", borderRadius: 10, border: "1.5px solid " + C.line, fontSize: 13, fontFamily: font.body, color: C.ink, background: C.graySoft, outline: "none" };

  return (
    <>
      {!onlySec && baoPending.length > 0 && (
        <Card style={{ marginBottom: 12, background: C.amberSoft, borderColor: C.line }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="bell" size={17} color={C.coral} />
            <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14.5, color: C.ink }}>Báo từ Giáo viên</span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: C.onFill, background: C.coral, borderRadius: 99, padding: "1px 8px" }}>{baoPending.length}</span>
          </div>
          {baoPending.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)).map((b) => {
            const col = b.type === "thoihoc" ? C.coral : b.type === "chuyenlop" ? C.blueA : C.green;
            const tg = b.ts ? new Date(b.ts) : null;
            const tgStr = tg ? `${String(tg.getHours()).padStart(2, "0")}:${String(tg.getMinutes()).padStart(2, "0")} ${tg.getDate()}/${tg.getMonth() + 1}` : "";
            return (
              <div key={b.id} style={{ border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px", marginBottom: 9, background: C.card }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: C.onFill, background: col, borderRadius: 6, padding: "1px 7px" }}>{baoTypeLabel(b.type)}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{b.hsTen || "(chưa tên)"}</span>
                  {b.type === "chuyenlop" && <span style={{ fontSize: 12.5, color: C.sub }}>→ {meta.classes.find((c) => c.id === b.lop)?.ten || b.lopTen || ""}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: C.grayText, marginBottom: b.note ? 4 : 8 }}>{b.gv || "Giáo viên"}{tgStr ? " · " + tgStr : ""}</div>
                {b.note && <div style={{ fontSize: 12.5, color: C.sub, background: C.bg, borderRadius: 7, padding: "5px 9px", marginBottom: 8 }}>{b.note}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => duyetBao(b)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="check" size={14} color={C.onFill} /> Duyệt</button>
                  <button onClick={() => boQuaBao(b)} style={{ flex: "0 0 auto", padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body }}>Bỏ qua</button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
      {!onlySec && <Segmented wrap style={{ marginBottom: 14 }} value={sec} onChange={setSec} items={[["gv", "Giáo viên"], ["bank", "Tài khoản"], ["thuphi", "Thu học phí"], ["dk", "Số dư đầu kỳ"], ["giaodien", "Giao diện"], ["baomat", "Bảo mật"], ["backup", "Sao lưu"], ["log", "Nhật ký"], ["data", "Dữ liệu"]]} />}

      {sec === "lop" && onlySec && isDesk && (() => {
        const q = noDau(lopTim.trim().toLowerCase());
        const dsLop = clsView.map((l, li) => ({ l, li, siSo: students.filter((s) => lopHienTai(s) === l.id && s.trangThai !== "Ra trường").length })).filter((x) => !q || noDau(x.l.ten.toLowerCase()).includes(q));
        const tongHS = clsView.reduce((a, l) => a + students.filter((s) => lopHienTai(s) === l.id && s.trangThai !== "Ra trường").length, 0);
        const chipS = { display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 12, background: C.card, border: `1px solid ${C.line}`, fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink, boxShadow: "0 1px 4px rgba(20,60,48,.06)" };
        const NHOM1 = [["t7", "Buổi T7"], ["hocPhi", "Học phí"], ["veSinh", "Vệ sinh"], ["tiengAnh", "Tiếng Anh"]];
        const NHOM2 = [["banTru", "Bán trú"], ["tienAn", "Tiền ăn"], ["ngoaiKhoa", "Ngoại khóa"]];
        const NHOM3 = [["dongPhuc", "Đồng phục"], ["dauNam", "Đầu năm"]];
        const dong = (l, [key, nhan]) => {
          const conCongTac = key !== "t7"; // Buổi T7 không có công tắc Thu/Tắt trong dữ liệu
          const on = conCongTac ? khoanMode(l, key) === "thu" : true;
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
              <span style={{ width: 86, flexShrink: 0, fontSize: 13.5, color: C.ink }}>{nhan}</span>
              <div style={{ flex: 1, minWidth: 0 }}><NumInput value={l[key] || 0} disabled={!on} onChange={(v) => setLopGia(l.id, key, v)} w={"100%"} /></div>
              {conCongTac
                ? <button onClick={() => cycleKhoan(l.id, key)} title="Bấm để đổi: Thu / Tắt" style={{ flexShrink: 0, minWidth: 64, padding: "6px 10px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 12.5, background: on ? C.greenSoft : C.coralSoft, color: on ? C.greenText : C.coralText }}>{on ? "✓ Thu" : "⊘ Tắt"}</button>
                : <span style={{ width: 64, flexShrink: 0 }} />}
            </div>
          );
        };
        const nhom = (tieuDe, phu, icon, cot) => (
          <div style={{ background: C.graySoft, borderRadius: 14, padding: "12px 14px", marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 6 }}><Icon name={icon} size={16} color={C.pine} />{tieuDe}{phu && <span style={{ fontWeight: 500, color: C.sub }}>{phu}</span>}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 18px" }}>{cot}</div>
          </div>
        );
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              <TieuDeTrang style={{ marginRight: "auto", minWidth: 200 }} tieuDe="Lớp học" phu="Quản lý sĩ số và các khoản thu theo lớp." />
              <span style={chipS}><Icon name="school" size={18} color={C.pine} />{clsView.length} lớp</span>
              <span style={chipS}><Icon name="users" size={18} color={C.pine} />{tongHS} học sinh</span>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Icon name="search" size={16} color={C.sub} /></span>
                <input value={lopTim} onChange={(e) => setLopTim(e.target.value)} placeholder="Tìm lớp…" aria-label="Tìm lớp" style={{ width: 200, padding: "10px 12px 10px 34px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontFamily: font.body, fontSize: 14 }} />
              </div>
              <button onClick={() => setThemMo((v) => !v)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}><Icon name="plus" size={16} color={C.onFill} /> Thêm lớp</button>
            </div>

            {themMo && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16, maxWidth: 520 }}>
                <input value={tenLopMoi} onChange={(e) => setTenLopMoi(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { themLop(); setThemMo(false); } }} autoFocus placeholder="Tên lớp mới" style={{ ...inp, flex: 1, minWidth: 0 }} />
                <button onClick={() => { themLop(); setThemMo(false); }} style={{ padding: "0 18px", borderRadius: 12, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Thêm</button>
                <button onClick={() => { setThemMo(false); setTenLopMoi(""); }} style={{ padding: "0 14px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Hủy</button>
              </div>
            )}

            {dsLop.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: C.sub }}>{clsView.length === 0 ? "Chưa có lớp nào. Bấm \"Thêm lớp\" để tạo lớp đầu tiên." : "Không có lớp nào khớp ô tìm."}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))", gap: 16, alignItems: "start", marginBottom: lopDraft || luaFlash ? 90 : 0 }}>
              {dsLop.map(({ l, li, siSo }) => {
                const mo = lopMo === l.id;
                return (
                  <Card key={l.id} style={{ padding: 0, overflow: "visible", borderRadius: 20, border: `1px solid ${mo ? C.pine : C.line}`, gridColumn: mo ? "1 / -1" : undefined }}>
                    <div onClick={() => setLopMo(mo ? null : l.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                      <span style={{ color: C.sub, transform: mo ? "rotate(90deg)" : "none", transition: "transform .15s", display: "flex" }}><Ii name="chevronRight" size={16} /></span>
                      <span title="Số thứ tự lớp" style={{ minWidth: 26, height: 26, borderRadius: 99, background: C.pineSoft, color: C.pine, fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{li + 1}</span>
                      <div style={{ width: 56, height: 56, borderRadius: 99, background: C.pineSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ClassAnimal name={l.ten} index={li} size={42} /></div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        {renameLop && renameLop.id === l.id ? (
                          <input ref={(el) => { if (el && !el.dataset.sel) { el.dataset.sel = "1"; el.focus(); el.select(); } }} value={renameLop.ten} onFocus={(e) => e.target.select()} onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setRenameLop({ ...renameLop, ten: e.target.value })}
                            onBlur={() => luuTenLop()}
                            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); else if (e.key === "Escape") setRenameLop(null); }}
                            style={{ width: "100%", boxSizing: "border-box", padding: "2px 6px", margin: "-3px -6px", borderRadius: 8, border: `1.5px solid ${C.pine}`, outline: "none", background: C.card, fontFamily: font.display, fontWeight: 800, fontSize: 19, color: C.ink }} />
                        ) : <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 19, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.ten}</div>}
                        <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>{siSo} HS · Học phí {fmt(l.hocPhi || 0)}đ · Tiền ăn {fmt(l.tienAn || 0)}đ/ngày</div>
                      </div>
                      <div style={{ position: "relative", display: "flex", gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setLopMenu(lopMenu === l.id ? null : l.id)} aria-label="Thêm tác vụ" style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, cursor: "pointer", fontWeight: 800, color: C.sub }}>···</button>
                        {lopMenu === l.id && (
                          <div style={{ position: "absolute", right: 0, top: 42, zIndex: 20, minWidth: 170, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.14)", overflow: "hidden" }}>
                            <button onClick={() => { setLopMenu(null); setRenameLop({ id: l.id, ten: l.ten }); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 14, color: C.ink, fontFamily: font.body }}>Đổi tên lớp</button>
                            {li > 0 && <button onClick={() => { setLopMenu(null); doiViTriLop(l.id, -1); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderTop: `1px solid ${C.line}`, background: "none", cursor: "pointer", fontSize: 14, color: C.ink, fontFamily: font.body }}>↑ Đưa lên trước</button>}
                            {li < clsView.length - 1 && <button onClick={() => { setLopMenu(null); doiViTriLop(l.id, 1); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderTop: `1px solid ${C.line}`, background: "none", cursor: "pointer", fontSize: 14, color: C.ink, fontFamily: font.body }}>↓ Đưa xuống sau</button>}
                            <button onClick={() => { setLopMenu(null); xoaLop(l.id); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", border: "none", borderTop: `1px solid ${C.line}`, background: "none", cursor: "pointer", fontSize: 14, color: C.coralText, fontFamily: font.body }}>Xóa lớp</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {mo && (
                      <div style={{ padding: "0 16px 16px", animation: "cdFade .12s ease-out" }}>
                        {nhom("Các khoản thu thường xuyên", "", "calendarCheck", <>
                          <div>{NHOM1.map((x) => dong(l, x))}</div>
                          <div>{NHOM2.map((x) => dong(l, x))}</div>
                        </>)}
                        {nhom("Các khoản khác", " (ít thu)", "tag", <div>{NHOM3.map((x) => dong(l, x))}</div>)}
                        <div style={{ background: C.graySoft, borderRadius: 14, padding: "12px 14px", marginTop: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: font.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 6 }}><Icon name="plus" size={16} color={C.pine} />Khoản thu thêm<span style={{ fontWeight: 500, color: C.sub }}> (tự đặt tên)</span></div>
                          {(l.khoanThem || []).filter((k) => !(k.ketThuc && k.ketThuc < ym)).map((k) => {
                            const batK = k.bat !== false;
                            const dangSua = suaTenKhoan === `${l.id}:${k.id}` || k.moi;
                            return (
                              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", flexWrap: "wrap" }}>
                                <div style={{ width: 200, flexShrink: 0, minWidth: 0 }}>
                                  {dangSua
                                    ? <input value={k.ten} autoFocus onChange={(e) => suaKhoanThem(l.id, k.id, { ten: e.target.value })} onBlur={() => setSuaTenKhoan(null)} onKeyDown={(e) => { if (e.key === "Enter") setSuaTenKhoan(null); }} placeholder="Tên khoản (VD: Dã ngoại)" style={{ ...inp, width: "100%" }} />
                                    : <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 600 }}>{k.ten || "(chưa đặt tên)"}</span>}
                                  {k.tuThang && k.tuThang > ym && <div style={{ fontSize: 11, color: C.amberText }}>Bắt đầu từ T{k.tuThang.slice(5)}/{k.tuThang.slice(0, 4)}</div>}
                                  {k.ketThuc && k.ketThuc >= ym && <div style={{ fontSize: 11, color: C.amberText }}>Áp đến hết T{k.ketThuc.slice(5)}/{k.ketThuc.slice(0, 4)}</div>}
                                </div>
                                <div style={{ flex: 1, minWidth: 120 }}><NumInput value={k.soTien || 0} disabled={!batK} onChange={(v) => suaKhoanThem(l.id, k.id, { soTien: v })} w={"100%"} /></div>
                                <button onClick={() => suaKhoanThem(l.id, k.id, { bat: !batK })} title="Bấm để đổi: Thu / Tắt" style={{ flexShrink: 0, minWidth: 64, padding: "6px 10px", borderRadius: 99, border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 12.5, background: batK ? C.greenSoft : C.coralSoft, color: batK ? C.greenText : C.coralText }}>{batK ? "✓ Thu" : "✕ Tắt"}</button>
                                <button onClick={() => setSuaTenKhoan(`${l.id}:${k.id}`)} aria-label="Sửa tên khoản" style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer" }}><Icon name="edit" size={16} color={C.sub} /></button>
                                <button onClick={() => xoaKhoanThem(l.id, k.id)} aria-label="Xóa khoản" style={{ width: 32, height: 32, border: "none", background: "none", cursor: "pointer" }}><Icon name="trash" size={16} color={C.coral} /></button>
                              </div>
                            );
                          })}
                          <button onClick={() => themKhoanThem(l.id)} style={{ width: "100%", marginTop: 8, padding: "11px 0", borderRadius: 12, border: "none", background: C.green, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Icon name="plus" size={16} color={C.onFill} /> Thêm khoản thu</button>
                        </div>
                        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 10 }}>Đổi giá hoặc tắt khoản sẽ cập nhật vào tháng đang xem khi bấm Lưu thay đổi (trừ HS đã sửa tay & tháng đã chốt).</div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {(lopDraft || luaFlash) && !hoiApDung && (
              <div style={{ position: "fixed", left: "calc(var(--sb-w, 240px) + 24px)", right: 24, bottom: 16, zIndex: 900, background: luaFlash ? C.greenSoft : C.card, border: `1.5px solid ${luaFlash ? C.green : C.line}`, borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 28px rgba(0,0,0,.16)" }}>
                {luaFlash ? (
                  <span style={{ flex: 1, color: C.greenText, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}><Ii name="check" size={14} /> Đã lưu bảng giá</span>
                ) : (<>
                  <span style={{ flex: 1, color: C.amberText, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}><Ii name="alertTriangle" size={14} /> {demThayDoi()} thay đổi chưa lưu</span>
                  <button onClick={() => setLopDraft(null)} style={{ padding: "10px 24px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Hủy</button>
                  <button onClick={bamLuu} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}><Icon name="save" size={16} color={C.onFill} /> Lưu thay đổi</button>
                </>)}
              </div>
            )}
          </>
        );
      })()}

      {sec === "lop" && !(onlySec && isDesk) && (
        <>
          <style>{`@keyframes cdFade{from{opacity:0}to{opacity:1}}@keyframes cdSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 12, lineHeight: 1.55 }}>Chạm tên lớp để mở/gập bảng giá. Thêm lớp = thêm 1 dòng, mọi tính toán tự nhận lớp mới.</div>
          {clsView.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: C.sub }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}><Ii name="school" size={32} /></div>
              <div style={{ fontSize: 13.5 }}>Chưa có lớp nào. Thêm lớp đầu tiên bên dưới.</div>
            </div>
          )}
          {clsView.map((l, li) => {
            const mo = lopMo === l.id;
            const siSo = students.filter((s) => lopHienTai(s) === l.id && s.trangThai !== "Ra trường").length;
            const kFmt = (n) => n >= 1000000 ? (n / 1000000).toString().replace(/\.0$/, "") + "tr" : Math.round(n / 1000) + "k";
            const ctx = `${siSo} HS · HP ${kFmt(l.hocPhi || 0)} · Ăn ${kFmt(l.tienAn || 0)}/ngày`;
            return (
            <Card key={l.id} style={{ padding: 0, marginBottom: 10, overflow: "hidden" }}>
              <div onClick={() => setLopMo(mo ? null : l.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ color: C.sub, fontSize: 12, transform: mo ? "rotate(90deg)" : "none", transition: "transform .15s" }}><Ii name="chevronRight" size={14} /></span>
                  <ClassAnimal name={l.ten} index={li} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.ten}</div>
                    <div style={{ fontSize: 11.5, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ctx}</div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setRenameLop({ id: l.id, ten: l.ten }); }} style={{ flexShrink: 0, border: "none", background: "none", cursor: "pointer", padding: 4 }}><Icon name="edit" size={16} color={C.sub} /></button>
              </div>
              {mo && (
                <div style={{ padding: "0 14px 14px", animation: "cdFade .12s ease-out" }}>
                  <label style={{ fontSize: 11, color: C.sub, display: "block", marginBottom: 10 }}>Buổi T7 (giá/buổi)
                    <div style={{ marginTop: 4 }}><NumInput lazy value={l.t7 || 0} onChange={(v) => setLopGia(l.id, "t7", v)} w={"100%"} /></div></label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {KHOAN.map((k) => {
                      const mode = khoanMode(l, k.key);
                      const on = mode === "thu";
                      return (
                        <div key={k.key} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                          <label style={{ flex: 1, fontSize: 11, color: C.sub, minWidth: 0 }}>{k.label}
                            <div style={{ marginTop: 3 }}><NumInput lazy value={l[k.key] || 0} disabled={!on} onChange={(v) => setLopGia(l.id, k.key, v)} w={"100%"} /></div></label>
                          <button onClick={() => cycleKhoan(l.id, k.key)} title="Chạm để đổi: Thu / Không thu" style={{ flexShrink: 0, marginBottom: 5, whiteSpace: "nowrap", padding: "5px 10px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, fontFamily: font.body, background: on ? C.greenSoft : C.coralSoft, color: on ? C.greenText : C.coralText }}>{on ? <><Ii name="check" size={13} /> Thu</> : "Tắt"}</button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.sub, marginTop: 8 }}>Đổi giá hoặc tắt khoản sẽ cập nhật vào tháng đang xem khi bấm Lưu (trừ HS đã sửa tay & tháng đã chốt).</div>
                </div>
              )}
            </Card>
            );
          })}
          <div style={{ display: "flex", gap: 8, marginBottom: lopDraft || luaFlash ? 70 : 0 }}>
            <input value={tenLopMoi} onChange={(e) => setTenLopMoi(e.target.value)} placeholder="Tên lớp mới" style={{ ...inp, flex: 1, minWidth: 0 }} />
            <button onClick={themLop} style={{ padding: "0 18px", borderRadius: 12, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Thêm lớp</button>
          </div>
          {(lopDraft || luaFlash) && (
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 900, background: luaFlash ? C.greenSoft : C.card, borderTop: `1.5px solid ${luaFlash ? C.green : C.amber}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 -3px 12px rgba(0,0,0,.08)", animation: "cdSlideUp .18s ease-out" }}>
              {luaFlash ? (
                <span style={{ flex: 1, color: C.greenText, fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}><Ii name="check" size={14} /> Đã lưu bảng giá</span>
              ) : (<>
                <span style={{ flex: 1, color: C.amberText, fontWeight: 700, fontSize: 13.5 }}><Ii name="alertTriangle" size={14} /> {demThayDoi()} thay đổi chưa lưu</span>
                <button onClick={() => setLopDraft(null)} style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Hủy</button>
                <button onClick={bamLuu} style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>Lưu</button>
              </>)}
            </div>
          )}
        </>
      )}

      {sec === "lop" && (<>
          <BottomSheet open={!!renameLop && !(onlySec && isDesk)} onClose={() => setRenameLop(null)} title="Đổi tên lớp">
            {renameLop && <>
              <input value={renameLop.ten} onChange={(e) => setRenameLop({ ...renameLop, ten: e.target.value })} autoFocus style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: font.body, boxSizing: "border-box", marginBottom: 12 }} />
              <button onClick={() => { const t = renameLop.ten.trim(); if (lopDraft) { toast("Lưu hoặc Hủy thay đổi giá đang sửa trước."); setRenameLop(null); return; } if (t) { const base = meta.classes; upMeta({ ...meta, classes: base.map((c) => (c.id === renameLop.id ? { ...c, ten: t } : c)) }); setLopDraft(null); logAction(`Đổi tên lớp → "${t}"`); } setRenameLop(null); }} style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Lưu tên</button>
            </>}
          </BottomSheet>
      </>)}

      {sec === "lop" && (
        <HoiBox open={hoiApDung} onClose={() => setHoiApDung(false)} title="Lưu thay đổi cho lớp">
          {(() => {
            const ds = tomTatDoi();
            const m1 = `${ym.slice(5)}/${ym.slice(0, 4)}`, m2 = `${ymNext(ym).slice(5)}/${ymNext(ym).slice(0, 4)}`;
            return (<>
              <div style={{ background: C.graySoft, borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
                {ds.slice(0, 5).map((s, i) => <div key={i} style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.75 }}>{s}</div>)}
                {ds.length > 5 && <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>… và {ds.length - 5} thay đổi khác</div>}
              </div>
              <div style={{ fontSize: 14.5, color: C.ink, fontWeight: 700, marginBottom: 6 }}>Áp dụng từ khi nào?</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.65, marginBottom: 18 }}>
                <div><b style={{ color: C.ink }}>Áp dụng ngay</b> — từ {m1}, hóa đơn tháng này được cập nhật (trừ em đã sửa tay).</div>
                <div><b style={{ color: C.ink }}>Từ tháng sau</b> — từ {m2}, hóa đơn tháng này giữ nguyên.</div>
                <div style={{ marginTop: 4 }}>Tháng đã chốt không bị thay đổi.</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={() => setHoiApDung(false)} style={{ flex: 1 }}>Hủy</Button>
                <Button onClick={() => luuLop(false)} style={{ flex: 1.3 }}>Từ tháng sau</Button>
                <Button variant="primary" onClick={() => luuLop(true)} style={{ flex: 1.3 }}>Áp dụng ngay</Button>
              </div>
            </>);
          })()}
        </HoiBox>
      )}

      {sec === "gv" && (
        <>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12 }}>Mỗi giáo viên có 1 PIN + 1 lớp. Khi đăng nhập bằng PIN, GV chỉ điểm danh lớp được giao (không thấy tiền, không đặt ngày lễ).</div>
          {(meta.giaoVien || []).map((gv) => (
            <Card key={gv.id} style={{ marginBottom: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{gv.ten}</div>
                <div style={{ fontSize: 12, color: C.sub }}>
                  PIN: <b style={{ color: C.ink, fontFamily: "monospace" }}>{showPinId === gv.id ? gv.pin : "••••"}</b>
                  <button onClick={() => setShowPinId(showPinId === gv.id ? null : gv.id)} style={{ marginLeft: 6, padding: "1px 8px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.sub, fontSize: 11, cursor: "pointer" }}>{showPinId === gv.id ? "Ẩn" : "Hiện"}</button>
                  {" "}· Lớp: {meta.classes.find((c) => c.id === gv.lopId)?.ten || "?"}
                </div>
              </div>
              <button onClick={() => xoaGV(gv.id)} style={{ color: C.coralText, border: "none", background: "none", cursor: "pointer", display:"inline-flex", alignItems:"center" }}><Icon name="trash" size={16} color={C.coral} /></button>
            </Card>
          ))}
          {(meta.giaoVien || []).length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: C.sub }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}><Ii name="graduationCap" size={32} /></div>
              <div style={{ fontSize: 13.5 }}>Chưa có giáo viên. Thêm bên dưới để cấp quyền điểm danh.</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <input value={gvTen} onChange={(e) => setGvTen(e.target.value)} placeholder="Tên GV" style={{ ...inp, flex: "2 1 120px", minWidth: 0 }} />
            <input value={gvPin} onChange={(e) => setGvPin(e.target.value)} placeholder="PIN" inputMode="numeric" style={{ ...inp, flex: "1 1 70px", width: 80, minWidth: 0 }} />
            <select value={gvLop} onChange={(e) => setGvLop(e.target.value)} style={{ ...inp, flex: "1 1 100px" }}>{meta.classes.map((c) => <option key={c.id} value={c.id}>{c.ten}</option>)}</select>
            <button onClick={themGV} style={{ padding: "0 16px", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontWeight: 700, cursor: "pointer" }}>+ Thêm</button>
          </div>
        </>
      )}

      {sec === "bank" && (
        <>
          <input value={meta.tenTruong} onChange={(e) => upMeta({ ...meta, tenTruong: e.target.value })} placeholder="Tên trường" style={{ ...inp, width: "100%", marginBottom: 12, fontFamily: font.display, fontWeight: 700 }} />
          {["A", "B"].map((p) => (
            <Card key={p} style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
              <div style={{ background: p === "A" ? C.blueASoft : C.violetBSoft, padding: "9px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="users" size={16} color={p === "A" ? C.blueA : C.violetB} />
                <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 14.5, color: p === "A" ? C.blueAText : C.violetBText }}>Người thu {p}</span>
                <span style={{ fontSize: 11, color: C.sub }}>· in lên phiếu</span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                {[["Chủ TK", "chu"], ["Số TK", "stk"], ["Ngân hàng", "nh"]].map(([lb, k]) => (<label key={k} style={{ fontSize: 12, color: C.sub, display: "block", marginBottom: 7 }}>{lb}<input value={meta.bank[p][k]} onChange={(e) => setBank(p, k, e.target.value)} style={{ ...inp, width: "100%", marginTop: 3 }} /></label>))}
              </div>
            </Card>
          ))}
        </>
      )}

      {sec === "dk" && (
        <Card>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>Số dư đầu kỳ (tiền & nợ nội bộ)</div>
          <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>A nợ B và B nợ A không cùng &gt; 0 (cấn trừ trước). Nợ học phí đầu kỳ của từng HS nhập ở thẻ HS.</div>
          {[["Tiền mặt A đang giữ", "tienMatA"], ["Tiền mặt B đang giữ", "tienMatB"], ["A nợ B", "AnoB"], ["B nợ A", "BnoA"]].map(([lb, k]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.line}` }}><span style={{ fontSize: 13.5, color: C.sub }}>{lb}</span><NumInput lazy value={(meta.soDuDauKy || {})[k] || 0} onChange={(v) => setDK(k, v)} w={130} /></div>
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
                style={{ marginTop: 4, padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.coralText, fontFamily: font.body, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
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
              <button onClick={confirmChange} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontFamily: font.body, fontWeight: 700, fontSize: 13.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="check" size={15} color={C.onFill} /> Xác nhận
              </button>
            </div>
          )}
        </Card>
      )}
      {sec === "baomat" && <><DoiPin /><PhienThietBi /></>}

      {sec === "thuphi" && <ThuPhiCaiDat meta={meta} upMeta={upMeta} />}

      {sec === "backup" && <BackupExport meta={meta} students={students} />}
      {sec === "log" && <AuditLog />}

      {sec === "data" && (
        <>
        <AuditWipeBadge />
        <Card>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Khôi phục bản trước thao tác</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 12, lineHeight: 1.5 }}>App tự chụp 1 bản NGAY TRƯỚC mỗi thao tác nguy hiểm (xóa sạch, xóa bảng thu, phục hồi). Lỡ tay thì bấm đây để quay lại bản đó.</div>
          <button onClick={async () => { await khoiPhucTruoc(); }} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: `1.5px solid ${C.pine}`, background: C.pineSoft, color: C.pine, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>↩ Khôi phục bản tự lưu gần nhất</button>
        </Card>
        <Card>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>Xóa sạch & bắt đầu lại</div>
          <div style={{ fontSize: 12.5, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>Đưa app về trạng thái mới: giữ 6 lớp + đơn giá + tài khoản + giáo viên mẫu (PIN giữ nguyên), nhưng <b style={{ color: C.coralText }}>xóa toàn bộ học sinh, điểm danh và các tháng đã nhập.</b> Dùng khi muốn làm lại từ đầu.</div>
          <div style={{ fontSize: 12.5, color: C.ink, marginBottom: 6 }}>Để xác nhận, gõ <b>XOA HET</b> vào ô dưới:</div>
          <input value={resetText} onChange={(e) => setResetText(e.target.value)} placeholder="XOA HET" style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: font.body, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
          <button disabled={resetText.trim().toUpperCase() !== "XOA HET"} onClick={async () => { if (await ask("Xóa TOÀN BỘ học sinh + điểm danh + các tháng, đưa về trạng thái mới?\n⚠️ Không hoàn tác. Nên Sao lưu trước.", { danger: true, okText: "Xóa sạch" })) { const ok = await reseedAll(); if (ok) { setResetText(""); toast("Đã xóa sạch. Bắt đầu thêm học sinh ở tab Học sinh."); } } }} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: `1.5px solid ${C.coral}`, background: resetText.trim().toUpperCase() === "XOA HET" ? C.coral : C.coralSoft, color: resetText.trim().toUpperCase() === "XOA HET" ? C.onFill : C.coralText, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: resetText.trim().toUpperCase() === "XOA HET" ? "pointer" : "default" }}>↻ Xóa sạch & bắt đầu lại</button>
        </Card>
        </>
      )}
    </>
  );
}

// ===== Đổi mã PIN quản lý =====
function DoiPin() {
  const [cu, setCu] = useState(""); const [m1, setM1] = useState(""); const [m2, setM2] = useState("");
  const [busy, setBusy] = useState(false);
  const inp = { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: font.body, boxSizing: "border-box", letterSpacing: 3, textAlign: "center" };
  const doi = async () => {
    if (busy) return;
    const c = cu.trim(), a = m1.trim(), b = m2.trim();
    if (!/^\d{6,}$/.test(a)) { toast("PIN mới tối thiểu 6 chữ số"); return; }
    if (a !== b) { toast("Hai lần nhập PIN mới không khớp"); return; }
    if (a === c) { toast("PIN mới phải khác PIN cũ"); return; }
    setBusy(true);
    try {
      const [hashCu, hashLuu] = await Promise.all([sha256Hex(c), getPinHash()]);
      if (hashCu !== hashLuu) { toast("PIN cũ không đúng"); setBusy(false); return; }
      await setPinHash(await sha256Hex(a));
      logAction("Đổi mã PIN quản lý");
      setCu(""); setM1(""); setM2("");
      toast("Đã đổi PIN. Dùng PIN mới từ lần đăng nhập sau.");
    } catch { toast("Không lưu được — kiểm tra mạng rồi thử lại."); }
    setBusy(false);
  };
  return (
    <Card>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="lock" size={16} color={C.pine} /> Đổi mã PIN quản lý</div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>PIN dùng để vào vai trò Quản lý. Nên đặt <b>tối thiểu 6 chữ số</b>, không dùng ngày sinh dễ đoán. PIN được lưu dạng mã hóa một chiều — không ai (kể cả app) đọc lại được chữ gốc.</div>
      <div style={{ display: "grid", gap: 10, maxWidth: 320 }}>
        <div><div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginBottom: 3 }}>PIN hiện tại</div><input type="password" inputMode="numeric" value={cu} onChange={(e) => setCu(e.target.value)} style={inp} /></div>
        <div><div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginBottom: 3 }}>PIN mới (≥ 6 số)</div><input type="password" inputMode="numeric" value={m1} onChange={(e) => setM1(e.target.value)} style={inp} /></div>
        <div><div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginBottom: 3 }}>Nhập lại PIN mới</div><input type="password" inputMode="numeric" value={m2} onChange={(e) => setM2(e.target.value)} style={inp} /></div>
        <button onClick={doi} disabled={busy} style={{ padding: "11px 0", borderRadius: 10, border: "none", background: busy ? C.graySoft : C.pine, color: busy ? C.sub : C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14.5, cursor: busy ? "default" : "pointer" }}>{busy ? "Đang lưu…" : "🔐 Đổi PIN"}</button>
      </div>
    </Card>
  );
}

// ===== Phiên đăng nhập thiết bị (Supabase Auth) =====
function PhienThietBi() {
  const email = getSbEmail();
  const logoutThis = async () => {
    if (!(await ask("Đăng xuất khỏi thiết bị này?\nLần mở sau sẽ phải nhập lại email + mật khẩu tài khoản của trường.", { okText: "Đăng xuất" }))) return;
    await sbSignOut("local");
    location.reload();
  };
  const logoutOthers = async () => {
    if (!(await ask("Đăng xuất TẤT CẢ máy khác đang dùng tài khoản này?\n\nMáy này vẫn đăng nhập bình thường. Các máy khác sẽ bị đẩy ra đăng nhập lại trong vòng ~1 giờ (không tức thì).", { okText: "Đăng xuất máy khác", danger: true }))) return;
    await sbSignOut("others");
    toast("Đã yêu cầu đăng xuất các máy khác.");
  };
  return (
    <Card>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="lock" size={16} color={C.pine} /> Phiên đăng nhập thiết bị</div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>Đang đăng nhập bằng: <b style={{ color: C.ink }}>{email || "—"}</b>. Mỗi máy nhập tài khoản 1 lần rồi được nhớ.</div>
      <div style={{ display: "grid", gap: 10, maxWidth: 340 }}>
        <button onClick={logoutThis} style={{ padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.line}`, background: C.card, color: C.ink, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Đăng xuất khỏi thiết bị này</button>
        <button onClick={logoutOthers} style={{ padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.coral}`, background: C.coralSoft, color: C.coralText, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Đăng xuất tất cả máy khác</button>
        <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}><Ii name="alertTriangle" size={14} /> "Máy khác" bị đẩy ra trong khoảng ~1 giờ (khi token hết hạn), không tức thì.</div>
      </div>
    </Card>
  );
}
function ThuPhiCaiDat({ meta, upMeta }) {
  const [hd, setHd] = useState(meta?.hanDong || "");
  useEffect(() => { setHd(meta?.hanDong || ""); }, [meta?.hanDong]);
  const luu = () => { const v = hd.trim(); if (v === (meta?.hanDong || "")) return; upMeta({ ...meta, hanDong: v }); toast(v ? "Đã lưu hạn đóng" : "Đã bỏ hạn đóng"); };
  return (
    <Card>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, marginBottom: 4, display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name="calendarCheck" size={16} color={C.pine} /> Thu học phí</div>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>Thiết lập chung cho việc thu học phí. Hạn đóng sẽ tự chèn vào tin nhắc Zalo (để trống = không ghi hạn).</div>
      <div style={{ maxWidth: 340 }}>
        <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginBottom: 3 }}>Hạn đóng học phí</div>
        <input value={hd} onChange={(e) => setHd(e.target.value)} onBlur={luu} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} placeholder="VD: trước ngày 10 hàng tháng" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13.5, fontFamily: font.body, boxSizing: "border-box" }} />
        <div style={{ fontSize: 11, color: C.sub, marginTop: 5 }}>Tin nhắc sẽ thành: "…hoàn thành giúp nhà trường <b>{hd.trim() || "(không ghi hạn)"}</b>."</div>
      </div>
    </Card>
  );
}
