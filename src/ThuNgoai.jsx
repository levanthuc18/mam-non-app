// ThuNgoai.jsx — Thu ngoài (khoản thu không phải học sinh) + Khoản thu theo lớp.
// Tách từ ThuPhi.jsx để sửa 2 nghiệp vụ này không phải mở file thu phí chính.
import { useState, useRef } from "react";
import { C, font, fmt, uid, toast, hoiXoa, baoDaXoa, logAction } from "./lib.js";
import { Card, ABBtn, NumInput, Segmented } from "./ui.jsx";
import { Icon, Ii } from "./Icon.jsx";

function ThuNgoaiItem({ k, locked, set, del }) {
  const conNo = k.soTien - k.thucThu;
  const isChuaThu = k.thucThu === 0 && k.soTien > 0;
  const isThieu = k.thucThu > 0 && conNo > 0;
  const isDu = conNo <= 0 && k.soTien > 0;

  let statusColor = C.coral, statusText = "CHƯA THU";
  if (isThieu) { statusColor = C.amber; statusText = "THU THIẾU"; }
  else if (isDu) { statusColor = C.green; statusText = "ĐÃ THU ĐỦ"; }

  const borderLeftColor = isChuaThu || isThieu ? C.coral : C.green;

  return (
    <div style={{
      backgroundColor: C.card,
      borderRadius: C.r,
      padding: "10px 14px",
      marginBottom: 10,
      borderLeft: `5px solid ${borderLeftColor}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.ten}</span>
            {k.coDinh && <span style={{ fontSize: 10, fontWeight: 700, color: C.blueAText, background: C.blueASoft, display:"inline-flex", alignItems:"center", gap:3, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}><Icon name="refresh" size={10} color={C.blueA} /> Cố định</span>}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>Phải thu: {fmt(k.soTien)}đ</div>
        </div>
        {!locked && (
          <button onClick={() => del(k.id)} style={{ color: C.coralText, border: "none", background: "none", display:"inline-flex", alignItems:"center", cursor: "pointer", padding: 4, fontSize: 16, flexShrink: 0 }}><Icon name="trash" size={15} color={C.coral} /></button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: statusColor, display:"flex", alignItems:"center", gap:6 }}><span style={{width:8,height:8,borderRadius:99,background:statusColor,flexShrink:0}} />{statusText}</div>
          {isThieu && <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Còn thiếu: {fmt(conNo)}đ</div>}
        </div>
        
        {!locked ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <ABBtn val={k.nguoiThu} set={(p) => set(k.id, { nguoiThu: p })} small disabled={locked} />
            <NumInput lazy value={k.thucThu} onChange={(v) => set(k.id, { thucThu: v })} w={100} disabled={locked} />
            <button 
              onClick={() => set(k.id, { thucThu: k.soTien })} 
              style={{ background: C.green, color: C.onFill, border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Thu đủ"
            ><Ii name="check" size={14} /></button>
          </div>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{fmt(k.thucThu)}đ</div>
        )}
      </div>
    </div>
  );
}

// ===== Máy tính: khối "Thu ngoài" cùng kiểu các khối khác (thẻ trắng, tiêu đề + thẻ đếm, 1 hàng thêm nhanh) =====
const BO = "color-mix(in srgb, var(--c-pine) 16%, var(--c-card))";
function ThuNgoaiDesk({ tn, locked, set, del, add, ten, setTen, so, setSo, coDinh, setCoDinh }) {
  const tongPT = tn.reduce((a, k) => a + (Number(k.soTien) || 0), 0), tongDa = tn.reduce((a, k) => a + (Number(k.thucThu) || 0), 0);
  const inp = { padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontFamily: font.body, fontSize: 14, outline: "none", minWidth: 0 };
  const seg = (on) => ({ padding: "9px 14px", border: "none", cursor: "pointer", fontFamily: font.body, fontWeight: 700, fontSize: 13.5, background: on ? BO : "transparent", color: on ? C.pine : C.sub, whiteSpace: "nowrap" });
  return (
    <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: BO, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="droplet" size={22} color={C.pine} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, color: C.ink }}>Thu ngoài</div>
          <div style={{ fontSize: 13, color: C.sub }}>Khoản thu riêng ngoài các khoản phí hàng tháng</div>
        </div>
        {tn.length > 0 && <span style={{ fontSize: 13, color: C.sub }}>Phải thu <b style={{ color: C.ink }}>{fmt(tongPT)}đ</b> · Đã thu <b style={{ color: C.greenText }}>{fmt(tongDa)}đ</b></span>}
        <span style={{ background: BO, color: C.pine, borderRadius: 99, padding: "3px 12px", fontWeight: 800, fontSize: 13 }}>{tn.length} khoản</span>
      </div>

      {tn.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: C.graySoft, borderRadius: 12, color: C.sub, fontSize: 14, marginBottom: 12 }}>
          <Icon name="x" size={14} color={C.sub} /> Chưa có khoản thu ngoài nào
        </div>
      ) : (
        <div style={{ marginBottom: 12, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
          {tn.map((k, i) => {
            const conNo = k.soTien - k.thucThu;
            const du = conNo <= 0 && k.soTien > 0, thieu = k.thucThu > 0 && conNo > 0;
            const [tt, bg, fg] = du ? ["Đã thu đủ", C.greenSoft, C.greenText] : thieu ? ["Thu thiếu", C.amberSoft, C.amberText] : ["Chưa thu", C.coralSoft, C.coralText];
            return (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: i ? `1px solid ${C.line}` : "none", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.ten}</span>
                    {k.coDinh && <span style={{ fontSize: 11, fontWeight: 700, color: C.blueAText, background: C.blueASoft, padding: "2px 8px", borderRadius: 99, flexShrink: 0 }}>Cố định</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.sub }}>Phải thu {fmt(k.soTien)}đ{thieu ? ` · còn thiếu ${fmt(conNo)}đ` : ""}</div>
                </div>
                <span style={{ background: bg, color: fg, borderRadius: 99, padding: "3px 10px", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{tt}</span>
                {!locked ? (
                  <>
                    <ABBtn val={k.nguoiThu} set={(p) => set(k.id, { nguoiThu: p })} small />
                    <NumInput lazy value={k.thucThu} onChange={(v) => set(k.id, { thucThu: v })} w={120} />
                    <button onClick={() => set(k.id, { thucThu: k.soTien })} title="Thu đủ" style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: C.pine, color: C.onFill, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: font.body }}>Thu đủ</button>
                    <button onClick={() => del(k.id)} title="Xóa khoản" style={{ border: `1px solid ${C.line}`, background: C.card, borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="trash" size={16} color={C.coral} /></button>
                  </>
                ) : <b style={{ color: C.ink }}>{fmt(k.thucThu)}đ</b>}
              </div>
            );
          })}
        </div>
      )}

      {!locked && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={ten} onChange={(e) => setTen(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="Tên khoản thu · ví dụ: Quỹ CSVC" style={{ ...inp, flex: "3 1 260px" }} />
          <input value={so ? Number(so).toLocaleString("vi-VN") : ""} onChange={(e) => setSo(e.target.value.replace(/[^\d]/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") add(); }} inputMode="numeric" placeholder="Số tiền (đ)" style={{ ...inp, flex: "1 1 140px", textAlign: "right" }} />
          <Segmented value={coDinh ? "cd" : "kcd"} onChange={(k) => setCoDinh(k === "cd")} items={[["kcd", "Không cố định"], ["cd", "Cố định", "refresh"]]} />
          <button onClick={add} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, border: "none", background: C.pine, color: C.onFill, fontFamily: font.display, fontWeight: 700, fontSize: 14, cursor: "pointer" }}><Icon name="plus" size={16} color={C.onFill} /> Thêm</button>
        </div>
      )}
    </div>
  );
}

export function ThuNgoai({ mData, upMData, locked, desk }) {
  const tn = mData.thuNgoai || [];
  const [ten, setTen] = useState(""); 
  const [so, setSo] = useState("");
  const [coDinh, setCoDinh] = useState(false); // State cho khoản cố định

  const add = () => { 
    if (!ten.trim()) return; 
    upMData({ 
      ...mData, 
      thuNgoai: [...tn, { id: uid(), ten: ten.trim(), soTien: Number(so) || 0, thucThu: 0, nguoiThu: "A", coDinh }] 
    }); 
    setTen(""); 
    setSo(""); 
    setCoDinh(false);
  };
  
  const set = (id, p) => upMData({ ...mData, thuNgoai: tn.map((k) => (k.id === id ? { ...k, ...p } : k)) });
  const del = async (id) => {
    const k = tn.find((x) => x.id === id); if (!k) return;
    const ghiChu = (Number(k.thucThu) || 0) > 0 ? `Khoản này đã thu ${fmt(Number(k.thucThu))}đ.` : "";
    if (!(await hoiXoa(`khoản thu ngoài "${k.ten}"`, ghiChu))) return;
    const conLai = tn.filter((x) => x.id !== id);
    upMData({ ...mData, thuNgoai: conLai });
    logAction(`Xóa khoản thu ngoài "${k.ten}"`);
    baoDaXoa("khoản thu ngoài", () => upMData({ ...mData, thuNgoai: [...conLai, k] }));
  };
  
  if (desk) return <ThuNgoaiDesk tn={tn} locked={locked} set={set} del={del} add={add} ten={ten} setTen={setTen} so={so} setSo={setSo} coDinh={coDinh} setCoDinh={setCoDinh} />;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}><Icon name="droplet" size={14} color={C.blueA} /> Thu ngoài</span>
      </div>
      
      {tn.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: C.sub, fontSize: 13, background: C.card, border: `1.5px dashed ${C.line}`, borderRadius: C.r, marginBottom: 10 }}>
          Chưa có khoản thu ngoài nào.
        </div>
      )}

      {tn.map((k) => (
        <ThuNgoaiItem key={k.id} k={k} locked={locked} set={set} del={del} />
      ))}

      {!locked && (
        <div style={{
          background: C.card,
          border: `1.5px dashed ${C.line}`,
          borderRadius: C.r,
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input 
              value={ten} 
              onChange={(e) => setTen(e.target.value)} 
              placeholder="Tên khoản (VD: Quỹ CSVC)" 
              style={{ flex: "2 1 150px", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, outline: "none" }} 
            />
            <input 
              type="number" 
              value={so} 
              onChange={(e) => setSo(e.target.value)} 
              placeholder="Số tiền" 
              style={{ flex: "1 1 100px", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, outline: "none" }} 
            />
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Segmented small value={coDinh ? "cd" : "kcd"} onChange={(k) => setCoDinh(k === "cd")} items={[["kcd", "Không cố định"], ["cd", "Cố định", "refresh"]]} />
            
            <button 
              onClick={add} 
              style={{ flex: "1 1 80px", background: C.pine, color: C.onFill, fontWeight: 700, fontSize: 13, padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer" }}
            >+ Thêm</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function KhoanThuLop({ mData, upMData, locked, classes, rows, lopFilter }) {
  if (locked) return null;
  const [ten, setTen] = useState(""); const [so, setSo] = useState("");
  const [coDinh, setCoDinh] = useState(false);
  const [lopAp, setLopAp] = useState(lopFilter !== "all" ? lopFilter : (classes[0]?.id || ""));
  const applying = useRef(false);
  const targets = rows.filter((r) => r.lopId === lopAp);
  const apply = () => {
    if (applying.current) return;                              // chống bấm 2 lần → cộng khoản gấp đôi
    if (!ten.trim() || !so || !lopAp) return;
    if (Number(so) <= 0) { toast("Số tiền phải lớn hơn 0."); return; }
    const ids = targets.map((r) => r.hs.id);
    if (ids.length === 0) { toast("Lớp này chưa có HS trong tháng."); return; }
    applying.current = true;
    const fees = { ...mData.fees };
    ids.forEach((sid) => {
      const cur = fees[sid]; if (!cur) return;
      fees[sid] = { ...cur, phuThu: [...(cur.phuThu || []), { id: uid(), ten: ten.trim() + (coDinh ? " (cố định)" : ""), soTien: Number(so), lop: lopAp, coDinh }] };
    });
    upMData({ ...mData, fees });
    setTen(""); setSo("");
    toast(`Đã thêm "${ten.trim()}" cho ${ids.length} HS lớp ${classes.find((c) => c.id === lopAp)?.ten}.`);
    setTimeout(() => { applying.current = false; }, 700);
  };
  return (
    <Card style={{ marginTop: 10, background: C.blueASoft, borderColor: C.line }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4, display:"inline-flex", alignItems:"center", gap:6, color: C.blueAText }}><Icon name="plus" size={15} color={C.pine} /> Khoản thu áp cho cả lớp</div>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8 }}>Chọn lớp + nhập khoản → cộng vào mọi HS lớp đó tháng này. <b>Cố định</b> = khoản lặp hàng tháng; <b>không cố định</b> = chỉ tháng này. Sửa/xóa lẻ ở thẻ HS.</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        <select value={lopAp} onChange={(e) => setLopAp(e.target.value)} style={{ flex: "1 1 120px", padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, background: C.card }}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.ten} ({rows.filter((r) => r.lopId === c.id).length} HS)</option>)}
        </select>
        <Segmented small value={coDinh ? "cd" : "kcd"} onChange={(k) => setCoDinh(k === "cd")} items={[["kcd", "Không cố định"], ["cd", "Cố định"]]} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên khoản (VD: Dã ngoại / Đầu năm)" style={{ flex: "2 1 150px", padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
        <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 90px", padding: "9px 10px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
        <button onClick={apply} style={{ background: C.blueA, color: C.onFill, fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 10, border: "none", cursor: "pointer" }}>Áp dụng</button>
      </div>
    </Card>
  );
}
