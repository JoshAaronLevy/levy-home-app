import type { LevyHomeEvent } from '@levy-home/shared';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchRecentEvents } from '@/src/api';

export default function EventsScreen() {
  const [events, setEvents] = useState<LevyHomeEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchRecentEvents();
      setEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load events.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadEvents} />}>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {events.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptyText}>Send a fake garage event to see the timeline fill in.</Text>
        </View>
      ) : null}

      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle}>{event.title ?? event.display.title}</Text>
            <Text style={[styles.severity, severityStyles[event.display.severity]]}>
              {event.display.severity}
            </Text>
          </View>
          <Text style={styles.eventMessage}>{event.message ?? event.display.body}</Text>
          <Text style={styles.eventMeta}>{event.entityId}</Text>
          <Text style={styles.eventTime}>{formatEventTime(event.receivedAt)}</Text>
          {event.push.skipped ? <Text style={styles.pushNote}>{event.push.reason}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const severityStyles = StyleSheet.create({
  info: {
    backgroundColor: '#e9f2ff',
    color: '#20507e',
  },
  warning: {
    backgroundColor: '#fff4d8',
    color: '#7a5200',
  },
  critical: {
    backgroundColor: '#ffe5e1',
    color: '#8a2418',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf8',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  error: {
    backgroundColor: '#ffe5e1',
    borderColor: '#ffb7ad',
    borderRadius: 8,
    borderWidth: 1,
    color: '#8a2418',
    padding: 12,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dde7e1',
    borderRadius: 8,
    borderWidth: 1,
    padding: 24,
  },
  emptyTitle: {
    color: '#17211d',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: '#56645f',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dde7e1',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  eventHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  eventTitle: {
    color: '#17211d',
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  severity: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    textTransform: 'uppercase',
  },
  eventMessage: {
    color: '#34423d',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  eventMeta: {
    color: '#6b7773',
    fontFamily: 'Courier',
    fontSize: 12,
    marginTop: 12,
  },
  eventTime: {
    color: '#6b7773',
    fontSize: 13,
    marginTop: 6,
  },
  pushNote: {
    color: '#7a5200',
    fontSize: 13,
    marginTop: 10,
  },
});

function formatEventTime(value: string): string {
  return new Date(value).toLocaleString();
}
