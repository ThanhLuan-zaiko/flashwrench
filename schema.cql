-- ============================================================================
-- FlashWrench — ScyllaDB Schema (CQL)
-- Web app: on-demand mobile vehicle repair / at-home service
--          + emergency roadside rescue + auto parts store (cars first)
--
-- DESIGN PRINCIPLES (Query-Driven, NoSQL):
--  1. Model around queries, NOT relations: one primary query = one table.
--  2. NO JOINs, NO ALLOW FILTERING: denormalize read-heavy data.
--  3. Choose partition keys for even distribution, avoid hot partitions
--     (e.g. low-cardinality status -> combine with month_bucket / zone_id).
--  4. Clustering keys sorted DESC by time so newest rows come first.
--  5. Money in VND uses BIGINT (never float/decimal). Coordinates use DOUBLE.
--  6. Counters live in dedicated tables. UDTs only in regular columns.
-- ============================================================================

-- NOTE: RF=1 fits single-node local dev (docker). For production with
-- 3+ nodes per DC, raise to 'datacenter1': 3.
CREATE KEYSPACE IF NOT EXISTS flashwrench
  WITH replication = { 'class': 'NetworkTopologyStrategy', 'datacenter1': 1 }
  AND durable_writes = true;

USE flashwrench;

-- ============================================================================
-- 0. SHARED UDTs
-- ============================================================================

CREATE TYPE IF NOT EXISTS address_udt (
  province    TEXT,    -- Province / city
  district    TEXT,    -- District
  ward        TEXT,    -- Ward / commune
  street      TEXT,    -- Street address, house number
  full_text   TEXT,    -- Full denormalized address for fast rendering
  lat         DOUBLE,  -- Latitude (map / dispatch)
  lng         DOUBLE   -- Longitude
);

CREATE TYPE IF NOT EXISTS image_udt (
  url         TEXT,
  alt         TEXT,
  sort_order  INT
);

-- ============================================================================
-- 0b. MEDIA ASSETS (uploaded images)
-- Files live on disk under storage/uploads/<scope>/<YYYY-MM>/<uuid>.<ext>
-- (see docs/media.md); ScyllaDB keeps only metadata + public URL. Scopes:
-- avatar | service | category | part | booking | emergency | review | misc.
-- Query: single asset (serve permission check, delete)
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_assets (
  asset_id   UUID PRIMARY KEY,
  owner_type TEXT,     -- avatar | service | category | part | booking | emergency | review | misc
  owner_id   UUID,     -- user_id | service_id | category_id | part_id | booking_id | ...
  scope      TEXT,     -- storage scope folder (usually = owner_type)
  file_path  TEXT,     -- relative path under storage/uploads
  url        TEXT,     -- public URL (/api/media/<file_path>)
  mime       TEXT,     -- image/jpeg | image/png | image/webp
  size_bytes BIGINT,
  width      INT,
  height     INT,
  alt        TEXT,
  created_by UUID,     -- uploader user_id
  created_at TIMESTAMP
);

-- Query: every image of one owner (service gallery, part gallery...)
CREATE TABLE IF NOT EXISTS media_assets_by_owner (
  owner_type TEXT,
  owner_id   UUID,
  created_at TIMESTAMP,
  asset_id   UUID,
  url        TEXT,
  PRIMARY KEY ((owner_type, owner_id), created_at, asset_id)
) WITH CLUSTERING ORDER BY (created_at DESC, asset_id ASC);

-- ============================================================================
-- 1. USERS & AUTH
-- role = customer | mechanic | dispatcher | admin
-- status = active | locked | pending_verification
-- ============================================================================

-- Query: get user by id (profile, auth session)
CREATE TABLE IF NOT EXISTS users_by_id (
  user_id       UUID PRIMARY KEY,
  phone         TEXT,
  email         TEXT,
  password_hash TEXT,
  full_name     TEXT,
  role          TEXT,
  avatar_url    TEXT,
  status        TEXT,
  token_version INT, -- bump on password change / lock: kills old access tokens
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
);

-- Query: login / existence check by phone
CREATE TABLE IF NOT EXISTS users_by_phone (
  phone   TEXT PRIMARY KEY,
  user_id UUID
);

-- Query: login / existence check by email
CREATE TABLE IF NOT EXISTS users_by_email (
  email   TEXT PRIMARY KEY,
  user_id UUID
);

-- Query: pending temp passwords created by admins. One row per staff account,
-- removed as soon as the staff member changes their password or the account
-- is hard-deleted. The password is stored encrypted (AES-GCM); only admins
-- may decrypt it through the pending-passwords endpoint.
CREATE TABLE IF NOT EXISTS staff_temp_passwords (
  user_id           UUID PRIMARY KEY,
  temp_password_enc TEXT,
  created_at        TIMESTAMP,
  created_by        UUID
);

-- Query: list by role (admin management) — month_bucket prevents hot partitions
-- month_bucket format 'YYYY-MM'
CREATE TABLE IF NOT EXISTS users_by_role (
  role         TEXT,
  month_bucket TEXT,
  created_at   TIMESTAMP,
  user_id      UUID,
  full_name    TEXT,
  phone        TEXT,
  email        TEXT,
  status       TEXT,
  PRIMARY KEY ((role, month_bucket), created_at, user_id)
) WITH CLUSTERING ORDER BY (created_at DESC, user_id ASC);

-- Distributed rate limiting without RAM or Redis: one row per
-- (kind, ip, fixed window). Rows expire by TTL, so storage stays bounded.
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket    TEXT PRIMARY KEY, -- e.g. "login:1.2.3.4:29247111"
  count     INT,
  window_ms BIGINT
);

-- Phone verification OTPs (app sets TTL: INSERT ... USING TTL 300)
CREATE TABLE IF NOT EXISTS phone_otps (
  phone      TEXT PRIMARY KEY,
  otp_hash   TEXT,
  attempts   INT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Auth sessions: rotating opaque refresh tokens. The (user_id, family_id)
-- partition is derived from the refresh token itself: one single-partition read.
CREATE TABLE IF NOT EXISTS refresh_sessions (
  user_id             UUID,
  family_id           UUID,
  token_hash          TEXT,
  previous_token_hash TEXT,
  device_label        TEXT,
  created_at          TIMESTAMP,
  rotated_at          TIMESTAMP,
  expires_at          TIMESTAMP,
  PRIMARY KEY ((user_id, family_id))
);

-- List / revoke every device of one user (the /account page).
CREATE TABLE IF NOT EXISTS refresh_sessions_by_user (
  user_id      UUID,
  created_at   TIMESTAMP,
  family_id    UUID,
  device_label TEXT,
  expires_at   TIMESTAMP,
  PRIMARY KEY ((user_id), created_at, family_id)
) WITH CLUSTERING ORDER BY (created_at DESC, family_id ASC);

-- ============================================================================
-- 2. CUSTOMER VEHICLES (cars first)
-- vehicle_type = car | suv | pickup | van | truck | ev
-- fuel_type = petrol | diesel | hybrid | electric
-- ============================================================================

-- Query: single vehicle details
CREATE TABLE IF NOT EXISTS vehicles_by_id (
  vehicle_id     UUID PRIMARY KEY,
  owner_id       UUID,
  license_plate  TEXT,
  brand          TEXT,  -- Toyota, Honda, Ford, VinFast...
  model          TEXT,  -- Vios, CX-5, VF8...
  year           INT,
  color          TEXT,
  vin            TEXT,
  vehicle_type   TEXT,
  fuel_type      TEXT,
  transmission   TEXT,  -- at | mt | cvt
  odometer_km    INT,
  is_default     BOOLEAN,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
);

-- Query: "my vehicles" — list all vehicles of one customer, newest first
CREATE TABLE IF NOT EXISTS vehicles_by_owner (
  owner_id      UUID,
  created_at    TIMESTAMP,
  vehicle_id    UUID,
  license_plate TEXT,
  brand         TEXT,
  model         TEXT,
  year          INT,
  vehicle_type  TEXT,
  is_default    BOOLEAN,
  PRIMARY KEY ((owner_id), created_at, vehicle_id)
) WITH CLUSTERING ORDER BY (created_at DESC, vehicle_id ASC);

-- Query: fast lookup by license plate (dedup check, owner lookup on rescue)
CREATE TABLE IF NOT EXISTS vehicles_by_plate (
  license_plate TEXT PRIMARY KEY,
  vehicle_id    UUID,
  owner_id      UUID
);

-- ============================================================================
-- 3. SERVICE ZONES + MOBILE MECHANICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_zones (
  zone_id    UUID PRIMARY KEY,
  name       TEXT,     -- e.g. "District 1 - HCMC", "Hai Chau - Da Nang"
  city       TEXT,
  center_lat DOUBLE,
  center_lng DOUBLE,
  radius_km  DOUBLE,
  is_active  BOOLEAN,
  created_at TIMESTAMP
);

-- Query: mechanic profile details (app joins users_by_id + mechanics_by_id)
CREATE TABLE IF NOT EXISTS mechanics_by_id (
  mechanic_id      UUID PRIMARY KEY, -- = user_id
  display_name     TEXT,
  avatar_url       TEXT,
  bio              TEXT,
  years_experience INT,
  skills           SET<TEXT>, -- engine | tire | battery | brake | ac | electrical | diagnostics
  zone_ids         SET<UUID>,
  base_lat         DOUBLE,
  base_lng         DOUBLE,
  is_verified      BOOLEAN,
  is_online        BOOLEAN,
  is_available     BOOLEAN,
  rating_avg       DECIMAL,
  rating_count     INT,
  completed_jobs   INT,
  created_at       TIMESTAMP,
  updated_at       TIMESTAMP
);

-- Query: "find mechanics in a zone" for booking / rescue dispatch
-- Sorted by rating so best mechanics come first
CREATE TABLE IF NOT EXISTS mechanics_by_zone (
  zone_id      UUID,
  rating_avg   DECIMAL,
  mechanic_id  UUID,
  display_name TEXT,
  skills       SET<TEXT>,
  is_online    BOOLEAN,
  is_available BOOLEAN,
  is_verified  BOOLEAN,
  PRIMARY KEY ((zone_id), rating_avg, mechanic_id)
) WITH CLUSTERING ORDER BY (rating_avg DESC, mechanic_id ASC);

-- Query: bookable mechanic directory for the customer booking picker.
-- One small partition (bucket = 'all') sorted by rating, maintained
-- whenever a mechanic flips availability (see syncMechanicDirectory):
-- the picker lists without scanning mechanics_by_id.
CREATE TABLE IF NOT EXISTS mechanics_available (
  bucket       TEXT, -- constant 'all': single partition, bounded by LIMIT
  rating_avg   DECIMAL,
  mechanic_id  UUID,
  display_name TEXT,
  skills       SET<TEXT>,
  base_lat     DOUBLE,
  base_lng     DOUBLE,
  is_online    BOOLEAN,
  is_verified  BOOLEAN,
  rating_count INT,
  completed_jobs INT,
  PRIMARY KEY ((bucket), rating_avg, mechanic_id)
) WITH CLUSTERING ORDER BY (rating_avg DESC, mechanic_id ASC);

-- Query: mechanic realtime location (app writes often, read on tracking)
CREATE TABLE IF NOT EXISTS mechanic_locations (
  mechanic_id      UUID PRIMARY KEY,
  lat              DOUBLE,
  lng              DOUBLE,
  current_job_id   UUID,
  current_job_type TEXT, -- booking | emergency | none
  updated_at       TIMESTAMP
);

-- ============================================================================
-- 4. REPAIR SERVICE CATALOG (at-home / mobile)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_categories (
  category_id UUID PRIMARY KEY,
  name        TEXT,
  slug        TEXT,
  icon        TEXT,
  image_url   TEXT,  -- cover image (served from media storage)
  images      LIST<TEXT>, -- cover gallery in display order, first mirrors image_url
  description TEXT,
  sort_order  INT,
  is_active   BOOLEAN,
  is_deleted  BOOLEAN,   -- Soft delete: true = hidden in trash, restorable
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP,
  deleted_at  TIMESTAMP  -- Set on soft delete, null on restore
);

CREATE TABLE IF NOT EXISTS service_categories_by_slug (
  slug        TEXT PRIMARY KEY,
  category_id UUID
);

-- Query: service details (price, job duration)
CREATE TABLE IF NOT EXISTS services_by_id (
  service_id             UUID PRIMARY KEY,
  category_id            UUID,
  category_name          TEXT, -- denormalized to avoid a second query
  name                   TEXT,
  slug                   TEXT,
  description            TEXT,
  image_url              TEXT,  -- cover image (served from media storage)
  images                 LIST<TEXT>, -- cover gallery in display order, first mirrors image_url
  base_price             BIGINT,  -- VND
  price_unit             TEXT,    -- per_job | per_hour | per_item
  duration_min           INT,
  is_home_supported      BOOLEAN,
  is_emergency_supported BOOLEAN,
  is_active              BOOLEAN,
  is_deleted             BOOLEAN,   -- Soft delete: true = hidden in trash
  created_at             TIMESTAMP,
  updated_at             TIMESTAMP,
  deleted_at             TIMESTAMP
);

-- Query: list services by category (booking menu)
CREATE TABLE IF NOT EXISTS services_by_category (
  category_id UUID,
  service_id  UUID,
  name        TEXT,
  slug        TEXT,
  base_price  BIGINT,
  duration_min INT,
  is_active   BOOLEAN,
  is_deleted  BOOLEAN, -- denormalized soft-delete flag for cheap filtering
  PRIMARY KEY ((category_id), service_id)
);

CREATE TABLE IF NOT EXISTS services_by_slug (
  slug       TEXT PRIMARY KEY,
  service_id UUID
);

-- ============================================================================
-- 5. AT-HOME REPAIR BOOKINGS
-- status = pending | confirmed | mechanic_assigned | en_route |
--          in_progress | completed | cancelled | no_show
-- payment_status = unpaid | partial | paid | refunded
-- ============================================================================

-- Query: single booking details (customer / vehicle / mechanic names denormalized)
CREATE TABLE IF NOT EXISTS bookings_by_id (
  booking_id        UUID PRIMARY KEY,
  customer_id       UUID,
  customer_name     TEXT,
  customer_phone    TEXT,
  vehicle_id        UUID,
  vehicle_plate     TEXT,
  vehicle_brand     TEXT,
  vehicle_model     TEXT,
  mechanic_id       UUID,
  mechanic_name     TEXT,
  zone_id           UUID,
  address           FROZEN<address_udt>,
  scheduled_at      TIMESTAMP, -- UTC instant; wall time lives in timezone
  timezone          TEXT,      -- IANA zone where the work happens (display + buckets)
  status            TEXT,
  payment_status    TEXT,
  subtotal          BIGINT,
  travel_fee        BIGINT,
  discount          BIGINT,
  total             BIGINT,
  coupon_code       TEXT,
  notes             TEXT,
  cancel_reason     TEXT,
  month_bucket      TEXT, -- 'YYYY-MM', for monthly queries
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
);

-- Query: customer booking history
CREATE TABLE IF NOT EXISTS bookings_by_customer (
  customer_id  UUID,
  scheduled_at TIMESTAMP,
  booking_id   UUID,
  status       TEXT,
  total        BIGINT,
  vehicle_plate TEXT,
  mechanic_name TEXT,
  PRIMARY KEY ((customer_id), scheduled_at, booking_id)
) WITH CLUSTERING ORDER BY (scheduled_at DESC, booking_id ASC);

-- Query: mechanic workload
CREATE TABLE IF NOT EXISTS bookings_by_mechanic (
  mechanic_id  UUID,
  scheduled_at TIMESTAMP,
  booking_id   UUID,
  status       TEXT,
  total        BIGINT,
  vehicle_plate TEXT,
  customer_name TEXT,
  PRIMARY KEY ((mechanic_id), scheduled_at, booking_id)
) WITH CLUSTERING ORDER BY (scheduled_at DESC, booking_id ASC);

-- Query: dispatcher/admin filter by status (monthly bucket avoids hot partitions)
CREATE TABLE IF NOT EXISTS bookings_by_status (
  status       TEXT,
  month_bucket TEXT,
  scheduled_at TIMESTAMP,
  booking_id   UUID,
  customer_id  UUID,
  mechanic_id  UUID,
  zone_id      UUID,
  total        BIGINT,
  PRIMARY KEY ((status, month_bucket), scheduled_at, booking_id)
) WITH CLUSTERING ORDER BY (scheduled_at DESC, booking_id ASC);

-- Line items of one booking (price snapshot at booking time)
CREATE TABLE IF NOT EXISTS booking_items (
  booking_id   UUID,
  service_id   UUID,
  service_name TEXT,
  quantity     INT,
  unit_price   BIGINT,
  line_total   BIGINT,
  PRIMARY KEY ((booking_id), service_id)
);

-- Status timeline for tracking ("mechanic on the way", "repairing"...)
CREATE TABLE IF NOT EXISTS booking_status_history (
  booking_id UUID,
  changed_at TIMESTAMP,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  note       TEXT,
  PRIMARY KEY ((booking_id), changed_at)
) WITH CLUSTERING ORDER BY (changed_at DESC);

-- Customer <-> mechanic chat within one booking
CREATE TABLE IF NOT EXISTS booking_messages (
  booking_id UUID,
  sent_at    TIMESTAMP,
  message_id UUID,
  sender_id  UUID,
  body       TEXT,
  image_url  TEXT,
  PRIMARY KEY ((booking_id), sent_at, message_id)
) WITH CLUSTERING ORDER BY (sent_at ASC, message_id ASC);

-- ============================================================================
-- 6. EMERGENCY ROADSIDE RESCUE
-- status = open | dispatching | assigned | en_route | on_site |
--          completed | cancelled | expired
-- priority = low | normal | high | critical
-- issue_type = flat_tire | dead_battery | engine_failure | accident |
--              out_of_fuel | overheating | locked_out | other
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_by_id (
  request_id          UUID PRIMARY KEY,
  customer_id         UUID,
  customer_name       TEXT,
  customer_phone      TEXT,
  vehicle_id          UUID,
  vehicle_plate       TEXT,
  vehicle_brand       TEXT,
  vehicle_model       TEXT,
  zone_id             UUID,
  address             FROZEN<address_udt>,
  issue_type          TEXT,
  description         TEXT,
  photos              LIST<TEXT>,
  priority            TEXT,
  status              TEXT,
  assigned_mechanic_id UUID,
  assigned_mechanic_name TEXT,
  eta_min             INT,
  price_estimate      BIGINT,
  final_price         BIGINT,
  payment_status      TEXT,
  cancel_reason       TEXT,
  created_at          TIMESTAMP,
  updated_at          TIMESTAMP
);

-- Query: customer rescue history
CREATE TABLE IF NOT EXISTS emergency_by_customer (
  customer_id UUID,
  created_at  TIMESTAMP,
  request_id  UUID,
  status      TEXT,
  issue_type  TEXT,
  vehicle_plate TEXT,
  PRIMARY KEY ((customer_id), created_at, request_id)
) WITH CLUSTERING ORDER BY (created_at DESC, request_id ASC);

-- Query (MOST IMPORTANT): dispatcher finds "pending rescues" inside one zone
-- Partition (zone_id, status) distributes evenly by zone
CREATE TABLE IF NOT EXISTS emergency_by_zone_status (
  zone_id    UUID,
  status     TEXT,
  created_at TIMESTAMP,
  request_id UUID,
  priority   TEXT,
  issue_type TEXT,
  customer_phone TEXT,
  PRIMARY KEY ((zone_id, status), created_at, request_id)
) WITH CLUSTERING ORDER BY (created_at DESC, request_id ASC);

-- Query: mechanic rescue workload
CREATE TABLE IF NOT EXISTS emergency_by_mechanic (
  mechanic_id UUID,
  created_at  TIMESTAMP,
  request_id  UUID,
  status      TEXT,
  issue_type  TEXT,
  PRIMARY KEY ((mechanic_id), created_at, request_id)
) WITH CLUSTERING ORDER BY (created_at DESC, request_id ASC);

-- Dispatch / status-change history of a rescue
CREATE TABLE IF NOT EXISTS emergency_status_history (
  request_id UUID,
  changed_at TIMESTAMP,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  note       TEXT,
  PRIMARY KEY ((request_id), changed_at)
) WITH CLUSTERING ORDER BY (changed_at DESC);

-- Rescue chat (location + on-site photos)
CREATE TABLE IF NOT EXISTS emergency_messages (
  request_id UUID,
  sent_at    TIMESTAMP,
  message_id UUID,
  sender_id  UUID,
  body       TEXT,
  image_url  TEXT,
  lat        DOUBLE,
  lng        DOUBLE,
  PRIMARY KEY ((request_id), sent_at, message_id)
) WITH CLUSTERING ORDER BY (sent_at ASC, message_id ASC);

-- ============================================================================
-- 7. AUTO PARTS SHOP
-- ============================================================================

CREATE TABLE IF NOT EXISTS part_categories (
  category_id UUID PRIMARY KEY,
  name        TEXT, -- Engine oil, Battery, Tire, Brake pad, Air filter...
  slug        TEXT,
  icon        TEXT,
  sort_order  INT,
  is_active   BOOLEAN
);

CREATE TABLE IF NOT EXISTS part_categories_by_slug (
  slug        TEXT PRIMARY KEY,
  category_id UUID
);

-- Query: product details (category name denormalized)
CREATE TABLE IF NOT EXISTS parts_by_id (
  part_id       UUID PRIMARY KEY,
  sku           TEXT,
  name          TEXT,
  brand         TEXT, -- Bosch, Castrol, Michelin, Denso...
  category_id   UUID,
  category_name TEXT,
  car_brands    SET<TEXT>, -- compatible brands: [Toyota, Honda, VinFast]
  car_models    SET<TEXT>, -- compatible models: [Vios, CX-5, VF8]
  price         BIGINT,    -- VND
  compare_price BIGINT,    -- list price (to show discount %)
  stock_qty     INT,
  sold_count    INT,
  images        LIST<TEXT>,
  specs         MAP<TEXT, TEXT>, -- {warranty: 12 months, origin: ...}
  description   TEXT,
  rating_avg    DECIMAL,
  rating_count  INT,
  is_active     BOOLEAN,
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
);

-- Query: browse shop by category (newest first)
CREATE TABLE IF NOT EXISTS parts_by_category (
  category_id UUID,
  created_at  TIMESTAMP,
  part_id     UUID,
  name        TEXT,
  brand       TEXT,
  price       BIGINT,
  stock_qty   INT,
  rating_avg  DECIMAL,
  is_active   BOOLEAN,
  PRIMARY KEY ((category_id), created_at, part_id)
) WITH CLUSTERING ORDER BY (created_at DESC, part_id ASC);

-- Query: filter by parts brand (Bosch, Michelin...)
CREATE TABLE IF NOT EXISTS parts_by_brand (
  brand      TEXT,
  created_at TIMESTAMP,
  part_id    UUID,
  name       TEXT,
  price      BIGINT,
  stock_qty  INT,
  PRIMARY KEY ((brand), created_at, part_id)
) WITH CLUSTERING ORDER BY (created_at DESC, part_id ASC);

-- Query: lookup by SKU (product / barcode code)
CREATE TABLE IF NOT EXISTS parts_by_sku (
  sku     TEXT PRIMARY KEY,
  part_id UUID
);

-- Query: lookup by SEO slug (/parts/gs-70ah-battery)
CREATE TABLE IF NOT EXISTS parts_by_slug (
  slug    TEXT PRIMARY KEY,
  part_id UUID
);

-- ============================================================================
-- 8. CART + PARTS ORDERS
-- order_status = pending | confirmed | packing | shipping |
--                delivered | cancelled | refunded
-- ============================================================================

-- Query: current customer cart (price + image snapshot for fast rendering)
CREATE TABLE IF NOT EXISTS carts_by_customer (
  customer_id UUID,
  part_id     UUID,
  qty         INT,
  unit_price  BIGINT,
  part_name   TEXT,
  part_image  TEXT,
  added_at    TIMESTAMP,
  PRIMARY KEY ((customer_id), part_id)
);

-- Query: single order details
CREATE TABLE IF NOT EXISTS orders_by_id (
  order_id       UUID PRIMARY KEY,
  customer_id    UUID,
  customer_name  TEXT,
  customer_phone TEXT,
  shipping_address FROZEN<address_udt>,
  status         TEXT,
  payment_status TEXT,
  payment_method TEXT,
  subtotal       BIGINT,
  shipping_fee   BIGINT,
  discount       BIGINT,
  total          BIGINT,
  coupon_code    TEXT,
  note           TEXT,
  month_bucket   TEXT,
  created_at     TIMESTAMP,
  updated_at     TIMESTAMP
);

-- Query: my orders
CREATE TABLE IF NOT EXISTS orders_by_customer (
  customer_id UUID,
  created_at  TIMESTAMP,
  order_id    UUID,
  status      TEXT,
  total       BIGINT,
  PRIMARY KEY ((customer_id), created_at, order_id)
) WITH CLUSTERING ORDER BY (created_at DESC, order_id ASC);

-- Query: admin/support filter orders by status (monthly bucket)
CREATE TABLE IF NOT EXISTS orders_by_status (
  status       TEXT,
  month_bucket TEXT,
  created_at   TIMESTAMP,
  order_id     UUID,
  customer_id  UUID,
  total        BIGINT,
  PRIMARY KEY ((status, month_bucket), created_at, order_id)
) WITH CLUSTERING ORDER BY (created_at DESC, order_id ASC);

-- Order lines (name + price snapshot at purchase time, kept even if price changes)
CREATE TABLE IF NOT EXISTS order_items_by_order (
  order_id   UUID,
  part_id    UUID,
  part_name  TEXT,
  part_image TEXT,
  sku        TEXT,
  quantity   INT,
  unit_price BIGINT,
  line_total BIGINT,
  PRIMARY KEY ((order_id), part_id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  order_id   UUID,
  changed_at TIMESTAMP,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID,
  note       TEXT,
  PRIMARY KEY ((order_id), changed_at)
) WITH CLUSTERING ORDER BY (changed_at DESC);

-- ============================================================================
-- 9. PAYMENTS (shared for bookings / rescues / parts orders)
-- ref_type = booking | emergency | order
-- method = cod | bank_transfer | momo | vnpay | zalopay | card
-- status = pending | paid | failed | refunded
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments_by_id (
  payment_id  UUID PRIMARY KEY,
  ref_type    TEXT,
  ref_id      UUID, -- booking_id | request_id | order_id
  customer_id UUID,
  amount      BIGINT, -- VND
  method      TEXT,
  status      TEXT,
  provider_ref TEXT,  -- MoMo / VNPay / bank transaction reference
  paid_at     TIMESTAMP,
  created_at  TIMESTAMP
);

-- Query: customer payment history
CREATE TABLE IF NOT EXISTS payments_by_customer (
  customer_id UUID,
  created_at  TIMESTAMP,
  payment_id  UUID,
  ref_type    TEXT,
  ref_id      UUID,
  amount      BIGINT,
  status      TEXT,
  PRIMARY KEY ((customer_id), created_at, payment_id)
) WITH CLUSTERING ORDER BY (created_at DESC, payment_id ASC);

-- Query: reconcile by referenced order (one booking can be charged multiple times)
CREATE TABLE IF NOT EXISTS payments_by_ref (
  ref_type   TEXT,
  ref_id     UUID,
  created_at TIMESTAMP,
  payment_id UUID,
  amount     BIGINT,
  status     TEXT,
  PRIMARY KEY ((ref_type, ref_id), created_at, payment_id)
) WITH CLUSTERING ORDER BY (created_at DESC, payment_id ASC);

-- ============================================================================
-- 10. REVIEWS (mechanics / services / parts)
-- target_type = mechanic | service | part
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews_by_target (
  target_type TEXT,
  target_id   UUID,
  created_at  TIMESTAMP,
  review_id   UUID,
  customer_id UUID,
  customer_name TEXT,
  booking_id  UUID, -- nullable: review after using a service
  order_id    UUID, -- nullable: review after buying a part
  rating      INT,  -- 1..5
  title       TEXT,
  body        TEXT,
  images      LIST<TEXT>,
  PRIMARY KEY ((target_type, target_id), created_at, review_id)
) WITH CLUSTERING ORDER BY (created_at DESC, review_id ASC);

-- Query: reviews written by one customer
CREATE TABLE IF NOT EXISTS reviews_by_customer (
  customer_id UUID,
  created_at  TIMESTAMP,
  review_id   UUID,
  target_type TEXT,
  target_id   UUID,
  rating      INT,
  PRIMARY KEY ((customer_id), created_at, review_id)
) WITH CLUSTERING ORDER BY (created_at DESC, review_id ASC);

-- Score counters (app computes rating_avg = total_score / total_count)
CREATE TABLE IF NOT EXISTS rating_counters (
  target_type TEXT,
  target_id   UUID,
  total_score COUNTER,
  total_count COUNTER,
  PRIMARY KEY ((target_type, target_id))
);

-- ============================================================================
-- 11. PROMOTIONS / COUPONS
-- discount_type = percent | fixed
-- ============================================================================

CREATE TABLE IF NOT EXISTS coupons_by_code (
  code          TEXT PRIMARY KEY,
  name          TEXT,
  discount_type TEXT,
  discount_value BIGINT, -- percent (1-100) or fixed VND amount
  max_discount  BIGINT,
  min_order     BIGINT,
  start_at      TIMESTAMP,
  end_at        TIMESTAMP,
  usage_limit   INT,
  used_count    INT,
  is_active     BOOLEAN
);

-- Query: who used a coupon (prevent double use / per-user limits)
CREATE TABLE IF NOT EXISTS coupon_usages (
  code      TEXT,
  used_at   TIMESTAMP,
  user_id   UUID,
  order_id  UUID,
  booking_id UUID,
  PRIMARY KEY ((code), used_at, user_id)
) WITH CLUSTERING ORDER BY (used_at DESC, user_id ASC);

-- ============================================================================
-- 12. MAINTENANCE HISTORY + NOTIFICATIONS
-- ============================================================================

-- Query: repair / maintenance history of one vehicle
-- (denormalized from completed bookings + rescues)
CREATE TABLE IF NOT EXISTS maintenance_history_by_vehicle (
  vehicle_id   UUID,
  serviced_at  TIMESTAMP,
  record_id    UUID,
  source_type  TEXT, -- booking | emergency | shop_service
  source_id    UUID,
  mechanic_name TEXT,
  summary      TEXT, -- e.g. "Oil + air filter change, front brake pads"
  cost         BIGINT,
  odometer_km  INT,
  next_due_at  TIMESTAMP,
  next_due_km  INT,
  PRIMARY KEY ((vehicle_id), serviced_at, record_id)
) WITH CLUSTERING ORDER BY (serviced_at DESC, record_id ASC);

-- Query: user notification inbox
-- (app may INSERT ... USING TTL for expiring messages)
CREATE TABLE IF NOT EXISTS notifications_by_user (
  user_id         UUID,
  created_at      TIMESTAMP,
  notification_id UUID,
  title           TEXT,
  body            TEXT,
  link_type       TEXT, -- booking | emergency | order | promotion | none
  link_id         UUID,
  is_read         BOOLEAN,
  PRIMARY KEY ((user_id), created_at, notification_id)
) WITH CLUSTERING ORDER BY (created_at DESC, notification_id ASC);

-- ============================================================================
-- 13. CUSTOMER COMPLAINTS (admin-handled)
-- status = open | in_review | resolved | rejected
-- ref_type = booking | emergency | order | account | other
-- ============================================================================

-- Query: single complaint details (reporter/target names denormalized)
CREATE TABLE IF NOT EXISTS complaints_by_id (
  complaint_id    UUID PRIMARY KEY,
  reporter_name   TEXT,
  reporter_phone  TEXT,
  target_user_id  UUID,
  target_name     TEXT,
  ref_type        TEXT,
  ref_id          TEXT,
  subject         TEXT,
  body            TEXT,
  status          TEXT,
  resolution_note TEXT,
  month_bucket    TEXT, -- 'YYYY-MM', for monthly queries
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP,
  resolved_at     TIMESTAMP
);

-- Query: admin filter complaints by status (monthly bucket avoids hot partitions)
CREATE TABLE IF NOT EXISTS complaints_by_status (
  status         TEXT,
  month_bucket   TEXT,
  created_at     TIMESTAMP,
  complaint_id   UUID,
  subject        TEXT,
  reporter_phone TEXT,
  PRIMARY KEY ((status, month_bucket), created_at, complaint_id)
) WITH CLUSTERING ORDER BY (created_at DESC, complaint_id ASC);
