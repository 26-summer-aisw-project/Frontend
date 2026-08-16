/**
 * 로그인 후 하단 탭.
 *
 * 탭은 "목적지"만 담는다. 습득물 등록처럼 여러 단계로 이어지는 작업은 탭 안에서
 * Stack으로 이어붙이고, 탭 자체를 액션 버튼처럼 쓰지 않는다.
 *
 * 아이콘은 `expo-symbols`의 `SymbolView`를 쓴다. iOS에서는 SF Symbols,
 * Android에서는 Material Symbols로 각각 매핑되므로 컨트롤은 OS 규범을 따르고
 * 브랜드는 색으로만 표현한다는 원칙(`.claude/PRODUCT.md`)과 맞는다.
 *
 * 홈 화면 파일명은 `index.tsx`가 아니라 `home.tsx`다. `(tabs)`는 경로 세그먼트를
 * 만들지 않아서 `app/index.tsx`와 `app/(tabs)/index.tsx`가 둘 다 `/`로 충돌한다.
 */
import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

const ACTIVE = '#1C5B54';
const INACTIVE = '#899490';

type TabDef = {
  name: string;
  title: string;
  symbol: SymbolViewProps['name'];
};

const TABS: TabDef[] = [
  { name: 'home', title: '홈', symbol: { ios: 'house', android: 'home', web: 'home' } },
  {
    name: 'register',
    title: '습득물 등록',
    symbol: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' },
  },
  {
    name: 'report',
    title: '분실 신고',
    symbol: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  },
  {
    name: 'mypage',
    title: '마이페이지',
    symbol: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
      }}>
      {TABS.map(({ name, title, symbol }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => <SymbolView name={symbol} tintColor={color} size={26} />,
          }}
        />
      ))}
    </Tabs>
  );
}
