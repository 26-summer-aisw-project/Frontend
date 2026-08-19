import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError, apiRequest } from '@/src/lib/api';
import { clearAccessToken } from '@/src/lib/auth-token';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import type { UserResponse, UserRole } from '@/src/types/auth';

const USER_ICON: SymbolViewProps['name'] = {
  ios: 'person',
  android: 'person',
  web: 'person',
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
const LOGOUT_ICON: SymbolViewProps['name'] = {
  ios: 'rectangle.portrait.and.arrow.right',
  android: 'logout',
  web: 'logout',
};

const ROLE_LABELS: Record<UserRole, string> = {
  USER: '일반 회원',
  ADMIN: '관리자',
};

type ActivityRowProps = {
  description: string;
  icon: SymbolViewProps['name'];
  title: string;
};

function ActivityRow({ description, icon, title }: ActivityRowProps) {
  const colors = useAppColors();

  return (
    <View style={styles.activityRow}>
      <View style={[styles.activityIcon, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView name={icon} size={17} tintColor={colors.muted} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={[styles.activityTitle, { color: colors.ink2 }]}>{title}</Text>
        <Text style={[styles.activityDescription, { color: colors.muted }]}>{description}</Text>
      </View>
      <View
        style={[
          styles.comingSoonBadge,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.line },
        ]}>
        <Text style={[styles.comingSoonText, { color: colors.muted }]}>준비 중</Text>
      </View>
    </View>
  );
}

type ProfileHeroProps = {
  user: UserResponse | null;
  isLoading: boolean;
};

function ProfileHero({ user, isLoading }: ProfileHeroProps) {
  const colors = useAppColors();

  return (
    <LinearGradient
      colors={[colors.pine500, colors.pine700]}
      start={{ x: 0.8, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={styles.hero}>
      <View style={styles.heroGlowTop} />
      <View style={styles.heroGlowBottom} />
      <View style={styles.profile}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.heroTint, borderColor: colors.heroHairline },
          ]}>
          {isLoading && !user ? (
            <ActivityIndicator color={colors.heroChrome} size="small" />
          ) : (
            <SymbolView name={USER_ICON} size={24} tintColor={colors.heroChrome} />
          )}
        </View>
        <View style={styles.profileCopy}>
          <Text numberOfLines={1} style={styles.email}>
            {user?.email ?? '회원 정보를 불러오는 중입니다'}
          </Text>
          {user ? (
            <View style={styles.roleRow}>
              {user.roles.map((role) => (
                <View key={role} style={[styles.roleBadge, { backgroundColor: colors.pine100 }]}>
                  <Text style={[styles.roleText, { color: colors.actionText }]}>
                    {ROLE_LABELS[role]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

export default function MypageScreen() {
  const colors = useAppColors();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canRetryProfile, setCanRetryProfile] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setCanRetryProfile(false);

    try {
      const response = await apiRequest<UserResponse>('/users/me');
      setUser(response);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setCanRetryProfile(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  async function handleLogout() {
    setIsLoggingOut(true);
    setErrorMessage(null);
    setCanRetryProfile(false);

    try {
      await clearAccessToken();
      router.replace('/login');
    } catch {
      setErrorMessage('로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsLoggingOut(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.action]}
            onRefresh={loadProfile}
            refreshing={isLoading && user !== null}
            tintColor={colors.action}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ProfileHero isLoading={isLoading} user={user} />

        <View style={styles.content}>
          {errorMessage ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.surface, borderColor: colors.brickBorder },
              ]}>
              <Text style={[styles.errorText, { color: colors.brick }]}>{errorMessage}</Text>
              {canRetryProfile ? (
                <Pressable accessibilityRole="button" hitSlop={8} onPress={loadProfile}>
                  <Text style={[styles.retryText, { color: colors.actionText }]}>다시 시도</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.ink2 }]}>내 활동</Text>
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.line,
                shadowColor: colors.shadow,
              },
            ]}>
            <ActivityRow
              description="내가 등록한 습득물을 모아 봐요"
              icon={CAMERA_ICON}
              title="내 습득물 등록 내역"
            />
            <View style={[styles.divider, { backgroundColor: colors.line }]} />
            <ActivityRow
              description="내가 올린 분실 신고와 후보를 봐요"
              icon={SEARCH_ICON}
              title="내 분실 신고 내역"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isLoggingOut, disabled: isLoggingOut }}
            disabled={isLoggingOut}
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              { backgroundColor: colors.surface, borderColor: colors.brickBorder },
              pressed && styles.pressed,
              isLoggingOut && styles.disabled,
            ]}>
            {isLoggingOut ? (
              <ActivityIndicator color={colors.brick} size="small" />
            ) : (
              <>
                <SymbolView name={LOGOUT_ICON} size={16} tintColor={colors.brick} />
                <Text style={[styles.logoutText, { color: colors.brick }]}>로그아웃</Text>
              </>
            )}
          </Pressable>
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
    height: 230,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -96,
    right: -54,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF14',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -130,
    left: -82,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#0B2A263D',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 15,
  },
  profileCopy: {
    flex: 1,
    gap: 8,
  },
  email: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  roleText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  retryText: {
    fontFamily: appFontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  menuCard: {
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  activityRow: {
    minHeight: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 4,
  },
  activityIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  activityDescription: {
    fontFamily: appFontFamily,
    fontSize: 11,
    lineHeight: 16,
  },
  comingSoonBadge: {
    flexShrink: 0,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 5,
  },
  comingSoonText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  logoutButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
    borderWidth: 1,
    borderRadius: 11,
  },
  logoutText: {
    fontFamily: appFontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.55,
  },
});
