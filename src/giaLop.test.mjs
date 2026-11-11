// Chạy: node src/giaLop.test.mjs
import assert from "node:assert/strict";
import { lopTai, khacGia, coDoiGia, demDoiGia, chotGiaLop } from "./giaLop.js";
let n = 0; const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };
const goc = [{ id: "c1", ten: "A", hocPhi: 800000, banTru: 200000, tienAn: 30000, t7: 80000 }];

ok("không có mốc → giữ nguyên", () => assert.equal(lopTai(goc[0], "2026-11"), goc[0]));
ok("khác biệt giá + công tắc", () => {
  const d = { ...goc[0], hocPhi: 900000, lapLai: { banTru: "khong" } };
  const r = khacGia(goc[0], d); assert.equal(r.n, 2); assert.deepEqual(r.v, { hocPhi: 900000, lapLai: { banTru: "khong" } });
  assert.equal(khacGia(goc[0], { ...goc[0] }).n, 0);
  assert.equal(khacGia(goc[0], { ...goc[0], lapLai: { banTru: "thu" } }).n, 0);          // "thu" là mặc định
});
ok("Từ tháng sau: tháng này giữ giá cũ, tháng sau giá mới, trường chính không đổi", () => {
  const d = [{ ...goc[0], hocPhi: 900000 }];
  const out = chotGiaLop(d, goc, "2026-11", false)[0];
  assert.equal(out.hocPhi, 800000);
  assert.equal(lopTai(out, "2026-11").hocPhi, 800000);
  assert.equal(lopTai(out, "2026-12").hocPhi, 900000);
  assert.equal(lopTai(out, "2027-03").hocPhi, 900000);
});
ok("Áp dụng ngay: từ tháng đang xem; tháng trước giữ giá cũ", () => {
  const out = chotGiaLop([{ ...goc[0], hocPhi: 900000 }], goc, "2026-11", true)[0];
  assert.equal(lopTai(out, "2026-10").hocPhi, 800000);
  assert.equal(lopTai(out, "2026-11").hocPhi, 900000);
  assert.equal(out.hocPhi, 800000);
});
ok("sửa tiếp khi đã có mốc: bản nháp xuất phát từ giá hiệu lực", () => {
  const l1 = chotGiaLop([{ ...goc[0], hocPhi: 900000 }], goc, "2026-11", false);            // mốc 12/2026
  const eff12 = lopTai(l1[0], "2026-12");                                                  // người dùng xem tháng 12
  const l2 = chotGiaLop([{ ...eff12, banTru: 250000 }], l1, "2026-12", true);              // áp ngay ở tháng 12
  assert.equal(lopTai(l2[0], "2026-11").hocPhi, 800000);
  assert.equal(lopTai(l2[0], "2026-12").hocPhi, 900000);
  assert.equal(lopTai(l2[0], "2026-12").banTru, 250000);
  assert.equal(l2[0].gia.length, 1);                                                       // gộp vào mốc cùng tháng
});
ok("không đổi gì → không thêm mốc", () => {
  const out = chotGiaLop(goc, goc, "2026-11", true)[0]; assert.equal(out.gia, undefined);
  assert.equal(coDoiGia(goc, goc, "2026-11"), false);
  assert.equal(demDoiGia([{ ...goc[0], hocPhi: 1, tienAn: 2 }], goc, "2026-11"), 2);
});
ok("công tắc Tắt từ tháng sau", () => {
  const out = chotGiaLop([{ ...goc[0], lapLai: { banTru: "khong" } }], goc, "2026-11", false)[0];
  assert.equal((lopTai(out, "2026-11").lapLai || {}).banTru, undefined);
  assert.equal(lopTai(out, "2026-12").lapLai.banTru, "khong");
});
ok("lớp mới (chưa có trong gốc) giữ nguyên", () => {
  const moi = { id: "c9", ten: "Mới", hocPhi: 1 };
  assert.equal(chotGiaLop([moi], goc, "2026-11", true)[0], moi);
});
console.log(`\n${n} nhóm kiểm — tất cả đạt`);
