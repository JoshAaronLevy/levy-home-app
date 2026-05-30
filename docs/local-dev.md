# Local Development

## Install

```bash
npm install
```

## Run The API

```bash
cp apps/api/.env.example apps/api/.env
npm run dev:api
```

The API listens on `http://localhost:4000` by default.

## Run The Expo App

```bash
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:mobile
```

Use the iOS target from Expo. For a physical iPhone, set
`EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your Mac's LAN URL, for example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.25:4000
```

## Register For Push

The app tries to register on launch and exposes the current Expo push token on
the Debug screen. The Debug screen also has a button to retry registration.

Remote push notification testing requires an Expo development build/EAS setup,
not Expo Go. The iOS Simulator can run the UI but cannot produce a useful real
device push token.

## Manual Garage Event Tests

Use the same secret configured in `apps/api/.env`.

These examples use `cover.main_garage_door` as a placeholder entity ID. Replace
it later with the real Meross garage door entity ID after confirming it in:

```text
Home Assistant → Developer Tools → States
```

### `garage_opened`

```bash
curl -X POST http://localhost:4000/api/ha/events \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "garage_opened",
    "category": "garage",
    "severity": "normal",
    "title": "Garage opened",
    "message": "The garage door opened.",
    "entityId": "cover.main_garage_door",
    "source": "home_assistant"
  }'
```

### `garage_closed`

```bash
curl -X POST http://localhost:4000/api/ha/events \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "garage_closed",
    "category": "garage",
    "severity": "normal",
    "title": "Garage closed",
    "message": "The garage door closed.",
    "entityId": "cover.main_garage_door",
    "source": "home_assistant"
  }'
```

### `garage_left_open_10_min`

```bash
curl -X POST http://localhost:4000/api/ha/events \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "garage_left_open_10_min",
    "category": "garage",
    "severity": "high",
    "title": "Garage left open",
    "message": "The garage has been open for 10 minutes.",
    "entityId": "cover.main_garage_door",
    "source": "home_assistant"
  }'
```

### `garage_opened_after_hours`

```bash
curl -X POST http://localhost:4000/api/ha/events \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "garage_opened_after_hours",
    "category": "garage",
    "severity": "high",
    "title": "Garage opened after hours",
    "message": "The garage opened between 10 PM and 7 AM.",
    "entityId": "cover.main_garage_door",
    "source": "home_assistant"
  }'
```

### `garage_still_open_at_10pm`

```bash
curl -X POST http://localhost:4000/api/ha/events \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "garage_still_open_at_10pm",
    "category": "garage",
    "severity": "high",
    "title": "Garage still open",
    "message": "The garage is still open at 10 PM.",
    "entityId": "cover.main_garage_door",
    "source": "home_assistant"
  }'
```

After sending an event, open the Events tab or call:

```bash
curl http://localhost:4000/api/events
```

## Send A Test Push

After the app has registered a push token:

```bash
curl -X POST http://localhost:4000/api/debug/send-test-push
```

The same endpoint is available from the Debug screen.

## Garage Wiring Checklist

1. Run the API.
2. Run the Expo app/dev build.
3. Register a push token from the app.
4. Send a fake garage event with curl.
5. Confirm push notification arrives.
6. Confirm event appears in the app timeline.
7. Confirm the real garage entity ID in Home Assistant → Developer Tools → States.
8. Only then wire Home Assistant automations.
