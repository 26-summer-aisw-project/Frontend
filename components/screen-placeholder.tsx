import { StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  badge?: string;
  note?: string;
};

export function ScreenPlaceholder({ name, badge, note }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    backgroundColor: '#F3F6F4',
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: '#21282A',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EDF1EF',
    borderWidth: 1,
    borderColor: '#E5E9E6',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#899490',
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: '#54605D',
    textAlign: 'center',
  },
});
