// Chạy: node src/khoanThem.test.mjs  (không cần thư viện)
import assert from "node:assert/strict";
import { ymNext, giaTriKhoan, khoanThemHieuLuc, dongBoPhuThuLop, phuThuLopMoi, coDoiKhoanThem, demDoiKhoanThem, chotKhoanThem } from "./khoanThem.js";
let n = 0; const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };
let id = 0; const mk = () => "p" + (++id);

ok("ymNext qua năm", () => { assert.equal(ymNext("2026-12"), "2027-01"); assert.equal(ymNext("2026-11"), "2026-12"); });

const k1 = { id: "k1", ten: "Dã ngoại", soTien: 50000, bat: true };
ok("hiệu lực cơ bản + tắt + tiền 0", () => {
  assert.deepEqual(giaTriKhoan(k1, "2026-11"), { id: "k1", ten: "Dã ngoại", soTien: 50000 });
  assert.equal(giaTriKhoan({ ...k1, bat: false }, "2026-11"), null);
  assert.equal(giaTriKhoan({ ...k1, soTien: 0 }, "2026-11"), null);
  assert.equal(giaTriKhoan({ ...k1, ten: " " }, "2026-11"), null);
});
ok("tuThang / ketThuc / cu", () => {
  assert.equal(giaTriKhoan({ ...k1, tuThang: "2026-12" }, "2026-11"), null);
  assert.ok(giaTriKhoan({ ...k1, tuThang: "2026-12" }, "2026-12"));
  assert.ok(giaTriKhoan({ ...k1, ketThuc: "2026-11" }, "2026-11"));
  assert.equal(giaTriKhoan({ ...k1, ketThuc: "2026-11" }, "2026-12"), null);
  const sua = { ...k1, soTien: 70000, cu: { ten: "Dã ngoại", soTien: 50000, bat: true, den: "2026-11" } };
  assert.equal(giaTriKhoan(sua, "2026-11").soTien, 50000);
  assert.equal(giaTriKhoan(sua, "2026-12").soTien, 70000);
});

const lop = { id: "c1", khoanThem: [k1] };
ok("đồng bộ: thêm, đổi tiền, bỏ khi tắt, giữ phụ thu tay", () => {
  const tay = { id: "t", ten: "Riêng", soTien: 10000 };
  let r = dongBoPhuThuLop({ phuThu: [tay] }, lop, "2026-11", mk);
  assert.ok(r.changed); assert.equal(r.phuThu.length, 2); assert.equal(r.phuThu[0], tay);
  const rec = { phuThu: r.phuThu };
  r = dongBoPhuThuLop(rec, lop, "2026-11", mk); assert.equal(r.changed, false);          // chạy lại: không đổi, không nhân đôi
  r = dongBoPhuThuLop(rec, { id: "c1", khoanThem: [{ ...k1, soTien: 60000 }] }, "2026-11", mk);
  assert.equal(r.phuThu.find((p) => p.lopKhoan).soTien, 60000);
  r = dongBoPhuThuLop(rec, { id: "c1", khoanThem: [{ ...k1, bat: false }] }, "2026-11", mk);
  assert.equal(r.phuThu.length, 1); assert.equal(r.phuThu[0], tay);
});
ok("HS đã xoá tay khoản → không thêm lại", () => {
  const r = dongBoPhuThuLop({ phuThu: [], boKhoanLop: ["k1"] }, lop, "2026-11", mk);
  assert.equal(r.changed, false); assert.equal(r.phuThu.length, 0);
});
ok("phuThuLopMoi", () => assert.equal(phuThuLopMoi(lop, "2026-11", mk)[0].lopKhoan, "k1"));

ok("chốt: khoản mới — ngay / tháng sau", () => {
  const goc = [{ id: "c1" }]; const draft = [{ id: "c1", khoanThem: [{ id: "k9", ten: "Mới", soTien: 1000, bat: true, moi: true }] }];
  const a = chotKhoanThem(draft, goc, "2026-11", true)[0].khoanThem[0]; assert.equal(a.tuThang, "2026-11"); assert.equal(a.moi, undefined);
  const b = chotKhoanThem(draft, goc, "2026-11", false)[0].khoanThem[0]; assert.equal(b.tuThang, "2026-12");
  assert.equal(giaTriKhoan(b, "2026-11"), null); assert.ok(giaTriKhoan(b, "2026-12"));
});
ok("chốt: sửa tiền — tháng sau giữ giá cũ tháng này", () => {
  const goc = [{ id: "c1", khoanThem: [k1] }]; const draft = [{ id: "c1", khoanThem: [{ ...k1, soTien: 80000 }] }];
  const k = chotKhoanThem(draft, goc, "2026-11", false)[0].khoanThem[0];
  assert.equal(giaTriKhoan(k, "2026-11").soTien, 50000); assert.equal(giaTriKhoan(k, "2026-12").soTien, 80000);
  const a = chotKhoanThem(draft, goc, "2026-11", true)[0].khoanThem[0]; assert.equal(a.cu, undefined); assert.equal(giaTriKhoan(a, "2026-11").soTien, 80000);
});
ok("chốt: xoá — ngay thì mất; tháng sau thì còn đến hết tháng này", () => {
  const goc = [{ id: "c1", khoanThem: [k1] }]; const draft = [{ id: "c1", khoanThem: [] }];
  assert.equal(chotKhoanThem(draft, goc, "2026-11", true)[0].khoanThem, undefined);
  const k = chotKhoanThem(draft, goc, "2026-11", false)[0].khoanThem[0];
  assert.ok(giaTriKhoan(k, "2026-11")); assert.equal(giaTriKhoan(k, "2026-12"), null);
});
ok("phát hiện thay đổi", () => {
  const goc = [{ id: "c1", khoanThem: [k1] }];
  assert.equal(coDoiKhoanThem(goc, goc), false);
  assert.equal(coDoiKhoanThem([{ id: "c1", khoanThem: [{ ...k1, soTien: 1 }] }], goc), true);
  assert.equal(demDoiKhoanThem([{ id: "c1", khoanThem: [] }], goc), 1);
});
console.log(`\n${n} nhóm kiểm — tất cả đạt`);
