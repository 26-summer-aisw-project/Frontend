import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActionTag,
  Card,
  ErrorBanner,
  FieldError,
  FieldLabel,
  ICONS,
  formatDateTime,
} from '@/components/register-ui';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import type { LostCenter } from '@/src/types/found-item';

interface RegisterHandoverViewProps {
  banner: { title: string; body?: string } | null;
  center: LostCenter;
  handedAt: Date | null;
  isCompleting: boolean;
  isCompleted: boolean;
  onBack: () => void;
  onChangeHandedAt: () => void;
  onComplete: () => void;
  onGoHome: () => void;
  onSetCurrentTime: () => void;
  timeError?: string;
}

export function RegisterHandoverView({
  banner,
  center,
  handedAt,
  isCompleting,
  isCompleted,
  onBack,
  onChangeHandedAt,
  onComplete,
  onGoHome,
  onSetCurrentTime,
  timeError,
}: RegisterHandoverViewProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) {
        clearTimeout(copyResetTimer.current);
      }
    };
  }, []);

  async function handleCopyAddress() {
    try {
      await Clipboard.setStringAsync(center.address);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }

    if (copyResetTimer.current) {
      clearTimeout(copyResetTimer.current);
    }
    copyResetTimer.current = setTimeout(() => setCopyState('idle'), 1800);
  }

  async function handleOpenNaverMap() {
    const encodedAddress = encodeURIComponent(center.address);
    const appUrl = `nmap://search?query=${encodedAddress}&appname=kr.lostory.app`;
    const webUrl = `https://map.naver.com/p/search/${encodedAddress}`;

    try {
      await Linking.openURL(Platform.OS === 'web' ? webUrl : appUrl);
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch {
        Alert.alert('네이버 지도를 열지 못했어요', '잠시 후 다시 시도해 주세요.');
      }
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.pine700 }]}>
          <Pressable
            accessibilityLabel="뒤로 가기"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView name={ICONS.back} size={22} tintColor={colors.heroChrome} />
          </Pressable>
          <Text style={styles.heroTitle}>선택한 분실물 센터예요</Text>
        </View>

        <View style={styles.stack}>
          {banner ? <ErrorBanner body={banner.body} title={banner.title} /> : null}
          <Card>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>분실물 센터</Text>
            <View style={styles.centerHeading}>
              <View style={[styles.centerIcon, { backgroundColor: colors.pine100 }]}>
                <SymbolView name={ICONS.pin} size={17} tintColor={colors.actionText} />
              </View>
              <Text style={[styles.centerName, { color: colors.ink }]}>{center.name}</Text>
            </View>
            <View
              style={[
                styles.addressBox,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.line },
              ]}>
              <Text selectable style={[styles.address, { color: colors.ink2 }]}>
                {center.address}
              </Text>
              <Pressable
                accessibilityLabel="센터 주소 복사"
                accessibilityRole="button"
                onPress={() => void handleCopyAddress()}
                style={({ pressed }) => [
                  styles.copyButton,
                  { backgroundColor: colors.surface, borderColor: colors.lineStrong },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  name={copyState === 'copied' ? ICONS.check : ICONS.copy}
                  size={14}
                  tintColor={copyState === 'failed' ? colors.brick : colors.actionText}
                />
                <Text
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.copyButtonText,
                    { color: copyState === 'failed' ? colors.brick : colors.actionText },
                  ]}>
                  {copyState === 'copied' ? '복사됨' : copyState === 'failed' ? '실패' : '복사'}
                </Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => void handleOpenNaverMap()}
              style={({ pressed }) => [
                styles.naverMapButton,
                { backgroundColor: colors.action },
                pressed && styles.pressed,
              ]}>
              <Text style={styles.naverMapButtonText}>네이버 지도로 열기</Text>
              <SymbolView name={ICONS.external} size={17} tintColor="#FFFFFF" />
            </Pressable>
          </Card>

          <Card>
            <View style={styles.field}>
              <FieldLabel
                label="인계 시각"
                required
                trailing={<ActionTag icon={ICONS.clock} label="지금" onPress={onSetCurrentTime} />}
              />
              <Pressable
                accessibilityRole="button"
                onPress={onChangeHandedAt}
                style={({ pressed }) => [
                  styles.input,
                  styles.selectRow,
                  { backgroundColor: colors.surface, borderColor: colors.lineStrong },
                  timeError ? { borderColor: colors.brick } : null,
                  pressed && styles.pressed,
                ]}>
                <SymbolView name={ICONS.clock} size={15} tintColor={colors.muted} />
                <Text style={[styles.inputText, { color: handedAt ? colors.ink : colors.muted }]}>
                  {handedAt ? formatDateTime(handedAt) : '인계한 날짜와 시각을 골라 주세요'}
                </Text>
              </Pressable>
              <FieldError message={timeError} />
            </View>
          </Card>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isCompleting, disabled: isCompleting || isCompleted }}
            disabled={isCompleting || isCompleted}
            onPress={onComplete}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.action },
              pressed && styles.pressed,
              (isCompleting || isCompleted) && styles.disabled,
            ]}>
            <Text style={styles.primaryButtonText}>
              {isCompleted
                ? '분실물 인계 완료됨'
                : isCompleting
                  ? '인계 정보 등록 중...'
                  : '분실물 인계 완료'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.page,
            borderTopColor: colors.line,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          onPress={onGoHome}
          style={({ pressed }) => [
            styles.outlineButton,
            { backgroundColor: colors.surface, borderColor: colors.pine200 },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.outlineButtonText, { color: colors.actionText }]}>홈으로</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  hero: {
    gap: 12,
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 48,
    height: 48,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 31,
  },
  stack: { gap: 12, padding: 16 },
  cardTitle: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  centerHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  centerIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  centerName: { flex: 1, fontFamily: appFontFamily, fontSize: 16, fontWeight: '700' },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  address: { flex: 1, fontFamily: appFontFamily, fontSize: 12, lineHeight: 18 },
  copyButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  copyButtonText: { fontFamily: appFontFamily, fontSize: 11, fontWeight: '700' },
  naverMapButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
  },
  naverMapButtonText: { color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  field: { gap: 8 },
  input: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 9,
  },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { flex: 1, fontFamily: appFontFamily, fontSize: 13.5 },
  primaryButton: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 14, fontWeight: '700' },
  bottomBar: {
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
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
  disabled: { opacity: 0.55 },
});
