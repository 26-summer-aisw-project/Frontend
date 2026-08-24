import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appFontFamily, useAppColors } from '@/src/theme/colors';

export const ICONS = {
  back: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
  camera: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  chevronDown: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'expand_more' },
  ai: { ios: 'viewfinder', android: 'center_focus_weak', web: 'center_focus_weak' },
  locate: { ios: 'location', android: 'my_location', web: 'my_location' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  copy: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' },
  external: { ios: 'arrow.up.right.square', android: 'open_in_new', web: 'open_in_new' },
  pin: { ios: 'mappin', android: 'location_on', web: 'location_on' },
  alert: { ios: 'exclamationmark.circle', android: 'error', web: 'error' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  shield: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
} satisfies Record<string, SymbolViewProps['name']>;

const STEP_LABELS = ['사진 촬영', '습득 정보', '물품 정보', '보관 상태'] as const;

export function StepHero({ step, onBack }: { step: number; onBack: () => void }) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.pine500, colors.pine700]}
      start={{ x: 0.8, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={[styles.hero, { paddingTop: Math.max(20, insets.top) }]}>
      <View style={styles.heroGlowTop} />
      <View style={styles.heroGlowBottom} />

      <Pressable
        accessibilityLabel={step > 1 ? '이전 단계로' : '등록 그만두기'}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <SymbolView name={ICONS.back} size={22} tintColor={colors.heroChrome} />
      </Pressable>

      <View style={styles.stepper}>
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isDone = stepNumber < step;
          const isCurrent = stepNumber === step;
          const trackColor = (segment: number) =>
            step > segment ? colors.heroRule : colors.heroHairline;

          return (
            <View key={label} style={styles.stepCell}>
              <View style={styles.stepNodeRow}>
                <View
                  style={[
                    styles.stepTrack,
                    { backgroundColor: index === 0 ? 'transparent' : trackColor(index) },
                  ]}
                />
                <View
                  accessibilityLabel={`${stepNumber}단계 ${label}${isDone ? ' 완료' : ''}`}
                  accessibilityRole="text"
                  style={[
                    styles.stepNode,
                    isDone && { backgroundColor: colors.heroChrome, borderColor: colors.heroChrome },
                    isCurrent && {
                      backgroundColor: colors.heroTintStrong,
                      borderColor: '#FFFFFF',
                      borderWidth: 2,
                    },
                    !isDone &&
                      !isCurrent && {
                        backgroundColor: colors.heroFaint,
                        borderColor: colors.heroHairlineSoft,
                      },
                  ]}>
                  {isDone ? (
                    <SymbolView name={ICONS.check} size={12} tintColor={colors.pine700} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        { color: isCurrent ? '#FFFFFF' : colors.heroTextMuted },
                      ]}>
                      {stepNumber}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.stepTrack,
                    {
                      backgroundColor:
                        index === STEP_LABELS.length - 1 ? 'transparent' : trackColor(stepNumber),
                    },
                  ]}
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  { color: isCurrent ? '#FFFFFF' : isDone ? colors.heroSub : colors.heroTextSoft },
                ]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = useAppColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line, shadowColor: colors.shadow },
        style,
      ]}>
      {children}
    </View>
  );
}

export function FieldLabel({
  label,
  required = false,
  trailing,
}: {
  label: string;
  required?: boolean;
  trailing?: ReactNode;
}) {
  const colors = useAppColors();

  return (
    <View style={styles.labelRow}>
      <View style={styles.labelText}>
        <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
        {required ? <Text style={[styles.label, { color: colors.brick }]}> *</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

export function AiTag({ label = 'AI 탐지' }: { label?: string }) {
  const colors = useAppColors();

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="text"
      style={[styles.aiTag, { backgroundColor: colors.bronze100, borderColor: colors.bronze200 }]}>
      <SymbolView name={ICONS.ai} size={12} tintColor={colors.bronze700} />
      <Text style={[styles.aiTagText, { color: colors.bronze700 }]}>{label}</Text>
    </View>
  );
}

export function ActionTag({
  label,
  icon,
  onPress,
  busy = false,
}: {
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  busy?: boolean;
}) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionTag,
        { backgroundColor: colors.surface, borderColor: colors.pine200 },
        pressed && styles.pressed,
        busy && styles.disabled,
      ]}>
      <SymbolView name={icon} size={12} tintColor={colors.actionText} />
      <Text style={[styles.actionTagText, { color: colors.actionText }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.pine100 : colors.surfaceMuted,
          borderColor: selected ? colors.pine200 : colors.line,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.chipText, { color: selected ? colors.onTint : colors.ink2 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.radioRow, pressed && styles.pressed]}>
      <View
        style={[
          styles.radio,
          {
            backgroundColor: colors.surface,
            borderColor: selected ? colors.action : colors.lineStrong,
            borderWidth: selected ? 2 : 1,
          },
        ]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: colors.action }]} /> : null}
      </View>
      <Text
        style={[
          styles.radioLabel,
          { color: selected ? colors.ink : colors.ink2, fontWeight: selected ? '700' : '400' },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CenterRow({
  index,
  name,
  address,
  distance,
  selected,
  onPress,
}: {
  index: number;
  name: string;
  address: string;
  distance?: number;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useAppColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.centerRow,
        selected && { backgroundColor: colors.pine100 },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.centerNo,
          { backgroundColor: selected ? colors.action : colors.surfaceMuted },
        ]}>
        <Text style={[styles.centerNoText, { color: selected ? '#FFFFFF' : colors.ink2 }]}>
          {index}
        </Text>
      </View>
      <View style={styles.centerCopy}>
        <Text numberOfLines={1} style={[styles.centerName, { color: selected ? colors.onTint : colors.ink }]}>
          {name}
        </Text>
        <Text numberOfLines={1} style={[styles.centerAddress, { color: colors.muted }]}>
          {address}
        </Text>
      </View>
      <Text style={[styles.centerDistance, { color: selected ? colors.actionText : colors.muted }]}>
        {typeof distance === 'number' ? formatDistance(distance) : '—'}
      </Text>
    </Pressable>
  );
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`;
}

export function MapPreview({ height = 230, markers = 0 }: { height?: number; markers?: number }) {
  const colors = useAppColors();
  const markerSpots: ViewStyle[] = [
    { left: '12%', top: '18%' },
    { left: '52%', top: '32%' },
    { left: '34%', top: '68%' },
    { left: '70%', top: '62%' },
    { left: '78%', top: '20%' },
  ];

  return (
    <View
      accessibilityLabel="습득 위치 지도 미리보기"
      accessibilityRole="image"
      style={[styles.map, { height, backgroundColor: colors.mapBase, borderColor: colors.line }]}>
      <View
        style={[styles.mapBlock, { backgroundColor: colors.mapGreen, left: 30, top: 16, width: 88 }]}
      />
      <View
        style={[
          styles.mapBlock,
          { backgroundColor: colors.mapGreen, right: 24, bottom: 20, width: 100 },
        ]}
      />
      <View style={[styles.mapRoadH, { backgroundColor: colors.mapRoad }]} />
      <View style={[styles.mapRoadV, { backgroundColor: colors.mapRoad }]} />
      <View style={[styles.mapRoadV2, { backgroundColor: colors.mapRoadAlt }]} />

      <View style={[styles.mapHalo, { backgroundColor: colors.pinHalo }]}>
        <View
          style={[styles.mapPin, { backgroundColor: colors.action, borderColor: colors.markerRing }]}
        />
      </View>

      {Array.from({ length: Math.min(markers, markerSpots.length) }, (_, index) => (
        <View
          key={index}
          style={[
            styles.mapMarker,
            markerSpots[index],
            {
              backgroundColor: index === 0 ? colors.action : colors.markerRing,
              borderColor: index === 0 ? colors.action : colors.pine200,
            },
          ]}>
          <Text style={[styles.mapMarkerText, { color: index === 0 ? '#FFFFFF' : colors.pine700 }]}>
            {index + 1}
          </Text>
        </View>
      ))}

    </View>
  );
}

export function ErrorBanner({ title, body }: { title: string; body?: string }) {
  const colors = useAppColors();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.errorBanner,
        { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
      ]}>
      <SymbolView name={ICONS.alert} size={18} tintColor={colors.brick} />
      <View style={styles.errorCopy}>
        <Text style={[styles.errorTitle, { color: colors.ink }]}>{title}</Text>
        {body ? <Text style={[styles.errorBody, { color: colors.ink2 }]}>{body}</Text> : null}
      </View>
    </View>
  );
}

export function FieldError({ message }: { message?: string }) {
  const colors = useAppColors();
  if (!message) {
    return null;
  }

  return (
    <Text accessibilityLiveRegion="polite" style={[styles.fieldError, { color: colors.brick }]}>
      {message}
    </Text>
  );
}

const DATE_PARTS = [
  { key: 'year', label: '년', step: 1 },
  { key: 'month', label: '월', step: 1 },
  { key: 'day', label: '일', step: 1 },
  { key: 'hour', label: '시', step: 1 },
  { key: 'minute', label: '분', step: 1 },
] as const;

type DatePartKey = (typeof DATE_PARTS)[number]['key'];

function shiftDate(base: Date, part: DatePartKey, amount: number): Date {
  const next = new Date(base.getTime());
  switch (part) {
    case 'year':
      next.setFullYear(next.getFullYear() + amount);
      break;
    case 'month':
      next.setMonth(next.getMonth() + amount);
      break;
    case 'day':
      next.setDate(next.getDate() + amount);
      break;
    case 'hour':
      next.setHours(next.getHours() + amount);
      break;
    case 'minute':
      next.setMinutes((next.getMinutes() + amount + 60) % 60);
      break;
  }
  return next;
}

function partValue(date: Date, part: DatePartKey): string {
  switch (part) {
    case 'year':
      return String(date.getFullYear());
    case 'month':
      return String(date.getMonth() + 1);
    case 'day':
      return String(date.getDate());
    case 'hour':
      return String(date.getHours()).padStart(2, '0');
    case 'minute':
      return String(date.getMinutes()).padStart(2, '0');
  }
}

export function DateTimeSheet({
  visible,
  value,
  title,
  editableParts,
  minimumDate,
  maximumDate,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  value: Date;
  title: string;
  editableParts?: DatePartKey[];
  minimumDate?: Date | null;
  maximumDate?: Date | null;
  onCancel: () => void;
  onConfirm: (next: Date) => void;
}) {
  const colors = useAppColors();
  const [draft, setDraft] = useState(value);
  const parts = editableParts
    ? DATE_PARTS.filter(({ key }) => editableParts.includes(key))
    : DATE_PARTS;

  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  function clamp(next: Date): Date {
    if (minimumDate && next.getTime() < minimumDate.getTime()) {
      return new Date(minimumDate.getTime());
    }
    if (maximumDate && next.getTime() > maximumDate.getTime()) {
      return new Date(maximumDate.getTime());
    }
    return next;
  }

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <Pressable
        accessibilityLabel="닫기"
        accessibilityRole="button"
        onPress={onCancel}
        style={styles.sheetScrim}
      />
      <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text style={[styles.sheetTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.sheetValue, { color: colors.actionText }]}>
          {formatDateTime(draft)}
        </Text>

        {parts.map(({ key, label, step }) => (
          <View key={key} style={styles.sheetRow}>
            <Text style={[styles.sheetRowLabel, { color: colors.ink2 }]}>{label}</Text>
            <View style={styles.sheetStepper}>
              <Pressable
                accessibilityLabel={`${label} 줄이기`}
                accessibilityRole="button"
                onPress={() => setDraft((current) => clamp(shiftDate(current, key, -step)))}
                style={({ pressed }) => [
                  styles.sheetStepButton,
                  { borderColor: colors.lineStrong },
                  pressed && styles.pressed,
                ]}>
                <SymbolView name={ICONS.minus} size={14} tintColor={colors.ink2} />
              </Pressable>
              <Text style={[styles.sheetPartValue, { color: colors.ink }]}>
                {partValue(draft, key)}
              </Text>
              <Pressable
                accessibilityLabel={`${label} 늘리기`}
                accessibilityRole="button"
                onPress={() => setDraft((current) => clamp(shiftDate(current, key, step)))}
                style={({ pressed }) => [
                  styles.sheetStepButton,
                  { borderColor: colors.lineStrong },
                  pressed && styles.pressed,
                ]}>
                <SymbolView name={ICONS.plus} size={14} tintColor={colors.ink2} />
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.sheetActions}>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [
              styles.sheetButton,
              { backgroundColor: colors.surface, borderColor: colors.lineStrong },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.sheetButtonText, { color: colors.ink2 }]}>취소</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onConfirm(clamp(draft))}
            style={({ pressed }) => [
              styles.sheetButton,
              { backgroundColor: colors.action, borderColor: colors.action },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.sheetButtonText, { color: '#FFFFFF' }]}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function formatDateTime(date: Date): string {
  const hours = date.getHours();
  const meridiem = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${meridiem} ${displayHour}:${minutes}`;
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 22,
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
  backButton: {
    width: 48,
    height: 48,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  stepper: {
    flexDirection: 'row',
    marginTop: 10,
  },
  stepCell: {
    flex: 1,
    alignItems: 'center',
  },
  stepNodeRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepTrack: {
    flex: 1,
    height: 2,
  },
  stepNode: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 11,
  },
  stepNumber: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  stepLabel: {
    marginTop: 8,
    fontFamily: appFontFamily,
    fontSize: 11,
  },
  stepLabelCurrent: {
    fontWeight: '700',
  },
  card: {
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  labelRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  labelText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 6,
  },
  aiTagText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  actionTag: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6,
  },
  actionTagText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  chip: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderRadius: 6,
  },
  chipText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
  radioRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioLabel: {
    fontFamily: appFontFamily,
    fontSize: 13,
  },
  centerRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  centerNo: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  centerNoText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  centerCopy: {
    flex: 1,
    gap: 2,
  },
  centerName: {
    fontFamily: appFontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  centerAddress: {
    fontFamily: appFontFamily,
    fontSize: 11,
  },
  centerDistance: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  map: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 10,
  },
  mapBlock: {
    position: 'absolute',
    height: 66,
    borderRadius: 4,
  },
  mapRoadH: {
    position: 'absolute',
    top: '52%',
    right: 0,
    left: 0,
    height: 15,
  },
  mapRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '42%',
    width: 14,
  },
  mapRoadV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '76%',
    width: 10,
  },
  mapHalo: {
    position: 'absolute',
    top: '43%',
    left: '30%',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  mapPin: {
    width: 16,
    height: 16,
    borderWidth: 3,
    borderRadius: 8,
  },
  mapMarker: {
    position: 'absolute',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 5,
  },
  mapMarkerText: {
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  errorCopy: {
    flex: 1,
    gap: 4,
  },
  errorTitle: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  errorBody: {
    fontFamily: appFontFamily,
    fontSize: 12,
    lineHeight: 17,
  },
  fieldError: {
    fontFamily: appFontFamily,
    fontSize: 11,
    lineHeight: 16,
  },
  sheetScrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#0E151299',
  },
  sheet: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    left: 12,
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
  },
  sheetTitle: {
    fontFamily: appFontFamily,
    fontSize: 13,
    fontWeight: '700',
  },
  sheetValue: {
    marginBottom: 4,
    fontFamily: appFontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetRowLabel: {
    fontFamily: appFontFamily,
    fontSize: 12,
  },
  sheetStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetStepButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  sheetPartValue: {
    minWidth: 44,
    fontFamily: appFontFamily,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  sheetButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 11,
  },
  sheetButtonText: {
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
