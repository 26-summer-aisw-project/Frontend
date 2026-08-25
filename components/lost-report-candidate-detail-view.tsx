import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner, ICONS } from '@/components/register-ui';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import type { LostReportCandidate } from '@/src/types/lost-report';

type Props = {
  candidate: LostReportCandidate;
  error: string | null;
  isConfirming: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function LostReportCandidateDetailView({
  candidate,
  error,
  isConfirming,
  onBack,
  onConfirm,
}: Props) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  async function handleOpenNaverMap() {
    const query = encodeURIComponent(candidate.centerAddress);
    const appUrl = `nmap://search?query=${query}&appname=kr.lostory.app`;
    const webUrl = `https://map.naver.com/p/search/${query}`;

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
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 + insets.bottom }]}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.pine500, colors.pine700]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <Pressable
            accessibilityLabel="뒤로"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={[styles.backButton, { top: Math.max(12, insets.top) }]}>
            <SymbolView name={ICONS.back} size={22} tintColor={colors.heroChrome} />
          </Pressable>
        </LinearGradient>

        <View style={styles.stack}>
          {error ? <ErrorBanner title={error} /> : null}
          <View
            style={[
              styles.itemCard,
              { backgroundColor: colors.surface, borderColor: colors.line, shadowColor: colors.shadow },
            ]}>
            <View
              style={[
                styles.thumbnail,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.line },
              ]}>
              {candidate.thumbnailUrl ? (
                <Image source={{ uri: candidate.thumbnailUrl }} style={styles.thumbnailImage} />
              ) : (
                <SymbolView name={ICONS.image} size={21} tintColor={colors.muted} />
              )}
            </View>
            <View style={styles.itemCopy}>
              <Text style={[styles.candidateId, { color: colors.muted }]}>
                {candidate.candidateId}
              </Text>
              <Text style={[styles.itemName, { color: colors.ink }]}>
                {candidate.publicDescription}
              </Text>
            </View>
            <View style={[styles.matchBadge, { backgroundColor: colors.action }]}>
              <Text style={styles.matchBadgeText}>{Math.round(candidate.score)}% 일치</Text>
            </View>
          </View>

          <View
            style={[
              styles.storageCard,
              {
                backgroundColor: colors.pine100,
                borderColor: colors.pine200,
                shadowColor: colors.shadow,
              },
            ]}>
            <View style={styles.storageHeader}>
              <SymbolView name={ICONS.pin} size={15} tintColor={colors.onTint} />
              <Text style={[styles.storageTitle, { color: colors.onTint }]}>보관소 안내</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoKey, { color: colors.ink2 }]}>보관소 위치</Text>
              <Text style={[styles.infoValue, { color: colors.ink }]}>
                {candidate.centerName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoKey, { color: colors.ink2 }]}>연락처</Text>
              <Text style={[styles.infoValue, { color: colors.actionText }]}>
                {candidate.centerContactPhone ?? '-'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.page, paddingBottom: Math.max(24, insets.bottom + 16) },
        ]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleOpenNaverMap()}
          style={({ pressed }) => [
            styles.outlineButton,
            { backgroundColor: colors.surface, borderColor: colors.action },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.outlineButtonText, { color: colors.actionText }]}>보관소 길찾기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isConfirming, disabled: isConfirming }}
          disabled={isConfirming}
          onPress={onConfirm}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.action },
            pressed && styles.pressed,
            isConfirming && styles.disabled,
          ]}>
          {isConfirming ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>내 물건이 맞아요</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: 150 },
  hero: {
    height: 188,
    overflow: 'hidden',
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 28,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -70,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF14',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#14403B30',
  },
  backButton: {
    position: 'absolute',
    left: 4,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: { gap: 16, padding: 16 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  thumbnail: {
    width: 56,
    height: 56,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  thumbnailImage: { width: '100%', height: '100%' },
  itemCopy: { flex: 1, gap: 4 },
  candidateId: { fontFamily: appFontFamily, fontSize: 11 },
  itemName: { fontFamily: appFontFamily, fontSize: 14, fontWeight: '700' },
  matchBadge: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  matchBadgeText: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  storageCard: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  storageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storageTitle: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoKey: { width: 66, fontFamily: appFontFamily, fontSize: 11 },
  infoValue: { flex: 1, fontFamily: appFontFamily, fontSize: 12, fontWeight: '700' },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 14,
    fontWeight: '800',
  },
  outlineButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
  },
  outlineButtonText: { fontFamily: appFontFamily, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
});
