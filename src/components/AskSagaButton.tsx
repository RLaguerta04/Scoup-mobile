import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconMessage2Filled } from '@/components/navIcons';
import { floatingTabBarClearance } from '@/components/FloatingTabBar';
import { useFabPosition } from '@/stores/fabPositionStore';
import { colors } from '@/theme/tokens';
import type { SagaView } from '@/features/chat/sagaChat';

const SIZE = 48;
const HALO = 12; // outer aura ring: extends HALO/2 (6px) beyond the button on all sides
const MARGIN = 16;
const TOP_MARGIN = 80; // keep clear of the header + sub-nav tabs

// The floating "Ask Scoup" chat button — draggable. Tap opens the contextual chat; drag it
// anywhere and it springs to the nearest side edge, keeping its height. The spot is
// remembered (fabPositionStore) so it survives sub-view switches.
//
// Vertical position is BOTTOM-anchored (`bottom: 0` + a translateY lift), tracking the same
// `floatingTabBarClearance` metric as the "This period" pill. Top-anchoring via
// `height - insets.top` drifts on native (the container height doesn't match), which parked
// the button too high and capped how far down it could go — bottom-anchoring fixes both.
export function AskSagaButton({ view }: { view: SagaView }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { side, bottom, setPosition } = useFabPosition();

  const leftX = MARGIN;
  const rightX = width - SIZE - MARGIN;
  const clearance = floatingTabBarClearance(insets.bottom);

  // `bo` = the button's bottom-edge distance from the screen bottom.
  // Default centres the button on the "This period" pill: the pill sits at clearance + 14 and
  // is ~40px tall (centre ≈ clearance + 34), so the button's bottom = that centre − SIZE/2.
  const defaultBottom = clearance + 34 - SIZE / 2;
  // Let it travel from just above/into the tab-bar zone up to near the header.
  const minBottom = Math.max(insets.bottom + 8, clearance - 44);
  const maxBottom = Math.max(defaultBottom, height - insets.top - SIZE - TOP_MARGIN);

  const startX = side === 'left' ? leftX : rightX;
  const startBottom =
    bottom < 0 ? defaultBottom : Math.min(Math.max(bottom, minBottom), maxBottom);

  const tx = useSharedValue(startX);
  const bo = useSharedValue(startBottom);
  const ox = useSharedValue(startX);
  const ob = useSharedValue(startBottom);

  const open = () => router.push({ pathname: '/newsletter-chat', params: { view } });
  const persist = (s: 'left' | 'right', b: number) => setPosition(s, b);

  const pan = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      ox.value = tx.value;
      ob.value = bo.value;
    })
    .onUpdate((e) => {
      tx.value = Math.min(Math.max(ox.value + e.translationX, MARGIN), rightX);
      // Finger down (positive translationY) lowers the button → smaller bottom offset.
      bo.value = Math.min(Math.max(ob.value - e.translationY, minBottom), maxBottom);
    })
    .onEnd(() => {
      const toLeft = tx.value + SIZE / 2 < width / 2;
      const snapX = toLeft ? leftX : rightX;
      tx.value = withSpring(snapX, { damping: 18, stiffness: 180 });
      runOnJS(persist)(toLeft ? 'left' : 'right', bo.value);
    });

  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd(() => runOnJS(open)());

  const gesture = Gesture.Exclusive(pan, tap);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: -bo.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityLabel="Ask Scoup"
        accessibilityRole="button"
        style={[
          {
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: SIZE,
            height: SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}>
        {/* Outer aura ring — a faded tint of the button's own ink background that sits behind
            it and overflows on all sides, so the dark button glows in its own colour. */}
        <View
          style={{
            position: 'absolute',
            width: SIZE + HALO,
            height: SIZE + HALO,
            borderRadius: (SIZE + HALO) / 2,
            backgroundColor: 'rgba(18,18,18,0.14)',
          }}
        />
        {/* The button itself */}
        <View
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.ink,
            shadowColor: '#000',
            shadowOpacity: 0.22,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}>
          <IconMessage2Filled size={26} color="#ffffff" />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
