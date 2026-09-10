<div align="center">

# 🛠️ FlashWrench - Mobile Vehicle Repair Booking

### Nền tảng đặt lịch sửa xe lưu động thông minh

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-white?style=for-the-badge&logo=bun)](https://bun.sh/)
[![ScyllaDB](https://img.shields.io/badge/ScyllaDB-NoSQL-orange?style=for-the-badge)](https://www.scylladb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

[📖 Tài liệu](./docs) • [🐛 Báo lỗi](../../issues) • [💡 Đề xuất](../../issues/new)

</div>

---

## 📖 Giới thiệu

**FlashWrench** là ứng dụng web giúp người dùng dễ dàng đặt lịch sửa xe lưu động chỉ với vài cú chạm. Hệ thống kết nối chủ xe với các thợ sửa xe chuyên nghiệp gần nhất, hỗ trợ theo dõi trạng thái đơn hàng theo thời gian thực và quản lý toàn bộ lịch sử bảo dưỡng phương tiện.

Dự án được xây dựng với triết lý **hiệu năng cao - code sạch - dễ bảo trì**, áp dụng các tiêu chuẩn nghiêm ngặt về kiến trúc và chất lượng mã nguồn.

## ✨ Tính năng chính

### 👤 Dành cho khách hàng
- 📍 **Đặt lịch nhanh** - Chọn loại dịch vụ, thời gian và địa điểm sửa xe
- 🗺️ **Tìm thợ gần nhất** - Định vị và hiển thị thợ sửa xe trong khu vực
- 📊 **Theo dõi realtime** - Cập nhật trạng thái đơn hàng theo thời gian thực
- 🚗 **Quản lý phương tiện** - Lưu thông tin xe và lịch sử bảo dưỡng
- ⭐ **Đánh giá & phản hồi** - Rating thợ sau khi hoàn thành dịch vụ

### 🔧 Dành cho thợ sửa xe
- 📋 **Quản lý lịch làm việc** - Nhận và xử lý yêu cầu từ khách hàng
- 🧭 **Điều hướng thông minh** - Tích hợp bản đồ để di chuyển đến điểm sửa xe
- 💰 **Quản lý thu nhập** - Theo dõi doanh thu và lịch sử giao dịch
- 📈 **Thống kê hiệu suất** - Báo cáo số đơn hoàn thành, rating trung bình

### 🛡️ Dành cho quản trị viên
- 👥 **Quản lý người dùng** - Duyệt thợ, khóa tài khoản, xử lý khiếu nại
- 📊 **Dashboard tổng quan** - Số liệu vận hành hệ thống theo thời gian thực
- ⚙️ **Cấu hình dịch vụ** - Quản lý bảng giá, loại hình sửa chữa

## 🚀 Tech Stack

| Tầng | Công nghệ | Ghi chú |
|------|-----------|---------|
| **Runtime** | [Bun](https://bun.sh/) | Package manager & runtime siêu nhanh |
| **Framework** | [Next.js 14+](https://nextjs.org/) | App Router, Server Components |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict mode |
| **Database** | [ScyllaDB](https://www.scylladb.com/) | NoSQL wide-column (CQL) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Pure utility-first, no custom CSS |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query) | Client-side state & caching |
| **UI Components** | Headless UI / Radix | Kết hợp Tailwind |

