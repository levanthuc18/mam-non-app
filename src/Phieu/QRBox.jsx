import { useState, useEffect } from "react";
import { C, binOf } from "../lib.js";

export function QRBox({ bank, amount, noiDung }) {
  const bin = binOf(bank?.nh);
  const [err, setErr] = useState(false);
  const [noCors, setNoCors] = useState(false);
  const [dataUrl, setDataUrl] = useState("");

  const url = (bin && bank?.stk)
    ? `https://img.vietqr.io/image/${bin}-${bank.stk}-compact.png?` +
      (amount > 0 ? `amount=${Math.round(amount)}&` : "") +
      `addInfo=${encodeURIComponent(noiDung || "")}`
    : "";

  // Khi đổi URL -> reset để tải lại từ đầu (ưu tiên crossOrigin)
  useEffect(() => { setErr(false); setNoCors(false); setDataUrl(""); }, [url]);

  // Khi ảnh QR (chế độ crossOrigin) tải xong -> vẽ vào canvas -> data-URL (ảnh nội bộ, chụp được chắc chắn)
  const onLoad = (e) => {
    if (dataUrl || noCors) return;
    try {
      const img = e.target;
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth || 200;
      cv.height = img.naturalHeight || 200;
      cv.getContext("2d").drawImage(img, 0, 0);
      setDataUrl(cv.toDataURL("image/png"));
    } catch {
      /* nếu vẫn bị nhiễm thì giữ nguyên ảnh crossOrigin, html-to-image vẫn thử được */
    }
  };

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

  return (
    <img
      key={dataUrl ? "data" : noCors ? "plain" : "cors"}
      src={dataUrl || url}
      alt="QR chuyển khoản"
      {...(dataUrl || noCors ? {} : { crossOrigin: "anonymous" })}
      onLoad={onLoad}
      onError={() => { if (!noCors && !dataUrl) setNoCors(true); else if (!dataUrl) setErr(true); }}
      style={{
        width: 88, height: 88, borderRadius: 8, background: "#fff",
        border: `1.5px solid ${C.pine}`, flexShrink: 0, objectFit: "contain"
      }}
    />
  );
}
