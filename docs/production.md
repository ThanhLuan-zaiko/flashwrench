# Chạy production

Kiến trúc một domain, hai process ứng dụng riêng biệt, Caddy đứng trước
làm TLS + reverse proxy, Cloudflare là bức tường chống DDoS thứ nhất:

```
Trình duyệt ──https/wss──> Cloudflare ──> Caddy :443 ─┬─ /*   → Next.js :3000
                                                     └─ /ws   → Bun realtime :3001
                                                                (realtime/server.ts)
```

`/publish` (server-to-server, ký bằng secret) và `/health` của gateway
không lộ ra ngoài — Next.js gọi thẳng `REALTIME_PUBLISH_URL` nội bộ.

## 1. Chuẩn bị máy chủ

- Bun (`curl -fsSL https://bun.sh/install | bash`), Caddy v2, ScyllaDB.
- Firewall: chỉ cho dải IP Cloudflare chạm cổng 443/80 (hoặc dùng
  Cloudflare Tunnel). Nếu origin mở công khai, attacker đi thẳng vào IP
  máy sẽ spoof được `CF-Connecting-IP` và lách mọi rate-limit theo IP.

## 2. Biến môi trường

Copy `.env.example` → `.env` rồi điền. Bắt buộc cho production:

| Biến                          | Ví dụ                              | Ghi chú                                     |
| ----------------------------- | ---------------------------------- | ------------------------------------------- |
| `SCYLLA_CONTACT_POINTS`       | `10.0.0.5`                          | cluster ScyllaDB                            |
| `SCYLLA_KEYSPACE`             | `flashwrench`                      |                                             |
| `SCYLLA_LOCAL_DATACENTER`     | `datacenter1`                      |                                             |
| `AUTH_SECRET`                 | 32+ byte ngẫu nhiên                | ký session + publish realtime               |
| `STAFF_TEMP_SECRET`           | 32 byte ngẫu nhiên base64          | mã hóa mật khẩu tạm của nhân viên           |
| `NEXT_PUBLIC_SITE_URL`        | `https://flashwrench.vn`           | og:image tuyệt đối cho preview tin nhắn     |
| `NEXT_PUBLIC_REALTIME_URL`    | `wss://flashwrench.vn/ws`          | WS gộp cùng domain qua Caddy                |
| `REALTIME_ALLOWED_ORIGINS`    | `https://flashwrench.vn`           | BẮT BUỘC: TLS kết thúc ở Caddy              |
| `STORAGE_DIR`                 | `/data`                            | mount volume bền (ảnh upload)               |

Tùy chọn (đã có default hợp lý, xem `.env.example`):

| Biến                  | Default | Ý nghĩa                                        |
| --------------------- | ------- | ---------------------------------------------- |
| `SHIELD_ENABLED`      | `true` ở production | tường lửa in-app lớp 2 (proxy.ts)       |
| `SHIELD_PAGE_LIMIT`   | 240/10s | page requests mỗi IP                           |
| `SHIELD_API_LIMIT`    | 120/10s | API requests mỗi IP                            |
| `SHIELD_MEDIA_LIMIT`  | 600/10s | ảnh `/api/media` mỗi IP (gallery fan-out)      |
| `SHIELD_AUTH_LIMIT`   | 20/60s  | `/api/auth/*` — chặt nhất                      |
| `SHIELD_GLOBAL_RPS`   | 600/s   | cổng admission toàn instance — chống stampede  |
| `SHIELD_BAN_SECONDS`  | 600     | thời hạn ban share qua ScyllaDB                |
| `SHIELD_MAX_*`        | 1MB / theo `MEDIA_MAX_MB` | cap `Content-Length` trước khi đọc body |

## 3. Build

```bash
bun install --frozen-lockfile
bun run build        # next build → .next/standalone
```

## 4. Chạy ứng dụng

Hai process riêng (đúng tinh thần "gộp domain, tách process"):

```bash
bun run start        # Next.js production, port 3000
bun run realtime     # gateway WebSocket Bun, port 3001
```

Hoặc một lệnh tiện cho máy đơn giản: `bun run start:all` (supervisor nội
bộ spawn cả hai, forward SIGINT/SIGTERM — không watch file).

Systemd sketch (`/etc/systemd/system/flashwrench-web.service`, và một file
tương tự `flashwrench-realtime.service` với `ExecStart=bun run realtime`):

```ini
[Unit]
Description=FlashWrench web (Next.js)
After=network.target

[Service]
WorkingDirectory=/opt/flashwrench
EnvironmentFile=/opt/flashwrench/.env
ExecStart=/usr/local/bin/bun run start
Restart=always
RestartSec=3
User=flashwrench

[Install]
WantedBy=multi-user.target
```

## 5. Caddy

```bash
SITE_DOMAIN=flashwrench.vn caddy run --config Caddyfile
# hoặc cài service: SITE_DOMAIN trong Environment của unit caddy
```

Caddy tự xin/gia hạn cert ACME. `Caddyfile` ở root repo đã xử lý sẵn:

- `Host` passthrough — bắt buộc, vì `isTrustedOrigin()` và origin check
  của gateway đều so `Origin` với `Host`.
- `X-Forwarded-For` ← `CF-Connecting-IP` (IP thật khi qua Cloudflare),
  `X-Real-IP` ← peer TCP (fallback khi test trực tiếp).
- Chỉ `/ws` đi tới :3001; `/publish`/`/health` giữ nội bộ.

## 6. Docker (tùy chọn)

`dockerfile` build image standalone chỉ chứa web — realtime chạy process
riêng trên host (`bun run realtime`) vì image không mang source Bun:

```bash
docker build -f dockerfile -t flashwrench .
docker run -d --env-file .env -v flashwrench-storage:/app/storage \
  -p 127.0.0.1:3000:3000 flashwrench
```

CI `production.yml` đã tự build + push `ghcr.io/<repo>:prod` khi push
`master`/`main` xanh.

## 7. Hậu kiểm

```bash
curl -I https://flashwrench.vn/          # 200 + security headers
curl -s https://flashwrench.vn/ | grep og:image   # URL tuyệt đối https://
curl -i https://flashwrench.vn/ws        # 400/403 từ gateway (không phải 502)
curl -s http://127.0.0.1:3001/health     # chỉ nội bộ: {"ok":true}
```

Kiểm thử preview link: dán URL vào Zalo/Messenger — phải hiện card
FlashWrench (ảnh `opengraph-image.png` 1200×630). Shield: bắn ~250 request
song song vào một page → phần vượt `SHIELD_PAGE_LIMIT` phải nhận 429 kèm
`Retry-After`.
