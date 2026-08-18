import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from 'react-native';

import {
  AuthHero,
  createCardStyle,
  FormField,
  PrimaryButton,
} from '@/components/auth-ui';
import { ApiError, apiRequest } from '@/src/lib/api';
import { saveAccessToken } from '@/src/lib/auth-token';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import type { LoginRequest, LoginResponse } from '@/src/types/auth';

const MAIL_ICON: SymbolViewProps['name'] = {
  ios: 'envelope',
  android: 'mail',
  web: 'mail',
};
const LOCK_ICON: SymbolViewProps['name'] = {
  ios: 'lock',
  android: 'lock',
  web: 'lock',
};
const SHIELD_ICON: SymbolViewProps['name'] = {
  ios: 'checkmark.shield',
  android: 'verified_user',
  web: 'verified_user',
};

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const colors = useAppColors();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    const nextErrors: LoginFieldErrors = {};
    if (email.trim().length === 0) {
      nextErrors.email = '이메일을 입력해 주세요.';
    }
    if (password.length === 0) {
      nextErrors.password = '비밀번호를 입력해 주세요.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError(null);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const request: LoginRequest = { email: email.trim(), password };
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        json: request,
        skipAuth: true,
      });
      await saveAccessToken(response.accessToken);
      router.replace('/home');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'VALIDATION_ERROR') {
          const validationErrors: LoginFieldErrors = {};
          for (const detail of error.details) {
            if (detail.field === 'email' || detail.field === 'password') {
              validationErrors[detail.field] = detail.reason;
            }
          }
          setFieldErrors(validationErrors);
          setFormError(
            Object.keys(validationErrors).length === 0 ? error.message : null,
          );
        } else if (
          error.code === 'INVALID_CREDENTIALS' ||
          error.code === 'USER_BLOCKED'
        ) {
          // 차단·삭제 여부를 드러내지 않아 계정 열거를 막는다.
          setFormError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError('로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.page }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AuthHero
          title="분실물 매칭 플랫폼"
          subtitle="잃어버린 물건과 주운 물건을 잇다"
          variant="login"
        />

        <View style={styles.content}>
          <View
            style={[
              styles.card,
              createCardStyle(colors),
            ]}>
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              error={fieldErrors.email}
              icon={MAIL_ICON}
              keyboardType="email-address"
              label="이메일"
              onChangeText={(value) => {
                setEmail(value);
                setFieldErrors((current) => ({ ...current, email: undefined }));
                setFormError(null);
              }}
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="email@example.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <FormField
              ref={passwordRef}
              autoComplete="current-password"
              error={fieldErrors.password}
              icon={LOCK_ICON}
              label="비밀번호"
              onChangeText={(value) => {
                setPassword(value);
                setFieldErrors((current) => ({ ...current, password: undefined }));
                setFormError(null);
              }}
              onSubmitEditing={handleLogin}
              placeholder="비밀번호"
              returnKeyType="done"
              secureTextEntry
              textContentType="password"
              value={password}
            />
            {formError ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.formError, { color: colors.brick }]}>
                {formError}
              </Text>
            ) : null}
            <PrimaryButton label="로그인" loading={isSubmitting} onPress={handleLogin} />
          </View>

          <View style={styles.accountLinkRow}>
            <Text style={[styles.accountQuestion, { color: colors.muted }]}>계정이 없으신가요?</Text>
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push('/signup')}>
              <Text style={[styles.accountLink, { color: colors.actionText }]}>회원가입</Text>
            </Pressable>
          </View>

          <View style={styles.footerNote}>
            <SymbolView name={SHIELD_ICON} size={13} tintColor={colors.muted} />
            <Text style={[styles.footerNoteText, { color: colors.muted }]}>
              로그인하면 분실 신고와 후보 안내를 이용할 수 있어요
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    gap: 20,
    paddingTop: 67,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    gap: 16,
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  formError: {
    marginTop: -4,
    fontFamily: appFontFamily,
    fontSize: 12,
    lineHeight: 18,
  },
  accountLinkRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  accountQuestion: {
    fontFamily: appFontFamily,
    fontSize: 12,
  },
  accountLink: {
    fontFamily: appFontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 12,
  },
  footerNoteText: {
    flexShrink: 1,
    fontFamily: appFontFamily,
    fontSize: 11,
    textAlign: 'center',
  },
});
