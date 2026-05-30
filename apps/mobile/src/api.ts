import type { LevyHomeEvent } from '@levy-home/shared';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

type RegisterDeviceResponse = {
  ok: true;
  registeredDeviceCount: number;
};

type EventsResponse = {
  ok: true;
  events: LevyHomeEvent[];
};

type TestPushResponse = {
  ok: true;
  message: string;
  registeredDeviceCount: number;
  sentTicketCount: number;
  invalidTokenCount: number;
};

export function registerDevice(pushToken: string): Promise<RegisterDeviceResponse> {
  return apiRequest<RegisterDeviceResponse>('/api/devices/register', {
    method: 'POST',
    body: JSON.stringify({
      pushToken,
      platform: 'ios',
    }),
  });
}

export function fetchRecentEvents(): Promise<EventsResponse> {
  return apiRequest<EventsResponse>('/api/events');
}

export function sendTestPush(): Promise<TestPushResponse> {
  return apiRequest<TestPushResponse>('/api/debug/send-test-push', {
    method: 'POST',
  });
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with status ${response.status}.`);
  }

  return data as T;
}
