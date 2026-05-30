export const LEVY_HOME_EVENT_TYPES = [
  'garage_opened',
  'garage_closed',
  'garage_left_open_10_min',
  'garage_opened_after_hours',
  'garage_still_open_at_10pm',
  'doorbell_pressed',
  'doorbell_person_detected',
  'doorbell_motion_detected',
] as const;

export type LevyHomeEventType = (typeof LEVY_HOME_EVENT_TYPES)[number];

export type EventSeverity = 'info' | 'warning' | 'critical';
export type HomeAssistantEventCategory = 'garage' | 'doorbell';
export type HomeAssistantEventSeverity = 'normal' | 'high';

export type EventDisplayMetadata = {
  title: string;
  body: string;
  severity: EventSeverity;
};

export type HomeAssistantEventPayload = {
  type: LevyHomeEventType;
  entityId: string;
  category?: HomeAssistantEventCategory;
  severity?: HomeAssistantEventSeverity;
  source?: string;
  occurredAt?: string;
  title?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type EventPushStatus = {
  attempted: boolean;
  skipped: boolean;
  reason?: string;
  ticketCount?: number;
  invalidTokenCount?: number;
};

export type LevyHomeEvent = HomeAssistantEventPayload & {
  id: string;
  receivedAt: string;
  display: EventDisplayMetadata;
  push: EventPushStatus;
};

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export const EVENT_DISPLAY_METADATA: Record<LevyHomeEventType, EventDisplayMetadata> = {
  garage_opened: {
    title: 'Garage opened',
    body: 'The garage door opened.',
    severity: 'info',
  },
  garage_closed: {
    title: 'Garage closed',
    body: 'The garage door closed.',
    severity: 'info',
  },
  garage_left_open_10_min: {
    title: 'Garage left open',
    body: 'The garage has been open for 10 minutes.',
    severity: 'warning',
  },
  garage_opened_after_hours: {
    title: 'Garage opened after hours',
    body: 'The garage opened between 10 PM and 7 AM.',
    severity: 'warning',
  },
  garage_still_open_at_10pm: {
    title: 'Garage still open',
    body: 'The garage is still open at 10 PM.',
    severity: 'critical',
  },
  doorbell_pressed: {
    title: 'Doorbell pressed',
    body: 'Someone pressed the doorbell.',
    severity: 'info',
  },
  doorbell_person_detected: {
    title: 'Person detected',
    body: 'The doorbell detected a person.',
    severity: 'warning',
  },
  doorbell_motion_detected: {
    title: 'Motion detected',
    body: 'The doorbell detected motion.',
    severity: 'info',
  },
};

const EVENT_TYPE_SET = new Set<string>(LEVY_HOME_EVENT_TYPES);

export function isLevyHomeEventType(value: unknown): value is LevyHomeEventType {
  return typeof value === 'string' && EVENT_TYPE_SET.has(value);
}

export function getEventDisplayMetadata(type: LevyHomeEventType): EventDisplayMetadata {
  return EVENT_DISPLAY_METADATA[type];
}

export function buildEventDedupeKey(event: Pick<HomeAssistantEventPayload, 'type' | 'entityId'>): string {
  return `${event.type}:${event.entityId}`;
}

export function validateHomeAssistantEventPayload(input: unknown): ValidationResult<HomeAssistantEventPayload> {
  if (!isPlainRecord(input)) {
    return { ok: false, error: 'Expected a JSON object event payload.' };
  }

  if (!isLevyHomeEventType(input.type)) {
    return {
      ok: false,
      error: `Invalid event type. Expected one of: ${LEVY_HOME_EVENT_TYPES.join(', ')}.`,
    };
  }

  const entityId = readRequiredString(input.entityId, 'entityId');
  if (!entityId.ok) {
    return entityId;
  }

  const occurredAt = readOptionalString(input.occurredAt, 'occurredAt');
  if (!occurredAt.ok) {
    return occurredAt;
  }

  if (occurredAt.value && Number.isNaN(Date.parse(occurredAt.value))) {
    return { ok: false, error: 'occurredAt must be an ISO date string when provided.' };
  }

  const title = readOptionalString(input.title, 'title');
  if (!title.ok) {
    return title;
  }

  const message = readOptionalString(input.message, 'message');
  if (!message.ok) {
    return message;
  }

  const category = readOptionalCategory(input.category);
  if (!category.ok) {
    return category;
  }

  const severity = readOptionalPayloadSeverity(input.severity);
  if (!severity.ok) {
    return severity;
  }

  const source = readOptionalString(input.source, 'source');
  if (!source.ok) {
    return source;
  }

  if (input.metadata !== undefined && !isPlainRecord(input.metadata)) {
    return { ok: false, error: 'metadata must be a JSON object when provided.' };
  }

  return {
    ok: true,
    value: {
      type: input.type,
      entityId: entityId.value,
      ...(category.value ? { category: category.value } : {}),
      ...(severity.value ? { severity: severity.value } : {}),
      ...(source.value ? { source: source.value } : {}),
      ...(occurredAt.value ? { occurredAt: occurredAt.value } : {}),
      ...(title.value ? { title: title.value } : {}),
      ...(message.value ? { message: message.value } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    },
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredString(value: unknown, fieldName: string): ValidationResult<string> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, error: `${fieldName} is required and must be a non-empty string.` };
  }

  return { ok: true, value: value.trim() };
}

function readOptionalString(value: unknown, fieldName: string): ValidationResult<string | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (typeof value !== 'string') {
    return { ok: false, error: `${fieldName} must be a string when provided.` };
  }

  const trimmed = value.trim();
  return { ok: true, value: trimmed.length > 0 ? trimmed : undefined };
}

function readOptionalCategory(value: unknown): ValidationResult<HomeAssistantEventCategory | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (value === 'garage' || value === 'doorbell') {
    return { ok: true, value };
  }

  return { ok: false, error: 'category must be garage or doorbell when provided.' };
}

function readOptionalPayloadSeverity(value: unknown): ValidationResult<HomeAssistantEventSeverity | undefined> {
  if (value === undefined) {
    return { ok: true, value: undefined };
  }

  if (value === 'normal' || value === 'high') {
    return { ok: true, value };
  }

  return { ok: false, error: 'severity must be normal or high when provided.' };
}
