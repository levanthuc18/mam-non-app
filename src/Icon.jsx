// Icon.jsx — bộ icon nét mảnh (line, stroke 2px) dựng sẵn bằng SVG nội tuyến.
// Không phụ thuộc thư viện ngoài (lucide-react). Đường dẫn lấy theo bộ Lucide (ISC).
// Dùng: <Icon name="wallet" size={22} color={C.orange} />

const PATHS = {
  // tài chính
  wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></>,
  coins: <><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" /></>,
  barChart: <><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></>,
  // vận hành
  calendarCheck: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
};

// icon dạng chấm (fill) tách riêng vì không dùng stroke
const FILLED = {
  more: <><circle cx="12" cy="12" r="1.6" /><circle cx="5" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
};

export function Icon({ name, size = 22, color = "currentColor", strokeWidth = 2, style }) {
  if (FILLED[name]) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style} aria-hidden="true">
        {FILLED[name]}
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {PATHS[name] || null}
    </svg>
  );
}
