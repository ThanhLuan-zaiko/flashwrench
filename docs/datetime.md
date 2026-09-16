# Giờ giấc FlashWrench — instant chuẩn UTC, zone đi kèm đơn

Quy ước này để webapp mở rộng ra nước ngoài mà không sai giờ. Ba câu
làm kim chỉ nam: **lưu instant, truyền zone, hiển thị tường minh**.

## 1. Lưu trữ: chỉ instant (UTC)

- Mọi cột `TIMESTAMP` trong ScyllaDB là một thời điểm tuyệt đối, không
  gắn múi giờ. `new Date(iso).getTime()` và `Date.now()` so sánh trực
  tiếp được ở mọi nơi — kiểm tra khung giờ (sớm nhất 1 tiếng, xa nhất
  30 ngày) luôn đúng dù server chạy ở zone nào.
- Riêng `bookings_by_id` có thêm cột `timezone` (IANA, ví dụ
  `Asia/Ho_Chi_Minh`): zone **nơi công việc diễn ra**, dùng để hiển thị
  và chia bucket lịch. Các hàng cũ (`timezone = null`) hiển thị theo
  zone của người xem.

## 2. Truyền: giờ phải kèm múi giờ

- `POST /api/bookings` **từ chối** chuỗi wall-time không offset
  (`2026-09-17T09:00` → 400): chuỗi này `new Date()` sẽ parse theo
  zone của server, container UTC là lệch hết đơn.
- Client (`BookingForm`) chuyển `datetime-local` (giờ tường của trình
  duyệt) thành ISO UTC (`.toISOString()`) và gửi kèm `timeZone` lấy từ
  `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- `timeZone` vắng mặt → server dùng `DEFAULT_TIME_ZONE`
  (`lib/datetime/timezone.ts`, hiện là `Asia/Ho_Chi_Minh`); zone lạ →
  400. Đây là default **có tài liệu, override được** — khác với việc
  lặng lẽ lấy zone server.

## 3. Bucket lịch: wall-month của zone, không phải UTC

- `monthKey(date, zone)` (`lib/mechanic/mechanic-period.ts`) cho mọi
  bucket dispatcher/thống kê. Ví dụ: đơn 00:30 ngày 01/10 (giờ +07)
  vẫn là tháng 9 theo UTC — bucket UTC sẽ giấu đơn khỏi dispatcher
  tháng 10.
- Mọi hàm period đã nhận `timeZone` tường minh, default là home zone
  để code cũ không đổi output.

## 4. Hiển thị: luôn ghi rõ zone

- `formatDateTime` / `formatShortDateTime` (`lib/datetime/format.ts`):
  locale `vi-VN`, zone tường minh, kèm hậu tố offset (`GMT+7`).
- Giờ hẹn đơn (`BookingSuccess`, `BookingCard`, `BookingInfo`,
  `NavigationList`) render theo `booking.timezone`.
- `MECHANIC_TIME_ZONE` trong `mechanic-format.ts` và
  `mechanic-period.ts` là **default**, không phải hardcode: truyền zone
  khác vào là xong khi có thị trường mới.

## 5. Checklist khi thêm quốc gia mới

1. Không thêm `getHours()`/`getFullYear()` phía server — dùng instant
   hoặc `monthKey`/`dayKey` với zone.
2. Mọi input giờ từ client phải là ISO có offset + `timeZone`.
3. Hiển thị giờ hẹn: lấy zone theo đơn, không theo server.
4. Thống kê "hôm nay/tháng này": truyền zone vận hành vào hàm period.
5. Không cần đổi schema: `timezone` đã nằm trên đơn từ đầu.
