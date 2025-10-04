# NCDB Schema Cheat Sheet

Instance: `48346_allerq`
Base URL: `https://api.nocodebackend.com`
All requests: `?Instance=48346_allerq`, JSON body includes `secret_key`.

## Users
```
users
  id                int(11) PK, NOT NULL
  uid               varchar(255) UNIQUE, NOT NULL
  email             varchar(255) UNIQUE, NOT NULL
  display_name      varchar(255)
  role              enum('admin','manager','superadmin') NOT NULL
  created_at        bigint(20) NOT NULL
  updated_at        bigint(20)
  assigned_restaurants longtext
  external_id       varchar(255) UNIQUE
  password_hash     char(64) NOT NULL
```
Notes:
- `assigned_restaurants` may be `null` or a JSON string.
- Roles no longer include `user`.

## Restaurants
```
restaurants
  id          int(11) PK, NOT NULL
  name        varchar(255) NOT NULL
  address     longtext
  owner_id    varchar(255) NOT NULL
  logo_url    varchar(255)
  region      varchar(255)
  location    longtext
  phone       varchar(255)
  email       varchar(255)
  website     varchar(255)
  created_at  bigint(20) NOT NULL
  updated_at  bigint(20)
  external_id varchar(255) UNIQUE
```

## Menus
```
menus
  id              int(11) PK, NOT NULL
  name            varchar(255) NOT NULL
  description     longtext
  restaurant_id   int(11) FK, NOT NULL
  created_by      varchar(255)
  created_at      bigint(20) NOT NULL
  updated_at      bigint(20)
  external_id     varchar(255) UNIQUE
  menu_type       longtext
  is_active       tinyint(1)
  ai_processed    tinyint(1)
  upload_file_name longtext
```

## Menu Items
```
menu_items
  id              int(11) PK, NOT NULL
  menu_id         int(11) FK, NOT NULL
  restaurant_id   int(11) FK, NOT NULL
  name            varchar(255) NOT NULL
  description     longtext
  price           decimal(10,2)
  category        varchar(255)
  allergens       longtext
  dietary         longtext
  created_at      bigint(20) NOT NULL
  updated_at      bigint(20)
  external_id     varchar(255) UNIQUE
  ai_confidence   decimal(10,2)
  manual_override tinyint(1)
  category_id     int(11) FK
  is_active       smallint(6)
  ai_processed    smallint(6)
  ai_needs_review smallint(6)
```
Notes:
- `is_active`/AI flags are smallints; treat non-zero as true.

## Supporting Tables
```
analytics            # events linked to restaurants/menus
menu_categories      # grouping for menu items
menu_uploads         # files processed by AI
qr_codes             # QR codes per restaurant/menu
subscriptions        # plan/status per restaurant
```

## Joins
- `menus.restaurant_id = restaurants.id`
- `menu_items.menu_id = menus.id`

Keep this file updated when the NCDB schema changes.
