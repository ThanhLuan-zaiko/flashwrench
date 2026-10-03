# Ví voucher gắn tài khoản

Mỗi voucher là một hàng trong ví của đúng một `user_id`, không có mã
dùng chung nên không chia sẻ hay đoán được.

## Bảng ScyllaDB

- `voucher_campaigns_by_id` + `voucher_campaigns_by_code` +
  `voucher_campaigns_by_slug`: định nghĩa chiến dịch (gallery ảnh, loại
  giảm, mệnh giá, phạm vi, thời gian, tổng số lượng, giới hạn mỗi
  khách, cờ điều phối, `is_deleted` + `deleted_at`). Hai bảng claim
  giữ `code` và `slug` duy nhất qua `INSERT ... IF NOT EXISTS`.
- `voucher_wallets_by_id`: một voucher của một khách
  (`active | used | expired | revoked`).
- `voucher_wallets_by_user`: ví của tôi, mới nhất trước.
- `voucher_wallets_by_campaign`: ai đã nhận một chiến dịch (đối soát).

Admin không gõ mã tay: dialog `/admin/vouchers` nhận một **slug** (tự
sinh từ tên, sửa được, có nút "Tạo từ tên"), server derive `code` bằng
cách viết hoa và đổi gạch ngang thành gạch dưới (`chao-mung` →
`CHAO_MUNG`). Cả slug lẫn code khóa sau khi tạo.

Chạy migration không xóa dữ liệu (backfill slug cho chiến dịch cũ từ
code, va chạm slug được hậu tố id; thêm `images`/`is_deleted`/
`deleted_at` cho vòng đời thùng rác):

```bash
bun run scripts/migrate-vouchers.ts
bun run scripts/migrate-voucher-slugs.ts
bun run scripts/migrate-voucher-lifecycle.ts
```

## Vòng đời chiến dịch

Giống `/admin/products/*`: xóa mềm chuyển chiến dịch vào Thùng rác
(`is_deleted=true`), khôi phục đưa về trạng thái cũ (`is_active` giữ
nguyên), xóa cứng là `DELETE` với `{"confirm": "<slug>"}` — gõ đúng slug
mới mở khóa.

- Xóa mềm chặn phát mới: dispatch picker, `grantWallet`, auto-rule và
  win-back đều bỏ qua chiến dịch đã xóa; voucher đã vào ví khách vẫn
  dùng được.
- Xóa cứng chỉ chạy khi `confirm` khớp slug VÀ không còn ví `active`
  (`countActiveWalletsForCampaign` quét partition
  `voucher_wallets_by_campaign`) — vì `redeemWallet` đọc lại chiến dịch
  để lấy `scope`/`min_order`. Batch xóa cả `by_id`, `by_code`,
  `by_slug` rồi tỉa asset media của owner.

## Phân quyền

- Admin (`/admin/vouchers`): tạo/sửa/bật/tắt chiến dịch, gallery tối đa
  5 ảnh scope `promotion` (ảnh đầu làm ảnh bìa), xóa mềm/khôi phục/xóa
  cứng, phát và thu hồi mọi voucher.
- Điều phối (`/dispatch/vouchers`): chỉ phát chiến dịch có
  `allow_dispatcher_grant`, bị chặn khi vượt `dispatcher_max_value`,
  hết `total_limit` hoặc quá `per_user_limit`. Chỉ thu hồi voucher
  mình đã phát.
- Khách (`/vouchers`): xem ví của chính mình.

## Ảnh

Scope media `promotion`, chỉ admin tải lên. Dialog dùng deferred
gallery giống parts: ảnh chỉ là preview local (object URL) tới khi bấm
lưu, upload lỗi thì abort trước khi ghi chiến dịch. `images[]` lưu tối
đa 5 url `/api/media/promotion/…`, `image_url` giữ ảnh bìa (`images[0]`)
để ví và picker đọc một cột. Sửa ảnh thì `pruneOwnerAssets` tỉa asset
bị gỡ.

## Websocket

- Topic công khai `promotions`: chiến dịch đổi là mọi màn hình voucher
  tự invalidate query.
- Inbox riêng `user:{id}`: được phát/thu hồi/dùng voucher là ví của
  khách đó tự làm mới.
- Bàn staff `operations`: điều phối và admin thấy ví đổi mà không cần
  tải lại trang.

Sự kiện chỉ mang `kind + id`, dữ liệu thật luôn fetch lại qua HTTPS.

## Trang chi tiết

Giữ nguyên `/vouchers` (ưu đãi đang chạy + ví của tôi), nút trên thẻ
mở trang chi tiết đọc toàn bộ thông tin:

- `/vouchers/c/[slug]` (công khai, không cần đăng nhập): gallery,
  mệnh giá, phạm vi, đơn tối thiểu, khung giờ, suất còn lại, cách
  nhận. Slug lạ hoặc chương trình đã kết thúc hiện panel dẫn về
  `/vouchers`. API `GET /api/voucher-campaigns/public/[slug]`.
- `/vouchers/w/[walletId]` (chủ ví, 404 với tài khoản khác): trạng
  thái, mệnh giá, phạm vi, đơn tối thiểu, ngày nhận/hạn dùng/lúc
  dùng, nút sang đặt lịch hoặc mua linh kiện khi còn hiệu lực. API
  `GET /api/vouchers/[walletId]`.

Cả hai dùng tiền tố tĩnh (`c`, `w`) nên không đụng pager
`/vouchers/page/N`. Shell `VouchersRouteShell` giữ mount một lần,
`page.tsx` chỉ metadata như `/products/*`.

## Phase 2 — tính tiền giả lập

Tiền vẫn giả lập như thanh toán hiện tại (`MOCK-*`, không tiền thật),
nhưng voucher giờ trừ thẳng vào đơn:

- Checkout tài khoản (`POST /api/orders`, `walletId`): voucher phải
  thuộc đúng tài khoản, còn hiệu lực, đúng phạm vi (`order`/`all`),
  đạt `min_order` trên tiền hàng. Đơn ghi `discount`,
  `coupon_code = wallet_id`, `total = subtotal + ship - discount` nên
  hàng thanh toán giả lập tự phản ánh số đã giảm. Khách vãng lai gửi
  `walletId` bị từ chối kèm lời mời tạo tài khoản.
- Đặt lịch tài khoản (`POST /api/bookings`, `walletId`): tương tự với
  phạm vi (`booking`/`all`) trên giá dịch vụ, `total = giá - giảm`.
- Bán tại quầy giữ nguyên giá (khách quầy không tài khoản, không ví) —
  đây chính là điểm đẩy khách tạo tài khoản.
- Hủy/hoàn (`cancelled`/`refunded` cho đơn, hủy lịch của khách, điều
  phối và thợ): ví đã tiêu được trả về active (quá hạn thì về expired),
  cả ba màn hình ví tự làm mới qua `user:{id}` + `operations`.
- Ghi đơn lỗi giữa chừng (hiếm): đặt chỗ ví được thả ra active để
  khách giữ lại voucher.

Giao diện: ô chọn voucher chung (`WalletPicker`) ở checkout và form
đặt lịch, chỉ hiện voucher còn hiệu lực + đúng phạm vi + đạt đơn tối
thiểu, kèm xem trước số tiền giảm và tổng phải trả.

## Phase 3 — phát tự động theo quy tắc

Thay vì nhân viên phát tay, hệ thống tự cấp voucher vào ví khi khách
chạm điều kiện. Quy tắc trỏ vào một chiến dịch sẵn có nên mọi giới hạn
của chiến dịch (active, khung giờ, `total_limit` qua CAS slot,
`per_user_limit`) vẫn được tôn trọng y như phát tay; voucher tự động
ghi `granted_by = NULL` (hệ thống) và note `Tự động: <tên quy tắc>`.

### Bảng ScyllaDB mới

- `voucher_auto_rules_by_id`: cấu hình quy tắc (`trigger_type`,
  `threshold`, `window_days`, `is_active`, `granted_count`, …).
- `voucher_auto_grants_by_rule` `(rule_id, user_id, dedupe_key)`:
  sổ cái chống trùng. `INSERT ... IF NOT EXISTS` là điểm tuần tự hóa —
  một cột mốc chỉ trả thưởng đúng một lần dù event lặp/retry/cạnh tranh.
- `customer_stats_by_id`: rollup mỗi khách (`completed_bookings`,
  `completed_orders`, `total_spent`, `last_activity_at`), cập nhật delta
  tại các điểm chuyển trạng thái bằng CAS; lần đầu thiếu hàng sẽ
  backfill từ chính partition `*_by_customer` của khách đó.

Chạy migration (an toàn chạy lại, không đụng dữ liệu):

```bash
bun run scripts/migrate-voucher-rules.ts
```

### Các trigger hỗ trợ

| `trigger_type` | Kích hoạt khi | `threshold` / `window_days` |
|---|---|---|
| `signup` | Khách đăng ký tài khoản | Không cần |
| `booking_count` | Mỗi N lần sửa xong | `threshold` = N |
| `order_count` | Mỗi N đơn đã giao | `threshold` = N |
| `order_value` | Mỗi đơn đã giao ≥ N đ | `threshold` = N (đ) |
| `spend_total` | Mỗi mốc N đ chi tiêu tích lũy | `threshold` = N (đ) |
| `review_created` | Mỗi đánh giá khách gửi | Không cần |
| `win_back` | Khách vắng ≥ `window_days` ngày | `window_days` = N |

Dedupe key theo mốc/sự kiện: `signup`, `b<n>` (lần sửa thứ n·threshold),
`o<n>`, `order:<orderId>`, `s<n>` (mốc chi tiêu), `review:<ref>`,
`wb:<YYYY-MM>` (win-back tối đa một lần/tháng/khách).

### Điểm hook (best-effort, không bao giờ làm hỏng nghiệp vụ gốc)

- `lib/auth/auth.service.ts` → `handleVoucherSignup` sau khi tạo tài
  khoản customer.
- `lib/mechanic/mechanic-bookings.service.ts` →
  `handleVoucherBookingCompleted` khi action `complete`.
- `lib/orders/orders.service.ts` → `handleVoucherOrderDelivered` /
  `handleVoucherOrderRefunded` trong `applyStatusChange`. Hoàn tiền
  giảm counter + doanh thu tích lũy nhưng **không** thu hồi voucher đã
  phát.
- `lib/booking/review.service.ts`, `lib/reviews/order-review.service.ts`,
  `lib/reviews/rescue-review.service.ts` → `handleVoucherReviewCreated`
  với ref `bookingId` / `order:<id>` / `part:<order>:<part>` /
  `rescue:<id>`.

Mọi call site bọc `.catch(() => undefined)`: lỗi voucher không làm
đăng ký / hoàn thành đơn / giao hàng / đánh giá thất bại.

### Win-back scan

Chạy tự động mỗi ngày lúc 03:00 (giờ máy chủ) bên trong tiến trình
realtime gateway — xem `realtime/winback-loop.ts`, khởi động cùng
`realtime/server.ts` qua `dev:all` / `start:all`. Timer được chống lặp
bằng global flag nên hot reload không nhân đôi; dedupe `wb:<YYYY-MM>`
bảo đảm nhiều replica chạy chồng cũng không phát trùng.

Chạy tay hoặc gắn cron ngoài vẫn được (idempotent):

```bash
bun run scripts/voucher-winback-scan.ts
```

Quét `customer_stats_by_id` (giới hạn 2000 khách), khách có
`last_activity_at` cũ hơn `window_days` nhận voucher — đã dedupe theo
tháng nên chạy lại trong tháng không phát trùng.

### API + UI điều phối

- `GET/POST /api/dispatch/voucher-rules`, `PATCH
  /api/dispatch/voucher-rules/[ruleId]`, `GET /api/dispatch/voucher-progress`
  — dispatcher + admin. Nối quy tắc vào chiến dịch = quyền phát chiến
  dịch đó: dispatcher bị chặn bởi `allow_dispatcher_grant` +
  `dispatcher_max_value` y như phát tay.
- `/dispatch/vouchers` có thêm section "Tự động phát theo quy tắc"
  (tạo/bật-tắt quy tắc, đếm lượt đã phát) và "Khách sắp đạt mốc"
  (khách còn 1 bước, hoặc trong 20% mốc chi tiêu) với nút copy ID để
  phát tay nếu muốn thưởng sớm.
