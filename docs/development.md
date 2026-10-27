# Development guide

- [Prerequisites](#prerequisites)
- [Run the API](#run-the-api)
- [Run the mobile app](#run-the-mobile-app)
- [Demo data](#demo-data)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing and CI](#testing-and-ci)
- [Conventions](#conventions)
- [Deploying the API](#deploying-the-api)
- [Troubleshooting](#troubleshooting)

## Prerequisites

| Tool | Version | For |
| --- | --- | --- |
| Node.js | 20+ | API and Metro bundler |
| MongoDB | 7+ (or Docker, or Atlas) | Database |
| Xcode + CocoaPods (via Bundler) | Xcode 16+ | iOS |
| Android Studio, JDK 17+ | API 24+ device / emulator with Google Play | Android |

## Run the API

### Option A — Docker (API + MongoDB)

```bash
docker compose up --build        # API on http://localhost:3001
```

### Option B — Node on your machine

```bash
cd server
cp .env.example .env             # set MONGODB_URI and JWT_SECRET
npm install
npm run dev                      # nodemon, http://localhost:3001
curl localhost:3001/health       # {"status":"ok"}
```

The server refuses to start without `MONGODB_URI` and `JWT_SECRET` (and, in production, a `JWT_SECRET` of at least 32 characters).

## Run the mobile app

```bash
cd clients
npm install
bundle install && (cd ios && bundle exec pod install)   # iOS only, first time and after native deps change
npm start                        # Metro
npm run ios                      # or: npm run android
```

The app talks to `localhost:3001` on the iOS simulator and `10.0.2.2:3001` on the Android emulator automatically. On a **physical device**, set `DEV_API_URL_OVERRIDE` in `clients/src/constants/appInfos.js` to your computer's LAN address (e.g. `http://192.168.1.45:3001`). Release builds use `PROD_API_URL`, which must be HTTPS.

> After pulling changes that add a native library, reloading Metro is not enough: run `pod install` and rebuild the app (`npm run ios` / `npm run android`).

## Demo data

```bash
cd server
npm run seed          # WIPES the database in MONGODB_URI, then inserts demo data
```

| Account | Password | Role |
| --- | --- | --- |
| `client@demo.com` | `Password123!` | Client with bookings in every state, a chat and notifications |
| `pt@demo.com` | `Password123!` | Trainer with open slots, requests, completed sessions and reviews |
| `pt2@demo.com` … `pt4@demo.com` | `Password123!` | More trainers for search |

`npm run seed` refuses to run with `NODE_ENV=production`. On a **shared** database, use `npm run test-accounts` instead: it only creates/resets the two accounts configured as `TEST_CLIENT_*` / `TEST_PT_*` in `.env` and tops up the trainer's open slots.

## Environment variables

Server (`server/.env`, see [`.env.example`](../server/.env.example)):

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | | MongoDB connection string |
| `JWT_SECRET` | yes | | JWT signing secret (≥ 32 chars in production) |
| `PORT` | | `3001` | HTTP port |
| `NODE_ENV` | | `development` | `production` hides error details and enables stricter checks |
| `JWT_EXPIRES_IN` | | `1d` | Token lifetime |
| `LOG_LEVEL` | | `info` | `info` logs startup and failed requests; `debug` also logs every successful request |
| `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | | | SMTP (e.g. Gmail app password). Without them emails are logged, not sent |
| `PUBLIC_URL` | | from request | Base URL for uploaded photo links |
| `CORS_ORIGINS` | | | Comma-separated browser origins (native apps don't need it) |
| `TRUST_PROXY` | | `0` | Number of reverse proxies in front of the API (correct client IPs for rate limiting) |
| `FIREBASE_SERVICE_ACCOUNT` | | | Service-account JSON or path to it. Push is disabled when empty — see [push-notifications.md](push-notifications.md) |
| `TEST_CLIENT_EMAIL` / `_PASSWORD`, `TEST_PT_EMAIL` / `_PASSWORD` | | | Accounts managed by `npm run test-accounts` |

## Scripts

| Where | Command | What |
| --- | --- | --- |
| `server/` | `npm run dev` | API with auto-reload |
| | `npm start` | API without reload |
| | `npm test` | Integration tests (in-memory MongoDB, no setup needed) |
| | `npm run lint` | ESLint |
| | `npm run seed` | Reset the database to demo data |
| | `npm run test-accounts` | Create/reset the configured test accounts (non-destructive) |
| `clients/` | `npm start` | Metro bundler |
| | `npm run ios` / `npm run android` | Build and launch |
| | `npm test` | Unit tests |
| | `npm run lint` | ESLint |

Useful test filters: `npx jest tests/booking.test.js`, `npx jest -t "concurrent"`. If MongoDB is installed locally, `MONGOMS_SYSTEM_BINARY=$(which mongod) npm test` skips downloading a MongoDB binary.

## Testing and CI

- `server/tests` — integration tests through the real Express app: auth/OTP, booking lifecycle and concurrency, reviews, maintenance jobs, profile and token revocation, chat and search, dashboard (fixed clock), availability, push (fake FCM transport) and Socket.IO (real server on a random port).
- `clients/__tests__` — unit tests for pure logic (validators, time conversion, formatting, error messages, dashboard labels, reducer).
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs lint, tests and `npm audit --audit-level=high` for both projects on pull requests and on `main`.

## Conventions

The short version (the full list lives in [`CLAUDE.md`](../CLAUDE.md)):

- **Server** — routers → thin controllers → services. Throw `httpError` helpers; never send `error.message` from a catch block. Validate ids with `assertValidId`, dates with `dayRange`. Booking status changes only in `bookingService`. Response fields are only ever added, never renamed or removed (the app relies on them).
- **App** — every request through `axiosClient`; show `error.message` (already Vietnamese). Sign out only via `utils/session.js`. Import dayjs from `utils/dayjs.js`. Use the design tokens in `constants/` and the shared components; gradients only through `GradientView`.
- **Language** — UI text is Vietnamese; code, comments and commit messages are English.

## Deploying the API

1. Provision MongoDB (Atlas works) and set `MONGODB_URI`, a long random `JWT_SECRET`, `NODE_ENV=production`.
2. Build the image from `server/Dockerfile` or run `npm ci --omit=dev && npm start` on Node 20+.
3. Put it behind HTTPS. If a reverse proxy (Nginx, a PaaS router) is in front, set `TRUST_PROXY=1` and **allow WebSocket upgrades** for Socket.IO.
4. Persist `server/uploads` (profile photos) on a volume, and set `PUBLIC_URL` to the public API URL.
5. Optional: SMTP variables for real emails, `FIREBASE_SERVICE_ACCOUNT` for push.
6. In the app, set `PROD_API_URL` in `clients/src/constants/appInfos.js` and build a release.

The maintenance jobs are safe to run on several instances at once (each booking is claimed with a conditional update).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Native module ... is not registered` in the app | A native dependency changed: `pod install`, then rebuild (`npm run ios` / `npm run android`) |
| App shows "network error" on a phone | Set `DEV_API_URL_OVERRIDE` to your LAN IP; phone and computer on the same network |
| Chat doesn't update live behind a proxy | Allow WebSocket upgrades (`Upgrade` / `Connection` headers) on the proxy |
| ESLint "No Babel config file detected" in the editor | Already handled by `clients/.eslintrc.js`; restart the ESLint server |
| Tests hang downloading MongoDB | Use `MONGOMS_SYSTEM_BINARY=$(which mongod)` |
| No push notifications | See the checklist in [push-notifications.md](push-notifications.md#troubleshooting) |
