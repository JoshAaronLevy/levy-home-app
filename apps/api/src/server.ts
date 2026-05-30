import 'dotenv/config';

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import crypto from 'node:crypto';

import {
  buildEventDedupeKey,
  getEventDisplayMetadata,
  type EventPushStatus,
  type HomeAssistantEventPayload,
  type LevyHomeEvent,
  validateHomeAssistantEventPayload,
} from '@levy-home/shared';

type RegisteredDevice = {
  pushToken: string;
  platform: 'ios' | 'unknown';
  registeredAt: string;
  lastSeenAt: string;
};

type PushSendResult = {
  registeredDeviceCount: number;
  sentTicketCount: number;
  invalidTokenCount: number;
  tickets: ExpoPushTicket[];
};

const app = express();
const port = Number(process.env.PORT ?? 4000);
const pushCooldownMs = Number(process.env.PUSH_DEDUPE_COOLDOWN_MS ?? 120_000);

const registeredDevices = new Map<string, RegisteredDevice>();
const recentEvents: LevyHomeEvent[] = [];
const lastPushAtByDedupeKey = new Map<string, number>();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'levy-home-api',
    registeredDeviceCount: registeredDevices.size,
    recentEventCount: recentEvents.length,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.post('/api/devices/register', (req, res) => {
  const pushToken = typeof req.body?.pushToken === 'string' ? req.body.pushToken.trim() : '';
  const platform = req.body?.platform === 'ios' ? 'ios' : 'unknown';

  if (!pushToken) {
    res.status(400).json({ error: 'pushToken is required.' });
    return;
  }

  const existing = registeredDevices.get(pushToken);
  const now = new Date().toISOString();

  registeredDevices.set(pushToken, {
    pushToken,
    platform,
    registeredAt: existing?.registeredAt ?? now,
    lastSeenAt: now,
  });

  res.status(existing ? 200 : 201).json({
    ok: true,
    registeredDeviceCount: registeredDevices.size,
    device: registeredDevices.get(pushToken),
  });
});

app.post(
  '/api/ha/events',
  requireHaWebhookSecret,
  asyncHandler(async (req, res) => {
    const validation = validateHomeAssistantEventPayload(req.body);

    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    const payload = validation.value;
    const display = getEventDisplayMetadata(payload.type);
    const dedupeKey = buildEventDedupeKey(payload);
    const now = Date.now();
    const lastPushAt = lastPushAtByDedupeKey.get(dedupeKey);
    const cooldownRemainingMs = lastPushAt ? pushCooldownMs - (now - lastPushAt) : 0;

    let push: EventPushStatus;

    if (cooldownRemainingMs > 0) {
      push = {
        attempted: false,
        skipped: true,
        reason: `Duplicate push skipped for ${Math.ceil(cooldownRemainingMs / 1000)} more seconds.`,
      };
    } else {
      lastPushAtByDedupeKey.set(dedupeKey, now);
      const pushResult = await sendPushToRegisteredDevices({
        title: payload.title ?? display.title,
        body: payload.message ?? display.body,
        data: {
          eventType: payload.type,
          entityId: payload.entityId,
          dedupeKey,
        },
      });

      push = {
        attempted: true,
        skipped: false,
        ticketCount: pushResult.sentTicketCount,
        invalidTokenCount: pushResult.invalidTokenCount,
        ...(pushResult.registeredDeviceCount === 0 ? { reason: 'No registered devices.' } : {}),
      };
    }

    const event = createStoredEvent(payload, push);
    recentEvents.unshift(event);

    if (recentEvents.length > 100) {
      recentEvents.length = 100;
    }

    res.status(201).json({
      ok: true,
      event,
      dedupeKey,
      storedEventCount: recentEvents.length,
    });
  }),
);

app.post(
  '/api/debug/send-test-push',
  asyncHandler(async (_req, res) => {
    const pushResult = await sendPushToRegisteredDevices({
      title: 'Levy Home test push',
      body: 'The local debug push endpoint is working.',
      data: {
        source: 'debug',
      },
    });

    res.json({
      ok: true,
      message: 'Test push request completed.',
      ...pushResult,
    });
  }),
);

app.get('/api/events', (req, res) => {
  const requestedLimit = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50;

  res.json({
    ok: true,
    events: recentEvents.slice(0, limit),
  });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});

app.listen(port, () => {
  console.log(`Levy Home API listening on http://localhost:${port}`);
});

function createStoredEvent(payload: HomeAssistantEventPayload, push: EventPushStatus): LevyHomeEvent {
  const display = getEventDisplayMetadata(payload.type);

  return {
    id: crypto.randomUUID(),
    type: payload.type,
    entityId: payload.entityId,
    category: payload.category,
    severity: payload.severity,
    source: payload.source,
    occurredAt: payload.occurredAt ?? new Date().toISOString(),
    title: payload.title ?? display.title,
    message: payload.message ?? display.body,
    metadata: payload.metadata,
    receivedAt: new Date().toISOString(),
    display,
    push,
  };
}

function requireHaWebhookSecret(req: Request, res: Response, next: NextFunction): void {
  const expectedSecret = process.env.LEVY_HOME_HA_WEBHOOK_SECRET;

  if (!expectedSecret) {
    res.status(500).json({ error: 'LEVY_HOME_HA_WEBHOOK_SECRET is not configured.' });
    return;
  }

  if (req.header('Authorization') !== `Bearer ${expectedSecret}`) {
    res.status(401).json({ error: 'Unauthorized Home Assistant event webhook.' });
    return;
  }

  next();
}

async function sendPushToRegisteredDevices(message: Omit<ExpoPushMessage, 'to'>): Promise<PushSendResult> {
  const expo = createExpoClient();
  const tickets: ExpoPushTicket[] = [];
  const messages: ExpoPushMessage[] = [];
  let invalidTokenCount = 0;

  for (const device of registeredDevices.values()) {
    if (!Expo.isExpoPushToken(device.pushToken)) {
      invalidTokenCount += 1;
      continue;
    }

    messages.push({
      ...message,
      to: device.pushToken,
      sound: 'default',
    });
  }

  for (const chunk of expo.chunkPushNotifications(messages)) {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }

  return {
    registeredDeviceCount: registeredDevices.size,
    sentTicketCount: tickets.length,
    invalidTokenCount,
    tickets,
  };
}

function createExpoClient(): Expo {
  return process.env.EXPO_ACCESS_TOKEN
    ? new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN })
    : new Expo();
}

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}
