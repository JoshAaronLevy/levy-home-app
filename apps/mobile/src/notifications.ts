import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistrationResult =
  | { ok: true; pushToken: string }
  | { ok: false; reason: string };

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      ok: false,
      reason: 'Push notifications require a physical iOS device with an EAS development build.',
    };
  }

  const existingPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = existingPermissions.status;

  if (existingPermissions.status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return {
      ok: false,
      reason: 'Push notification permission was not granted.',
    };
  }

  const projectId = getExpoProjectId();
  const token = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return {
    ok: true,
    pushToken: token.data,
  };
}

function getExpoProjectId(): string | undefined {
  const appConfigProjectId = Constants.expoConfig?.extra?.eas?.projectId;
  const runtimeProjectId = (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  return typeof runtimeProjectId === 'string' ? runtimeProjectId : appConfigProjectId;
}
