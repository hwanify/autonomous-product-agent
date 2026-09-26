import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getRemainingSeconds, type CookTimer } from '../lib/timer';

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  timer: CookTimer;
  now: number;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function TimerCard({ timer, now, onPause, onResume, onCancel }: Props) {
  const remaining = getRemainingSeconds(timer, now);

  return (
    <View style={[styles.card, timer.status === 'done' && styles.cardDone]}>
      <View style={styles.info}>
        <Text style={styles.label}>{timer.label}</Text>
        <Text style={styles.time}>
          {timer.status === 'done' ? '끝!' : formatMMSS(remaining)}
        </Text>
      </View>
      <View style={styles.actions}>
        {timer.status === 'running' && (
          <Pressable style={styles.actionButton} onPress={() => onPause(timer.id)}>
            <Text style={styles.actionText}>일시정지</Text>
          </Pressable>
        )}
        {timer.status === 'paused' && (
          <Pressable style={styles.actionButton} onPress={() => onResume(timer.id)}>
            <Text style={styles.actionText}>재개</Text>
          </Pressable>
        )}
        <Pressable style={[styles.actionButton, styles.cancelButton]} onPress={() => onCancel(timer.id)}>
          <Text style={styles.actionText}>취소</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardDone: {
    backgroundColor: '#dcfce7',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});
