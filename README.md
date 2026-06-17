# k6-conductor

> Configuration-driven load testing framework built on [Grafana k6](https://k6.io).  
> Add a new endpoint by editing JSON — no code required.

---

## How it works

- **Endpoints** are defined in JSON files — one file per service/app.
- **Test data** (path variables, request bodies) comes from CSV files. A random row is picked per request.
- **Traffic mix** is controlled by a `weight` on each endpoint — heavier endpoints get called more often.
- **Think time** is configured per endpoint — k6 sleeps a random duration between `min` and `max` after each call.
- **VU profiles** (how many virtual users, for how long) live in a single `profiles.json` — selected at runtime.

---

## Project structure

```
framework/
├── main.js                        # k6 entry point — do not edit
├── config/
│   ├── global.json                # Base URL, auth config, app registry
│   ├── profiles.json              # VU/stage profiles (smoke, load, stress, soak)
│   └── apps/
│       ├── user-service.json      # Endpoints for user-service
│       ├── product-service.json   # Endpoints for product-service
│       └── ...                    # One file per service
├── data/
│   ├── users.csv                  # Login credentials
│   ├── user_ids.csv               # Test data for user-service endpoints
│   └── ...                        # One CSV per data set
└── lib/                           # Framework internals — do not edit
    ├── auth.js
    ├── dataLoader.js
    ├── requestBuilder.js
    └── runner.js
```

---

## Quickstart

### 1. Configure your base URL and auth

Edit `config/global.json`:

```json
{
  "baseUrl": "https://your-app.example.com",
  "auth": {
    "url": "/api/v1/auth/token",
    "usernameField": "email",
    "passwordField": "password",
    "tokenPath": "access_token",
    "dataFile": "data/users.csv"
  },
  "apps": ["user-service", "order-service"]
}
```

### 2. Add your test users

Edit `data/users.csv`:

```csv
email,password
user1@example.com,Password1!
user2@example.com,Password2!
```

### 3. Add a service

Create `config/apps/order-service.json`:

```json
{
  "endpoints": [
    {
      "id": "get_order",
      "method": "GET",
      "url": "/api/v1/orders/{orderId}",
      "dataFile": "data/order_ids.csv",
      "thinkTime": { "min": 1, "max": 3 },
      "weight": 60,
      "checks": { "status": 200 }
    },
    {
      "id": "create_order",
      "method": "POST",
      "url": "/api/v1/orders",
      "body": { "productId": "{productId}", "quantity": "{quantity}" },
      "dataFile": "data/order_payload.csv",
      "thinkTime": { "min": 2, "max": 5 },
      "weight": 40,
      "checks": { "status": 201 }
    }
  ]
}
```

### 4. Add test data

Create `data/order_ids.csv`:

```csv
orderId
ORD-001
ORD-002
ORD-003
```

### 5. Run

```bash
# All services, default load profile
k6 run framework/main.js

# Single service
k6 run -e APPS=order-service framework/main.js

# Multiple services
k6 run -e APPS=user-service,order-service framework/main.js

# Override base URL
k6 run -e BASE_URL=https://staging.example.com -e APPS=all framework/main.js
```

---

## Endpoint config reference

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique identifier, used in k6 tags and logs |
| `method` | Yes | `GET` `POST` `PUT` `PATCH` `DELETE` |
| `url` | Yes | Path with `{placeholder}` tokens for path variables |
| `dataFile` | No | CSV file path (relative to `framework/`). `null` if no data needed |
| `body` | No | Request body object. Values can contain `{placeholder}` tokens |
| `thinkTime` | Yes | `{ "min": 1, "max": 3 }` — seconds to sleep after the call |
| `weight` | Yes | Relative traffic share. Does not need to sum to 100 |
| `checks` | Yes | `{ "status": 200 }` — expected HTTP status code |

---

## Load profiles

Profiles are defined in `config/profiles.json`. Select one at runtime with `TEST_TYPE`.

| Profile | Purpose |
|---|---|
| `dryrun` | 1 VU for 1 min — verify nothing is broken |
| `smoke` | 5 VUs for 2 min — quick sanity check |
| `load` | Ramp to 200 VUs — normal production load |
| `stress` | Ramp to 1000 VUs — find the breaking point |
| `soak` | 200 VUs for 2 hours — detect slow degradation |

```bash
k6 run -e TEST_TYPE=smoke  framework/main.js
k6 run -e TEST_TYPE=stress framework/main.js
k6 run -e TEST_TYPE=soak   framework/main.js
```

Add a new profile by adding a JSON entry to `config/profiles.json` — no code changes needed.

---

## ENV variable reference

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | value in `global.json` | Override the target base URL |
| `TEST_TYPE` | `load` | Load profile to use |
| `APPS` | `all` | Comma-separated service names, or `all` |

---

## Adding a new service — checklist

- [ ] Create `config/apps/<service-name>.json` with your endpoints
- [ ] Add `<service-name>` to the `apps` array in `config/global.json`
- [ ] Create any required CSV files under `data/`
- [ ] Run with `-e APPS=<service-name>` to test in isolation first

---

## Requirements

- [k6](https://k6.io/docs/get-started/installation/) v0.46+
