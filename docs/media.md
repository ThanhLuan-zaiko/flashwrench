# Ảnh tải lên FlashWrench — storage vật lý + registry ScyllaDB

File ảnh nằm trên đĩa theo phân cấp rõ ràng, ScyllaDB chỉ giữ metadata
và URL công khai. Ảnh vật lý không bao giờ lên GitHub.

## 1. Phân cấp thư mục

```
<STORAGE_DIR>/uploads/<scope>/<YYYY-MM>/<uuid>.<ext>
```

| Phần              | Ví dụ                              | Vì sao                                  |
| ----------------- | ---------------------------------- | --------------------------------------- |
| `scope`           | `avatar`, `service`, `part`…       | các nhóm không lẫn vào nhau, dễ mở rộng |
| `YYYY-MM`         | `2026-09`                          | giới hạn số file mỗi thư mục            |
| `<uuid>.<ext>`    | `a1b2….jpg`                        | tên do server sinh, không đoán được, bất biến (cache 1 năm) |

URL công khai: `/api/media/<scope>/<YYYY-MM>/<uuid>.<ext>` (route
`app/api/media/[...key]`).

## 2. Schema (chạy `reset_data.sh --yes` rồi mới có bảng mới)

- `media_assets` (partition `asset_id`): metadata đầy đủ — owner,
  scope, đường dẫn, URL, mime, dung lượng, kích thước, alt, người tải.
- `media_assets_by_owner` (partition `(owner_type, owner_id)`): liệt kê
  ảnh của một chủ (gallery dịch vụ/sản phẩm…).
- Cột sẵn có giữ nguyên ý nghĩa: `users_by_id.avatar_url`,
  `mechanics_by_id.avatar_url`, `parts_by_id.images`, `emergency_by_id.photos`,
  `reviews_by_target.images`, `booking_messages.image_url`,
  `emergency_messages.image_url`.
- Cột mới: `services_by_id.image_url`, `service_categories.image_url`
  (ảnh bìa cấu hình dịch vụ).

## 3. API

| Endpoint                  | Quyền                                         |
| ------------------------- | --------------------------------------------- |
| `POST /api/media` (multipart: `file`, `scope`, `ownerType`, `ownerId`, `alt?`, `width?`, `height?`) | đăng nhập; nhóm `service`/`category`/`part` chỉ admin |
| `GET /api/media/[...key]` | công khai (ảnh catalog/avatar phải hiện cho khách chưa đăng nhập) |
| `DELETE /api/media/[assetId]` | chính chủ hoặc admin                      |
| `POST /api/account/avatar` (`{ assetId }`) | chính chủ, asset phải thuộc scope `avatar` của mình |

Máy chủ kiểm tra: scope trong allowlist, mime JPEG/PNG/WebP **cộng**
soi magic bytes (file `.exe` đổi tên vẫn rớt), dung lượng tối đa
`MEDIA_MAX_MB` (mặc định 8MB), kích thước 1–12000px. Ghi registry lỗi
sau khi file đã nằm đĩa thì file mồ côi bị xóa ngay để đĩa và DB
không bao giờ lệch nhau.

## 4. UI tải + sửa ảnh (`components/media/`)

`ImageUploader` (1 file) → `ImageCropDialog` (zoom, xoay, preset tỉ lệ
1:1/4:3/16:9/tự do, `react-easy-crop`) → canvas cắt ở **đúng phân giải
gốc của vùng chọn** (không nén nhỏ lại) → `POST /api/media`. Luồng
này dùng chung cho avatar (`AvatarSection` ở `/account`) và sau này
cho ảnh bìa dịch vụ/sản phẩm ở trang admin.

## 5. Vận hành (Docker / server)

```bash
# .env
STORAGE_DIR=/data
MEDIA_MAX_MB=8
```

```bash
# image đã tạo sẵn /app/storage (ephemeral nếu không mount)
docker build -f dockerfile -t flashwrench .
docker run -d -p 3000:3000 \
  -v flashwrench-storage:/app/storage \
  -e STORAGE_DIR=/app/storage \
  --env-file .env.production \
  flashwrench
```

- Dev: để trống `STORAGE_DIR` → dùng `./storage` (đã gitignore, tự tạo
  khi upload đầu tiên).
- Backup ảnh = backup volume `flashwrench-storage`; backup metadata =
  backup keyspace (bảng `media_assets*`).
- Đổi `STORAGE_DIR` sang ổ mới: chép nguyên cây `uploads/` sang rồi
  mới đổi env (URL không đổi vì đường dẫn tương đối giữ nguyên).
