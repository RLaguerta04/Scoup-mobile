import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Txt } from '@/components/ui/Txt';
import { useTabBarStore } from '@/stores/tabBarStore';
import { colors } from '@/theme/tokens';

// The five routes that get a button, in bar order. Everything else in this navigator
// (reports / campaigns / recipient-groups) is a hidden destination reached from the More
// sheet — filtering by name is bulletproof regardless of how Expo Router's vendored tab bar
// surfaces hidden-route options to a custom bar.
const TAB_ROUTES = ['index', 'publishers', 'channels', 'personas', 'more'];

// Bar geometry, exported so bottom-pinned UI (e.g. the feed's "This period" button) can sit
// above the floating bar instead of under it. Since the bar is an absolute overlay, screens
// get no reserved space — anything pinned to the bottom must clear this by hand.
export const FLOATING_TAB_BAR_PILL_HEIGHT = 62;
export const FLOATING_TAB_BAR_MIN_INSET = 12;

// Distance from the screen's bottom edge to the TOP of the floating pill, for a given bottom
// safe-area inset. Add a gap to this to place something just above the bar.
export const floatingTabBarClearance = (insetBottom: number) =>
  Math.max(insetBottom, FLOATING_TAB_BAR_MIN_INSET) + FLOATING_TAB_BAR_PILL_HEIGHT;

// Outer margin: the gap between the floating pill and the screen edges. Matches the body
// content's 16px horizontal padding so the bar's edges line up with the cards/text above it.
const OUTER_MARGIN_X = 16;

// Pill end padding (both sides). PILL_PADDING_X (5) + HILITE_GUTTER (3) = 8 = HILITE_INSET, so
// the first/last highlight is inset the same 8px from the pill as the top/bottom → balanced.
const PILL_PADDING_X = 5;

// The active highlight is an ABSOLUTELY-POSITIONED layer, inset from each tab cell by these
// amounts. Absolute left/right/top/bottom is honored identically on native (Fabric) and web —
// unlike a child View's `width` / `alignSelf:'stretch'` / `%`, which silently fail on Fabric
// and leave the highlight hugging its content. The tab CELLS get an explicit measured pixel
// width (which DOES apply on native); the highlight then fills each 1/5 cell via left/right,
// inset a uniform 8px on all four sides.
const HILITE_INSET = 8; // top/bottom inset from the pill
const HILITE_GUTTER = 3; // left/right inset within the tab cell
const HILITE_RADIUS = (FLOATING_TAB_BAR_PILL_HEIGHT - HILITE_INSET * 2) / 2; // 23; concentric with the pill's rounded ends
const HILITE_H = FLOATING_TAB_BAR_PILL_HEIGHT - HILITE_INSET * 2; // 46; explicit highlight height

// A floating "pill" tab bar: a rounded, mostly-opaque bar inset from the screen edges and
// pinned to the bottom. It is absolutely positioned and OVERLAYS the screen (content scrolls
// behind it), so the fill is a high-opacity translucent white (~0.95) — enough "glass" to feel
// floaty while staying readable. (The old expo-blur + low-opacity wash let article text bleed
// sharply through on device, which is why it's a plain translucent fill now.) The navigator is
// told the bar floats (tabBarStyle.position:'absolute' in (tabs)/_layout), so it doesn't
// reserve space; screens keep their own bottom padding so the last row clears it.
//
// Behavior is delegated back to the navigator: each press emits `tabPress`, so the More tab's
// listener (in (tabs)/_layout) can preventDefault and pop its sheet instead of navigating —
// this bar doesn't need to know about More.
export function FloatingTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  // Each tab CELL needs an explicit pixel width: on native, flex:1 does NOT grow the cells to
  // fill (they stay content-width → the "bunched in the center" bug), and an onLayout measurement
  // doesn't reliably arrive inside this absolute overlay in Expo Go. useWindowDimensions gives the
  // screen width SYNCHRONOUSLY on both platforms (no measurement race, no null first frame), so we
  // size every cell to an exact fifth of the pill's inner width up front.
  const { width } = useWindowDimensions();
  const hidden = useTabBarStore((s) => s.hidden);
  const cellW = (width - (OUTER_MARGIN_X + PILL_PADDING_X) * 2) / TAB_ROUTES.length;
  // Hidden during multi-select so the screen's bottom action bar (Cancel / Delete) is visible.
  if (hidden) return null;
  return (
    // box-none: the transparent inset margins around the pill pass taps + scrolls straight
    // through to the content scrolling behind the floating bar.
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: OUTER_MARGIN_X,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, FLOATING_TAB_BAR_MIN_INSET),
      }}>
      <View
        style={{
          flexDirection: 'row',
          // stretch → each tab cell fills the full pill height, so the highlight's top/bottom
          // inset is measured from the pill edge (not from a shorter content-sized cell).
          alignItems: 'center',
          // Cells get an explicit width (below), so they already fill the row; space-around is a
          // harmless safety that still distributes if the width ever can't be computed.
          justifyContent: 'space-around',
          height: FLOATING_TAB_BAR_PILL_HEIGHT,
          paddingHorizontal: PILL_PADDING_X,
          borderRadius: 32,
          overflow: 'hidden', // clip the active highlight to the rounded pill
          backgroundColor: 'rgba(255,255,255,0.97)', // translucent "glass": a faint see-through, kept high so it stays readable
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          // Soft drop shadow for the floating lift — boxShadow on web, elevation on Android.
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 16,
        }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if (!TAB_ROUTES.includes(route.name)) return null;

          const isFocused = state.index === index;
          const color = isFocused ? colors.ink : colors.ink3;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            // More's listener preventDefaults and pops its sheet; others navigate.
            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          const onLongPress = () => {
            emitter.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            // Cell = explicit measured width (equal fifths on native). Icon + label centered;
            // the rounded highlight below fills the cell via absolute positioning. flex:1 is
            // only the single-frame fallback before the first measurement.
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? String(label)}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => ({
                ...(cellW > 0 ? { width: cellW } : { flex: 1 }),
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}>
              {/* Highlight sized with EXPLICIT px width + height (honored on native Fabric). A
                  two-sided absolute stretch — left+right / top+bottom — does NOT reliably size a
                  nested view on device (it collapsed the highlight to a small circle). This outer
                  view is a fixed-size box, centered in the cell by the Pressable; the inner layer
                  is the rounded background, toggled via OPACITY (not color) so Fabric never
                  re-paints the corner square on a tab change. */}
              <View
                style={{
                  width: cellW - HILITE_GUTTER * 2,
                  height: HILITE_H,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: cellW - HILITE_GUTTER * 2,
                    height: HILITE_H,
                    borderRadius: HILITE_RADIUS,
                    backgroundColor: 'rgba(18,18,18,0.1)',
                    opacity: isFocused ? 1 : 0,
                  }}
                />
                {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
                <Txt
                  numberOfLines={1}
                  weight={isFocused ? 'semibold' : 'medium'}
                  style={{
                    marginTop: 3,
                    fontSize: 9,
                    letterSpacing: -0.2,
                    color,
                  }}>
                  {label}
                </Txt>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
