# Push notifications (Firebase Cloud Messaging)

Push is **optional**: the app and the API run normally without it. This guide turns it on. How it works internally is described in [architecture.md](architecture.md#push-notifications).

| What gets pushed | To whom |
| --- | --- |
| New chat message | The other member of the conversation |
| Every in-app notification (new request, confirmed, rejected, cancelled, reminder, completed, new review) | Its recipient |

Pushes appear when the app is in the background or closed. Tapping one opens the conversation or the notifications screen. In the foreground nothing is shown, because the socket already updates the screen.

## App id

Firebase and Apple identify the app by its id. This project uses **`com.bookingpt.app`** for both the iOS bundle identifier and the Android `applicationId`. Register exactly this id below.

## 1. Create the Firebase project

1. [Firebase console](https://console.firebase.google.com) → **Add project**.
2. **Add app → Android**, package name `com.bookingpt.app` → download **`google-services.json`** → put it in `clients/android/app/`.
3. **Add app → iOS**, bundle ID `com.bookingpt.app` → download **`GoogleService-Info.plist`** → in Xcode (`clients/ios/Project.xcworkspace`) drag it into the **Project** group with **Copy items if needed** and target **Project** ticked.

Skip Firebase's "add SDK / initialization code" steps: the project is already wired (React Native Firebase, `FirebaseApp.configure()` in `AppDelegate.swift`, the Google Services Gradle plugin). Each of them is enabled only when its config file exists, so a missing file never breaks a build.

> macOS renames a second download to `GoogleService-Info 2.plist` / `google-services (1).json`. The names must be exact.

## 2. iOS only: APNs (requires a paid Apple Developer account)

1. Xcode → target **Project** → **Signing & Capabilities** → choose your **Team** → **+ Capability** → **Push Notifications**. (`remote-notification` background mode is already in `Info.plist`.)
2. [Apple Developer](https://developer.apple.com/account) → **Certificates, IDs & Profiles** → **Keys** → **+** → enable **Apple Push Notifications service (APNs)** → download the `.p8` key (only downloadable once) and note the **Key ID** and your **Team ID**.
3. Firebase → **Project settings** → **Cloud Messaging** → **Apple app configuration** → upload the `.p8` key with its Key ID and Team ID.

Without these steps iOS builds still work; the device just never receives a push token. Android needs none of this.

## 3. Server credentials

1. Firebase → **Project settings** → **Service accounts** → **Generate new private key**.
2. Save it as `server/firebase-service-account.json` (ignored by git — never commit it).
3. In `server/.env`:

   ```bash
   FIREBASE_SERVICE_ACCOUNT=./firebase-service-account.json
   ```

   On hosts without a file system for secrets, paste the JSON on one line as the value instead.
4. Restart the API. An invalid value logs `Push notifications disabled: invalid FIREBASE_SERVICE_ACCOUNT` and push stays off.

## 4. Build and test

```bash
cd clients
npm run android        # emulator image with Google Play, or a real phone
npm run ios            # a real iPhone; the simulator is unreliable for FCM
```

1. Sign in and allow notifications when asked.
2. Check the device registered: the `devicetokens` collection has a document for the user.
3. Put the app in the background and send a message from another account (or trigger a booking action).
4. The notification appears; tapping it opens the chat.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Never asked for permission | Config file missing or not in the iOS target / wrong file name → app treats push as disabled. Rebuild after adding it. |
| `devicetokens` stays empty on iOS | No Push Notifications capability or no APNs key in Firebase |
| Token saved but nothing arrives | `FIREBASE_SERVICE_ACCOUNT` missing/invalid, or it belongs to another Firebase project than the app's config file |
| Works on Android, not iOS | APNs key, bundle id mismatch, or testing on the simulator |
| Arrives while the app is open? | It shouldn't — foreground updates come from the socket by design |

Tokens that FCM reports as unregistered (app uninstalled, signed out) are deleted automatically. Signing out unregisters the device, and "sign out of all devices", password changes and account deletion remove all of the user's tokens.
