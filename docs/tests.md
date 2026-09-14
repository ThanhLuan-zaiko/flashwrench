# Kiểm thử API FlashWrench — unit, tích hợp, hồi quy

Tài liệu này mô tả cách chạy và cách mở rộng bộ kiểm thử cho các endpoint
API hiện tại. Bộ test dùng sẵn `bun test`, không cần database thật, không
thêm framework ngoài (chỉ thêm `bun-types` để `tsc` hiểu `bun:test`).

## 1. Cách chạy

| Lệnh | Ý nghĩa |
|---|---|
| `bun run test` | Chạy toàn bộ: unit → tích hợp → hồi quy |
| `bun run test:unit` | Chỉ test đơn vị (`tests/unit`) |
| `bun run test:integration` | Chỉ test tích hợp (`tests/integration`) |
| `bun run test:regression` | Chỉ test hồi quy (`tests/regression`) |
| `bun test tests/unit/validation.test.ts` | Chạy 1 file khi đang sửa test đó |

CI chạy `bun run test` ở job `test` và chặn `build` khi test đỏ
(xem `.github/workflows/ci.yml`).

## 2. Cấu trúc thư mục

| Thư mục | Nội dung | Ví dụ |
|---|---|---|
| `tests/helpers` | Fixtures và mock dùng chung, không chứa test | `auth.fixtures.ts`, `service-mocks.ts`, `route-mocks.ts`, `db-fake.ts` |
| `tests/unit` | Hàm thuần: validation, token, cookie, guards | `validation.test.ts`, `session.test.ts` |
| `tests/integration` | Service và route handler với dependency bị stub | `auth.service.test.ts`, `auth.routes.test.ts` |
| `tests/regression` | Bug từng xảy ra, chạy code thật trên fake DB | `register-duplicate.test.ts` |
| `tests/run-suite.sh` | Chạy mỗi file test trong tiến trình riêng (mục 3) | — |

- Unit test không mock gì (ngoại lệ duy nhất: đặt `AUTH_SECRET` giả trong
  `session.test.ts` để ký JWT).
- Test tích hợp stub mọi tác động ra ngoài: repository, hasher, guards,
  `next/headers`. Service test stub repository; route test stub service.
- Test hồi quy làm ngược lại: chạy service và repository **thật** trên
  `db-fake.ts` (fake Scylla trong bộ nhớ, ép đúng ngữ nghĩa PRIMARY KEY),
  chỉ stub hasher cho nhanh. Nhờ vậy nó bắt được lỗi race và bypass mà
  test stub không thấy.

## 3. Quy tắc cách ly (quan trọng)

`bun test` dùng chung một module registry cho mỗi tiến trình, nên
`mock.module` của file này sẽ lọt sang file khác chạy cùng tiến trình.
Vì vậy **mỗi file test luôn chạy tiến trình riêng** qua
`tests/run-suite.sh`. Không chạy `bun test tests/integration` gộp chung
khi muốn kết quả ổn định, và không trông chờ vào thứ tự chạy giữa các file.

## 4. Thêm test cho endpoint mới

1. Thêm builder vào `tests/helpers/auth.fixtures.ts` nếu cần dữ liệu mới.
2. Thêm case vào service test tương ứng (`auth.service.test.ts` hoặc file
   mới trong `tests/integration`): input xấu → mã lỗi, thành công →
   repository được gọi đúng tham số.
3. Thêm `describe` vào file route tương ứng (`auth.routes.test.ts` cho
   session cơ bản, `auth.routes-account.test.ts` cho tài khoản/phiên):
   dựng `routeStubs.*`, gọi handler, assert status/body/cookie
   (`getResponseCookie`).
4. Nếu đang sửa bug, thêm file mới trong `tests/regression` chạy code thật
   qua `db-fake.ts` thay vì stub.

## 5. Mẫu mock chuẩn

```ts
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { resetServiceMocks, serviceStubs, userRepoMocks } from "../helpers/service-mocks";

// Thứ tự import là bắt buộc: helpers trước, mock.module giữa,
// code cần test cuối cùng (bun hoist mock.module lên trên import).
mock.module("@/lib/auth/user.repository", () => userRepoMocks);

import { registerUser } from "@/lib/auth/auth.service";

beforeEach(() => {
  resetServiceMocks();
});

test("...", async () => {
  serviceStubs.phoneOwner = "existing-user";
  const result = await registerUser({ ... }, "device");
  expect(result).toMatchObject({ ok: false, status: 409 });
});
```

- Muốn đổi hành vi mock thì sửa `serviceStubs`/`routeStubs`, muốn assert
  thì đọc `tenMock.mock.calls`. Không tạo mock cục bộ cho module đã có
  handle chung.
- Factory của `mock.module` phải trả đúng hình namespace của module gốc,
  ví dụ `() => ({ scylla: scyllaStub })` chứ không phải `() => scyllaStub`.

## 6. Khắc phục sự cố thường gặp

- **Test pass khi chạy lẻ, fail khi chạy chung**: có người mock cùng module
  theo 2 kiểu khác nhau trong một tiến trình. Kiểm tra lại là mọi file đều
  chạy qua `run-suite.sh`, và gộp handle về file chung trong `helpers`.
- **TypeScript pass ở máy, fail ở CI**: thường do code phụ thuộc file
  generated nhưng không commit (ví dụ type toàn cục `LayoutProps` chỉ tồn
  tại trong `.next/` sau khi chạy `next dev`, mà `.next` bị gitignore).
  Cách sửa là khai báo tường minh, ví dụ
  `{ children }: { children: ReactNode }`, không dùng type toàn cục đó.
- **Test chạm database thật**: mọi suite đều hermetic. Nếu thấy lỗi kết nối
  Scylla khi chạy test, nghĩa là một `mock.module` sai hình (xem mục 5)
  khiến code dùng nhầm client thật.
