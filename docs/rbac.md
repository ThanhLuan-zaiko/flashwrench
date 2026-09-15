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

## 4. Trang quản trị (`/admin`)

Khu vực admin có layout riêng (`app/admin/layout.tsx`) verify
server-side: chưa đăng nhập thì redirect `/login`, sai role thì trả panel
403, chỉ `admin` mới thấy nội dung.

| URL | Nội dung |
|---|---|
| `/admin` | Dashboard tổng quan (số liệu vận hành) |
| `/admin/users` | Quản lý người dùng: duyệt thợ, khóa/mở khóa tài khoản |
| `/admin/users/staff` | Quản lý nhân viên: tạo/sửa, xóa mềm |
| `/admin/users/trash` | Thùng rác nhân viên: khôi phục, xóa vĩnh viễn |
| `/admin/services` | Cấu hình dịch vụ: bảng giá, loại hình sửa chữa |

Sidebar dùng `Link` nên mỗi mục có URL riêng, deep-link và refresh giữ
nguyên trang. Cuối sidebar có nút "Về trang chủ" (`/`) để quay lại giao
diện khách. Đăng nhập thành công với `role === "admin"` tự chuyển tới
`/admin` (xem `LoginForm`), các role khác về `/` như cũ.

## 5. API quản trị người dùng

Mọi route đều yêu cầu `requireRole("admin")` và tuân thủ layering:
repository (`lib/auth/admin-users.repository.ts`, chỉ CQL) →
service (`lib/auth/admin-users.service.ts`, nghiệp vụ) →
route handler (mỏng) → `services/admin.api.ts` (fetch) →
`hooks/admin.ts` (`useAdminUsers`, `useAdminUserAction`).

Danh sách đọc từ bảng `users_by_role` theo từng partition
`(role, month_bucket)` rồi gộp, sắp xếp mới nhất trước — không dùng
`ALLOW FILTERING`.

| Endpoint | Phương thức | Tham số | Ý nghĩa |
|---|---|---|---|
| `/api/admin/users` | `GET` | `role=all\|customer\|mechanic\|dispatcher\|admin`, `status`, `months` (1–24, mặc định 6), `limit` (1–100, mặc định 50) | Liệt kê người dùng mới nhất trước |
| `/api/admin/users` | `POST` | `{ "fullName", "phone", "email", "role": "mechanic" \| "dispatcher" }` | Tạo tài khoản nhân viên, trả về mật khẩu tạm một lần |
| `/api/admin/users/[userId]` | `PATCH` | `{ "action": "approve" \| "lock" \| "unlock" }` | Đổi trạng thái một tài khoản |
| `/api/admin/users/[userId]` | `PATCH` | `{ "action": "update", "fullName", "phone", "email", "role" }` | Sửa hồ sơ nhân viên |
| `/api/admin/users/[userId]` | `PATCH` | `{ "action": "soft" \| "restore" }` | Xóa mềm / khôi phục nhân viên |
| `/api/admin/users/[userId]` | `DELETE` | `{ "confirm": "<số điện thoại>" }` | Xóa vĩnh viễn (chỉ trong thùng rác) |

Trạng thái tài khoản (`status`): `active` (hoạt động), `locked` (bị
khóa), `pending_verification` (chờ duyệt), `deleted` (xóa mềm, nằm trong
thùng rác). Tài khoản `deleted` bị chặn đăng nhập/refresh/đổi mật khẩu
giống `locked`.

Luật nghiệp vụ của `applyAdminUserAction`:

- `approve`: chỉ khi `status` đang `pending_verification` → `active`.
  Dùng cho tab "Duyệt thợ" (`role=mechanic`, `status=pending_verification`).
- `lock`: khóa tài khoản đang `active` (hoặc chờ duyệt) → `locked`,
  đồng thời tăng `token_version` để đá mọi phiên đang đăng nhập.
- `unlock`: chỉ mở tài khoản đang `locked` → `active`.
- Không bao giờ tác động tài khoản của chính mình hoặc tài khoản
  `admin` khác (trả `403`).
- Từ chối mọi thao tác trên tài khoản `deleted` (trả `400`, hãy khôi
  phục trước).

Luật nghiệp vụ của staff (`lib/auth/staff.service.ts`, tab "Nhân viên"):

- `create`: chỉ gán `mechanic`/`dispatcher` (khách hàng tự đăng ký,
  không bao giờ `admin`), server sinh mật khẩu tạm 12 ký tự và trả về
  đúng một lần. Trùng phone/email trả `409`.
- `update`: sửa tên, phone, email, vai trò (`customer`/`mechanic`/
  `dispatcher`, để khách hàng cũ vẫn sửa được). Đổi phone/email phải
  claim lookup mới trước, nhả lookup cũ sau khi thành công.
- `soft`: mọi trạng thái trừ `deleted` → `deleted`, tăng
  `token_version` để đá mọi phiên.
- `restore`: chỉ `deleted` → `active`.
- `hard`: chỉ `deleted`, phải nhập đúng số điện thoại để xác nhận.
  Xóa hàng ở cả 4 bảng `users_by_id/phone/email/role` và thu hồi phiên.
- Mọi thao tác staff đều chặn tài khoản của chính mình và tài khoản
  `admin` khác (`403`), UI ẩn luôn tài khoản của chính mình.

## 6. Seed admin đầu tiên

Script `bun run seed:admin` (`scripts/seed-admin.ts`) tạo đúng 1 admin
khởi động. Luồng: đọc env → `seedAdmin()` trong
`lib/auth/admin-seed.service.ts` → ghi 3 bảng `users_by_id`,
`users_by_phone`, `users_by_email`, `users_by_role` bằng LWT + batch
giống đăng ký thường.

### 6.1. Biến môi trường (xem `.env.example`)

| Biến | Bắt buộc | Mặc định | Ý nghĩa |
|---|---|---|---|
| `SEED_ADMIN_PHONE` | Có | — | Số di động VN, ví dụ `0912345678` |
| `SEED_ADMIN_EMAIL` | Có | — | Email admin |
| `SEED_ADMIN_PASSWORD` | Có | — | Mật khẩu, phải qua `validatePassword` (≥ 8 ký tự, có chữ + số) |
| `SEED_ADMIN_FULL_NAME` | Không | `Site Administrator` | Tên hiển thị |
| `SEED_ADMIN_ENFORCE_SINGLE_ADMIN` | Không | `true` | `true` thì từ chối khi đã có admin khác |
| `SEED_ADMIN_LOOKBACK_MONTHS` | Không | `12` | Số bucket tháng gần nhất để quét admin |

### 6.2. Chạy ở dev

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

### 6.3. Tính idempotent (chạy lại an toàn)

| Tình huống | Kết quả | Exit code |
|---|---|---|
| Chưa có ai trùng phone/email | `created` — tạo admin mới | `0` |
| Trùng cả phone + email của đúng admin cũ | `exists` — bỏ qua, không ghi đè mật khẩu | `0` |
| Trùng phone/email của user khác (kể cả `customer`) | `conflict` — từ chối, không tự nâng quyền | `1` |
| Đã có admin khác + `ENFORCE_SINGLE_ADMIN=true` | `refused` — từ chối seed admin thứ 2 | `1` |
| Dữ liệu không đạt validation | `invalid` kèm chi tiết từng field | `1` |
| Thiếu biến môi trường | Báo tên biến còn thiếu | `1` |

### 6.4. Deploy doanh nghiệp

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
