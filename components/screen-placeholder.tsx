/**
 * 스캐폴딩용 placeholder.
 *
 * 화면 이름과(필요하면) 상태 배지만 보여준다. 실제 UI는 각 Phase에서 이 컴포넌트를
 * 교체하며 구현한다 — 디자인은 Pencil 문서(`design/`, git 무시)를 참고한다.
 */
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  /** 화면 이름. 예: '로그인' */
  name: string;
  /** 아직 만들 수 없는 화면에 붙이는 배지. 예: '준비 중' */
  badge?: string;
  /** 배지가 붙은 이유. */
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
