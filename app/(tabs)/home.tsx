import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { apiRequest } from '@/src/lib/api';
import { appFontFamily, brandFontFamily, useAppColors } from '@/src/theme/colors';
import type { FoundItemResponse, PagedResponse } from '@/src/types/found-item';

const PROFILE_ICON: SymbolViewProps['name'] = {
  ios: 'person',
  android: 'person',
  web: 'person',
};
const HANDOVER_ICON: SymbolViewProps['name'] = {
  ios: 'shippingbox.and.arrow.backward',
  android: 'inventory_2',
  web: 'inventory_2',
};
const CAMERA_ICON: SymbolViewProps['name'] = {
  ios: 'camera',
  android: 'photo_camera',
  web: 'photo_camera',
};
const SEARCH_ICON: SymbolViewProps['name'] = {
  ios: 'magnifyingglass',
  android: 'search',
  web: 'search',
};
const CHEVRON_ICON: SymbolViewProps['name'] = {
  ios: 'chevron.right',
  android: 'chevron_right',
  web: 'chevron_right',
};

type ActionCardProps = {
  description: string;
  icon: SymbolViewProps['name'];
  kind: 'handover' | 'register' | 'report';
  onPress: () => void;
  title: string;
};

type PendingHandoverStatus = Extract<FoundItemResponse['status'], 'PROCESSING' | 'ACTIVE'>;

async function listFoundItems(status: PendingHandoverStatus): Promise<FoundItemResponse[]> {
  const items: FoundItemResponse[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await apiRequest<PagedResponse<FoundItemResponse>>(
      `/found-items?page=${page}&pageSize=100&status=${status}`,
    );
    items.push(...response.data);
    totalPages = response.meta.totalPages;
    page += 1;
  }

  return items;
}

function ActionCard({ description, icon, kind, onPress, title }: ActionCardProps) {
  const colors = useAppColors();
  const isHandover = kind === 'handover';
  const isReport = kind === 'report';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        {
          backgroundColor: isHandover ? colors.pine100 : colors.surface,
          borderColor: isHandover ? colors.pine200 : colors.line,
          shadowColor: colors.shadow,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor: isHandover
              ? colors.surface
              : isReport
                ? colors.bronze100
                : colors.pine100,
          },
        ]}>
        <SymbolView
          name={icon}
          size={20}
          tintColor={isReport ? colors.bronze700 : colors.actionText}
        />
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.actionDescription, { color: colors.muted }]}>{description}</Text>
      </View>
      <SymbolView name={CHEVRON_ICON} size={18} tintColor={colors.muted} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useAppColors();
  const [pendingHandover, setPendingHandover] = useState<FoundItemResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadPendingHandover() {
        try {
          const items = await Promise.all([
            listFoundItems('PROCESSING'),
            listFoundItems('ACTIVE'),
          ]);
          const pending = items
            .flat()
            .filter(
              (item) =>
                item.storageMethod === 'HANDED_TO_CENTER' &&
                item.centerId !== null &&
                item.handedAt === null &&
                (item.status === 'PROCESSING' || item.status === 'ACTIVE'),
            )
            .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))[0];

          if (!cancelled) setPendingHandover(pending ?? null);
        } catch {
          if (!cancelled) setPendingHandover(null);
        }
      }

      void loadPendingHandover();

      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.pine500, colors.pine700]}
          end={{ x: 0.2, y: 1 }}
          start={{ x: 0.8, y: 0 }}
          style={styles.hero}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <Pressable
            accessibilityLabel="마이페이지"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push('/mypage')}
            style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}>
            <SymbolView name={PROFILE_ICON} size={22} tintColor={colors.heroChrome} />
          </Pressable>
          <Text style={[styles.wordmark, { color: colors.heroAccent }]}>LOSTORY</Text>
          <View style={styles.greeting}>
            <Text style={styles.greetingLine}>무엇을 도와드릴까요?</Text>
            <Text style={styles.greetingLine}>주웠거나, 잃어버렸거나.</Text>
            <Text style={[styles.heroDescription, { color: colors.heroSub }]}>
              필요한 작업을 선택해 주세요
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.actions}>
          {pendingHandover ? (
            <ActionCard
              description="선택한 분실물 센터로 인계해 주세요"
              icon={HANDOVER_ICON}
              kind="handover"
              onPress={() =>
                router.push({
                  pathname: '/register',
                  params: {
                    handoverCenterId: pendingHandover.centerId!,
                    handoverFoundAt: pendingHandover.foundAt,
                    handoverItemId: pendingHandover.id,
                  },
                })
              }
              title="인계해야 하는 분실물이 있어요"
            />
          ) : null}
          <ActionCard
            description="물건을 주웠어요"
            icon={CAMERA_ICON}
            kind="register"
            onPress={() => router.push('/register')}
            title="습득물 등록"
          />
          <ActionCard
            description="물건을 잃어버렸어요"
            icon={SEARCH_ICON}
            kind="report"
            onPress={() => router.push('/report')}
            title="분실물 찾기"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    minHeight: 264,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -100,
    right: -45,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#FFFFFF14',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -125,
    left: -90,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#0B2A263D',
  },
  profileButton: {
    position: 'absolute',
    top: 28,
    right: 8,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  wordmark: {
    fontFamily: brandFontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3.4,
  },
  greeting: {
    gap: 4,
  },
  greetingLine: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontFamily: appFontFamily,
    fontSize: 12,
  },
  actions: {
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  actionCard: {
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  actionIcon: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  actionDescription: {
    fontFamily: appFontFamily,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.76,
  },
});
