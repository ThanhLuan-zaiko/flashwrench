<div align="center">

<img src="asset/flashwrench.png" alt="Linh vật FlashWrench" width="240">

# 🛠️ FlashWrench

### Nền tảng đặt lịch sửa xe lưu động, cứu hộ và mua linh kiện

[![CI](https://github.com/ThanhLuan-zaiko/flashwrench/actions/workflows/ci.yml/badge.svg)](https://github.com/ThanhLuan-zaiko/flashwrench/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.4-f9f1e1?style=flat&logo=bun&logoColor=black)](https://bun.sh/)
[![ScyllaDB](https://img.shields.io/badge/ScyllaDB-CQL-6cd5e7?style=flat)](https://www.scylladb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[📖 Tài liệu](./docs) • [🤝 Đóng góp](./CONTRIBUTING.md) • [🔒 Bảo mật](./SECURITY.md) • [🐛 Báo lỗi](../../issues)

</div>

---

## 📖 Giới thiệu

**FlashWrench** là ứng dụng web giúp chủ xe đặt thợ sửa xe tới tận nơi, gọi
cứu hộ khẩn cấp và mua linh kiện, kể cả khi **không có tài khoản**. Hệ thống
kết nối khách với thợ phù hợp, cho phép theo dõi tiến độ theo thời gian thực
qua WebSocket, và cung cấp bảng điều khiển riêng cho thợ, điều phối viên và
quản trị viên.

Giao diện hoàn toàn bằng tiếng Việt, hỗ trợ giao diện sáng/tối và tối ưu cho
điện thoại lẫn máy tính.

## ✨ Tính năng chính

### 👤 Khách hàng

- 📅 **Đặt lịch sửa xe tại nhà**: chọn nhiều dịch vụ trong một lần đặt, chọn
  khung giờ theo giờ làm việc của cửa hàng, ghim vị trí trên bản đồ (Leaflet)
  và chọn thợ dựa trên xếp hạng và đánh giá.
- 🚨 **Cứu hộ khẩn cấp**: gửi sự cố cùng vị trí xe, theo dõi thợ đang tới và
  tự hủy khi thợ chưa xuất phát.
- 🛒 **Cửa hàng linh kiện**: giỏ hàng, thanh toán khi nhận hàng, tại quầy hoặc
  chuyển khoản (mô phỏng), giao hàng hoặc nhận tại cửa hàng, yêu cầu trả hàng
  kèm ảnh.
- 📍 **Theo dõi realtime**: trang `/track/booking/<id>` và `/track/order/<id>`
  hiển thị trạng thái và vị trí thợ/người giao hàng trực tiếp.
- 🎟️ **Ví voucher**: nhận ưu đãi theo chiến dịch, nhập mã và áp dụng khi đặt
  lịch hoặc thanh toán.
- 💬 **Chat** với thợ và điều phối viên, **đánh giá**, **bình luận** và
  **khiếu nại** sau khi hoàn thành dịch vụ.
- 🗂️ **Lịch sử** đặt lịch, đơn hàng, cứu hộ và khiếu nại trong tài khoản.

### 🚶 Khách vãng lai (không cần đăng nhập)

- Đặt lịch, gọi cứu hộ và mua hàng chỉ với họ tên, số điện thoại và email.
- Email xác nhận kèm link theo dõi sau mỗi đơn.
- **Tra cứu bằng OTP qua email** tại `/lookup`, xem và tải **hóa đơn PDF**
  tiếng Việt.
- Menu **"Đơn của bạn"** trên thanh đầu trang: đơn đặt ở tab nào cũng hiện ở
  mọi tab của cùng trình duyệt, các tab tự đồng bộ giỏ hàng và danh sách dịch
  vụ đã chọn.
- Có thể tạo tài khoản ngay khi đặt lịch; đơn và giỏ hàng cũ được chuyển vào
  tài khoản mới.

### 🔧 Thợ sửa xe

- Lịch làm việc theo trạng thái, nhận và xử lý việc được giao.
- Bản đồ và chỉ đường tới điểm sửa xe, chia sẻ vị trí trực tiếp cho khách.
- Thu tiền mặt có mã xác nhận, theo dõi thu nhập và thống kê hiệu suất.

### 🧭 Điều phối viên

- Bảng điều phối đặt lịch, đơn hàng và cứu hộ theo từng trạng thái.
- Quản lý tồn kho linh kiện, voucher, bán hàng tại quầy.
- Báo cáo doanh thu và cơ cấu khách hàng.

### 🛡️ Quản trị viên

- Quản lý người dùng và nhân viên (tạo tài khoản, khóa, cấp mật khẩu tạm).
- Quản lý danh mục dịch vụ, sản phẩm, đơn hàng, cứu hộ và chiến dịch voucher.
- Doanh thu, cơ cấu khách hàng và cài đặt cửa hàng (giờ làm việc, hồ sơ).

## 🚀 Công nghệ

| Tầng | Công nghệ | Ghi chú |
|------|-----------|---------|
| **Runtime** | [Bun](https://bun.sh/) 1.4 | Trình quản lý gói, chạy script, test và gateway realtime |
| **Framework** | [Next.js](https://nextjs.org/) 16 | App Router, Turbopack, React Compiler |
| **UI** | [React](https://react.dev/) 19 + [Tailwind CSS](https://tailwindcss.com/) 4 | Chỉ dùng utility class, icon từ `react-icons` |
| **Ngôn ngữ** | [TypeScript](https://www.typescriptlang.org/) | Strict mode |
| **Cơ sở dữ liệu** | [ScyllaDB](https://www.scylladb.com/) | CQL qua `cassandra-driver`, thiết kế bảng theo truy vấn |
| **Dữ liệu phía client** | [TanStack Query](https://tanstack.com/query) 5 | Cache, refetch, mutation |
| **Realtime** | Bun WebSocket | Gateway riêng ở `realtime/server.ts` |
| **Bản đồ** | Leaflet + React Leaflet | Chọn vị trí, theo dõi hành trình |
| **Hiệu ứng** | GSAP, Motion | Bento layout, chuyển cảnh nhẹ |
| **Xác thực** | `jose` (JWT) + `hash-wasm` (Argon2id) | Refresh token xoay vòng, quản lý phiên |
| **Email / PDF** | Nodemailer (SMTP), jsPDF | OTP, email xác nhận, hóa đơn có dấu |
| **Chất lượng mã** | Biome, `bun:test` | Lint/format, unit + tích hợp + hồi quy |
| **Triển khai** | Docker, Caddy | TLS tự động, reverse proxy cho web và WebSocket |

## 🏗️ Kiến trúc

```
Trình duyệt ──https/wss──> Caddy ─┬─ /*   → Next.js :3000   (trang + API)
                                  └─ /ws  → Bun realtime :3001 (realtime/server.ts)
                                                 │
                         Next.js ──CQL──> ScyllaDB
```

Backend tách lớp nghiêm ngặt:

- **Repository** (`lib/<domain>/*.repository.ts`): chỉ chứa câu lệnh CQL.
- **Service** (`lib/<domain>/*.service.ts`): nghiệp vụ, kiểm tra dữ liệu, điều
  phối nhiều repository.
- **Route handler** (`app/api/**/route.ts`): đọc input, gọi service, trả
  response.

Phía client: `services/*.api.ts` gọi API, `hooks/` bọc TanStack Query,
`components/` chỉ dùng hooks.

### Cấu trúc thư mục

```
app/            Route của Next.js (trang + app/api)
components/     Component React theo tính năng
hooks/          Hook TanStack Query và hook dùng chung
lib/            Nghiệp vụ phía server: repository, service, kiểu dữ liệu
services/       Client gọi API cho phía trình duyệt
realtime/       Gateway WebSocket (Bun)
scripts/        Seed, migration không phá dữ liệu, chạy nhiều process
tests/          unit / integration / regression (bun:test)
docs/           Tài liệu chi tiết theo chủ đề
schema.cql      Nguồn chuẩn của schema ScyllaDB
```

## 🏁 Bắt đầu

### Yêu cầu

- [Bun](https://bun.sh/) 1.4 trở lên
- ScyllaDB (chạy bằng Docker là nhanh nhất)
- Một tài khoản SMTP nếu muốn thử OTP và email xác nhận (không bắt buộc)

### Cài đặt

```bash
# 1. Lấy mã nguồn và cài thư viện
git clone https://github.com/ThanhLuan-zaiko/flashwrench.git
cd flashwrench
bun install

# 2. Chạy ScyllaDB cục bộ (tên container "scylladb" khớp với reset_data.sh)
docker run --name scylladb -d -p 9042:9042 scylladb/scylla --smp 1

# 3. Tạo file môi trường rồi điền giá trị
cp .env.example .env.local

# 4. Tạo keyspace và bảng từ schema.cql (CHỈ dùng cho database dev)
./reset_data.sh          # Windows: ./reset_data.ps1

# 5. Tạo tài khoản admin đầu tiên (đọc SEED_ADMIN_* trong .env.local)
bun run seed:admin

# 6. Chạy Next.js và gateway realtime cùng lúc
bun run dev:all
```

Mở <http://localhost:3000>. Gateway realtime chạy ở cổng `3001`.

Biến môi trường tối thiểu để chạy dev: `SCYLLA_*`, `AUTH_SECRET` (chuỗi ngẫu
nhiên từ 32 byte) và `STAFF_TEMP_SECRET`. Ý nghĩa từng biến được ghi chú
trong [`.env.example`](./.env.example).

> ⚠️ `reset_data.sh` xóa và tạo lại keyspace. Với database đang có dữ liệu
> thật, hãy dùng các script `scripts/migrate-*.ts` (mục bên dưới).

### Các lệnh thường dùng

| Lệnh | Tác dụng |
|------|----------|
| `bun run dev` | Next.js dev server (Turbopack) |
| `bun run realtime` | Chỉ chạy gateway WebSocket |
| `bun run dev:all` | Next.js + gateway, tự reload khi sửa code |
| `bun run build` / `bun run start` | Build và chạy bản production |
| `bun run start:all` | Next.js production + gateway |
| `bun run lint` / `bun run lint:fix` | Kiểm tra / tự sửa bằng Biome |
| `bun run type-check` | Kiểm tra kiểu TypeScript |
| `bun run check:lines` | Giới hạn số dòng mỗi file (`.tsx` ≤ 250, `.ts` ≤ 350) |
| `bun run check:all` | Lint + type-check + giới hạn số dòng |
| `bun run test` | Toàn bộ test: unit → tích hợp → hồi quy |
| `bun run check:mail` | Kiểm tra cấu hình SMTP |
| `bun run seed:admin` | Tạo admin đầu tiên |

### Thay đổi schema trên database có dữ liệu

`schema.cql` là nguồn chuẩn cho môi trường mới. Database đang chạy được cập
nhật tại chỗ bằng script idempotent, chạy lại nhiều lần vẫn an toàn:

```bash
bun run scripts/migrate-<tính-năng>.ts   # ví dụ: scripts/migrate-guest-records.ts
```

## 🧪 Kiểm thử

Bộ test dùng `bun:test`, không cần database thật. Mỗi file test chạy trong
một tiến trình riêng để `mock.module` không rò rỉ giữa các file.

```bash
bun run test               # tất cả
bun run test:unit          # tests/unit
bun run test:integration   # tests/integration
bun run test:regression    # tests/regression
```

CI ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) chạy Biome,
TypeScript, giới hạn số dòng, toàn bộ test và build production cho mọi push
và pull request. Chi tiết: [`docs/tests.md`](./docs/tests.md).

## 📦 Triển khai

- [`dockerfile`](./dockerfile): build nhiều stage ra image Next.js standalone
  chạy bằng Bun.
- [`Caddyfile`](./Caddyfile): một domain, TLS tự động, `/ws` đi tới gateway
  realtime, phần còn lại tới Next.js.
- Lớp chống quá tải trong ứng dụng (`proxy.ts`) giới hạn request theo IP và
  theo loại lưu lượng, cấu hình bằng các biến `SHIELD_*`.

Hướng dẫn đầy đủ: [`docs/production.md`](./docs/production.md).

## 📚 Tài liệu

| Tài liệu | Nội dung |
|----------|----------|
| [`docs/auth.md`](./docs/auth.md) | Đăng nhập, phiên, refresh token |
| [`docs/rbac.md`](./docs/rbac.md) | Vai trò, phân quyền, seed admin |
| [`docs/guest-access.md`](./docs/guest-access.md) | Khách vãng lai, OTP, hóa đơn PDF, đồng bộ nhiều tab |
| [`docs/realtime.md`](./docs/realtime.md) | Gateway WebSocket và protocol |
| [`docs/vouchers.md`](./docs/vouchers.md) | Ví voucher và chiến dịch |
| [`docs/media.md`](./docs/media.md) | Upload và lưu trữ ảnh |
| [`docs/datetime.md`](./docs/datetime.md) | Múi giờ và định dạng thời gian |
| [`docs/rescue-cancel.md`](./docs/rescue-cancel.md) | Quy tắc hủy cứu hộ |
| [`docs/tests.md`](./docs/tests.md) | Cách viết và chạy test |
| [`docs/production.md`](./docs/production.md) | Chạy production |
| [`AGENTS.md`](./AGENTS.md) | Quy ước mã nguồn (dành cho cả người và AI agent) |

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón. Hãy đọc [`CONTRIBUTING.md`](./CONTRIBUTING.md)
trước khi mở pull request, và tuân thủ
[Quy tắc ứng xử](./CODE_OF_CONDUCT.md) của dự án.

## 🔒 Bảo mật

Vui lòng **không** báo lỗ hổng bảo mật qua issue công khai. Xem cách báo cáo
riêng tư trong [`SECURITY.md`](./SECURITY.md).

## 📄 Giấy phép

Phát hành theo [Giấy phép Apache 2.0](./LICENSE).
