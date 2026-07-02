// ThuNgoai.jsx — Thu ngoài (khoản thu không phải học sinh) + Khoản thu theo lớp.
// Tách từ ThuPhi.jsx để sửa 2 nghiệp vụ này không phải mở file thu phí chính.
import { useState } from "react";
import { C, font, fmt, uid, toast } from "./lib.js";
import { Card, ABBtn, NumInput } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

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
            {k.coDinh && <span style={{ fontSize: 10, fontWeight: 700, color: C.blueA, background: C.blueASoft, display:"inline-flex", alignItems:"center", gap:3, padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}><Icon name="refresh" size={10} color={C.blueA} /> Cố định</span>}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2 }}>Phải thu: {fmt(k.soTien)}đ</div>
        </div>
        {!locked && (
          <button onClick={() => del(k.id)} style={{ color: C.coral, border: "none", background: "none", display:"inline-flex", alignItems:"center", cursor: "pointer", padding: 4, fontSize: 16, flexShrink: 0 }}><Icon name="trash" size={15} color={C.coral} /></button>
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
            <NumInput value={k.thucThu} onChange={(v) => set(k.id, { thucThu: v })} w={100} disabled={locked} />
            <button 
              onClick={() => set(k.id, { thucThu: k.soTien })} 
              style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 14, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Thu đủ"
            >✓</button>
          </div>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{fmt(k.thucThu)}đ</div>
        )}
      </div>
    </div>
  );
}

export function ThuNgoai({ mData, upMData, locked }) {
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
  const del = (id) => upMData({ ...mData, thuNgoai: tn.filter((k) => k.id !== id) });
  
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5}}><Icon name="droplet" size={14} color={C.blueA} /> Thu ngoài (KV4)</span>
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
              style={{ flex: "2 1 150px", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, outline: "none" }} 
            />
            <input 
              type="number" 
              value={so} 
              onChange={(e) => setSo(e.target.value)} 
              placeholder="Số tiền" 
              style={{ flex: "1 1 100px", padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, outline: "none" }} 
            />
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.line}` }}>
              <button onClick={() => setCoDinh(false)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: !coDinh ? C.pine : C.card, color: !coDinh ? "#fff" : C.sub, fontFamily: font.body }}>Không cố định</button>
              <button onClick={() => setCoDinh(true)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: coDinh ? C.pine : C.card, color: coDinh ? "#fff" : C.sub, fontFamily: font.body }}><span style={{display:"inline-flex",alignItems:"center",gap:5}}><Icon name="refresh" size={13} color="currentColor" /> Cố định</span></button>
            </div>
            
            <button 
              onClick={add} 
              style={{ flex: "1 1 80px", background: C.pine, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}
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
  const targets = rows.filter((r) => r.lopId === lopAp);
  const apply = () => {
    if (!ten.trim() || !so || !lopAp) return;
    const ids = targets.map((r) => r.hs.id);
    if (ids.length === 0) { toast("Lớp này chưa có HS trong tháng."); return; }
    const fees = { ...mData.fees };
    ids.forEach((sid) => {
      const cur = fees[sid]; if (!cur) return;
      fees[sid] = { ...cur, phuThu: [...(cur.phuThu || []), { id: uid(), ten: ten.trim() + (coDinh ? " (cố định)" : ""), soTien: Number(so), lop: lopAp, coDinh }] };
    });
    upMData({ ...mData, fees });
    setTen(""); setSo("");
    toast(`Đã thêm "${ten.trim()}" cho ${ids.length} HS lớp ${classes.find((c) => c.id === lopAp)?.ten}.`);
  };
  return (
    <Card style={{ marginTop: 10, background: C.blueASoft, borderColor: C.line }}>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, marginBottom: 4, display:"inline-flex", alignItems:"center", gap:6, color: C.blueA }}><Icon name="plus" size={15} color={C.pine} /> Khoản thu áp cho cả lớp</div>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8 }}>Chọn lớp + nhập khoản → cộng vào mọi HS lớp đó tháng này. <b>Cố định</b> = khoản lặp hàng tháng; <b>không cố định</b> = chỉ tháng này. Sửa/xóa lẻ ở thẻ HS.</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
        <select value={lopAp} onChange={(e) => setLopAp(e.target.value)} style={{ flex: "1 1 120px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body, background: C.card }}>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.ten} ({rows.filter((r) => r.lopId === c.id).length} HS)</option>)}
        </select>
        <div style={{ display: "inline-flex", borderRadius: 9, overflow: "hidden", border: `1.5px solid ${C.line}` }}>
          <button onClick={() => setCoDinh(false)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: !coDinh ? C.blueA : C.card, color: !coDinh ? "#fff" : C.sub, fontFamily: font.body }}>Không cố định</button>
          <button onClick={() => setCoDinh(true)} style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", background: coDinh ? C.blueA : C.card, color: coDinh ? "#fff" : C.sub, fontFamily: font.body }}>Cố định</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Tên khoản (VD: Dã ngoại / Đầu năm)" style={{ flex: "2 1 150px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
        <input type="number" value={so} onChange={(e) => setSo(e.target.value)} placeholder="Số tiền" style={{ flex: "1 1 90px", padding: "9px 10px", borderRadius: 9, border: `1.5px solid ${C.line}`, fontSize: 13, minWidth: 0, fontFamily: font.body }} />
        <button onClick={apply} style={{ background: C.blueA, color: "#fff", fontWeight: 700, fontSize: 13, padding: "9px 14px", borderRadius: 9, border: "none", cursor: "pointer" }}>Áp dụng</button>
      </div>
    </Card>
  );
}

