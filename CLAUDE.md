# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BookingPT — a mobile app connecting freelance Personal Trainers (PT) with clients (search PTs, book sessions, chat, notifications). Two independent npm projects, no root package.json:

- `clients/` — React Native 0.79 app (JS/JSX with some TS), Redux Toolkit, React Navigation 7
- `server/` — Node.js 20 + Express 5 REST API, MongoDB via Mongoose 8, JWT auth, bcrypt

## Commands

Server (run from `server/`, needs `server/.env` — copy `.env.example`; `MONGODB_URI` and `JWT_SECRET` are required, the app throws on startup otherwise):
- `npm run dev` — nodemon, port `PORT` (default 3001)
- `npm test` — Jest + Supertest against mongodb-memory-server (no external DB needed). Single file: `npx jest tests/booking.test.js`; single test: `npx jest -t "only one of many concurrent"`. If a local `mongod` exists, `MONGOMS_SYSTEM_BINARY=$(which mongod)` avoids the binary download.
- `npm run seed` — wipes the DB in `MONGODB_URI` and inserts demo data (accounts `client@demo.com` / `pt@demo.com`, password `Password123!`). Refuses to run with `NODE_ENV=production`.
- `docker compose up --build` (repo root) — API + MongoDB.

Client (run from `clients/`):
- `npm start` (Metro), `npm run ios` / `npm run android`
- `npm run lint` — ESLint config lives in `clients/.eslintrc.js`; `react-hooks/exhaustive-deps` is a warning by design.
- `npm test` — Jest unit tests in `__tests__/` (pure logic: validators, time utils, reducer). Rendering full screens in Jest is not set up (navigation ESM packages aren't transformed).
- iOS pods: `bundle install && cd ios && bundle exec pod install`

API URL: `clients/src/constants/appInfos.js` — in `__DEV__` it uses `localhost` (iOS sim) / `10.0.2.2` (Android emu) unless `DEV_API_URL_OVERRIDE` is set (needed for physical devices); release builds use `PROD_API_URL` (must be HTTPS).

## Server architecture

`index.js` (connect DB, listen, graceful shutdown) → `src/app.js` (Express app, exported for tests). Middleware order in `app.js`: helmet → CORS (native apps have no Origin) → `express.json({limit:'100kb'})` → `sanitizeInput` (strips `$`/`.` keys from body/params; Express 5's query parser doesn't build nested objects) → rate limiters → routers → `notFound` → `errorHandler`.

- Config: all env access goes through `src/configs/env.js` (accepts legacy `SECRET_KEY`/`USERNAME_EMAIL`/`USERNAME_PASSWORD` names).
- Errors: controllers are wrapped in `express-async-handler`; set `res.status(4xx)` then `throw new Error(msg)`, or throw an error with `.statusCode`. `errorHandler` maps CastError/ValidationError/11000/Multer errors and hides 5xx details + stack in production. Don't send `error.message` from catch blocks directly.
- Ids from params/body must be checked with `assertValidId` (`src/utils/helpers.js`) — malformed ids should be 400, not 500. User text used in `$regex` must go through `escapeRegex`; pagination via `parsePagination` (caps page size at 50); "a day" filters via `dayRange()` which interprets dates in `Asia/Ho_Chi_Minh` and returns UTC bounds.
- Auth: `src/services/tokenService.js` signs `{id, role}` (HS256). `authMiddleware` loads the user, rejects inactive users and tokens with `iat` older than `user.passwordChangedAt` (password change/reset revokes old tokens; change-password returns a fresh token). `User.password` is `select: false` — use `.select('+password')` when comparing.
- Sign-up / password reset use server-side OTPs (`src/services/otpService.js`, `OtpModel` with TTL index): codes are hashed, 10-min expiry, 5 attempts, 60s resend cooldown, and are **never returned in API responses**. `/auth/register` requires the `code`.
- Mail: `src/services/mailService.js`; falls back to a JSON (no-send) transport when SMTP vars are missing or in tests. Tests mock `sendOtpMail` to capture codes.
- Booking/slot invariant: creating a booking atomically flips the `Availability` slot `available → booked` (`findOneAndUpdate` with `status: 'available'` in the filter) — this is what prevents double booking. Reject/cancel set it back to `available`; booked slots can't be edited or deleted. Booking status flow: `pending_confirmation` → `confirmed` / `rejected_by_pt` / `cancelled_by_client` → `completed`. Each transition creates a notification via `createNotification`.
- Data exposure: other users' email/phone/dob are not returned in public PT endpoints (`PUBLIC_PT_USER_FIELDS` in `clientController`); PTs do see their own clients' email in bookings.
- Uploads: multer writes to `server/uploads/profiles` (git-ignored); file extension comes from a MIME allow-list, never from the client filename. `photoUrl` is built from `PUBLIC_URL` or the request host.

## Client architecture

- `App.tsx` → Redux `Provider` → `NavigationContainer` → `navigators/AppRouter.jsx`, which restores `auth` from AsyncStorage, shows `SplashScreen`, then `AuthNavigator` (no `accesstoken`) or `MainNavigator`.
- `MainNavigator` branches on `auth.role`: `'pt'` → `PTTabNavigator`; otherwise `DrawerNavigator` (drawer wrapping `ClientTabNavigator`, drawer screen name `ClientTabNavigator`). Shared stack screens (Chat, Notifications, EditProfile, ChangePassword) are registered in both branches — add new shared screens to both.
- Session: Redux is the source of truth for the token. AsyncStorage key `auth` holds a copy only when "Remember me" is on. Always sign out via `utils/session.js#signOut(dispatch)` (clears both).
- API layer: every request goes through `src/apis/axiosClient.js`, which reads the token from the Redux store, signs the user out on 401, and rethrows `Error(serverMessage)` with `.status` and `.response` attached — show `error.message` in UI. Per-domain modules (`authApi`, `clientApi`, `ptApi`, `chatApi`, `notificationApi`, `profileApi`); some keep an unused token argument for backwards compatibility.
- Dates: server sends UTC ISO strings; display/input conversion to Vietnam time lives in `utils/timeUtils.js`. Build `YYYY-MM-DD` strings with `dayjs(date).format(...)`, never `toISOString().split('T')[0]` (that's the UTC day).
- Password rules are shared: `MIN_PASSWORD_LENGTH` in `utils/validate.js` must match the server (`authController.js`).
- UI primitives in `src/components` (`ContainerComponent`, `SectionComponent`, `RowComponent`, `TextComponent`, `ButtonComponent`, `InputComponent` — use `isPassword` for password fields, it owns `secureTextEntry`), colors in `constants/appColors.js`, Poppins via `constants/fontFamilies.js`. SVGs import as components (`react-native-svg-transformer`).
