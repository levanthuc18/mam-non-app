-- SAO LƯU TỰ ĐỘNG 17:00 (giờ VN) MỖI NGÀY, GIỮ 35 BẢN MỚI NHẤT
-- Cách chạy: Supabase Dashboard -> SQL Editor -> dán cả file -> Run.
-- Điều kiện: bật extension pg_cron (Dashboard -> Database -> Extensions -> pg_cron).
-- Chạy lại nhiều lần vẫn an toàn (không tạo trùng lịch).

-- 1) Bảng chứa các bản sao lưu: mỗi dòng = ảnh chụp toàn bộ bảng "data" tại thời điểm đó.
create table if not exists public.sao_luu (
  id         bigint generated always as identity primary key,
  tao_luc    timestamptz not null default now(),
  so_muc     int         not null,
  du_lieu    jsonb       not null
);

-- Khóa bảng: bật RLS và KHÔNG tạo policy nào => khóa anon của app không đọc/ghi được.
-- (Chỉ vào được từ SQL Editor / tài khoản quản trị Supabase.)
alter table public.sao_luu enable row level security;

-- 2) Hàm chụp + dọn: lưu 1 bản mới, rồi chỉ giữ 35 bản mới nhất.
create or replace function public.sao_luu_ngay() returns void
language plpgsql as $$
declare n int;
begin
  select count(*) into n from public.data;
  -- Không sao lưu khi bảng rỗng (tránh một bản rỗng chen vào và đẩy bản tốt ra khỏi 35 bản).
  if n = 0 then return; end if;

  insert into public.sao_luu (so_muc, du_lieu)
  select n, jsonb_object_agg(d.key, d.value) from public.data d;

  delete from public.sao_luu
  where id not in (select id from public.sao_luu order by tao_luc desc, id desc limit 35);
end $$;

-- 3) Lịch: pg_cron chạy theo giờ UTC. 17:00 giờ VN (UTC+7) = 10:00 UTC.
select cron.schedule('sao-luu-17h', '0 10 * * *', $$select public.sao_luu_ngay()$$);

-- ---- Kiểm tra sau khi chạy ----
-- Chụp thử ngay 1 bản:     select public.sao_luu_ngay();
-- Xem các bản đã lưu:      select id, tao_luc at time zone 'Asia/Ho_Chi_Minh' as gio_vn, so_muc, pg_size_pretty(pg_column_size(du_lieu)::bigint) as dung_luong from public.sao_luu order by tao_luc desc;
-- Xem lịch:                select jobid, jobname, schedule, active from cron.job where jobname = 'sao-luu-17h';
-- Xem lần chạy gần nhất:   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- Phục hồi 1 key từ bản id=N (ví dụ học sinh):
--   select du_lieu -> 'mn5:students' from public.sao_luu where id = N;
-- Tắt lịch:                select cron.unschedule('sao-luu-17h');
