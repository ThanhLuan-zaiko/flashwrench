# Xác thực FlashWrench — access ngắn hạn + refresh xoay vòng

Tài liệu này mô tả cơ chế đăng nhập đang chạy trong dự án: vừa nhanh
(không query database cho phần lớn request) vừa thu hồi được khi lộ token,
đổi mật khẩu hoặc khóa tài khoản.

## 1. Tổng quan mô hình

| Loại token | Định dạng | Nơi lưu | Hạn | Query DB? |
|---|---|---|---|---|
| Access (`fw_at`) | JWT HS256 ký bằng `jose` | Cookie `httpOnly` | 15 phút | Không (chỉ verify chữ ký) |
| Refresh (`fw_rt`) | Chuỗi ngẫu nhiên 256-bit (`fw1.<payload>.<secret>`) | Cookie `httpOnly` + hash SHA-256 trong ScyllaDB | 30 ngày, tự gia hạn khi xoay vòng | Có (1 đọc single-partition) |

- Đăng nhập/đăng ký thành công → server đặt cả 2 cookie.
- Frontend gọi API bằng access token. Gặp `401` → tự gọi
  `POST /api/auth/refresh` 1 lần rồi thử lại request gốc
  (xem `services/auth.api.ts`).
- Refresh token **dùng 1 lần**: mỗi lần refresh sinh cặp mới, token cũ
  thành `previous` và chỉ được chấp nhận trong 60 giây (chống refresh
  đồng thời), sau đó vô hiệu hẳn.

## 2. Luồng hoạt động

- **Đăng nhập** (`POST /api/auth/login`): kiểm tra validation → kiểm tra
  mật khẩu bằng **Argon2id** → tạo `family_id` mới → lưu hash
  refresh vào `refresh_sessions` + `refresh_sessions_by_user` (có TTL) →
  đặt 2 cookie.
- **Gọi API** (`GET /api/auth/me`): verify JWT (chữ ký, `iss`, `aud`,
  hết hạn) → đọc `users_by_id` → so khớp `token_version` → trả user.
- **Refresh** (`POST /api/auth/refresh`): tách `(user_id, family_id)` từ
  token → đọc đúng 1 partition → so hash → xoay vòng bằng LWT
  (`UPDATE ... IF token_hash = ?`) để chỉ 1 request thắng khi gọi đồng thời.
- **Đăng xuất 1 thiết bị** (`POST /api/auth/logout`): xóa family hiện tại,
  xóa cookie.
- **Đăng xuất tất cả** (`POST /api/auth/logout-all`, nút ở `/account`):
  xóa mọi family của user **và tăng `token_version`** → access token cũ
  rớt ngay dù chưa hết 15 phút.
- **Thu hồi 1 thiết bị** (`DELETE /api/auth/sessions/:familyId`,
  trang `/account`): xóa family đó, các thiết bị khác không ảnh hưởng.
- **Đổi mật khẩu** (`POST /api/auth/change-password`, trang
  `/account/password`): kiểm tra mật khẩu cũ → băm Argon2id mới → xóa mọi
  family + tăng `token_version` (đá mọi thiết bị khác, access token cũ rớt
  ngay) → cấp cặp token mới cho thiết bị đang đổi.

## 3. Chống giả mạo token

- Dùng thư viện chuẩn `jose`, không tự chế JWT: ép thuật toán duy nhất
  `HS256`, kiểm tra `issuer`, `audience`, `exp` (xem `lib/auth/session.ts`).
- Khóa ký **xoay vòng theo `kid`**: `AUTH_SECRET` (ký mới, `kid=k1`) +
  `AUTH_SECRET_PREVIOUS` (chỉ verify token cũ, `kid=k0`). Secret tối thiểu
  32 ký tự, production thiếu secret thì server từ chối khởi động.
- Claims chống dùng lại sai mục đích: `sub` (user_id), `tv`
  (token_version), `iat`, `exp` 15 phút.
- Refresh token là chuỗi ngẫu nhiên, server **không tin payload** trong
  token: mọi quyết định đều dựa trên hàng trong database. Chỉ lưu
  **SHA-256 hash**, lộ database cũng không dùng được token.

## 4. Chống đánh cắp và dùng lại token lộ

- Cả 2 cookie đều `httpOnly + Secure (production) + SameSite=Lax + Path=/`.
  Tuyệt đối không đưa token ra JavaScript, `localStorage` hay URL.
- **Phát hiện dùng lại token cũ**: refresh token đã xoay vòng mà bị gửi lại
  (ngoài cửa sổ 60 giây) → coi như bị đánh cắp → **thu hồi cả family**,
  client nhận `401` kèm thông báo và phải đăng nhập lại.
- CSRF: cookie `SameSite=Lax` + mọi route thay đổi trạng thái đều kiểm tra
  `Origin` khớp `Host` (`lib/auth/guards.ts`). Client không phải trình duyệt
  (không gửi `Origin`) vẫn dùng được.
- Trang `/account` liệt kê mọi thiết bị đang đăng nhập để người dùng tự
  phát hiện và thu hồi phiên lạ.

## 5. Mật khẩu và chống dò (brute-force)

- Thuật toán: **Argon2id** qua `hash-wasm` (thuần WASM, không cần build
  native), tham số theo khuyến nghị OWASP: `m=19MiB, t=2, p=1`, salt ngẫu
  nhiên 16 byte, định dạng PHC `$argon2id$v=19$...` lưu trực tiếp.
- Băm/verify **bất đồng bộ**, không chặn event loop. Sai tài khoản hay sai
  mật khẩu đều trả cùng một thông báo
  `"Số điện thoại/email hoặc mật khẩu không đúng."` để chống dò tài khoản.
  Tài khoản `locked` bị chặn ngay ở service.

## 6. Rate limit bằng chính ScyllaDB (không RAM, không Redis)

Vì không dùng bộ nhớ RAM (tránh tràn RAM khi nhiều IP) và không thêm Redis,
bộ đếm đặt trong bảng `rate_limits`: mỗi hàng là một cửa sổ cố định
`bucket = "<loại>:<ip>:<số cửa sổ>"`, ghi bằng `INSERT ... IF NOT EXISTS`
và tăng bằng `UPDATE ... IF count = ?` (LWT) nên nhiều instance cùng đếm
chính xác mà không ghi đè lẫn nhau. Hàng tự xóa nhờ TTL (gấp đôi cửa sổ)
nên dung lượng luôn bị chặn trên, không phình theo thời gian.

| Route | Giới hạn | Cửa sổ |
|---|---|---|
| Đăng nhập | 10 lần | 10 phút / IP |
| Đăng ký | 5 lần | 1 giờ / IP |
| Refresh | 30 lần | 1 phút / IP |
| Đổi mật khẩu | 10 lần | 10 phút / IP |

Vượt hạn → `429` kèm header `Retry-After` và thông báo tiếng Việt.
Nếu ScyllaDB lỗi, guard **mở cho qua** (fail-open) để sự cố rate-limit
không khóa toàn bộ người dùng — kẻ tấn công làm sập DB thì bản thân DB
đã là vấn đề lớn hơn.

## 6. Vận hành

Biến môi trường (xem `.env.example`):

- `AUTH_SECRET` — khóa ký hiện tại, tối thiểu 32 ký tự ngẫu nhiên.
- `AUTH_SECRET_PREVIOUS` — khóa cũ, chỉ dùng khi vừa xoay key.

**Xoay key không downtime:**

1. Đặt secret mới vào `AUTH_SECRET`, chuyển secret cũ vào
   `AUTH_SECRET_PREVIOUS`, deploy. Token mới ký `k1`, token cũ `k0` vẫn
   verify được.
2. Sau 15 phút (hết hạn access token cũ), xóa `AUTH_SECRET_PREVIOUS`.

**Thu hồi khẩn cấp 1 tài khoản** (không cần deploy):

```cql
-- Đá mọi thiết bị + vô hiệu access token trong ≤ 15 phút:
-- 1. Xóa các family trong refresh_sessions / refresh_sessions_by_user
--    của user (xem user_id cần khóa).
-- 2. Tăng token_version:
UPDATE users_by_id SET token_version = 99 WHERE user_id = ?;
```

Thay đổi schema (bảng `refresh_sessions`, `refresh_sessions_by_user`,
`rate_limits`, cột `token_version`) nằm trực tiếp trong `schema.cql`; môi
trường dev dựng lại bằng `reset_data.sh`. Trong giai đoạn dev không dùng
migration file.

## 7. Giới hạn đã biết

- Rate-limit dùng cửa sổ cố định: request dồn đúng biên 2 cửa sổ có thể
  vượt hạn mức nhất thời tối đa ~2 lần trong thời gian ngắn — chấp nhận được
  cho mục đích chống dò; cần chặt hơn thì chuyển sang sliding-window log.
- Phát hiện đánh cắp ở mức **family/thiết bị**: lộ refresh token thì family
  đó bị thu hồi, các thiết bị khác an toàn; muốn đá toàn bộ phải bấm
  "Đăng xuất tất cả thiết bị" hoặc đổi mật khẩu.

## 8. Lộ trình tiếp theo

1. Bật OTP qua `phone_otps` (đã có bảng) cho vai trò
   `mechanic`/`dispatcher`/`admin` trước, `customer` sau.
2. Passkey/WebAuthn khi có nhu cầu đăng nhập không mật khẩu.
