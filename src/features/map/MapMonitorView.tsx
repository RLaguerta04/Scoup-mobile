import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { List as ListIcon, Map as MapIcon } from 'lucide-react-native';
import BottomSheet, {
  BottomSheetScrollView,
  type BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { floatingTabBarClearance } from '@/components/FloatingTabBar';
import { Txt } from '@/components/ui/Txt';
import { Skeleton } from '@/components/ui/feedback';
import { DashboardMap } from '@/features/map/DashboardMap';
import { MapPlacePanels } from '@/features/map/MapPlacePanels';
import { useGeoMap, useMapPlaceDetail } from '@/services/api/queries';
import { useSelectionStore } from '@/stores/selectionStore';
import { colors } from '@/theme/tokens';

const SHEET_RADIUS = 16;

// Animated sheet background: the top corners interpolate from rounded (at the 55% peek,
// index 0) to flat (full-screen, index 1) as the sheet drags — a smooth radius change instead
// of snapping from rounded to flat at the top snap.
function SheetBackground({ style, animatedIndex }: BottomSheetBackgroundProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const radius = interpolate(animatedIndex.value, [0, 1], [SHEET_RADIUS, 0], Extrapolation.CLAMP);
    return { borderTopLeftRadius: radius, borderTopRightRadius: radius };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { backgroundColor: colors.bg }, animatedStyle]}
    />
  );
}

// The newsletter's Local map — the Map sub-view of the Newsletters tab. Mirrors the web's
// "Local" view inside the Dashboard's layout: a post-count map up top, with the selected
// city's panels (Sentiment · Most posts · Facebook pages · Top posts) in a draggable bottom
// sheet over it. Opens on the busiest city; tapping another re-scopes every panel to it.
export function MapMonitorView() {
  const insets = useSafeAreaInsets();
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const geo = useGeoMap(newsletterId);

  // Default to the busiest city (like the web) until the user taps another one.
  const busiest = useMemo(() => {
    const areas = geo.data?.areas ?? [];
    if (areas.length === 0) return null;
    return areas.reduce((a, b) => (b.posts > a.posts ? b : a), areas[0]);
  }, [geo.data]);

  const [picked, setPicked] = useState<{ code: string; name: string } | null>(null);
  const selectedCode = picked?.code ?? busiest?.code ?? null;

  const detail = useMapPlaceDetail(newsletterId, selectedCode);
  const onSelectPlace = useCallback((code: string, name: string) => setPicked({ code, name }), []);

  const sheetRef = useRef<BottomSheet>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const snapPoints = useMemo(() => ['55%', '100%'], []);
  const onMap = sheetIndex < 1;
  const toggleSheet = () => sheetRef.current?.snapToIndex(onMap ? 1 : 0);

  // DashboardMap speaks IStoryMapArea (`stories`); map posts onto it.
  const areas = useMemo(
    () =>
      (geo.data?.areas ?? []).map((a) => ({
        code: a.code,
        name: a.name,
        short: a.short,
        region: a.region,
        stories: a.posts,
      })),
    [geo.data],
  );

  return (
    <View className="flex-1">
      <DashboardMap
        counts={geo.data?.counts ?? {}}
        areas={areas}
        total={geo.data?.total ?? 0}
        placeCount={geo.data?.placeCount ?? 0}
        unplaced={geo.data?.unplaced ?? 0}
        selectedCode={selectedCode}
        onSelectPlace={onSelectPlace}
      />

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        onChange={setSheetIndex}
        backgroundComponent={SheetBackground}
        handleIndicatorStyle={{ backgroundColor: colors.border }}>
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          {detail.data ? (
            <MapPlacePanels detail={detail.data} />
          ) : (
            <View className="gap-3 p-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Floating Map / Details toggle (Airbnb-style, like the Dashboard). Sits just above the
          floating nav bar so the bar doesn't cover it — tracks the device's safe-area inset. */}
      <Pressable
        onPress={toggleSheet}
        className="absolute flex-row items-center self-center rounded-full bg-ink px-5 py-3"
        style={{
          bottom: floatingTabBarClearance(insets.bottom) + 14,
          zIndex: 20,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
        }}>
        {onMap ? <ListIcon size={16} color="#ffffff" /> : <MapIcon size={16} color="#ffffff" />}
        <Txt weight="semibold" className="ml-2 text-[13px] text-white">
          {onMap ? 'Details' : 'Map'}
        </Txt>
      </Pressable>
    </View>
  );
}
