import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { registerDevice } from '@/src/api';
import { registerForPushNotificationsAsync } from '@/src/notifications';

type PushRegistrationStatus = 'idle' | 'registering' | 'registered' | 'unavailable' | 'error';

type PushRegistrationContextValue = {
  pushToken: string | null;
  status: PushRegistrationStatus;
  statusMessage: string;
  error: string | null;
  isRegistering: boolean;
  register: () => Promise<void>;
};

const PushRegistrationContext = createContext<PushRegistrationContextValue | null>(null);

export function PushRegistrationProvider({ children }: PropsWithChildren) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [status, setStatus] = useState<PushRegistrationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Push registration has not run yet.');
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async () => {
    setStatus('registering');
    setStatusMessage('Requesting push notification permission.');
    setError(null);

    const result = await registerForPushNotificationsAsync();

    if (!result.ok) {
      setPushToken(null);
      setStatus('unavailable');
      setStatusMessage(result.reason);
      setError(result.reason);
      return;
    }

    setPushToken(result.pushToken);
    setStatusMessage('Registering push token with the API.');

    try {
      const response = await registerDevice(result.pushToken);
      setStatus('registered');
      setStatusMessage(`Registered with API. ${response.registeredDeviceCount} device(s) on file.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to register push token with the API.';
      setStatus('error');
      setStatusMessage('Push token was created, but API registration failed.');
      setError(message);
    }
  }, []);

  useEffect(() => {
    void register();
  }, [register]);

  const value = useMemo<PushRegistrationContextValue>(
    () => ({
      pushToken,
      status,
      statusMessage,
      error,
      isRegistering: status === 'registering',
      register,
    }),
    [error, pushToken, register, status, statusMessage],
  );

  return <PushRegistrationContext.Provider value={value}>{children}</PushRegistrationContext.Provider>;
}

export function usePushRegistration(): PushRegistrationContextValue {
  const value = useContext(PushRegistrationContext);

  if (!value) {
    throw new Error('usePushRegistration must be used inside PushRegistrationProvider.');
  }

  return value;
}
