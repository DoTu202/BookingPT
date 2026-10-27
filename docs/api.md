# API reference

Base URL in development: `http://localhost:3001` (Android emulator: `http://10.0.2.2:3001`).

- [Conventions](#conventions)
- [Auth](#auth-auth)
- [Profile](#profile-apiprofile)
- [Client](#client-apiclient)
- [Trainer](#trainer-apipt)
- [Chat](#chat-apichat)
- [Notifications](#notifications-apinotifications)
- [Realtime events](#realtime-events-socketio)

## Conventions

**Authentication.** Every endpoint except `/auth/*`, `GET /health` and `GET /api/client/pt` needs a bearer token:

```http
Authorization: Bearer <accesstoken>
```

The token is returned by `POST /auth/login` (and by `POST /api/profile/change-password`, which revokes all older tokens).

**Responses.** Successful responses are JSON with `success: true` and usually a `data` field. Errors always look like this:

```json
{ "success": false, "message": "Booking not found." }
```

| Status | Meaning |
| --- | --- |
| 400 | Invalid input (including malformed ids and dates) |
| 401 | Missing, expired or revoked token |
| 403 | Signed in, but not allowed (wrong role, not your resource) |
| 404 | Not found |
| 409 | Conflict — e.g. another request changed the booking first |
| 429 | Rate limit reached |

**Dates.** Instants are UTC ISO 8601 strings. Day parameters (`date`, `from`, `to`, `availableDate`) are `YYYY-MM-DD` and mean a calendar day in Vietnam time.

**Pagination.** `pageNumber` (from 1) and `pageSize` (max 50) where supported.

**Rate limits.** 500 requests / 15 min per IP on `/api` and `/auth`; login, register, reset and OTP confirmation: 10 / 15 min; endpoints that send email: 5 / 15 min.

## Auth (`/auth`)

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/auth/verification` | `email` | Emails a 6-digit sign-up code |
| POST | `/auth/register` | `username, email, password, phoneNumber, dob, role, code` | `role`: `client` (default) or `pt` |
| POST | `/auth/login` | `email, password` | Returns `{id, email, username, role, photoUrl, accesstoken}` |
| POST | `/auth/forgotPassword` | `email` | Emails a reset code (same answer whether or not the account exists) |
| POST | `/auth/resetPassword` | `email, code, newPassword` | Revokes all existing tokens |

## Profile (`/api/profile`)

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/profile` | | Signed-in user |
| PUT | `/profile` | `username, phoneNumber, dob, …` | Email changes go through the OTP flow below |
| POST | `/change-password` | `currentPassword, newPassword, confirmPassword` | Returns a fresh token; other devices are signed out |
| POST | `/upload-photo` | multipart `photo` | JPEG / PNG / WebP / HEIC, content verified |
| POST | `/email/request` | `newEmail` | Sends a code to the new address |
| POST | `/email/confirm` | `newEmail, code` | |
| POST | `/logout-all` | | Revokes every token, socket and push token of the user |
| DELETE | `/delete-account` | `password, confirmDelete: "DELETE"` | Refused while bookings are active |
| POST | `/push-token` | `token, platform: ios \| android` | Registers this device for push |
| DELETE | `/push-token` | `token` | Unregisters this device |

## Client (`/api/client`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/pt` | Public search. Query: `name`, `specialization`, `location`, `availableDate`, `minRate`, `maxRate`, `sortBy` (`hourlyRate` \| `experienceYears`), `order` (`asc` \| `desc`), `pageNumber`, `pageSize` |
| GET | `/pt/:ptId/profile` | Trainer profile (no private contact data) |
| GET | `/pt/:ptId/availability` | Open slots. Query: `startDate`, `endDate` |
| GET | `/pt/:ptId/reviews` | Reviews of a trainer |
| POST | `/bookings` | Client only. Body: `ptId, availabilitySlotId, notesFromClient?`. Atomically reserves the slot (409 if it was just taken) |
| GET | `/my-bookings` | Client only. Query: `status`, `upcoming`, pagination |
| POST | `/my-bookings/:bookingId/cancel` | Body: `reason?`. Confirmed sessions need ≥ 24 h notice |
| POST | `/my-bookings/:bookingId/review` | Body: `rating` (1–5), `comment?`. Completed sessions only, once |

## Trainer (`/api/pt`)

All routes require `role: pt`.

| Method | Path | Notes |
| --- | --- | --- |
| GET / PUT | `/profile` | Own trainer profile (bio, specializations, rate, location, accepting clients) |
| GET | `/availability` | Own slots. Query: `date` (one day) or `from` + `to` (up to 62 days) |
| POST | `/availability` | Body: `startTime, endTime` (UTC ISO). Future only, max 12 h, no overlap |
| PUT | `/availability/:availabilityId` | Same rules; booked slots can't be moved |
| DELETE | `/availability/:availabilityId` | Booked slots can't be deleted |
| GET | `/bookings` | Query: `status`, `date` |
| POST | `/bookings/:bookingId/confirm` | |
| POST | `/bookings/:bookingId/reject` | Body: `reason?` |
| POST | `/bookings/:bookingId/cancel` | Body: `reason` (required) |
| POST | `/bookings/:bookingId/complete` | After the session has ended |
| GET | `/reviews` | Reviews about me |
| GET | `/dashboard` | Statistics, see below |

### `GET /api/pt/dashboard`

Query: `period` = `week` (Mon–Sun) \| `month` \| `year` (default `month`), `offset` = how many periods back (0–60, default 0).

```jsonc
{
  "success": true,
  "data": {
    "period": "week",
    "offset": 0,
    "range": { "start": "2026-10-11T17:00:00.000Z", "end": "2026-10-18T17:00:00.000Z" },
    "earnings": { "total": 450000, "previous": 100000, "expected": 250000 },
    "sessions": { "completed": 2, "previous": 1, "upcoming": 1, "hours": 2 },
    "status": { "completed": 2, "confirmed": 1, "cancelled_by_client": 1, "...": 0 },
    "completionRate": 0.667,          // completed / (completed + cancelled), null if none
    "cancellationRate": 0.25,
    "clients": { "active": 3, "new": 2 },
    "slots": { "total": 4, "booked": 2, "available": 1, "fillRate": 0.667 },
    "series": [ { "key": "2026-10-12", "earnings": 150000, "sessions": 1 } ],  // per day, or per month for a year
    "weekdays": [1, 1, 0, 0, 1, 0, 0], // Monday first
    "topClients": [ { "_id": "…", "username": "…", "photoUrl": null, "sessions": 1, "earnings": 300000 } ],
    "rating": { "average": 4.7, "count": 12, "inPeriod": { "count": 1, "average": 5 }, "distribution": { "5": 9, "4": 3, "3": 0, "2": 0, "1": 0 } },
    "attention": { "pending": 1, "toComplete": 0 }   // about now, not the period
  }
}
```

## Chat (`/api/chat`)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/rooms` | My conversations, newest first, with `lastMessage` |
| GET | `/room/:otherUserId` | Get or create the room with a client/trainer |
| GET | `/messages/:chatRoomId` | Members only |
| POST | `/send/:chatRoomId` | Body: `content`, `clientId?` (echoed in the socket event). Pushes `chat:message` to both members |

## Notifications (`/api/notifications`)

| Method | Path |
| --- | --- |
| GET | `/` (query: `page`, `limit`, `isRead`) |
| GET | `/unread-count` |
| PUT | `/:notificationId/read` |
| PUT | `/mark-all-read` |
| DELETE | `/:notificationId` |

## Realtime events (Socket.IO)

Connect to the API origin with the access token:

```js
import {io} from 'socket.io-client';
const socket = io('http://localhost:3001', {auth: {token}, transports: ['websocket']});
```

Invalid tokens fail the handshake with `connect_error` (`Unauthorized`, `Token expired`, `Invalid token`). The server disconnects sockets whose tokens are revoked.

| Event | Direction | Payload |
| --- | --- | --- |
| `chat:message` | server → both members | `{chatRoomId, message, clientId?}` |
| `chat:typing` | client → server | `{chatRoomId}` (relayed only to the other member, max 1/s) |
| `chat:typing` | server → other member | `{chatRoomId, userId}` |
