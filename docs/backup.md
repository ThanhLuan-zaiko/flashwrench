# Sao lưu và khôi phục cơ sở dữ liệu ScyllaDB

Hai lệnh `bun run db:backup` và `bun run db:restore` dùng để chép toàn bộ
dữ liệu sang máy khác, hoặc lấy lại dữ liệu khi cơ sở dữ liệu (kể cả
production) bị xoá. Cả hai đọc thông tin kết nối từ `.env.local`.

## 1. File backup

- Tên file: `db-backup-<keyspace>-<thời gian UTC>.jsonl.gz`, nằm ở root repo.
- Bên trong: dòng đầu là cấu trúc DB (keyspace, kiểu UDT, bảng, index),
  các dòng sau là từng dòng dữ liệu, nén gzip.
- Mọi kiểu dữ liệu (uuid, bigint, timestamp, map, set, UDT, counter…)
  được giữ nguyên khi khôi phục.
- `.gitignore` đã chặn `/db-backup-*` và `*.jsonl.gz`, nên file không thể
  lên GitHub. File chứa dữ liệu thật (tài khoản, mật khẩu đã băm, số điện
  thoại), hãy chép bằng USB hoặc kênh riêng, không gửi qua kênh công khai.

**Không có trong backup:**

- Ảnh tải lên trong thư mục `storage/` (xem `docs/media.md`). DB chỉ giữ
  URL, nên phải chép thêm thư mục `storage/` nếu muốn ảnh hiển thị.
- Các bảng nội bộ `*$paxos` của Scylla và materialized view (hiện chưa có).

## 2. Tạo backup

Các biến cần có trong `.env.local`:

```
SCYLLA_CONTACT_POINTS=127.0.0.1
SCYLLA_PORT=9042
SCYLLA_LOCAL_DATACENTER=datacenter1
SCYLLA_KEYSPACE=flashwrench
SCYLLA_USERNAME=        # bỏ trống nếu không bật xác thực
SCYLLA_PASSWORD=
```

Chạy:

```bash
bun run db:backup
```

Muốn đặt tên hoặc nơi lưu khác thì truyền đường dẫn:

```bash
bun run db:backup D:/Backups/flashwrench.jsonl.gz
```

Kết quả in ra số dòng của từng bảng và đường dẫn file.

## 3. Nạp backup vào cơ sở dữ liệu

### 3.1. Trên máy mới

1. Clone repo, chạy `bun install`.
2. Khởi động ScyllaDB (ví dụ bằng docker) và chờ cổng `9042` sẵn sàng.
3. Tạo `.env.local` như mục 2, trỏ tới ScyllaDB của máy mới.
   `SCYLLA_LOCAL_DATACENTER` phải khớp tên datacenter của máy đó
   (xem bằng `nodetool status`).
4. Chép file backup vào root repo, rồi chạy:

   ```bash
   bun run db:restore db-backup-flashwrench-2026-11-06T13-10-38.jsonl.gz
   ```

5. (Nếu cần ảnh) chép thư mục `storage/` từ máy cũ sang.
6. Chạy `bun run dev` và đăng nhập thử để kiểm tra.

Không cần chạy `schema.cql` hay `reset_data.sh` trước. Lệnh restore tự tạo
keyspace, kiểu UDT, bảng và index nếu còn thiếu, rồi nạp dữ liệu.

### 3.2. Khôi phục production

1. Tạo backup định kỳ trên production và cất ở nơi khác máy chủ DB.
2. Khi cần khôi phục, đặt `.env.local` (hoặc biến môi trường) trỏ tới
   cluster production.
3. Với cluster 3 node trở lên, tạo keyspace trước với hệ số sao chép 3
   (lệnh restore chỉ tạo keyspace 1 bản sao khi keyspace chưa có):

   ```sql
   CREATE KEYSPACE IF NOT EXISTS flashwrench
     WITH replication = { 'class': 'NetworkTopologyStrategy', 'datacenter1': 3 };
   ```

4. Chạy `bun run db:restore <file>`.

### 3.3. Nạp vào keyspace khác

Để thử backup mà không đụng dữ liệu đang dùng:

```bash
bun run db:restore <file> --keyspace flashwrench_test
```

Thứ tự ưu tiên tên keyspace: `--keyspace`, rồi `SCYLLA_KEYSPACE`, rồi tên
keyspace ghi trong file backup.

## 4. Restore xử lý dữ liệu đang có như thế nào

- Không xoá gì. Bảng, kiểu và index đã có được giữ nguyên.
- Dòng trùng khoá chính bị ghi đè bằng giá trị trong backup.
- Dòng chỉ có ở DB đích (không có trong backup) vẫn còn.
- Bảng counter được đặt về đúng giá trị trong backup. Chạy restore nhiều
  lần không làm số bị cộng dồn.
- Nếu muốn DB giống hệt backup (bỏ cả dữ liệu mới hơn), hãy restore vào
  một DB trống. `reset_data.sh` chỉ dùng cho DB dev có thể bỏ.

Nếu bảng trên DB đích có cấu trúc khác bản backup (thiếu cột), hãy chạy
các script `scripts/migrate-*.ts` cho DB đích trước, rồi restore lại.

## 5. Lỗi thường gặp

| Thông báo                                  | Cách xử lý                                              |
| ------------------------------------------ | ------------------------------------------------------- |
| `SCYLLA_KEYSPACE is missing in .env.local` | Thêm `SCYLLA_KEYSPACE` vào `.env.local`.                |
| `All host(s) tried for query failed`       | ScyllaDB chưa chạy, hoặc sai địa chỉ/cổng.              |
| `Not a valid backup file`                  | File không phải do `db:backup` tạo, hoặc đã hỏng.       |
| Lỗi xác thực                               | Kiểm tra `SCYLLA_USERNAME` / `SCYLLA_PASSWORD`.         |
| Datacenter không khớp                      | Sửa `SCYLLA_LOCAL_DATACENTER` theo `nodetool status`.   |

## 6. Mã nguồn

- `scripts/db-backup.ts`: tạo backup.
- `scripts/db-restore.ts`: khôi phục.
- `scripts/db-backup/codec.ts`: chuyển kiểu dữ liệu sang JSON và ngược lại.
- `scripts/db-backup/schema.ts`: đọc cấu trúc DB, sinh lại lệnh tạo bảng.
