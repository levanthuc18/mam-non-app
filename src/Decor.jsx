// Decor.jsx — hình minh hoạ trang trí phong cách mầm non (SVG thuần)
import { C } from "./lib.js";

export function Cloud({ w = 90, style }) {
  return (
    <svg width={w} height={w * 0.42} viewBox="0 0 100 42" fill="none" style={style}>
      <g fill="#FFFFFF">
        <ellipse cx="30" cy="28" rx="22" ry="14" />
        <ellipse cx="52" cy="22" rx="20" ry="16" />
        <ellipse cx="72" cy="29" rx="18" ry="12" />
        <rect x="20" y="28" width="60" height="13" rx="6" />
      </g>
    </svg>
  );
}

export function Sun({ w = 76, style }) {
  return (
    <svg width={w} height={w} viewBox="0 0 100 100" fill="none" style={style}>
      <g stroke="#FBC02D" strokeWidth="5" strokeLinecap="round">
        {[...Array(8)].map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = 50 + Math.cos(a) * 34, y1 = 50 + Math.sin(a) * 34;
          const x2 = 50 + Math.cos(a) * 44, y2 = 50 + Math.sin(a) * 44;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <circle cx="50" cy="50" r="26" fill="#FFD34E" />
      <circle cx="42" cy="47" r="3" fill="#5B4A1E" />
      <circle cx="58" cy="47" r="3" fill="#5B4A1E" />
      <circle cx="38" cy="56" r="4" fill="#FF9E80" opacity="0.7" />
      <circle cx="62" cy="56" r="4" fill="#FF9E80" opacity="0.7" />
      <path d="M43 56 Q50 63 57 56" stroke="#5B4A1E" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Dải cỏ cong full-width ở đáy (cho phép méo ngang, chỉ là nền)
export function Grass({ h = 70, style }) {
  return (
    <svg width="100%" height={h} viewBox="0 0 400 70" preserveAspectRatio="none" style={style}>
      <path d="M0 30 Q100 0 200 14 T400 24 L400 70 L0 70 Z" fill="#CDEBD3" />
      <path d="M0 44 Q120 22 220 34 T400 40 L400 70 L0 70 Z" fill="#B5DFC0" />
    </svg>
  );
}

// Ngôi trường + cây, giữ tỉ lệ, căn giữa đáy
export function School({ w = 300, style }) {
  return (
    <svg width={w} height={w * 0.46} viewBox="0 0 300 138" fill="none" style={style}>
      {/* cây trái */}
      <g>
        <rect x="40" y="92" width="7" height="26" rx="3" fill="#8D6E4F" />
        <circle cx="43" cy="84" r="20" fill="#7BC47F" />
        <circle cx="30" cy="92" r="14" fill="#92CE93" />
        <circle cx="56" cy="92" r="13" fill="#92CE93" />
      </g>
      {/* cây phải */}
      <g>
        <rect x="252" y="96" width="6" height="22" rx="3" fill="#8D6E4F" />
        <circle cx="255" cy="90" r="16" fill="#7BC47F" />
        <circle cx="244" cy="96" r="11" fill="#92CE93" />
        <circle cx="266" cy="96" r="10" fill="#92CE93" />
      </g>
      {/* thân trường */}
      <rect x="96" y="66" width="108" height="52" rx="6" fill="#FFF1DD" stroke="#F2D9B6" strokeWidth="2" />
      {/* mái */}
      <path d="M88 66 L150 34 L212 66 Z" fill="#FF7043" />
      <path d="M88 66 L150 34 L212 66 Z" fill="none" stroke="#E8552E" strokeWidth="1.5" />
      {/* cờ */}
      <line x1="150" y1="34" x2="150" y2="18" stroke="#8D6E4F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M150 19 L165 23 L150 27 Z" fill={C.coral} />
      {/* cửa chính */}
      <rect x="138" y="86" width="24" height="32" rx="3" fill={C.pine} />
      <circle cx="156" cy="102" r="1.6" fill="#FFF1DD" />
      {/* cửa sổ */}
      <rect x="108" y="80" width="18" height="18" rx="3" fill="#BFE3EF" stroke="#fff" strokeWidth="2" />
      <rect x="174" y="80" width="18" height="18" rx="3" fill="#BFE3EF" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}
