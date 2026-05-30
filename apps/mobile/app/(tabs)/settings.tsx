import { StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '@/src/api';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>API URL</Text>
        <Text style={styles.value}>{API_BASE_URL}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Platform</Text>
        <Text style={styles.value}>iOS development build</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Data</Text>
        <Text style={styles.value}>Local API memory only</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7faf8',
    flex: 1,
    gap: 12,
    padding: 20,
  },
  row: {
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
});
