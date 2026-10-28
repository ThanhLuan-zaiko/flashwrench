# Chính sách bảo mật

## Phiên bản được hỗ trợ

FlashWrench phát triển liên tục trên nhánh `master`. Bản vá bảo mật chỉ được
áp dụng cho mã mới nhất của nhánh này.

| Phiên bản | Được hỗ trợ |
|-----------|-------------|
| `master` (mới nhất) | ✅ |
| Các commit cũ hơn | ❌ |

## Báo cáo lỗ hổng

**Vui lòng không báo lỗ hổng bảo mật qua issue, pull request hay thảo luận
công khai.**

Hãy báo cáo riêng tư qua
[GitHub Security Advisories](https://github.com/ThanhLuan-zaiko/flashwrench/security/advisories/new)
(tab **Security** → **Report a vulnerability**).

Báo cáo nên có:

- Mô tả lỗ hổng và mức độ ảnh hưởng (ví dụ: lộ dữ liệu khách, vượt quyền,
  chiếm phiên đăng nhập).
- Các bước tái hiện, request mẫu hoặc proof of concept tối giản.
- Route, file hoặc commit liên quan nếu bạn biết.
- Đề xuất cách khắc phục (nếu có).

## Quy trình xử lý

- Xác nhận đã nhận báo cáo trong vòng **3 ngày làm việc**.
- Đánh giá mức độ và phản hồi kế hoạch xử lý trong vòng **7 ngày**.
- Sau khi bản vá được phát hành, lỗ hổng được công bố qua Security Advisory và
  người báo cáo được ghi nhận (nếu đồng ý).

Vui lòng cho dự án thời gian hợp lý để khắc phục trước khi công bố.

## Phạm vi

Trong phạm vi:

- Ứng dụng web và API trong repo này (`app/`, `lib/`, `proxy.ts`).
- Gateway realtime (`realtime/`).
- Cấu hình triển khai đi kèm (`dockerfile`, `Caddyfile`).

Ngoài phạm vi:

- Tấn công từ chối dịch vụ bằng lưu lượng lớn, spam, social engineering.
- Lỗ hổng chỉ xảy ra khi tự cấu hình sai (ví dụ để lộ `.env`, mở cổng
  ScyllaDB ra Internet).
- Lỗ hổng của thư viện bên thứ ba chưa ảnh hưởng thực tế tới FlashWrench
  (hãy báo cho dự án gốc của thư viện đó).

## Khi tự triển khai

- Đặt `AUTH_SECRET`, `STAFF_TEMP_SECRET` (và `OTP_SECRET` nếu dùng) là chuỗi
  ngẫu nhiên đủ dài, không dùng lại giữa các môi trường.
- Không commit `.env`, `.env.local` hay bất kỳ file chứa bí mật nào.
- Chỉ cho phép dải IP Cloudflare (hoặc tunnel) truy cập cổng 80/443 của máy
  chủ, và đặt `REALTIME_ALLOWED_ORIGINS` đúng domain production. Xem
  [docs/production.md](./docs/production.md).
