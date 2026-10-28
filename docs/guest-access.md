# Tra cứu dịch vụ vãng lai (OTP qua email)

## 1. Vấn đề

Khách hàng đặt lịch sửa xe, gọi cứu hộ hoặc mua linh kiện mà **không tạo tài
khoản** vẫn phải nhập đủ họ tên + SĐT + email (xem
`lib/booking/booking.validation.ts`, `lib/rescue/rescue.validation.ts`). Sau khi
đặt, hệ thống đẩy khách tới `/track/booking/<uuid>` — link đó dùng **UUID làm
capability**, ai giữ link là xem được, không cần đăng nhập.

Nhưng khách lưu mất link, hoặc đóng tab, là mất hoàn toàn quyền truy cập. Muốn
xem lại thì phải đăng ký đủ 5 trường (tên / SĐT / email / mật khẩu / xác nhận) cho
một việc chỉ là xem.

Tính năng này giải quyết đúng chỗ đó: **xác minh email bằng OTP để lấy lại quyền
xem, không tạo tài khoản, không cần mật khẩu.**

## 2. Quyết định thiết kế

| Quyết định | Lý do |
|---|---|
| Nodemailer + SMTP generic | Chạy được với Gmail, Resend, Brevo, Mailtrap, SMTP doanh nghiệp. Chỉ đổi giá trị env, không khoá vào nhà cung cấp. |
| Phiên đọc nhẹ, **không tạo user row** | Khách chỉ muốn xem, không muốn có tài khoản. Không có mật khẩu nên không có bề mặt đăng nhập để tấn công. |
| Cookie ký HMAC `fw_gx` (stateless) | Không cần bảng session, không cần dọn dẹp. Tách khỏi `fw_at` / `fw_rt` nên đăng nhập / đăng xuất không ảnh hưởng lẫn nhau. |
| Bảng index theo email | `guest_bookings_by_phone` / `guest_orders_by_phone` key theo **SĐT**, không trả lời được câu hỏi "email này có gì?". |
| Mọi lỗi verify trả **cùng một thông báo** | Phân biệt "sai mã" / "hết hạn" / "chưa có mã" sẽ tiết lộ mã còn sống hay không. |
| PDF sinh **server-side** | jsPDF chỉ có font WinAnsi, nên phải nhúng font TrueType hỗ trợ dấu. Đọc font ở server giữ ~246 KB base64 ra khỏi trình duyệt và cho phép test trực tiếp trên output. |

## 3. Luồng

```
/lookup
  │
  ├─(1) nhập email  → POST /api/auth/otp/request   → gửi mã 6 chữ số
  ├─(2) nhập mã     → POST /api/auth/otp/verify    → set cookie fw_gx (7 ngày)
  └─(3) xem danh sách → GET  /api/guest-access/records
        └─(4) xem hoá đơn → GET /api/guest-access/invoice?type=&id=
             ├─(5) tải PDF   → GET /api/guest-access/invoice.pdf?type=&id=
             └─(6) theo dõi  → /track/booking/<id>  hoặc /track/order/<id>
```

Bước (5) không cần cookie: các route track vốn đã công khai theo capability. OTP
chỉ giữ vai trò **tìm lại** cái id mà khách đã lỡ mất.

## 4. Cấu hình SMTP

Thêm vào `.env.local`:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=your.address@gmail.com
MAIL_PASS=<App Password của Gmail>
MAIL_FROM=no-reply@yourdomain.vn
MAIL_FROM_NAME=FlashWrench
```

Với Gmail: bật 2FA rồi tạo **App Password** (mật khẩu tài khoản Google thường
không dùng được cho SMTP). `MAIL_HOST` + `MAIL_FROM` là cặp bắt buộc duy nhất;
thiếu một trong hai thì endpoint trả `503` chứ không giả vờ đã gửi.

Biến tuỳ chọn: `MAIL_TIMEOUT_MS` (mặc định 10000), `OTP_SECRET` (pepper cho
digest OTP, mặc định lấy `AUTH_SECRET`).

## 5. Migration

```bash
bun run scripts/migrate-guest-access.ts
```

Không destructive — thêm bảng mới và thêm cột `emergency_by_id.customer_email`.
Chạy lại nhiều lần vẫn an toàn (`CREATE TABLE IF NOT EXISTS`, lỗi "already
exists" được bỏ qua). **Không** backfill dữ liệu cũ: những dòng khách vãng lai đã
tạo trước khi có tính năng này sẽ không xuất hiện trong tra cứu.

## 6. Bảo mật

- **Mã băm có pepper.** `hashOtp` = HMAC-SHA256(`OTP_SECRET`, `purpose email
  code`). Mã 6 chữ số chỉ có 1 triệu giá trị nên hash trần sẽ bị dò ra ngay từ
  dump DB. HMAC còn ràng buộc digest vào đúng hàng của nó: hash bắt được ở email A
  không verify được ở email B.
- **Chống liệt kê email.** `requestEmailOtp` luôn trả 200 với cùng một shape,
  kể cả khi không tìm thấy gì — endpoint không dùng để dò ai có tài khoản ở đây.
- **Ngân sách đoán.** 5 lần sai thì huỷ mã (không chỉ tăng bộ đếm), nếu không kẻ
  kiên nhẫn sẽ có vô hạn lượt trong suốt 5 phút hiệu lực.
- **Cooldown gửi lại.** 60 giây / địa chỉ, chặn bomb thư vào một inbox.
- **Rollback khi gửi fail.** Code không gửi được thì xoá row, trả `502` — không để
  lại mã mà khách không bao giờ nhận được.
- **Rate limit.** Bucket `otp` trong `lib/auth/guards.ts`: 6 lần / 15 phút / IP,
  cộng thêm `enforceRequestGuards` kiểm tra CSRF origin.
- **Chống đọc chéo.** `requireGuestRecord` trả `404` giống hệt nhau cho "id không
  tồn tại" và "id thuộc về email khác".
- **Bỏ qua bản ghi đã claim.** Khi khách đăng ký và nhận luôn booking cũ, dòng
  index email vẫn còn; `listGuestRecords` lọc theo `customer_id` nên không
  phục vụ dữ liệu đã thuộc tài khoản.

## 7. PDF và font

`/api/guest-access/invoice.pdf` trả file `.pdf` thật, sinh server-side bằng
`jspdf` với font **Be Vietnam Pro** nhúng từ `asset/fonts/`.

Vì sao phải nhúng font: các font chuẩn tích hợp của jsPDF (Helvetica, Times,
Courier) chỉ hỗ trợ WinAnsi — mọi dấu tiếng Việt sẽ ra ô vuông. Be Vietnam Pro
là TrueType nét `glyf` (đúng định dạng jsPDF parse được) và phủ trọn bộ mã dựng
sẵn có dấu. jsPDF tự **subset** font theo những ký tự thực sự dùng, nên một hoá
đơn đầy đủ chỉ khoảng 30 KB dù file font gốc là 120 KB.

Vài điểm vận hành:

- **`asset/fonts` phải có mặt lúc chạy.** `dockerfile` đã copy
  `/app/asset/fonts` sang stage runner; thiếu dòng đó thì mọi hoá đơn PDF đều
  lỗi 500 trong production (chạy dev thì không sao vì `process.cwd()` là thư
  mục gốc dự án).
- **Font chỉ nằm trên server.** Nếu sinh PDF ở client, ~246 KB base64 sẽ nằm
  trong bộ nhớ trình duyệt chỉ để vẽ một tờ giấy.
- **Test khẳng định font thật sự được dùng** chứ không chỉ được nhúng:
  `tests/unit/invoice-pdf.test.ts` kiểm tra `FontFile2` (đã nhúng font TrueType)
  và `Type0` + `Identity-H` (mã hoá composite bắt buộc khi vượt khỏi Latin-1).
  Nếu chỉ kiểm tra `FontFile2` thì một bản font thiếu dấu vẫn qua.
- `window.print()` vẫn giữ lại như một lựa chọn in giấy; phần không thuộc hoá
  đơn được đánh dấu `print:hidden` bằng utility Tailwind, không cần file CSS
  in riêng.

## 8. Ranh giới đã biết

- **Không backfill.** Xem mục 5.
- **Email dùng chung cho cả nhà.** Một địa chỉ chung sẽ gộp lịch sử của mọi
  người dùng nó. Phiên này chỉ đọc và chỉ hiện dữ liệu đã liên kết với email đó —
  nhưng vẫn nên cân nhắc bước xác nhận SĐT ở giai đoạn sau.
- **Chưa có trang theo dõi công khai cho cứu hộ.** `trackHref` của dòng cứu hộ là
  `null` cho tới khi có route tương ứng.
- **Chưa có ETA trên booking.** `eta_min` mới chỉ có ở `emergency_by_id`.

## 9. Nhiều tab trên cùng trình duyệt

### Vấn đề

Đơn của khách vãng lai lưu với `customer_id = null` và trước đây **không gắn với
trình duyệt**. Khách đặt lịch ở tab A rồi mở tab B thì tab B không biết đơn đó
tồn tại; bản nháp và danh sách dịch vụ đã chọn nằm trong `sessionStorage` nên
cũng không sang được tab B. Tab B đang mở `/checkout` cũ có thể bấm đặt lại một
giỏ hàng vừa bị tab A dùng hết.

### Hướng xử lý

1. **Chỉ mục theo trình duyệt (`guest_records_by_gid`).** Mỗi booking / cứu hộ /
   đơn linh kiện của khách vãng lai được ghi thêm một dòng theo cookie `fw_gid`
   (cookie httpOnly sẵn có của giỏ hàng, UUID khó đoán). Nếu khách chưa có cookie
   thì route tạo mới. Dòng có TTL bằng tuổi cookie (30 ngày). Việc ghi là
   best-effort: lỗi chỉ mục không làm hỏng response 201.
2. **`GET /api/guest-access/recent`** trả tối đa 10 đơn gần nhất của trình duyệt,
   mới nhất trước. Người đã đăng nhập luôn nhận danh sách rỗng; đơn đã được claim
   vào tài khoản bị lọc theo `customer_id` giống luồng OTP.
3. **Menu "Đơn của bạn" trên header** (`GuestRecordsMenu`) chỉ hiện cho khách
   chưa đăng nhập khi có ít nhất một đơn. Badge đếm số đơn còn đang xử lý; dòng
   cứu hộ chưa có trang theo dõi công khai nên dẫn về `/lookup`. Query bật
   `refetchOnWindowFocus` nên chuyển sang tab cũ là tự cập nhật.
4. **Đồng bộ giữa các tab (`BroadcastChannel`).** Khi đặt lịch, gửi cứu hộ, thanh
   toán hay sửa giỏ hàng thành công, tab đó phát một sự kiện trên kênh
   `flashwrench-sync`. Các tab còn lại làm mới cache (đơn gần đây, giỏ hàng, lịch
   sử), bỏ các dịch vụ vừa đặt khỏi danh sách đang chọn để tránh đặt trùng, và
   hiện toast giải thích. Trình duyệt không có `BroadcastChannel` dùng sự kiện
   `storage` của `localStorage` thay thế. Sự kiện chỉ là tín hiệu: tab nhận luôn
   tải lại dữ liệu thật qua HTTPS.

### Migration

```bash
bun run scripts/migrate-guest-records.ts
```

Không destructive, chạy lại an toàn. Không backfill: đơn tạo trước khi có tính
năng này vẫn tìm được qua link email hoặc `/lookup`.

### Ranh giới

- Cookie `fw_gid` bị xoá khi khách đăng ký hoặc đăng nhập (giỏ hàng được gộp vào
  tài khoản), nên menu biến mất đúng lúc lịch sử chuyển sang tài khoản. Đơn cũ
  của trình duyệt khi đó vẫn tìm lại được qua `/lookup`.
- Trình duyệt khác hoặc chế độ ẩn danh không thấy đơn của nhau — khi đó vẫn dùng
  `/lookup`.
- Máy dùng chung: người dùng tiếp trình duyệt đó trong thời hạn cookie sẽ thấy
  menu và mở được link theo dõi — tương đương lịch sử duyệt web vốn đã chứa các
  link `/track/...` này. Menu chỉ đọc, không lộ thêm dữ liệu nào ngoài tóm tắt
  mà `/lookup` hiển thị.
- Bản nháp form vẫn cố ý giữ trong `sessionStorage` (theo từng tab) vì chứa thông
  tin cá nhân đang gõ dở.

## 10. Bản đồ mã nguồn

| Lớp | File |
|---|---|
| Config SMTP | `lib/mail/mail.config.ts` |
| Transport | `lib/mail/mailer.service.ts` |
| Template OTP | `lib/mail/otp-email.ts` |
| Sinh mã / hash | `lib/otp/otp-code.ts` |
| Validate input | `lib/otp/otp.validation.ts` |
| CQL | `lib/otp/otp.repository.ts` |
| Điều phối | `lib/otp/otp.service.ts` |
| Cookie phiên | `lib/auth/guest-access.ts` |
| Index email | `lib/guest-access/guest-access.repository.ts` |
| Tra cứu + chống truy cập chéo | `lib/guest-access/guest-access.service.ts` |
| Hoá đơn 3 loại | `lib/guest-access/guest-invoice.service.ts` |
| Nhãn + định dạng dùng chung | `lib/guest-access/guest-access.format.ts` |
| Font PDF | `lib/pdf/pdf-fonts.ts` |
| Vẽ PDF | `lib/pdf/invoice-pdf.draw.ts`, `lib/pdf/invoice-pdf.ts` |
| API | `app/api/auth/otp/*`, `app/api/guest-access/*` |
| Client | `services/guest-access.api.ts`, `hooks/guest-access.ts` |
| UI | `app/lookup/page.tsx`, `components/guest-access/*` |
| Chỉ mục theo trình duyệt | `lib/guest-records/*`, `app/api/guest-access/recent/route.ts`, `scripts/migrate-guest-records.ts` |
| Tóm tắt đơn dùng chung | `lib/guest-access/guest-record-summaries.ts` |
| Đồng bộ nhiều tab | `lib/cross-tab/*`, `hooks/useCrossTabSync.ts`, `components/providers/LazyCrossTabSync.tsx` |
| Menu header | `components/layout/GuestRecordsMenu.tsx`, `components/layout/GuestRecordMenuItem.tsx` |
| Test | `tests/unit/cross-tab-protocol.test.ts`, `tests/unit/cross-tab-bus.test.ts`, `tests/unit/guest-records-menu.test.ts`, `tests/integration/guest-records.service.test.ts`, `tests/integration/guest-records.routes.test.ts`, `tests/integration/guest-records.create-routes.test.ts`, `tests/unit/otp-code.test.ts`, `tests/unit/otp-validation.test.ts`, `tests/unit/guest-access-token.test.ts`, `tests/unit/invoice-pdf.test.ts`, `tests/integration/otp.service.test.ts`, `tests/integration/guest-access.service.test.ts`, `tests/integration/guest-invoice.service.test.ts` |
