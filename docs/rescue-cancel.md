# Khách tự hủy cứu hộ (trước khi thợ xuất phát)

## 1. Vấn đề

Cứu hộ là luồng khẩn cấp: khách gửi yêu cầu, hệ thống tự động offer cho thợ
gần nhất theo chu kỳ 30 giây, thợ accept rồi xuất phát. Nhưng nhiều khách tự
xử lý được giữa chừng — xe nổ lại, người quen tới giúp, tìm được chỗ sửa gần.

Trước đây khách muốn hủy **phải gọi hotline** để điều phối viên bấm hủy hộ
(`PATCH /api/dispatch/rescue/<id>`). Trong lúc chờ gọi, hệ thống vẫn chạy offer
cycle và thợ có thể đang lăn bánh tới — phí thời gian cả ba phía.

Tính năng này cho khách có tài khoản **tự kéo ca về** khi còn sớm, với rào chắn
đủ chặt để không làm thợ mất chuyến oan.

## 2. Quyết định thiết kế

| Quyết định | Lý do |
|---|---|
| Chỉ customer đã đăng nhập (`customer_id === actor.id`) | Ownership chứng minh được bằng session. |
| **Guest vẫn gọi hotline** | Link tracking (`/api/rescue/<id>/track`) là capability shareable — ai được forward SMS/email đều giữ link. Gắn hủy vào link nghĩa là ai có link đều hủy được ca của người khác. |
| Cửa sổ hủy: `open`, `dispatched`, `accepted` | Thợ chưa lăn bánh thì hủy không tốn chi phí chuyến đi. `dispatched` (offer đang sống) và `accepted` (thợ đã nhận nhưng chưa depart) đều còn "miễn phí" về mặt vận hành. |
| Từ `en_route` trở đi → hotline/dispatcher | Thợ đã bỏ xăng/thời gian. Hủy lúc này cần con người quyết (kèm chính sách phí hủy nếu có sau này) — không để khách tự ý. |
| Bắt buộc lý do 1–300 ký tự | Đồng nhất booking cancel + dispatcher cancel; timeline/audit cần ngữ cảnh, và product đọc được lý do hủy. |
| Dùng lại `claimRescueTransition` (CAS) | Cùng cơ chế chống race mà dispatcher cancel đang dùng — hai bên ghi đè cùng lúc thì CAS quyết định, không có ghi đè mờ. |
| CAS thua → **re-read 1 lần rồi thử lại** | Offer cycle 30s khiến row đổi trạng thái liên tục (expire → re-offer, thợ accept). Một lần re-read hấp thụ race phổ biến mà không bắt khách reload; vẫn thua lần hai thì 409. |
| `RescueCancelSection` tự gate theo role | Component kiểm tra `useMe().role === "customer"` — render được trong `RescueTracker` (trang public, guest cũng xem) mà không sợ lộ nút cho guest. Server vẫn kiểm tra lại ownership. |

## 3. Vòng đời status và ai hủy được

```
open ──offer──> dispatched ──accept──> accepted ──depart──> en_route ──arrive──> arrived ──complete──> completed
  │                │                    │                   │
  └──khách + điều phối hủy được─────────┘                   └── chỉ điều phối/admin hủy được ──┘
                  (điều phối hủy được MỌI trạng thái active, kể cả en_route/arrived)
```

| Trạng thái | Khách (account) | Guest | Điều phối viên / Admin |
|---|---|---|---|
| `open` | Có | Không | Có |
| `dispatched` | Có | Không | Có |
| `accepted` | Có | Không | Có |
| `en_route` | Không | Không | Có |
| `arrived` | Không | Không | Có |
| `cancelled` / `completed` | — | — | — |

Hằng số chung server + UI: `CUSTOMER_CANCELLABLE_RESCUE_STATUSES` và
`canCustomerCancelRescue()` trong `lib/rescue/rescue-status.ts`.

## 4. API contract

```
PATCH /api/rescue/<requestId>
{ "action": "cancel", "note": "<lý do 1–300 ký tự>" }
```

Route `app/api/rescue/[requestId]/route.ts` giờ rẽ nhánh theo `action`:

- `cancel` → `requireRole("customer")` → `cancelCustomerRescue()`
- còn lại (`accept`, `decline`, `depart`, `arrive`, `complete`) → giữ nguyên
  `requireRole("mechanic")` → `applyRescueMechanicAction()`

| Code | Khi nào |
|---|---|
| 200 `{ rescue: { requestId, status: "cancelled" } }` | Hủy thành công |
| 400 `errors.note` | Thiếu lý do / quá 300 ký tự |
| 400 `errors.form` | Status `en_route`/`arrived` ("Thợ đã xuất phát…") hoặc đã đóng |
| 401 | Chưa đăng nhập / token hết hạn (client sẽ refresh + retry một lần) |
| 403 | Đăng nhập nhưng không phải customer |
| 404 | Không tìm thấy, hoặc ca không thuộc account này (kể cả ca của guest — `customer_id` null) |
| 409 | Row nhảy trạng thái liên tục qua cả 2 attempt — khách tải lại rồi thử lại |

## 5. Race và tính nhất quán

`lib/rescue/rescue-customer-actions.service.ts` viết theo mô hình CAS:

1. Đọc row → kiểm tra `customer_id` + status thuộc cửa sổ hủy.
2. `claimRescueTransition` — `UPDATE ... IF status = ? AND
   assigned_mechanic_id = ? AND updated_at = ?`. Ai ghi trước thắng.
3. Thua claim → đọc lại **đúng một lần**:
   - trạng thái mới vẫn trong cửa sổ (vd `dispatched`→`accepted`) → thử lại;
   - đã qua `en_route`/`arrived`/đóng → trả 400 với thông báo phù hợp;
   - thua lần hai → 409.
4. Thắng claim → `projectRescueTransition` ghi history
   (`changed_by = customer id`, `note = lý do`), xóa row `emergency_by_mechanic`
   của thợ đang được offer (card trong inbox thợ tự rơi ra), cập nhật
   `emergency_by_customer`.
5. `publishRescueChange("rescue-updated", ...)` — realtime báo cho topic của
   thợ được giao (nếu có), chủ ca, dispatcher board (`operations`) và zone.

Race đối xứng cũng được CAS xử lý: nếu thợ bấm **accept** đúng lúc khách bấm
**hủy**, một trong hai `UPDATE ... IF` thua và nhận 409/"vừa được cập nhật" —
không bao giờ có trạng thái nửa vời.

## 6. Luồng phía client

```
RescueCancelSection (components/rescue/RescueCancelSection.tsx)
  │ gate: me.role === "customer" && canCustomerCancelRescue(status)
  │
  ├─(1) nút "Hủy yêu cầu cứu hộ"  → mở form 2-bước
  ├─(2) textarea lý do (bắt buộc, max 300) → "Xác nhận hủy"
  └─(3) useCancelRescue → cancelRescueRequest → PATCH qua apiRequest
        ├─ 401 → /api/auth/refresh → replay 1 lần (trong suốt)
        ├─ refresh cũng hỏng → useSessionExpired: toast + /login?next=/history/rescue
        └─ 200 → toast thành công + invalidate rescueKeys.all
```

Hai nơi gắn section:

- `components/rescue/RescueTracker.tsx` — panel sau khi tạo ca ở `/rescue`.
  Guest xem trang này vẫn không thấy nút (component tự trả null).
- `components/history/HistoryRescueDialog.tsx` — dialog chi tiết trong
  `/history/rescue`, nằm ngay dưới nút "Gọi hotline".

Sau khi hủy thành công: `useRescueTracking` poll lần kế (hoặc invalidate) thấy
`cancelled` → tracker chuyển sang khối "đã hủy + gọi hotline nếu vẫn cần".

## 7. Test

`tests/integration/rescue-customer-actions.service.test.ts` — 9 case, mock
repository + publish qua `tests/helpers/rescue.mocks.ts` (thêm `claimResults`
queue để dựng kịch bản CAS thắng/thua xen kẽ):

- hủy `open` / `dispatched` / `accepted` kèm giải phóng thợ + publish;
- từ chối `en_route`, `arrived`, `completed`, `cancelled`;
- 404 khi ca thuộc account khác hoặc của guest (`customer_id` null);
- 403 non-customer, 400 id xấu, 400 note thiếu/quá dài;
- race: thua claim rồi re-read thấy `en_route` → 400 "xuất phát";
- race: thua claim rồi re-read thấy `accepted` → claim lại thành công;
- thua cả hai attempt → 409.

## 8. Chưa làm (ranh giới cố ý)

- **Guest tự hủy** — cần xác thực trước (OTP theo email/SĐT kiểu
  `guest-access`, hoặc signed cancel token gửi qua kênh liên hệ gốc). Không bao
  giờ gắn hủy vào tracking link trần.
- **Hủy khi thợ `en_route`+** — vẫn là việc của dispatcher (họ hủy được tới
  `arrived`). Nếu product muốn khách tự hủy đoạn này, cần chính sách phí hủy /
  bồi thường thợ trước.
- **Rate limit hủy** — CAS + ownership đã chặn abuse lớn; nếu thấy khách spam
  tạo→hủy thì thêm bucket riêng sau.
