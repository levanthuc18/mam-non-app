// Splash.jsx — màn chờ 2 giây khi mở app
import { useEffect } from "react";
import { C, font } from "./lib.js";
import { Logo } from "./Brand.jsx";

export function Splash({ onDone, ms = 2000 }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), ms);
    return () => clearTimeout(t);
  }, [onDone, ms]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 18,
      background: "linear-gradient(160deg,#E8F1EC,#E1ECF1)",
      fontFamily: font.body, padding: 24,
    }}>
      <style>{`
        @keyframes ttFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ttDot{0%,80%,100%{opacity:.25}40%{opacity:1}}
      `}</style>

      <div style={{ animation: "ttFade .5s ease both" }}>
        <Logo w={210} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, animation: "ttFade .6s .2s ease both" }}>
        <span style={{ fontSize: 13, color: C.sub }}>Đang tải dữ liệu</span>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: 99, background: C.pine,
            display: "inline-block", animation: `ttDot 1.2s ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
