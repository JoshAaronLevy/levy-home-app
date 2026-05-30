# Levy Home App

Family-facing iOS notification app for selected Home Assistant events.

This repo is intentionally small for the MVP. Home Assistant remains the
automation brain; this app receives curated events, sends Expo push
notifications, and shows a recent event timeline.

## Workspaces

```text
apps/mobile      Expo + TypeScript iOS app
apps/api         Node/Express TypeScript API
packages/shared  Shared event types and validation helpers
docs             MVP and local development notes
```

## Quick Start

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:api
npm run dev:mobile
```

See [docs/local-dev.md](docs/local-dev.md) for local curl examples and push
notification notes.
