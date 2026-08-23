import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ActionTag,
  AiTag,
  Card,
  CenterRow,
  Chip,
  FieldError,
  FieldLabel,
  ICONS,
  MapPreview,
  RadioRow,
  formatDateTime,
} from '@/components/register-ui';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import {
  type GeoPoint,
  type LostCenter,
  type StorageMethod,
} from '@/src/types/found-item';

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const LOCATION_MAX_LENGTH = 255;
export const STORAGE_DESC_MAX_LENGTH = 1000;

const STORAGE_OPTIONS: { value: StorageMethod; label: string }[] = [
  { value: 'LEFT_IN_PLACE', label: '원래 자리에 뒀어요' },
  { value: 'MOVED_TO_SAFE_PLACE', label: '주변으로 옮겼어요' },
  { value: 'HANDED_TO_CENTER', label: '분실물 센터에 맡길게요' },
];

const AI_FEATURE_SUGGESTIONS = ['검정색', '가죽', '카드 여러 장', '지퍼 있음', '브랜드 로고'];

type StepErrors = Partial<
  Record<
    | 'expectedImageCount'
    | 'name'
    | 'category'
    | 'description'
    | 'foundLocationText'
    | 'location'
    | 'foundAt'
    | 'storageMethod'
    | 'storageDesc'
    | 'centerId',
    string
  >
>;

type PhotoStepProps = {
  canRemovePhoto: (image: { uri: string }, index: number) => boolean;
  errors: StepErrors;
  imageLimit: number;
  images: readonly { uri: string }[];
  onRemovePhoto: (index: number) => void;
  onTakePhoto: () => void;
};

export function RegisterPhotoStep({
  canRemovePhoto,
  errors,
  imageLimit,
  images,
  onRemovePhoto,
  onTakePhoto,
}: PhotoStepProps) {
  const colors = useAppColors();

  return (
    <Card>
      <View style={styles.photoRow}>
        <View style={[styles.photoTile, { backgroundColor: colors.pine100 }]}>
          <SymbolView name={ICONS.camera} size={20} tintColor={colors.actionText} />
        </View>
        <View style={styles.photoCopy}>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>사진 촬영</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel={images.length === 0 ? '카메라 촬영' : '사진 추가 촬영'}
        accessibilityRole="button"
        onPress={onTakePhoto}
        style={({ pressed }) => [
          styles.captureArea,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.pine200 },
          pressed && styles.pressed,
        ]}>
        <View
          style={[
            styles.captureIconCircle,
            { backgroundColor: colors.surface, borderColor: colors.pine200 },
          ]}>
          <SymbolView name={ICONS.camera} size={34} tintColor={colors.actionText} />
        </View>
        <Text style={[styles.captureLabel, { color: colors.actionText }]}>카메라 촬영</Text>
        <Text style={[styles.captureHint, { color: colors.muted }]}>화면을 눌러 사진을 촬영하세요</Text>
        <Text style={[styles.captureCount, { color: colors.muted }]}>
          {images.length}/{imageLimit}장
        </Text>
      </Pressable>

      {images.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.thumbnailRow}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {images.map((image, index) => (
            <View key={image.uri} style={styles.thumbnailWrap}>
              <Image
                source={{ uri: image.uri }}
                style={[styles.thumbnail, { borderColor: colors.line }]}
              />
              {canRemovePhoto(image, index) ? (
                <Pressable
                  accessibilityLabel={`${index + 1}번째 사진 삭제`}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => onRemovePhoto(index)}
                  style={[styles.thumbnailRemove, { backgroundColor: colors.ink }]}>
                  <SymbolView name={ICONS.close} size={11} tintColor="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.noteRow}>
        <SymbolView name={ICONS.camera} size={12} tintColor={colors.muted} />
        <Text style={[styles.note, { color: colors.muted }]}>
          현장에서 찍은 사진을 최소 1장, 최대 {imageLimit}장까지 등록할 수 있어요
        </Text>
      </View>
      <FieldError message={errors.expectedImageCount} />
    </Card>
  );
}

type ItemInfoStepProps = {
  categoryLabel: string | null;
  description: string;
  errors: StepErrors;
  isCategoryOpen: boolean;
  name: string;
  onChangeDescription: (value: string) => void;
  onChangeName: (value: string) => void;
  onOpenCategory: () => void;
};

export function RegisterItemInfoStep({
  categoryLabel,
  description,
  errors,
  isCategoryOpen,
  name,
  onChangeDescription,
  onChangeName,
  onOpenCategory,
}: ItemInfoStepProps) {
  const colors = useAppColors();
  const inputShell = { backgroundColor: colors.surface, borderColor: colors.lineStrong };

  function handleFeaturePress(feature: string) {
    const values = description
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (values.includes(feature)) {
      return;
    }

    onChangeDescription([...values, feature].join(', ').slice(0, DESCRIPTION_MAX_LENGTH));
  }

  return (
    <Card>
        <View style={styles.field}>
          <FieldLabel label="물품명" required trailing={<AiTag />} />
          <TextInput
            maxLength={NAME_MAX_LENGTH}
            onChangeText={onChangeName}
            placeholder="검정색 카드지갑"
            placeholderTextColor={colors.muted}
            selectionColor={colors.action}
            style={[
              styles.input,
              styles.inputFont,
              inputShell,
              { color: colors.ink },
              errors.name ? { borderColor: colors.brick } : null,
            ]}
            value={name}
          />
          <FieldError message={errors.name} />
        </View>

        <View style={styles.field}>
          <FieldLabel label="카테고리" required trailing={<AiTag />} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isCategoryOpen }}
            onPress={onOpenCategory}
            style={({ pressed }) => [
              styles.input,
              styles.selectRow,
              inputShell,
              errors.category ? { borderColor: colors.brick } : null,
              pressed && styles.pressed,
            ]}>
            <Text
              style={[styles.inputText, { color: categoryLabel ? colors.ink : colors.muted }]}>
              {categoryLabel ?? '지갑 / 카드'}
            </Text>
            <SymbolView name={ICONS.chevronDown} size={15} tintColor={colors.muted} />
          </Pressable>
          <FieldError message={errors.category} />
        </View>

        <View style={styles.field}>
          <FieldLabel label="분실물 특징" required />
          <TextInput
            maxLength={DESCRIPTION_MAX_LENGTH}
            multiline
            onChangeText={onChangeDescription}
            placeholder="물품의 색상, 재질, 눈에 띄는 특징을 적어주세요"
            placeholderTextColor={colors.muted}
            selectionColor={colors.action}
            style={[
              styles.textarea,
              inputShell,
              { color: colors.ink },
              errors.description ? { borderColor: colors.brick } : null,
            ]}
            textAlignVertical="top"
            value={description}
          />
          <FieldError message={errors.description} />
          <View style={styles.chipRow}>
            {AI_FEATURE_SUGGESTIONS.map((feature) => (
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
        </View>
    </Card>
  );
}

type FoundInfoStepProps = {
  autoFilled: { location: boolean; foundAt: boolean };
  errors: StepErrors;
  foundAt: Date | null;
  foundCoords: GeoPoint | null;
  foundLocationText: string;
  isLocating: boolean;
  onChangeLocationText: (value: string) => void;
  onOpenFoundAt: () => void;
  onSetFoundAtNow: () => void;
  onUseCurrentLocation: () => void;
};

export function RegisterFoundInfoStep({
  autoFilled,
  errors,
  foundAt,
  foundCoords,
  foundLocationText,
  isLocating,
  onChangeLocationText,
  onOpenFoundAt,
  onSetFoundAtNow,
  onUseCurrentLocation,
}: FoundInfoStepProps) {
  const colors = useAppColors();
  const inputShell = { backgroundColor: colors.surface, borderColor: colors.lineStrong };

  return (
    <>
      <Card>
        <View style={styles.field}>
          <FieldLabel
            label="습득 장소"
            required
            trailing={
              <ActionTag
                busy={isLocating}
                icon={ICONS.locate}
                label={isLocating ? '찾는 중' : '현위치'}
                onPress={onUseCurrentLocation}
              />
            }
          />
          <View
            style={[
              styles.input,
              styles.selectRow,
              inputShell,
              errors.foundLocationText ? { borderColor: colors.brick } : null,
            ]}>
            <SymbolView name={ICONS.pin} size={15} tintColor={colors.muted} />
            <TextInput
              editable={foundCoords !== null}
              maxLength={LOCATION_MAX_LENGTH}
              onChangeText={onChangeLocationText}
              placeholder={foundCoords ? '숭실대학교 정보과학관 1층 로비' : '현위치를 먼저 확인해 주세요'}
              placeholderTextColor={colors.muted}
              selectionColor={colors.action}
              style={[styles.inlineInput, { color: foundCoords ? colors.ink : colors.muted }]}
              value={foundLocationText}
            />
          </View>
          <FieldError message={errors.foundLocationText} />
          {foundCoords && autoFilled.location ? (
            <View style={styles.hintRow}>
              <SymbolView name={ICONS.camera} size={12} tintColor={colors.actionText} />
              <Text style={[styles.hint, { color: colors.actionText }]}>
                사진에 담긴 위치로 채웠어요. 장소 설명은 고칠 수 있어요
              </Text>
            </View>
          ) : !foundCoords && !errors.location ? (
            <View style={styles.hintRow}>
              <SymbolView name={ICONS.locate} size={12} tintColor={colors.actionText} />
              <Text style={[styles.hint, { color: colors.actionText }]}>
                현위치를 눌러 습득 장소를 확인해 주세요
              </Text>
            </View>
          ) : null}
          <FieldError message={errors.location} />
        </View>

        <View style={styles.field}>
          <FieldLabel
            label="습득 일시"
            required
            trailing={
              <ActionTag icon={ICONS.clock} label="지금" onPress={onSetFoundAtNow} />
            }
          />
          <Pressable
            accessibilityRole="button"
            onPress={onOpenFoundAt}
            style={({ pressed }) => [
              styles.input,
              styles.selectRow,
              inputShell,
              errors.foundAt ? { borderColor: colors.brick } : null,
              pressed && styles.pressed,
            ]}>
            <SymbolView name={ICONS.clock} size={15} tintColor={colors.muted} />
            <Text style={[styles.inputText, { color: foundAt ? colors.ink : colors.muted }]}>
              {foundAt ? formatDateTime(foundAt) : '습득한 날짜와 시각을 골라 주세요'}
            </Text>
          </Pressable>
          <FieldError message={errors.foundAt} />
          {autoFilled.foundAt ? (
            <View style={styles.hintRow}>
              <SymbolView name={ICONS.camera} size={12} tintColor={colors.actionText} />
              <Text style={[styles.hint, { color: colors.actionText }]}>
                사진 촬영 시각으로 채웠어요. 다르면 고쳐 주세요
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>습득 위치</Text>
        <MapPreview height={230} />
      </Card>
    </>
  );
}

type StorageStepProps = {
  centerId: string | null;
  centers: readonly { center: LostCenter; distance?: number }[];
  centersError: string | null;
  errors: StepErrors;
  isLoadingCenters: boolean;
  onChangeStorageDesc: (value: string) => void;
  onRetryCenters: () => void;
  onSelectCenter: (center: LostCenter) => void;
  onSelectStorageMethod: (method: StorageMethod) => void;
  selectedCenter: LostCenter | null;
  storageDesc: string;
  storageMethod: StorageMethod | null;
};

export function RegisterStorageStep({
  centerId,
  centers,
  centersError,
  errors,
  isLoadingCenters,
  onChangeStorageDesc,
  onRetryCenters,
  onSelectCenter,
  onSelectStorageMethod,
  selectedCenter,
  storageDesc,
  storageMethod,
}: StorageStepProps) {
  const colors = useAppColors();
  const inputShell = { backgroundColor: colors.surface, borderColor: colors.lineStrong };

  return (
    <>
      <Card>
        <Text style={[styles.cardTitle, { color: colors.ink }]}>인계할 분실물 센터</Text>
        <MapPreview height={184} markers={Math.min(centers.length, 3)} />

        {isLoadingCenters ? (
          <View style={styles.centersPlaceholder}>
            <ActivityIndicator color={colors.action} size="small" />
          </View>
        ) : null}

        {centersError ? (
          <View style={styles.centersPlaceholder}>
            <Text style={[styles.cardDescription, { color: colors.brick }]}>{centersError}</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onRetryCenters}>
              <Text style={[styles.retryText, { color: colors.actionText }]}>다시 시도</Text>
            </Pressable>
          </View>
        ) : null}

        {centers.map(({ center, distance }, index) => (
          <CenterRow
            key={center.id}
            address={center.address}
            distance={distance}
            index={index + 1}
            name={center.name}
            onPress={() => onSelectCenter(center)}
            selected={center.id === centerId}
          />
        ))}
      </Card>

      <Card>
        <FieldLabel label="보관 상태" required />
        {STORAGE_OPTIONS.map((option) => (
          <View key={option.value}>
            <RadioRow
              label={option.label}
              onPress={() => onSelectStorageMethod(option.value)}
              selected={storageMethod === option.value}
            />

            {option.value === 'MOVED_TO_SAFE_PLACE' && storageMethod === 'MOVED_TO_SAFE_PLACE' ? (
              <View style={styles.conditional}>
                <Text style={[styles.conditionalLabel, { color: colors.ink2 }]}>
                  정확히 어디에 옮겼나요?
                </Text>
                <TextInput
                  maxLength={STORAGE_DESC_MAX_LENGTH}
                  multiline
                  onChangeText={onChangeStorageDesc}
                  placeholder="예) 1층 안내데스크 옆 선반 위에 올려 뒀어요"
                  placeholderTextColor={colors.muted}
                  selectionColor={colors.action}
                  style={[
                    styles.textarea,
                    inputShell,
                    { color: colors.ink },
                    errors.storageDesc ? { borderColor: colors.brick } : null,
                  ]}
                  textAlignVertical="top"
                  value={storageDesc}
                />
                <FieldError message={errors.storageDesc} />
              </View>
            ) : null}

            {option.value === 'HANDED_TO_CENTER' && storageMethod === 'HANDED_TO_CENTER' ? (
              <View style={styles.conditional}>
                {selectedCenter ? (
                  <View style={[styles.selectedCenter, { backgroundColor: colors.pine100 }]}>
                    <SymbolView name={ICONS.pin} size={13} tintColor={colors.onTint} />
                    <Text
                      numberOfLines={2}
                      style={[styles.selectedCenterText, { color: colors.onTint }]}>
                      {selectedCenter.name} · {selectedCenter.address}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.conditionalLabel, { color: colors.brick }]}>
                    위 목록에서 인계할 분실물 센터를 먼저 골라 주세요.
                  </Text>
                )}
                <FieldError message={errors.centerId} />
              </View>
            ) : null}
          </View>
        ))}
        <FieldError message={errors.storageMethod} />
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  cardDescription: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 11,
    lineHeight: 16,
  },
  photoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  photoTile: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  photoCopy: {
    flex: 1,
    gap: 4,
  },
  thumbnailRow: {
    gap: 8,
  },
  thumbnailWrap: {
    height: 72,
    width: 72,
  },
  thumbnail: {
    borderRadius: 10,
    borderWidth: 1,
    height: 72,
    width: 72,
  },
  thumbnailRemove: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 22,
  },
  captureArea: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    height: 420,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  captureIconCircle: {
    alignItems: 'center',
    borderRadius: 38,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  captureLabel: {
    fontFamily: appFontFamily,
    fontSize: 16,
    fontWeight: '700',
  },
  captureHint: {
    fontFamily: appFontFamily,
    fontSize: 12,
  },
  captureCount: {
    fontFamily: appFontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  noteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  note: {
    fontFamily: appFontFamily,
    fontSize: 11,
  },
  field: {
    gap: 8,
  },
  input: {
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  inputFont: {
    fontFamily: appFontFamily,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  inputText: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 13.5,
  },
  selectRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  textarea: {
    borderRadius: 9,
    borderWidth: 1,
    fontFamily: appFontFamily,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inlineInput: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 13.5,
    height: 46,
    paddingVertical: 0,
  },
  hintRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  hint: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 11,
    lineHeight: 16,
  },
  centersPlaceholder: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  retryText: {
    fontFamily: appFontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  conditional: {
    gap: 8,
    marginBottom: 8,
    marginTop: 2,
    paddingLeft: 26,
  },
  conditionalLabel: {
    fontFamily: appFontFamily,
    fontSize: 12,
  },
  selectedCenter: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  selectedCenterText: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiNoteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  aiNote: {
    fontFamily: appFontFamily,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.76,
  },
});
