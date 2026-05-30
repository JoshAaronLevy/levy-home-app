import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL, sendTestPush } from '@/src/api';
import { usePushRegistration } from '@/src/push-registration';

export default function DebugScreen() {
  const pushRegistration = usePushRegistration();
  const [isSending, setIsSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);

  async function handleSendTestPush() {
    setIsSending(true);
    setLastResponse(null);

    try {
      const response = await sendTestPush();
      const summary = `Sent ${response.sentTicketCount} push ticket(s) to ${response.registeredDeviceCount} registered device(s).`;
      setLastResponse(summary);
      Alert.alert('Test push', summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send test push.';
      setLastResponse(message);
      Alert.alert('Test push failed', message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>API URL</Text>
        <Text style={styles.value}>{API_BASE_URL}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Push registration</Text>
        <Text style={styles.value}>{pushRegistration.statusMessage}</Text>
        {pushRegistration.error ? <Text style={styles.error}>{pushRegistration.error}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Expo push token</Text>
        <Text selectable style={styles.token}>
          {pushRegistration.pushToken ?? 'No token registered yet.'}
        </Text>
      </View>

      <ActionButton
        iconName="arrow.clockwise"
        label={pushRegistration.isRegistering ? 'Registering...' : 'Register push token'}
        disabled={pushRegistration.isRegistering}
        onPress={pushRegistration.register}
      />

      <ActionButton
        iconName="paperplane"
        label={isSending ? 'Sending...' : 'Send test push'}
        disabled={isSending}
        onPress={handleSendTestPush}
      />

      {isSending ? <ActivityIndicator color="#2f6f5e" /> : null}
      {lastResponse ? <Text style={styles.lastResponse}>{lastResponse}</Text> : null}
    </ScrollView>
  );
}

type ActionButtonProps = {
  iconName: SFSymbol;
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

function ActionButton({ iconName, label, disabled, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}>
      <SymbolView
        name={{
          ios: iconName,
          android: 'send',
          web: 'send',
        }}
        tintColor="#ffffff"
        size={18}
      />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7faf8',
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#dde7e1',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  label: {
    color: '#6b7773',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  value: {
    color: '#17211d',
    fontSize: 15,
    lineHeight: 21,
  },
  token: {
    backgroundColor: '#f2f6f4',
    borderRadius: 6,
    color: '#17211d',
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
    padding: 10,
  },
  error: {
    color: '#8a2418',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2f6f5e',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  lastResponse: {
    color: '#34423d',
    fontSize: 14,
    lineHeight: 20,
  },
});
