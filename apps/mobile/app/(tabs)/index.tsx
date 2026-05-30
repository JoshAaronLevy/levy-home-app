import { StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '@/src/api';
import { usePushRegistration } from '@/src/push-registration';

export default function HomeScreen() {
  const pushRegistration = usePushRegistration();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Levy Home</Text>
        <Text style={styles.title}>Home notifications, not a dashboard.</Text>
        <Text style={styles.subtitle}>
          Garage events land here first. Doorbell notifications can plug into the same pipeline later.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Push status</Text>
        <Text style={styles.panelValue}>{pushRegistration.statusMessage}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelLabel}>API</Text>
        <Text style={styles.panelValue}>{API_BASE_URL}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf8',
    padding: 20,
    gap: 14,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  eyebrow: {
    color: '#2f6f5e',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211d',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  subtitle: {
    color: '#56645f',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 10,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#dde7e1',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  panelLabel: {
    color: '#6b7773',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  panelValue: {
    color: '#17211d',
    fontSize: 15,
    lineHeight: 21,
  },
});
