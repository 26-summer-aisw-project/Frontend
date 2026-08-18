import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type SymbolViewProps } from 'expo-symbols';
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
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import {
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_BYTES,
  utf8ByteLength,
  type SignupRequest,
  type SignupResponse,
} from '@/src/types/auth';

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

type SignupField = 'email' | 'password' | 'passwordConfirm';
type SignupFieldErrors = Partial<Record<SignupField, string>>;

/**
 * 비밀번호 길이 위반 사유를 상한/하한으로 갈라서 돌려준다.
 *
 * 명세 §3.2의 기준은 글자 수가 아니라 UTF-8 바이트 수(8..72)다. 한글은 글자당
 * 3바이트라 24자를 넘으면 상한에 걸리는데, 이때 하한 문구를 띄우면 사용자가
 * 원인을 알 수 없다.
 */
function passwordLengthError(password: string): string | undefined {
  const bytes = utf8ByteLength(password);

  if (bytes < PASSWORD_MIN_BYTES) {
    return '비밀번호가 너무 짧습니다';
  }
  if (bytes > PASSWORD_MAX_BYTES) {
    return '비밀번호가 너무 깁니다';
  }
  return undefined;
}

export default function SignupScreen() {
  const colors = useAppColors();
  const passwordRef = useRef<TextInput>(null);
  const passwordConfirmRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const livePasswordLengthError =
    password.length > 0 ? passwordLengthError(password) : undefined;
  const hasMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  function clearFieldError(field: SignupField) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSignup() {
    const nextErrors: SignupFieldErrors = {};
    if (email.trim().length === 0) {
      nextErrors.email = '이메일을 입력해 주세요.';
    }
    const passwordLengthMessage = passwordLengthError(password);
    if (passwordLengthMessage) {
      nextErrors.password = passwordLengthMessage;
    }
    if (passwordConfirm.length === 0) {
      nextErrors.passwordConfirm = '비밀번호를 한 번 더 입력해 주세요.';
    } else if (password !== passwordConfirm) {
      nextErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
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
      const request: SignupRequest = { email: email.trim(), password };
      await apiRequest<SignupResponse>('/auth/signup', {
        method: 'POST',
        json: request,
        skipAuth: true,
      });
      router.replace('/login');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'EMAIL_ALREADY_EXISTS') {
          setFieldErrors({ email: '이미 사용 중인 이메일입니다.' });
          setFormError(null);
        } else if (error.code === 'VALIDATION_ERROR') {
          const validationErrors: SignupFieldErrors = {};
          for (const detail of error.details) {
            if (
              detail.field === 'email' ||
              detail.field === 'password' ||
              detail.field === 'passwordConfirm'
            ) {
              validationErrors[detail.field] = detail.reason;
            }
          }
          setFieldErrors(validationErrors);
          setFormError(
            Object.keys(validationErrors).length === 0 ? error.message : null,
          );
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError('회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const passwordError = fieldErrors.password ?? livePasswordLengthError;
  const passwordConfirmError =
    fieldErrors.passwordConfirm ?? (hasMismatch ? '비밀번호가 일치하지 않습니다.' : undefined);

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
          onBack={() => router.replace('/login')}
          subtitle="분실 신고와 후보 안내를 이용하려면 계정이 필요해요"
          title="계정 만들기"
          variant="signup"
        />

        <View style={styles.content}>
          <View style={[styles.card, createCardStyle(colors)]}>
            <FormField
              autoCapitalize="none"
              autoComplete="email"
              error={fieldErrors.email}
              helper="로그인할 때 쓰는 주소예요"
              icon={MAIL_ICON}
              keyboardType="email-address"
              label="이메일"
              onChangeText={(value) => {
                setEmail(value);
                clearFieldError('email');
              }}
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="hong@ssu.ac.kr"
              required
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <FormField
              ref={passwordRef}
              autoComplete="new-password"
              error={passwordError}
              icon={LOCK_ICON}
              label="비밀번호"
              onChangeText={(value) => {
                setPassword(value);
                clearFieldError('password');
              }}
              onSubmitEditing={() => passwordConfirmRef.current?.focus()}
              placeholder="비밀번호"
              required
              returnKeyType="next"
              secureTextEntry
              textContentType="newPassword"
              value={password}
            />
            <FormField
              ref={passwordConfirmRef}
              autoComplete="new-password"
              error={passwordConfirmError}
              icon={LOCK_ICON}
              label="비밀번호 확인"
              onChangeText={(value) => {
                setPasswordConfirm(value);
                clearFieldError('passwordConfirm');
              }}
              onSubmitEditing={handleSignup}
              placeholder="비밀번호 확인"
              required
              returnKeyType="done"
              secureTextEntry
              textContentType="newPassword"
              value={passwordConfirm}
            />
            {formError ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.formError, { color: colors.brick }]}>
                {formError}
              </Text>
            ) : null}
            <PrimaryButton
              label="가입하고 시작하기"
              loading={isSubmitting}
              onPress={handleSignup}
            />
          </View>

          <View style={styles.accountLinkRow}>
            <Text style={[styles.accountQuestion, { color: colors.muted }]}>이미 계정이 있으신가요?</Text>
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.replace('/login')}>
              <Text style={[styles.accountLink, { color: colors.actionText }]}>로그인</Text>
            </Pressable>
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
    gap: 16,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    gap: 16,
    padding: 16,
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
    gap: 6,
  },
  accountQuestion: {
    fontFamily: appFontFamily,
    fontSize: 14,
  },
  accountLink: {
    fontFamily: appFontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
});
