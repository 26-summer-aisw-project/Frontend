import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AiTag, Card, Chip, ErrorBanner, FieldLabel, ICONS } from '@/components/register-ui';
import { appFontFamily, brandFontFamily, useAppColors } from '@/src/theme/colors';

export const LOST_CATEGORIES = [
  { value: 'WALLET', label: '지갑 / 카드' },
  { value: 'ELECTRONICS', label: '휴대폰 / 전자기기' },
  { value: 'BAG', label: '가방 / 파우치' },
  { value: 'ID_CARD', label: '신분증 / 학생증' },
  { value: 'KEY', label: '열쇠 / 키링' },
  { value: 'CLOTHING', label: '의류 / 신발' },
  { value: 'BOOK', label: '도서 / 문구' },
  { value: 'ACCESSORY', label: '액세서리' },
  { value: 'ETC', label: '기타' },
] as const;

type Props = {
  brand: string;
  category: string | null;
  description: string;
  error: string | null;
  featureSuggestions: string[];
  imageUris: string[];
  isImageLimitReached: boolean;
  isSubmitting: boolean;
  itemName: string;
  onBack: () => void;
  onChangeBrand: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeItemName: (value: string) => void;
  onPickImage: () => void;
  onRemoveImage: (index: number) => void;
  onSelectCategory: (value: string) => void;
  onSubmit: () => void;
};

export function LostReportDetailsStep({
  brand,
  category,
  description,
  error,
  featureSuggestions,
  imageUris,
  isImageLimitReached,
  isSubmitting,
  itemName,
  onBack,
  onChangeBrand,
  onChangeDescription,
  onChangeItemName,
  onPickImage,
  onRemoveImage,
  onSelectCategory,
  onSubmit,
}: Props) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryLabel = LOST_CATEGORIES.find((option) => option.value === category)?.label;
  const canSubmit =
    itemName.trim().length > 0 &&
    category !== null &&
    description.trim().length > 0 &&
    !isSubmitting;

  function handleFeaturePress(feature: string) {
    const values = description
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (values.includes(feature)) {
      return;
    }

    onChangeDescription([...values, feature].join(', ').slice(0, 1000));
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.page }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(28, insets.bottom + 20) }]}
        keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[colors.pine500, colors.pine700]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          style={[styles.hero, { paddingTop: Math.max(14, insets.top) }]}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <Pressable
            accessibilityLabel="뒤로"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView name={ICONS.back} size={22} tintColor={colors.heroChrome} />
          </Pressable>
          <Text style={styles.heroEyebrow}>LOSTORY</Text>
          <Text style={styles.heroTitle}>어떤 물건을 잃어버리셨나요?</Text>
          <Text style={[styles.heroSubtitle, { color: colors.heroSub }]}>
            특징을 자세히 적을수록 후보가 정확해져요
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {error ? <ErrorBanner title={error} /> : null}

          <Card>
            <View style={styles.imageHeader}>
              <View style={styles.imageCopy}>
                <Text style={[styles.cardTitle, { color: colors.ink }]}>이미지 업로드</Text>
                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                  사진이 있으면 더 정확한 후보를 찾을 수 있어요
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isImageLimitReached }}
                disabled={isImageLimitReached}
                onPress={onPickImage}
                style={({ pressed }) => [
                  styles.imageButton,
                  { backgroundColor: colors.pine100, borderColor: colors.pine200 },
                  isImageLimitReached && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                <SymbolView name={ICONS.camera} size={17} tintColor={colors.action} />
                <Text style={[styles.imageButtonText, { color: colors.actionText }]}>이미지 선택</Text>
              </Pressable>
            </View>
            {imageUris.length > 0 ? (
              <View style={styles.previewGrid}>
                {imageUris.map((uri, index) => (
                  <View key={uri} style={styles.previewItem}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <Pressable
                      accessibilityLabel={`이미지 ${index + 1} 삭제`}
                      accessibilityRole="button"
                      hitSlop={6}
                      onPress={() => onRemoveImage(index)}
                      style={[styles.removeImageButton, { backgroundColor: colors.ink2 }]}>
                      <SymbolView name={ICONS.close} size={14} tintColor="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          <Card>
            <View style={styles.fieldGroup}>
              <FieldLabel label="물품명" required trailing={<AiTag />} />
              <TextInput
                maxLength={100}
                onChangeText={onChangeItemName}
                placeholder="예: 카드 지갑"
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, borderColor: colors.lineStrong, color: colors.ink },
                ]}
                value={itemName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel label="카테고리" required trailing={<AiTag />} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setCategoryOpen(true)}
                style={[styles.select, { backgroundColor: colors.surface, borderColor: colors.lineStrong }]}>
                <Text style={[styles.inputText, { color: categoryLabel ? colors.ink : colors.muted }]}>
                  {categoryLabel ?? '카테고리 선택'}
                </Text>
                <SymbolView name={ICONS.chevronDown} size={18} tintColor={colors.muted} />
              </Pressable>
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel label="브랜드" trailing={<AiTag />} />
              <TextInput
                maxLength={100}
                onChangeText={onChangeBrand}
                placeholder="예: 삼성, 애플, 루이비통"
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, borderColor: colors.lineStrong, color: colors.ink },
                ]}
                value={brand}
              />
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel label="분실물 특징" required />
              <TextInput
                maxLength={1000}
                multiline
                onChangeText={onChangeDescription}
                placeholder="물품의 색상, 재질, 눈에 띄는 특징을 적어주세요"
                placeholderTextColor={colors.muted}
                style={[
                  styles.descriptionInput,
                  { backgroundColor: colors.surface, borderColor: colors.lineStrong, color: colors.ink },
                ]}
                textAlignVertical="top"
                value={description}
              />
              {featureSuggestions.length > 0 ? (
                <>
                  <View style={styles.chipRow}>
                    {featureSuggestions.map((feature) => (
                      <Chip
                        key={feature}
                        label={feature}
                        onPress={() => handleFeaturePress(feature)}
                        selected={description
                          .split(',')
                          .map((value) => value.trim())
                          .includes(feature)}
                      />
                    ))}
                  </View>
                  <View style={styles.aiNoteRow}>
                    <SymbolView name={ICONS.ai} size={12} tintColor={colors.bronze700} />
                    <Text style={[styles.aiNote, { color: colors.bronze700 }]}>
                      AI가 사진에서 추출한 특징이에요
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </Card>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSubmitting, disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.action },
              !canSubmit && styles.disabled,
              pressed && styles.pressed,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>분실물 검색</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setCategoryOpen(false)}
        transparent
        visible={categoryOpen}>
        <Pressable onPress={() => setCategoryOpen(false)} style={styles.scrim} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {LOST_CATEGORIES.map((option) => (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: option.value === category }}
              onPress={() => {
                onSelectCategory(option.value);
                setCategoryOpen(false);
              }}
              style={[
                styles.categoryOption,
                option.value === category && { backgroundColor: colors.pine100 },
              ]}>
              <Text style={[styles.categoryOptionText, { color: colors.ink }]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 16 },
  hero: {
    height: 188,
    overflow: 'hidden',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#FFFFFF14',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -150,
    left: -70,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#0B2A263D',
  },
  backButton: { width: 44, height: 38, marginLeft: -8, alignItems: 'center', justifyContent: 'center' },
  heroEyebrow: {
    marginTop: 2,
    color: '#E7D3AB',
    fontFamily: brandFontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heroTitle: { marginTop: 8, color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 23, fontWeight: '800' },
  heroSubtitle: { marginTop: 7, fontFamily: appFontFamily, fontSize: 13 },
  body: { gap: 14, paddingHorizontal: 16 },
  imageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageCopy: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: appFontFamily, fontSize: 14, fontWeight: '800' },
  cardDescription: { fontFamily: appFontFamily, fontSize: 11, lineHeight: 16 },
  imageButton: { height: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10 },
  imageButtonText: { fontFamily: appFontFamily, fontSize: 12, fontWeight: '700' },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewItem: { position: 'relative', width: 96, height: 96 },
  previewImage: { width: 96, height: 96, borderRadius: 12 },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  fieldGroup: { gap: 8 },
  select: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, borderWidth: 1, borderRadius: 10 },
  inputText: { fontFamily: appFontFamily, fontSize: 13 },
  textInput: { height: 48, paddingHorizontal: 13, borderWidth: 1, borderRadius: 10, fontFamily: appFontFamily, fontSize: 13 },
  descriptionInput: { minHeight: 116, padding: 13, borderWidth: 1, borderRadius: 10, fontFamily: appFontFamily, fontSize: 13, lineHeight: 19 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiNoteRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  aiNote: { fontFamily: appFontFamily, fontSize: 11 },
  primaryButton: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  primaryButtonText: { color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 15, fontWeight: '800' },
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0E151299',
  },
  sheet: { position: 'absolute', right: 12, bottom: 12, left: 12, gap: 2, padding: 12, borderWidth: 1, borderRadius: 18 },
  categoryOption: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10 },
  categoryOptionText: { fontFamily: appFontFamily, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
});
