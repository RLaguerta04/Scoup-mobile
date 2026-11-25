import { useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Txt } from '@/components/ui/Txt';
import { Skeleton } from '@/components/ui/feedback';
import { MapCanvas } from '@/features/map/MapCanvas';
import { PlaceSheet } from '@/features/map/PlaceSheet';
import { useLocalMap, usePlaceDetail } from '@/services/api/queries';
import { useSelectionStore } from '@/stores/selectionStore';
import { colors } from '@/theme/tokens';

// The newsletter's Local map — the Map sub-view of the Newsletters tab. A choropleth of
// the selected newsletter's placed posts; tapping a city opens its place sheet.
export function LocalMapView() {
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const { data: map } = useLocalMap(newsletterId);
  const [city, setCity] = useState<string | null>(null);
  const { data: place } = usePlaceDetail(city);

  const sheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%'], []);
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.3} />
    ),
    [],
  );
  const onSelect = useCallback((c: string) => {
    setCity(c);
    sheetRef.current?.present();
  }, []);

  return (
    <View className="flex-1">
      {map ? (
        <MapCanvas areas={map.areas} onSelect={onSelect} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Skeleton className="h-40 w-40" />
        </View>
      )}
      {map ? (
        <View
          className="absolute left-4 top-3 rounded-full border border-border bg-surface px-3 py-1.5"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
          }}>
          <Txt mono className="text-[11px] text-ink-2">
            {map.totalPosts} posts · {map.unplaced} not placed
          </Txt>
        </View>
      ) : null}

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.bg }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}>
        <BottomSheetScrollView>
          {place ? (
            <PlaceSheet place={place} />
          ) : (
            <View className="p-6">
              <Skeleton className="h-40 w-full" />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}
