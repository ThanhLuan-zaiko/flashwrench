# Phân quyền và seed admin FlashWrench

Tài liệu này mô tả cách gán vai trò người dùng, cách chặn quyền trong
route handler, và cách tạo tài khoản admin đầu tiên an toàn cho cả
môi trường dev lẫn deploy doanh nghiệp.

## 1. Các vai trò

| Vai trò | Ý nghĩa |
|---|---|
| `customer` | Khách hàng đặt lịch, mặc định cho mọi đăng ký công khai |
| `mechanic` | Thợ sửa xe lưu động |
| `dispatcher` | Điều phối cứu hộ/booking |
| `admin` | Quản trị toàn hệ thống |

Kiểu `UserRole` định nghĩa trong `lib/auth/user.types.ts`. Mọi so sánh
quyền đều dùng đúng 4 chuỗi này, không chế thêm chuỗi tự do.

## 2. Đăng ký luôn gán cứng `customer`

- Route `POST /api/auth/register` chỉ nhận `fullName/phone/email/password`,
  không có field `role` trong body.
- Service `registerUser` gọi repository `createUser`, hàm này bọc
  `createUserWithRole({ ...params, role: "customer" })`
  (xem `lib/auth/user.repository.ts`).
- Người dùng không thể tự nâng quyền bằng cách sửa request, vì role là
  tham số nội bộ của server, không đọc từ input.

Muốn tạo `mechanic`/`dispatcher`/`admin` mới sau này: viết API riêng yêu
cầu `requireRole("admin")` rồi gọi `createUserWithRole` với role tương
ứng. Tuyệt đối không mở field `role` ra API công khai.

## 3. Chặn quyền trong route handler

Dùng guard trong `lib/auth/authorization.ts`. Guard đọc cookie `fw_at`,
verify JWT, đọc user từ `users_by_id` (kèm kiểm tra `token_version` và
`status`), rồi mới so sánh `user.role` lấy từ database — không tin bất
kỳ role nào client gửi lên.

```ts
import { requireAuth, requireRole } from "@/lib/auth/authorization";

// Bất kỳ user nào đã đăng nhập:
export async function GET() {
  const { user, response } = await requireAuth();
  if (response) return response;
  // ... dùng user
}

// Chỉ admin:
export async function POST() {
  const { user, response } = await requireRole("admin");
  if (response) return response;
  // ... dùng user
}

// Admin hoặc điều phối:
export async function GET() {
  const { user, response } = await requireRole("admin", "dispatcher");
  if (response) return response;
  // ... dùng user
}
```

| Kết quả | HTTP | Thông báo |
|---|---|---|
| Chưa đăng nhập / token hết hạn | `401` | "Vui lòng đăng nhập để tiếp tục." |
| Đã đăng nhập nhưng sai role | `403` | "Bạn không có quyền thực hiện thao tác này." |

Tài khoản `locked` bị `authenticate()` chặn từ trước nên guard chỉ cần
kiểm tra role.

## 4. Seed admin đầu tiên

Script `bun run seed:admin` (`scripts/seed-admin.ts`) tạo đúng 1 admin
khởi động. Luồng: đọc env → `seedAdmin()` trong
`lib/auth/admin-seed.service.ts` → ghi 3 bảng `users_by_id`,
`users_by_phone`, `users_by_email`, `users_by_role` bằng LWT + batch
giống đăng ký thường.

### 4.1. Biến môi trường (xem `.env.example`)

| Biến | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|---|---|
| `SEED_ADMIN_PHONE` | Có | — | Số di động VN, ví dụ `0912345678` |
| `SEED_ADMIN_EMAIL` | Có | — | Email admin |
| `SEED_ADMIN_PASSWORD` | Có | — | Mật khẩu, phải qua `validatePassword` (≥ 8 ký tự, có chữ + số) |
| `SEED_ADMIN_FULL_NAME` | Không | `Site Administrator` | Tên hiển thị |
| `SEED_ADMIN_ENFORCE_SINGLE_ADMIN` | Không | `true` | `true` thì từ chối khi đã có admin khác |
| `SEED_ADMIN_LOOKBACK_MONTHS` | Không | `12` | Số bucket tháng gần nhất để quét admin |

### 4.2. Chạy ở dev

```bash
# Thêm vào .env.local (file này bị gitignore, không commit):
SEED_ADMIN_FULL_NAME="Quản trị viên"
SEED_ADMIN_PHONE=0912345678
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin1234

# Dựng lại schema rồi seed:
bun run seed:admin
```

Bun tự load `.env.local` nên không cần export tay.

### 4.3. Tính idempotent (chạy lại an toàn)

| Tình huống | Kết quả | Exit code |
|---|---|---|
| Chưa có ai trùng phone/email | `created` — tạo admin mới | `0` |
| Trùng cả phone + email của đúng admin cũ | `exists` — bỏ qua, không ghi đè mật khẩu | `0` |
| Trùng phone/email của user khác (kể cả `customer`) | `conflict` — từ chối, không tự nâng quyền | `1` |
| Đã có admin khác + `ENFORCE_SINGLE_ADMIN=true` | `refused` — từ chối seed admin thứ 2 | `1` |
| Dữ liệu không đạt validation | `invalid` kèm chi tiết từng field | `1` |
| Thiếu biến môi trường | Báo tên biến còn thiếu | `1` |

### 4.4. Deploy doanh nghiệp

- **Không** dùng file `.env.local` trên server. Inject cùng tên biến
  `SEED_ADMIN_*` từ Secrets Manager (Vault / AWS Secrets Manager /
  Doppler / CI secrets) vào bước chạy một lần của CI/CD.
- Chạy script đúng 1 lần sau khi dựng keyspace, **không** tự seed mỗi lần
  `next start` (tránh ghi đè admin đã bị khóa và race khi scale nhiều
  instance).
- Giữ `SEED_ADMIN_ENFORCE_SINGLE_ADMIN=true` ở prod để lần chạy nhầm thứ
  2 tự từ chối thay vì đẻ thêm admin.
- Sau khi có admin đầu tiên, thu hồi quyền chạy seed, các admin/thợ/điều
  phối tiếp theo tạo qua API nội bộ đã gắn `requireRole("admin")`.
- Xoay vòng mật khẩu seed ngay sau lần đăng nhập đầu tiên và lưu audit ai,
  khi nào đã chạy seed.
