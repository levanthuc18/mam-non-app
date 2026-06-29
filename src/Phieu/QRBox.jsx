import { useState, useEffect } from "react";
import { C, binOf, buildVietQR } from "../lib.js";
import QRCode from "qrcode/lib/browser.js";

export function QRBox({ bank, amount, noiDung }) {
  const bin = binOf(bank?.nh);
  const [dataUrl, setDataUrl] = useState("");
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!bin || !bank?.stk) return;
    let alive = true;
    setErr(false);
    try {
      const payload = buildVietQR({ bin, accountNo: bank.stk, amount, addInfo: noiDung });
      QRCode.toDataURL(payload, { margin: 2, width: 240, errorCorrectionLevel: "M" })
        .then((u) => { if (alive) setDataUrl(u); })
        .catch(() => { if (alive) setErr(true); });
    } catch { setErr(true); }
    return () => { alive = false; };
  }, [bin, bank?.stk, amount, noiDung]);

  const box = {
    width: 88, height: 88, borderRadius: 8, background: "#fff",
    border: `1.5px solid ${C.pine}`, flexShrink: 0,
  };

  if (!bin || !bank?.stk || err) {
    return (
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: C.sub, textAlign: "center", padding: 4 }}>
        {bin ? "QR" : "QR (ngân hàng chưa hỗ trợ)"}
      </div>
    );
  }
  if (!dataUrl) {
    return (
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: C.sub }}>
        Đang tạo QR…
      </div>
    );
  }
  return <img src={dataUrl} alt="QR chuyển khoản" style={{ ...box, objectFit: "contain", padding: 4, boxSizing: "border-box" }} />;
}
