# Ví voucher gắn tài khoản

Mỗi voucher là một hàng trong ví của đúng một `user_id`, không có mã
dùng chung nên không chia sẻ hay đoán được.

## Bảng ScyllaDB

- `voucher_campaigns_by_id` + `voucher_campaigns_by_code`: định nghĩa
  chiến dịch (ảnh bìa, loại giảm, mệnh giá, phạm vi, thời gian, tổng
  số lượng, giới hạn mỗi khách, cờ điều phối).
- `voucher_wallets_by_id`: một voucher của một khách
  (`active | used | expired | revoked`).
- `voucher_wallets_by_user`: ví của tôi, mới nhất trước.
- `voucher_wallets_by_campaign`: ai đã nhận một chiến dịch (đối soát).

Chạy migration không xóa dữ liệu:

```bash
bun run scripts/migrate-vouchers.ts
```

## Phân quyền

- Admin (`/admin/vouchers`): tạo/sửa/bật/tắt chiến dịch, tải ảnh bìa
  scope `promotion`, phát và thu hồi mọi voucher.
- Điều phối (`/dispatch/vouchers`): chỉ phát chiến dịch có
  `allow_dispatcher_grant`, bị chặn khi vượt `dispatcher_max_value`,
  hết `total_limit` hoặc quá `per_user_limit`. Chỉ thu hồi voucher
  mình đã phát.
- Khách (`/vouchers`): xem ví của chính mình.

## Ảnh

Scope media mới `promotion`, chỉ admin tải lên. Dialog admin tải ảnh
trước, lưu chiến dịch mới trỏ asset về `campaign_id` thật, đổi ảnh thì
tỉa ảnh cũ.

## Websocket

- Topic công khai `promotions`: chiến dịch đổi là mọi màn hình voucher
  tự invalidate query.
- Inbox riêng `user:{id}`: được phát/thu hồi/dùng voucher là ví của
  khách đó tự làm mới.
- Bàn staff `operations`: điều phối và admin thấy ví đổi mà không cần
  tải lại trang.

Sự kiện chỉ mang `kind + id`, dữ liệu thật luôn fetch lại qua HTTPS.

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
