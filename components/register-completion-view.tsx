import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';

import { Card, ErrorBanner, ICONS } from '@/components/register-ui';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import type { FoundItemResponse } from '@/src/types/found-item';

interface RegisterCompletionViewProps {
  item: FoundItemResponse;
  itemName: string;
  centerName: string | null;
  featureSaveFailed: boolean;
  onGoHome: () => void;
  onOpenHandover: () => void;
  showHandoverAction: boolean;
}

export function RegisterCompletionView({
  item,
  itemName,
  centerName,
  featureSaveFailed,
  onGoHome,
  onOpenHandover,
  showHandoverAction,
}: RegisterCompletionViewProps) {
  const colors = useAppColors();
  const storageLabel = showHandoverAction
    ? `${centerName ?? '분실물 센터'}에 인계 예정`
    : item.storageMethod === 'HANDED_TO_CENTER'
      ? `${centerName ?? '분실물 센터'}에 인계 완료`
      : item.storageMethod === 'MOVED_TO_SAFE_PLACE'
        ? '주변 안전한 곳으로 옮김'
        : '원래 자리에 그대로';

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.successHero, { backgroundColor: colors.pine700 }]}>
          <View style={[styles.successMark, { backgroundColor: '#FFFFFF' }]}>
            <SymbolView name={ICONS.check} size={30} tintColor={colors.pine700} />
          </View>
          <Text style={styles.successTitle}>등록됐어요</Text>
          <Text style={[styles.successSubtitle, { color: colors.heroSub }]}>
            {showHandoverAction
              ? '습득물 정보가 접수됐어요. 선택한 센터로 가져다주면 인계가 마무리돼요.'
              : '습득물 정보가 접수됐어요.'}
          </Text>
        </View>

        <View style={styles.stack}>
          {featureSaveFailed ? (
            <ErrorBanner
              body="등록은 끝났지만 입력한 특징을 저장하지 못했어요."
              title="특징을 저장하지 못했어요"
            />
          ) : null}

          <Card>
            <View style={[styles.receiptId, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.receiptKey, { color: colors.ink2 }]}>등록 번호</Text>
              <Text style={[styles.receiptValue, { color: colors.ink }]}>{item.id}</Text>
            </View>
            <ReceiptRow label="물품명" value={itemName} />
            <ReceiptRow label="보관 상태" value={storageLabel} />
          </Card>

          {showHandoverAction ? (
            <Card>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>이어서 해주세요</Text>
              <NextStepRow
                icon={ICONS.search}
                text="선택한 센터로 바로 이동해 습득물을 인계해 주세요"
              />
              <NextStepRow
                icon={ICONS.clock}
                text="아래 버튼에서 경로를 다시 확인하고 바로 이동할 수 있어요"
              />
            </Card>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.page, borderTopColor: colors.line }]}>
        <Pressable
          accessibilityRole="button"
          onPress={onGoHome}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.action },
            pressed && styles.pressed,
          ]}>
          <Text style={styles.primaryButtonText}>홈으로</Text>
        </Pressable>
        {showHandoverAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenHandover}
            style={({ pressed }) => [
              styles.outlineButton,
              { backgroundColor: colors.surface, borderColor: colors.pine200 },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.outlineButtonText, { color: colors.actionText }]}>
              분실물 센터로 인계하기
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  const colors = useAppColors();
  return (
    <View style={styles.receiptRow}>
      <Text style={[styles.receiptKey, { color: colors.ink2 }]}>{label}</Text>
      <Text style={[styles.receiptValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

function NextStepRow({
  icon,
  text,
}: {
  icon: (typeof ICONS)[keyof typeof ICONS];
  text: string;
}) {
  const colors = useAppColors();
  return (
    <View style={styles.nextStepRow}>
      <View style={[styles.nextStepTile, { backgroundColor: colors.pine100 }]}>
        <SymbolView name={icon} size={13} tintColor={colors.onTint} />
      </View>
      <Text style={[styles.nextStepText, { color: colors.ink2 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  successHero: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 72,
    paddingHorizontal: 28,
    paddingBottom: 42,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  successMark: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
  successTitle: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 22,
    fontWeight: '800',
  },
  successSubtitle: {
    fontFamily: appFontFamily,
    fontSize: 12,
    textAlign: 'center',
  },
  stack: { gap: 12, padding: 16 },
  cardTitle: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  receiptId: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  receiptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  receiptKey: { width: 68, fontFamily: appFontFamily, fontSize: 12 },
  receiptValue: { flex: 1, fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  nextStepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextStepTile: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  nextStepText: { flex: 1, fontFamily: appFontFamily, fontSize: 12, lineHeight: 17 },
  bottomBar: {
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  primaryButton: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 14, fontWeight: '700' },
  outlineButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  outlineButtonText: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.76 },
});
