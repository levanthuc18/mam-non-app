// SbAuth.jsx — Đăng nhập tài khoản Supabase (1 lần / máy). Không lưu mật khẩu vào code.
import { useState } from "react";
import { C, font, sbLogin } from "./lib.js";
import { Logo } from "./Brand.jsx";

export function SbAuth({ onDone }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const login = async () => {
    if (!email.trim() || !pw) { setErr("Nhập email và mật khẩu."); return; }
    setBusy(true); setErr("");
    try {
      await sbLogin(email, pw);
      try { localStorage.removeItem("mn5:auth"); } catch {} // đăng nhập email mới → hỏi lại PIN vai trò
      onDone();
    } catch (e) {
      setErr(e.message || "Không đăng nhập được. Kiểm tra mạng và thử lại.");
      setBusy(false);
    }
  };

  const inp = { width: "100%", padding: "13px 14px", borderRadius: 11, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: font.body, outline: "none", boxSizing: "border-box", background: C.card, color: C.ink };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Logo w={160} style={{ width: "min(150px, 40vw)" }} /></div>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: C.pine, marginTop: 10 }}>Đăng nhập thiết bị</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>Nhập tài khoản của trường để máy này được phép truy cập dữ liệu. Chỉ cần nhập 1 lần.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (vd: mamnon@gmail.com)" style={inp} />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Mật khẩu" style={inp} />
          {err && <div style={{ fontSize: 12.5, color: C.coral, fontWeight: 600, padding: "2px 2px" }}>{err}</div>}
          <button onClick={login} disabled={busy} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: busy ? C.gray : C.pine, color: "#fff", fontWeight: 800, fontSize: 15.5, fontFamily: font.display, cursor: busy ? "default" : "pointer", marginTop: 4, boxShadow: "0 4px 14px rgba(23,107,91,0.28)" }}>
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 16, textAlign: "center", lineHeight: 1.5 }}>
          Mật khẩu chỉ lưu trên máy này, không gửi đi đâu khác. Quên mật khẩu? Vào Supabase → Authentication để đặt lại.
        </div>
      </div>
    </div>
  );
}
