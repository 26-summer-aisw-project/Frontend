import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import {
  appFontFamily,
  brandFontFamily,
  type ColorPalette,
  useAppColors,
} from '@/src/theme/colors';

const SEARCH_ICON: SymbolViewProps['name'] = {
  ios: 'magnifyingglass',
  android: 'search',
  web: 'search',
};
const BACK_ICON: SymbolViewProps['name'] = {
  ios: 'arrow.left',
  android: 'arrow_back',
  web: 'arrow_back',
};

type AuthHeroProps = {
  title: string;
  subtitle: string;
  variant: 'login' | 'signup';
  onBack?: () => void;
};

export function AuthHero({ title, subtitle, variant, onBack }: AuthHeroProps) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const isLogin = variant === 'login';

  return (
    <LinearGradient
      colors={[colors.pine500, colors.pine700]}
      start={{ x: 0.8, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={[styles.hero, { height: isLogin ? 304 : 252 }]}>
      <View style={styles.heroGlowTop} />
      <View style={styles.heroGlowBottom} />
      {onBack ? (
        <Pressable
          accessibilityLabel="로그인 화면으로 돌아가기"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { top: Math.max(38, insets.top + 4) },
            pressed && styles.pressed,
          ]}>
          <SymbolView name={BACK_ICON} size={24} tintColor={colors.heroChrome} />
        </Pressable>
      ) : null}

      <View style={[styles.heroContent, { paddingBottom: isLogin ? 42 : 38 }]}>
        {isLogin ? (
          <View
            style={[
              styles.heroMark,
              { backgroundColor: colors.heroTint, borderColor: colors.heroHairline },
            ]}>
            <SymbolView name={SEARCH_ICON} size={22} tintColor={colors.heroChrome} />
          </View>
        ) : null}
        <View style={styles.heroCopy}>
          <Text style={[styles.wordmark, { color: colors.heroAccent }]}>LOSTORY</Text>
          <Text style={[styles.heroTitle, { fontSize: isLogin ? 27 : 22 }]}>{title}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.heroSub }]}>{subtitle}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

type FormFieldProps = TextInputProps & {
  label: string;
  icon: SymbolViewProps['name'];
  error?: string;
  helper?: string;
  trailing?: ReactNode;
  required?: boolean;
};

export const FormField = forwardRef<TextInput, FormFieldProps>(
  ({ label, icon, error, helper, trailing, required = false, style, ...inputProps }, ref) => {
    const colors = useAppColors();

    return (
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
          {required ? <Text style={[styles.required, { color: colors.brick }]}>*</Text> : null}
        </View>
        <View
          style={[
            styles.inputShell,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.brick : colors.lineStrong,
            },
          ]}>
          <SymbolView name={icon} size={18} tintColor={error ? colors.brick : colors.muted} />
          <TextInput
            ref={ref}
            placeholderTextColor={colors.muted}
            selectionColor={colors.action}
            style={[styles.input, { color: colors.ink }, style]}
            {...inputProps}
          />
        </View>
        {error || helper || trailing ? (
          <View style={styles.supportingRow}>
            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.supportingText,
                { color: error ? colors.brick : colors.muted },
              ]}>
              {error ?? helper ?? ' '}
            </Text>
            {trailing}
          </View>
        ) : null}
      </View>
    );
  },
);

FormField.displayName = 'FormField';

type PrimaryButtonProps = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function PrimaryButton({
  label,
  loading = false,
  disabled = false,
  onPress,
}: PrimaryButtonProps) {
  const colors = useAppColors();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.action },
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.primaryButtonText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function createCardStyle(colors: ColorPalette) {
  return {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    shadowColor: colors.shadow,
  };
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
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
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 16,
    paddingHorizontal: 28,
  },
  heroMark: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  heroCopy: {
    gap: 8,
  },
  wordmark: {
    fontFamily: brandFontFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3.4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: appFontFamily,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontFamily: appFontFamily,
    fontSize: 12,
  },
  backButton: {
    position: 'absolute',
    left: 4,
    zIndex: 1,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  required: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputShell: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 11,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: appFontFamily,
    fontSize: 14,
  },
  supportingRow: {
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  supportingText: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 11,
    lineHeight: 16,
  },
  primaryButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  primaryButtonText: {
    color: '#FFFFFF',
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
