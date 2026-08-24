import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LostLocationMap } from '@/components/lost-location-map';
import { ICONS } from '@/components/register-ui';
import { appFontFamily, useAppColors } from '@/src/theme/colors';
import type { GeoPoint } from '@/src/types/found-item';
import type { LostTimeBand } from '@/src/types/lost-report';

const TIME_BANDS: { value: LostTimeBand; label: string }[] = [
  { value: null, label: '시간대 전체' },
  { value: 'MORNING', label: '오전 6~11시' },
  { value: 'LUNCH', label: '오전 11시~오후 2시' },
  { value: 'AFTERNOON', label: '오후 2~6시' },
  { value: 'EVENING', label: '오후 6~9시' },
  { value: 'NIGHT', label: '오후 9시 이후' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

type Props = {
  cameraCenter: GeoPoint;
  date: Date | null;
  isLocating: boolean;
  isSearching: boolean;
  pins: GeoPoint[];
  searchQuery: string;
  timeBand: LostTimeBand;
  onBack: () => void;
  onChangeSearchQuery: (value: string) => void;
  onNext: () => void;
  onRemovePin: (index: number) => void;
  onSearch: () => void;
  onSelectDate: (date: Date) => void;
  onSelectTimeBand: (timeBand: LostTimeBand) => void;
  onTapMap: (point: GeoPoint) => void;
  onUseCurrentLocation: () => void;
};

function formatDate(date: Date | null): string {
  return date ? `${date.getMonth() + 1}월 ${date.getDate()}일` : '날짜 선택';
}

function isSameDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function LostDateCalendar({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const colors = useAppColors();
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(value.getFullYear(), value.getMonth(), 1),
  );

  useEffect(() => {
    setVisibleMonth(new Date(value.getFullYear(), value.getMonth(), 1));
  }, [value]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const leadingBlankCount = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: leadingBlankCount }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
  ];
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  return (
    <View style={styles.calendar}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onChange(today)}
        style={[styles.todayButton, { borderColor: colors.lineStrong }]}>
        <Text style={[styles.todayButtonText, { color: colors.actionText }]}>오늘</Text>
      </Pressable>

      <View style={styles.calendarHeader}>
        <Pressable
          accessibilityLabel="이전 달"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setVisibleMonth(new Date(year, month - 1, 1))}
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}>
          <SymbolView name={ICONS.back} size={18} tintColor={colors.ink2} />
        </Pressable>
        <Text style={[styles.calendarTitle, { color: colors.ink }]}>
          {year}년 {month + 1}월
        </Text>
        <Pressable
          accessibilityLabel="다음 달"
          accessibilityRole="button"
          disabled={isCurrentMonth}
          hitSlop={8}
          onPress={() => setVisibleMonth(new Date(year, month + 1, 1))}
          style={({ pressed }) => [
            styles.monthButton,
            styles.nextMonthButton,
            isCurrentMonth && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <SymbolView name={ICONS.back} size={18} tintColor={colors.ink2} />
        </Pressable>
      </View>

      <View style={styles.calendarGrid}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={[styles.weekday, { color: colors.muted }]}>
            {weekday}
          </Text>
        ))}
        {calendarCells.map((day, index) => {
          if (day === null) {
            return <View key={`blank-${index}`} style={styles.calendarCell} />;
          }

          const candidate = new Date(year, month, day);
          const selected = isSameDate(candidate, value);
          const disabled = candidate.getTime() > today.getTime();
          return (
            <Pressable
              key={`${year}-${month}-${day}`}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              onPress={() => onChange(candidate)}
              style={[
                styles.calendarCell,
                selected && { backgroundColor: colors.action },
              ]}>
              <Text
                style={[
                  styles.calendarDay,
                  { color: selected ? '#FFFFFF' : colors.ink2 },
                  disabled && styles.disabled,
                ]}>
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function LostReportLocationStep({
  cameraCenter,
  date,
  isLocating,
  isSearching,
  pins,
  searchQuery,
  timeBand,
  onBack,
  onChangeSearchQuery,
  onNext,
  onRemovePin,
  onSearch,
  onSelectDate,
  onSelectTimeBand,
  onTapMap,
  onUseCurrentLocation,
}: Props) {
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(date ?? new Date());
  const timeLabel = TIME_BANDS.find((option) => option.value === timeBand)?.label ?? '시간대 전체';

  useEffect(() => {
    if (dateOpen) {
      setDraftDate(date ?? new Date());
    }
  }, [date, dateOpen]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.page }]}>
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

          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <SymbolView name={ICONS.search} size={20} tintColor={colors.muted} />
            <TextInput
              onChangeText={onChangeSearchQuery}
              onSubmitEditing={onSearch}
              placeholder="지나온 곳을 검색하거나 지도를 탭"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              style={[styles.searchInput, { color: colors.ink }]}
              value={searchQuery}
            />
            {isSearching ? <ActivityIndicator color={colors.action} size="small" /> : null}
          </View>

          <View style={styles.filterRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDateOpen(true)}
              style={({ pressed }) => [styles.filterChip, pressed && styles.pressed]}>
              <SymbolView name={ICONS.clock} size={15} tintColor="#FFFFFF" />
              <Text style={styles.filterText}>{formatDate(date)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTimeOpen(true)}
              style={({ pressed }) => [styles.filterChip, pressed && styles.pressed]}>
              <Text style={styles.filterText}>{timeLabel}</Text>
              <SymbolView name={ICONS.chevronDown} size={15} tintColor="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={[styles.dateHint, { color: colors.heroSub }]}>날짜와 시간을 선택해주세요</Text>
        </LinearGradient>

        <View style={[styles.mapCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <LostLocationMap center={cameraCenter} onTap={onTapMap} pins={pins} />
          <Pressable
            accessibilityLabel="현재 위치"
            accessibilityRole="button"
            disabled={isLocating}
            onPress={onUseCurrentLocation}
            style={({ pressed }) => [
              styles.locateButton,
              { backgroundColor: colors.surface, borderColor: colors.line },
              pressed && styles.pressed,
            ]}>
            {isLocating ? (
              <ActivityIndicator color={colors.action} size="small" />
            ) : (
              <SymbolView name={ICONS.locate} size={20} tintColor={colors.action} />
            )}
          </Pressable>
        </View>

        {pins.length > 0 ? (
          <View style={[styles.pinCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {pins.map((pin, index) => (
              <View
                key={`${pin.latitude}-${pin.longitude}-${index}`}
                style={[styles.pinRow, index > 0 && { borderTopColor: colors.line, borderTopWidth: 1 }]}>
                <View style={[styles.pinNumber, { backgroundColor: colors.action }]}>
                  <Text style={styles.pinNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.pinLabel, { color: colors.ink }]}>핀 {index + 1}</Text>
                <Pressable
                  accessibilityLabel={`핀 ${index + 1} 삭제`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onRemovePin(index)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <SymbolView name={ICONS.close} size={18} tintColor={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !date || pins.length === 0 }}
          disabled={!date || pins.length === 0}
          onPress={onNext}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.action },
            (!date || pins.length === 0) && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.primaryButtonText}>이 경로에서 분실물 찾기</Text>
        </Pressable>
      </ScrollView>

      <Modal animationType="fade" onRequestClose={() => setDateOpen(false)} transparent visible={dateOpen}>
        <Pressable onPress={() => setDateOpen(false)} style={styles.scrim} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={[styles.sheetTitle, { color: colors.ink }]}>분실 날짜</Text>
          <LostDateCalendar onChange={setDraftDate} value={draftDate} />
          <View style={styles.sheetActions}>
            <Pressable
              onPress={() => setDateOpen(false)}
              style={[styles.sheetButton, { borderColor: colors.lineStrong }]}>
              <Text style={[styles.sheetButtonText, { color: colors.ink2 }]}>취소</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSelectDate(draftDate);
                setDateOpen(false);
              }}
              style={[styles.sheetButton, { backgroundColor: colors.action, borderColor: colors.action }]}>
              <Text style={[styles.sheetButtonText, { color: '#FFFFFF' }]}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setTimeOpen(false)} transparent visible={timeOpen}>
        <Pressable onPress={() => setTimeOpen(false)} style={styles.scrim} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {TIME_BANDS.map((option) => (
            <Pressable
              key={option.value ?? 'ALL'}
              accessibilityRole="radio"
              accessibilityState={{ checked: option.value === timeBand }}
              onPress={() => {
                onSelectTimeBand(option.value);
                setTimeOpen(false);
              }}
              style={[
                styles.timeOption,
                option.value === timeBand && { backgroundColor: colors.pine100 },
              ]}>
              <Text style={[styles.timeOptionText, { color: colors.ink }]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 16 },
  hero: {
    height: 230,
    overflow: 'hidden',
    paddingHorizontal: 16,
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
  backButton: {
    width: 44,
    height: 40,
    marginLeft: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingHorizontal: 15,
    borderRadius: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: appFontFamily,
    fontSize: 14,
  },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  filterChip: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF42',
    borderRadius: 17,
    backgroundColor: '#FFFFFF1F',
  },
  filterText: { color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 12, fontWeight: '700' },
  dateHint: { marginTop: 8, fontFamily: appFontFamily, fontSize: 11 },
  mapCard: {
    marginHorizontal: 16,
    padding: 0,
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: '#14403B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  locateButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 21,
  },
  pinCard: { marginHorizontal: 16, paddingHorizontal: 14, borderWidth: 1, borderRadius: 16 },
  pinRow: { height: 54, flexDirection: 'row', alignItems: 'center', gap: 11 },
  pinNumber: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  pinNumberText: { color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 11, fontWeight: '800' },
  pinLabel: { flex: 1, fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  primaryButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderRadius: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontFamily: appFontFamily, fontSize: 15, fontWeight: '800' },
  scrim: {
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
    borderRadius: 18,
  },
  sheetTitle: { fontFamily: appFontFamily, fontSize: 16, fontWeight: '800' },
  calendar: { gap: 10 },
  todayButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 18,
  },
  todayButtonText: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  calendarHeader: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: { fontFamily: appFontFamily, fontSize: 15, fontWeight: '800' },
  monthButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  nextMonthButton: { transform: [{ rotate: '180deg' }] },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: `${100 / 7}%`,
    height: 30,
    textAlign: 'center',
    fontFamily: appFontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  calendarDay: { fontFamily: appFontFamily, fontSize: 13, fontWeight: '700' },
  sheetActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  sheetButton: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 11 },
  sheetButtonText: { fontFamily: appFontFamily, fontSize: 14, fontWeight: '700' },
  timeOption: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10 },
  timeOptionText: { fontFamily: appFontFamily, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
});
