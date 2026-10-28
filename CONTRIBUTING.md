# Đóng góp cho FlashWrench

Cảm ơn bạn đã quan tâm tới FlashWrench! Tài liệu này mô tả cách báo lỗi, đề
xuất tính năng và gửi pull request sao cho được review nhanh nhất.

Khi tham gia dự án, bạn đồng ý tuân thủ [Quy tắc ứng xử](./CODE_OF_CONDUCT.md).

## Báo lỗi và đề xuất

- Tìm trong [issues](../../issues) trước để tránh trùng lặp.
- Khi báo lỗi, ghi rõ: các bước tái hiện, kết quả mong đợi, kết quả thực tế,
  trình duyệt/thiết bị, và ảnh chụp màn hình nếu là lỗi giao diện.
- Lỗ hổng bảo mật **không** báo qua issue công khai, xem
  [SECURITY.md](./SECURITY.md).

## Chuẩn bị môi trường

Làm theo mục **Bắt đầu** trong [README](./README.md#-bắt-đầu): cài Bun, chạy
ScyllaDB, tạo `.env.local`, tạo schema và chạy `bun run dev:all`.

Dự án chỉ dùng **Bun** (`bun install`, `bun add`, `bun run`). Không dùng npm
hay yarn để tránh lệch `bun.lock`.

## Quy trình gửi pull request

1. Fork repo và tạo nhánh từ `master` với tên mô tả, ví dụ
   `fix/booking-timezone` hoặc `feat/rescue-tracking-page`.
2. Viết code theo quy ước bên dưới, kèm test cho mọi tính năng hay thay đổi
   hành vi.
3. Chạy đủ bước kiểm tra trước khi push:

   ```bash
   bun run test        # unit + tích hợp + hồi quy
   bun run check:all   # Biome + TypeScript + giới hạn số dòng
   ```

4. Mở pull request mô tả **vì sao** cần thay đổi, thay đổi những gì và cách
   bạn đã kiểm tra. Đính kèm ảnh chụp trước/sau nếu đổi giao diện.
5. CI phải xanh (lint, type-check, giới hạn số dòng, test, build) thì PR mới
   được merge.

## Quy ước mã nguồn

Quy ước đầy đủ nằm trong [AGENTS.md](./AGENTS.md). Những điểm quan trọng nhất:

- **Giới hạn kích thước file**: `.tsx` tối đa 250 dòng, `.ts` tối đa 350
  dòng. Vượt thì tách component, hook, `.types.ts` hoặc `.constants.ts`.
- **Tách lớp backend**: repository chỉ chứa CQL; service chứa nghiệp vụ; route
  handler (`app/api/**/route.ts`) chỉ đọc input, gọi service và trả response.
- **Phía client**: `services/` gọi API, `hooks/` bọc TanStack Query,
  `components/` chỉ dùng hooks, không gọi `fetch` trực tiếp.
- **Ngôn ngữ**: chuỗi hiển thị cho người dùng viết tiếng Việt có dấu đầy đủ.
  Tên biến, hàm, comment, đường dẫn URL và log viết bằng tiếng Anh.
- **Giao diện**: chỉ dùng utility class của Tailwind (không thêm file CSS, không
  `style={{}}`), bảng màu trung tính, hỗ trợ cả giao diện sáng và tối, icon từ
  `react-icons`.
- **TypeScript strict**: không dùng `any`, định kiểu đầy đủ cho props, response
  và dòng dữ liệu.
- **Danh sách tăng dần theo thời gian** phải phân trang.

## Thay đổi cơ sở dữ liệu

Không bao giờ xóa hoặc reset dữ liệu đang chạy.

1. Sửa `schema.cql` trước để môi trường mới vẫn dựng đúng.
2. Viết script idempotent `scripts/migrate-<tính-năng>.ts` theo mẫu
   `scripts/migrate-revenue.ts` (`CREATE TABLE IF NOT EXISTS`, bỏ qua lỗi
   "already exists").
3. Ghi lệnh chạy migration vào mô tả pull request.

## Kiểm thử

- Framework: `bun:test`. Mỗi file test chạy trong một tiến trình riêng.
- `tests/unit`: hàm thuần, không mock.
- `tests/integration`: service và route với repository bị mock bằng
  `mock.module`, không bao giờ chạm database thật.
- `tests/regression`: tái hiện lỗi đã sửa.
- Dùng lại fixture và mock trong `tests/helpers/` thay vì tự tạo mới.
- Kiểm tra cả trường hợp lỗi: dữ liệu sai (400), không có quyền (403), không
  tìm thấy (404), xung đột (409).

Chi tiết: [docs/tests.md](./docs/tests.md).

## Commit

- Mỗi commit làm một việc, thông điệp ngắn gọn ở thể mệnh lệnh, mô tả kết quả
  cho người dùng hoặc lý do kỹ thuật.
- Không commit file rác hoặc bí mật: `node_modules/`, `.next/`, `.env*`,
  `*.log`, thư mục `storage/`, khóa hay mật khẩu.

## Giấy phép

Khi gửi đóng góp, bạn đồng ý rằng đóng góp đó được phát hành theo
[Giấy phép Apache 2.0](./LICENSE) của dự án.
