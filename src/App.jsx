const [phieuId, setPhieuId] = useState(null);
  const [daChot, setDaChot] = useState(false); // Trạng thái chốt cục bộ của tháng đang chọn

  // Mảng danh sách các tháng/năm để hiển thị trên UI bộ lọc
  const monthsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const yearsList = [2025, 2026, 2027];

  // ====================================================================
  // [SỬA ĐỔI CHÍNH] ĐỒNG BỘ VÀ TẢI DỮ LIỆU AN TOÀN THEO THÁNG
  // ====================================================================
  useEffect(() => {
    let isMounted = true;

    async function loadDataAndCheckLock() {
      if (!students || !meta) return;
      
      const ym = ymKey(year, month);
      
      try {
        // 1. Tải dữ liệu thu chi & cấu hình của tháng hiện tại
        let dataThang = await sGet(`mn5:thang:${ym}`);
        
        // 2. Tải dữ liệu điểm danh riêng của tháng hiện tại
        const diemDanh = await sGet(`mn5:dd:${ym}`) || {};
        
        // 3. Tải dữ liệu điểm danh tháng trước để tính ngày nghỉ trừ tiền ăn nếu có
        const pm = month === 1 ? 12 : month - 1;
        const py = month === 1 ? year - 1 : year;
        const diemDanhTruoc = await sGet(`mn5:dd:${ymKey(py, pm)}`) || {};

        // 4. Kiểm tra trạng thái chốt của tháng liền sau (tháng sau đã chốt thì tháng này không được sửa)
        const nm = month === 12 ? 1 : month + 1;
        const ny = month === 12 ? year + 1 : year;
        const dataThangSau = await sGet(`mn5:thang:${ymKey(ny, nm)}`);
        
        if (!isMounted) return;

        // Nếu tháng đang xem hoàn toàn mới (chưa có dữ liệu), tiến hành khởi tạo (Seed)
        if (!dataThang) {
          dataThang = seedThangData(ym, students, meta);
          // Lưu dữ liệu khởi tạo của riêng tháng này vào bộ nhớ, không ghi đè lung tung
          await sSet(`mn5:thang:${ym}`, dataThang);
        }

        // Cập nhật lên State giao diện cho tháng hiện hành
        setMData(dataThang);
        setDDData(diemDanh);
        setDDPrev(diemDanhTruoc);
        setNextChot(dataThangSau ? !!dataThangSau.daChot : false);
        
        // Cố lập trạng thái chốt: Đọc trực tiếp từ thuộc tính daChot của chính tháng đó
        setDaChot(!!dataThang.daChot);

      } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu tháng:", error);
      }
    }

    loadDataAndCheckLock();

    return () => {
      isMounted = false;
    };
  }, [year, month, students, meta]);

  // ====================================================================
  // HÀM XỬ LÝ CHỐT THÁNG (GỌI TỪ PHÍA GIAO DIỆN)
  // ====================================================================
  const handleToggleChotThang = async () => {
    if (!mData) return;
    const ym = ymKey(year, month);
    const trangThaiMoi = !daChot;

    const xacNhan = trangThaiMoi 
      ? `Bạn có chắc chắn muốn CHỐT dữ liệu tháng ${month}/${year}?\nSau khi chốt, giáo viên không thể điểm danh và kế toán không thể sửa tiền của tháng này.`
      : `Bạn có chắc chắn muốn MỞ KHÓA dữ liệu tháng ${month}/${year}?`;

    if (!(await ask(xacNhan, { danger: !trangThaiMoi, okText: trangThaiMoi ? "Chốt ngay" : "Mở khóa" }))) {
      return;
    }

    // Cập nhật trạng thái vào Object dữ liệu của tháng đó
    const updatedMData = { ...mData, daChot: trangThaiMoi };
    
    // Ghi nhận nhật ký hệ thống (Audit log)
    await logAction(`${trangThaiMoi ? "Chốt" : "Mở chốt"} dữ liệu tháng ${month}/${year}`);
    
    // Lưu xuống cơ sở dữ liệu bền vững theo đúng key của tháng
    await sSet(`mn5:thang:${ym}`, updatedMData);
    
    // Cập nhật State để UI thay đổi lập tức
    setMData(updatedMData);
    setDaChot(trangThaiMoi);
    
    toast(trangThaiMoi ? `🔒 Đã chốt tháng ${month}/${year}` : `🔓 Đã mở khóa tháng ${month}/${year}`);
  };

  // ====================================================================
  // PHẦN KHỞI TẠO DỮ LIỆU GỐC KHI APP BẮT ĐẦU CHẠY
  // ====================================================================
  useEffect(() => {
    async function initApp() {
      try {
        let trườngMeta = await sGet("mn5:meta");
        let danhSachHS = await sGet("mn5:students");

        // Nếu là lần đầu chạy chưa có data, nạp dữ liệu SEED mẫu cấu hình sẵn ở trên
        if (!trườngMeta) {
          trườngMeta = SEED_META;
          await sSet("mn5:meta", trườngMeta);
        }
        if (!danhSachHS) {
          danhSachHS = []; // Khởi tạo mảng học sinh trống hoặc mảng seed nếu cần
          await sSet("mn5:students", danhSachHS);
        }

        setMeta(trườngMeta);
        setStudents(danhSachHS);
      } catch (e) {
        toast("Không thể tải dữ liệu cấu hình gốc.");
      }
    }
    initApp();
  }, []);

  // --- Đoạn dưới này là phần Render UI (Tab Thu phí, Điểm danh, Tổng quan...) giữ nguyên theo code của bạn ---
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: font.body, paddingBottom: 80 }}>
      {/* Khung hiển thị Đăng nhập hoặc Giao diện chính tùy thuộc vào State `auth` */}
      {!auth ? (
        <LoginScreen meta={meta} onLogin={(u) => setAuth(u)} />
      ) : (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "10px 14px" }}>
          {/* Header hiển thị tháng năm và nút Chốt nhanh */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: font.display, color: C.pine }}>
                Tháng {month}/{year}
              </span>
              {daChot && <span style={{ marginLeft: 8, color: C.coral, fontWeight: "bold" }}>[ĐÃ CHỐT]</span>}
            </div>
            
            {/* Bộ chọn tháng năm */}
            <div style={{ display: "flex", gap: 6 }}>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.line}` }}>
                {monthsList.map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: "6px", borderRadius: 8, border: `1px solid ${C.line}` }}>
                {yearsList.map(y => <option key={y} value={y}>Năm {y}</option>)}
              </select>
            </div>
          </div>

          {daChot && <LockNote />}

          {/* Render nội dung các Tab chức năng (thu phí, điểm danh, cài đặt...) dựa vào state `tab` */}
          {/* ... Phần code giao diện của bạn viết tiếp ở đây ... */}
          
          <div style={{ marginTop: 20, textAlign: "center" }}>
            {isAdmin && (
              <button 
                onClick={handleToggleChotThang} 
                style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: daChot ? C.amber : C.coral, color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                {daChot ? "🔓 Mở khóa tháng" : "🔒 Chốt tháng hiện tại"}
              </button>
            )}
            <button onClick={() => setAuth(null)} style={{ marginLeft: 10, padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff", color: C.sub, cursor: "pointer" }}>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
      
      <ConfirmHost />
      <ToastHost />
    </div>
  );
}
