# Realtime (WebSocket hai chiều)

Xương sống realtime của FlashWrench là gateway WebSocket chạy bằng Bun
(`realtime/server.ts`). Mọi tính năng — theo dõi booking, điều phối cứu hộ,
chat, thông báo, mật khẩu tạm của nhân viên — đều dùng chung một socket và
một bộ protocol, thay vì mỗi nơi tự dựng một kênh riêng.

## Chạy

```bash
bun run dev:all   # Next.js + gateway cùng lúc (khuyên dùng khi dev)
bun run realtime  # chỉ gateway (mặc định port 3001)
```

Production: chạy `realtime/server.ts` cạnh Next.js (process thứ hai trong
container hoặc service riêng). Không cần Redis khi còn một instance.

## Protocol

Client gửi JSON một dòng:

| type          | field                | Ý nghĩa                          |
| ------------- | -------------------- | -------------------------------- |
| `subscribe`   | `topic`              | nghe một topic                   |
| `unsubscribe` | `topic`              | thôi nghe                        |
| `publish`     | `topic`, `payload`   | gửi lên topic (cần quyền)        |
| `ping`        | —                    | giữ kết nối (`pong` trả về)      |

Server trả về `event` (`topic`, `payload`, `from`), `subscribed`,
`unsubscribed`, `pong` hoặc `error`. Định nghĩa và validate nằm ở
`lib/realtime/protocol.ts` — dùng chung cho server lẫn client.

## Topic và phân quyền

| Topic                    | Nghe                       | Gửi từ browser              |
| ------------------------ | -------------------------- | --------------------------- |
| `staff-passwords`        | admin                      | server-only (route publish) |
| `user:{userId}`          | chính chủ hoặc admin       | server-only                 |
| `booking:{id}`           | đã đăng nhập (v1, sẽ siết theo participant) | server-only |
| `booking:{id}:chat`      | đã đăng nhập (v1, như trên) | đã đăng nhập               |
| `emergency:zone:{zoneId}`| thợ / điều phối / admin    | thợ / điều phối / admin     |
| topic lạ                 | từ chối                    | từ chối                     |

Auth lúc upgrade dùng cookie `fw_at` qua `authenticate()` nên quyền role
luôn lấy từ DB, không tin client.

## Cưỡng chế đăng xuất khi admin khóa tài khoản

Luồng này là ví dụ chuẩn cho "một tài khoản bị đá ra ngay lập tức", dùng
đúng 4 bước và không cần thêm topic mới:

1. **Máy chủ (ScyllaDB):** `applyAdminUserAction(..., "lock")` tăng
   `token_version` và xóa mọi family trong `refresh_sessions` của tài khoản
   (`revokeUserSessions`) → access token cũ vô hiệu ngay, không thể refresh
   lại ở bất kỳ thiết bị nào.
2. **Máy chủ (realtime):** route `PATCH /api/admin/users/[userId]` phát
   `publishRealtimeEvent(userTopic(id), { kind: "locked" })`.
3. **Máy chủ (`/api/auth/me`):** trả `{ user, status }` với
   `status = "locked" | "deleted" | "active"` — nhờ vậy trình duyệt phân
   biệt được "hết phiên bình thường" và "bị admin khóa".
4. **Trình duyệt (`AccountLockGuard`):** nghe `user:{id}` để thoát ngay,
   **đồng thời** đối chiếu `/api/auth/me` mỗi 60 giây, khi cửa sổ được
   focus, và mỗi lần socket nối lại. Nhờ hai nguồn độc lập này, thông báo
   khóa vẫn tới nạn nhân kể cả khi gateway đang tắt hoặc socket vừa đứt.
   Người dùng nhận toast, một overlay chặn toàn bộ trang, và trang
   `/login?locked=1` hiển thị thông báo còn lưu lại sau khi đã chuyển trang.

Vì `authenticate()` từ chối tài khoản `locked`/`deleted`, mọi API khác cũng
tự trả `401` ngay sau khi khóa, không cần thêm logic ở từng route.

## Thêm topic mới (4 bước)

1. Thêm helper tạo tên topic vào `lib/realtime/protocol.ts`.
2. Thêm quyền vào `canSubscribe` / `canPublish` (mặc định từ chối).
3. Phía server (route handler): `publishRealtimeEvent(topic, payload)`.
4. Phía client: `useRealtimeTopic(topic, { onEvent })`. Nếu client cần gửi
   kèm xử lý (lưu DB trước khi broadcast), đăng ký
   `registerPublishHandler(prefix, handler)` trong gateway.

Ví dụ consumer đầu tiên: `hooks/useStaffPasswordRealtime.ts`.

## Giới hạn

- Payload tối đa 64KB; vượt quá bị từ chối (`error`, HTTP 413).
- Subscriptions nằm trong RAM của gateway: scale nhiều instance thì cần
  Redis pub/sub thay `server.publish` (chưa cần lúc này).
- Sự kiện chỉ mang tín hiệu/ID; dữ liệu thật luôn fetch lại qua HTTPS đã
  authenticate (không lộ secret trên socket).

## Khắc phục sự cố

- Badge hiện "Mất kết nối realtime": gateway chưa chạy. Dev thì dùng
  `bun run dev:all`; nếu chạy tay thì mở 2 terminal (`bun run dev` +
  `bun run realtime`). Badge chuyển "Trực tiếp" là xong.
- Server log `[realtime] gateway unreachable`: Next không gọi được sang
  gateway — kiểm tra gateway có chạy và `REALTIME_PUBLISH_URL` có đúng
  host không (chạy Docker thì không dùng `127.0.0.1`).
- Server log `[realtime] publish ... failed: 403`: lệch secret. Cả hai
  phía đều dùng `REALTIME_SECRET ?? AUTH_SECRET`, Bun tự đọc `.env`
  và `.env.local` từ thư mục project — kiểm tra gateway được start
  đúng từ thư mục project.
- Mở trang bằng IP/hostname LAN mà `NEXT_PUBLIC_REALTIME_URL` vẫn là
  `ws://127.0.0.1:3001/ws`: browser sẽ không tới được gateway. Mặc định
  client đã bám theo hostname của trang (giữ được auth cookie trên
  handshake) nên cứ để trống biến này khi dev; chỉ đặt khi prod/split-host.
- Console browser báo `[realtime] Forbidden.`: socket nối được nhưng
  subscribe bị từ chối — thường do handshake thiếu cookie (sai host như
  trên) hoặc hết phiên đăng nhập. Đăng nhập lại rồi thử tiếp.
- Đổi mật khẩu xong mà mật khẩu tạm không mất: kiểm tra server log có
  `[staff-temp] clear failed` không (lỗi Scylla khi xóa dòng pending).

## Biến môi trường

| Biến                       | Mặc định                    | Ghi chú                        |
| -------------------------- | --------------------------- | ------------------------------ |
| `REALTIME_PORT`            | `3001`                      | port gateway                   |
| `REALTIME_PUBLISH_URL`     | `http://127.0.0.1:3001/publish` | Next gọi sang gateway      |
| `NEXT_PUBLIC_REALTIME_URL` | `ws://127.0.0.1:3001/ws`    | browser kết nối                |
| `REALTIME_SECRET`          | = `AUTH_SECRET`             | chỉ đặt riêng khi tách host    |
