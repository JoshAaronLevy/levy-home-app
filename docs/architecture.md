# Architecture

The MVP proves one pipeline:

```text
Home Assistant / fake event
-> API /api/ha/events
-> Expo push service
-> Expo iOS app
-> event timeline
```

## Components

- `apps/api`: Express API with in-memory device registration and recent events.
- `apps/mobile`: Expo Router app that registers for push notifications and reads recent events.
- `packages/shared`: Event types, display metadata, and validation helpers used by the app and API.

## Current Storage

The API stores devices and events in memory. Restarting the API clears all
registered devices and recent events.

## Current Auth

Only `POST /api/ha/events` is protected. It requires:

```text
Authorization: Bearer <LEVY_HOME_HA_WEBHOOK_SECRET>
```

Production user authentication is intentionally not part of this stage.
