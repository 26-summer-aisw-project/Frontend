import { ScreenPlaceholder } from '@/components/screen-placeholder';

/**
 * 분실 신고.
 *
 * 백엔드에 분실 신고 API가 없다 (`lostreport` 패키지 자체가 없음). 화면을 먼저 만들면
 * 목업으로만 남으므로 Phase 3까지는 "준비 중"으로 정직하게 드러낸다.
 */
export default function ReportScreen() {
  return (
    <ScreenPlaceholder
      name="분실 신고"
      badge="준비 중"
      note={'백엔드에 분실 신고 API가 아직 없습니다.\n구현되면 이 화면부터 연결합니다.'}
    />
  );
}
