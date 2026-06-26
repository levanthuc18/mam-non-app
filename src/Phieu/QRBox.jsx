import { useState } from "react";
import { C, binOf } from "../lib.js";

export function QRBox({ bank, amount, noiDung }) {
  const bin = binOf(bank?.nh);
  const [err, setErr] = useState(false);
  
  if (!bin || !bank?.stk || err) {
    return (
      <div style={{ 
        width: 88, height: 88, borderRadius: 8, background: "#fff", 
        border: `1.5px solid ${C.pine}`, display: "flex", alignItems: "center", 
        justifyContent: "center", fontSize: 10, color: C.sub, textAlign: "center", 
        flexShrink: 0, padding: 4 
      }}>
        {bin ? "QR" : "QR (ngân hàng chưa hỗ trợ)"}
      </div>
    );
  }
  
  const url = `https://img.vietqr.io/image/${bin}-${bank.stk}-compact.png?` + 
    (amount > 0 ? `amount=${Math.round(amount)}&` : "") + 
    `addInfo=${encodeURIComponent(noiDung || "")}`;
    
  return (
    <img 
      src={url} 
      alt="QR chuyển khoản" 
      onError={() => setErr(true)} 
      style={{ 
        width: 88, height: 88, borderRadius: 8, background: "#fff", 
        border: `1.5px solid ${C.pine}`, flexShrink: 0, objectFit: "contain" 
      }} 
    />
  );
}
