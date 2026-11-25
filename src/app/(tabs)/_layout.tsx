import { useRef } from 'react';
import { Tabs } from 'expo-router';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { MoreSheet, type MoreSheetHandle } from '@/components/MoreSheet';
import {
  IconArticle,
  IconArticleFilled,
  IconDeviceTv,
  IconDeviceTvFilled,
  IconMail,
  IconMailFilled,
  IconMenu2,
  IconMenu2Filled,
  IconUser,
  IconUserFilled,
} from '@/components/navIcons';

// The bottom tabs follow the web's global top-nav order: Newsletters, Publishers, Channels,
// Personas — then More for the rest (Map, Reports, Campaigns, Recipient groups), which open as
// hidden tab screens. The per-newsletter views (Daily feed / Dashboard / Decision report /
// Settings) are sub-tabs inside Newsletters.
//
// Active state uses Tabler's dedicated *Filled glyph (inactive = the outline, lighter stroke),
// so the current tab reads as a solid shape — clearer than a stroke-weight bump, and the
// purpose-built filled icons don't collapse into a black block the way a `fill`-ed outline does.
export default function TabsLayout() {
  const moreRef = useRef<MoreSheetHandle>(null);
  return (
    <>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        // The bar floats (absolute) and overlays content — tell the navigator not to reserve
        // space for it, so content scrolls behind the frosted glass.
        screenOptions={{ headerShown: false, tabBarStyle: { position: 'absolute' } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Newsletters',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconMailFilled color={color} size={24} />
            ) : (
              <IconMail color={color} size={24} strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="publishers"
        options={{
          title: 'Publishers',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconArticleFilled color={color} size={24} />
            ) : (
              <IconArticle color={color} size={24} strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: 'Channels',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconDeviceTvFilled color={color} size={24} />
            ) : (
              <IconDeviceTv color={color} size={24} strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="personas"
        options={{
          title: 'Personas',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconUserFilled color={color} size={24} />
            ) : (
              <IconUser color={color} size={24} strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <IconMenu2Filled color={color} size={24} />
            ) : (
              <IconMenu2 color={color} size={24} strokeWidth={1.8} />
            ),
        }}
        listeners={{
          tabPress: (e) => {
            // Don't navigate to a More screen — pop the overflow sheet instead.
            e.preventDefault();
            moreRef.current?.present();
          },
        }}
      />
      {/* More destinations — live inside the tab navigator so they keep the bottom bar
          (and have no back button), but render no button of their own (opened from More).
          tabBarButton:()=>null hides the button while keeping the route fully navigable
          (href:null would also de-link it from routing). */}
      <Tabs.Screen name="reports" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="campaigns" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="recipient-groups" options={{ tabBarButton: () => null }} />
      <Tabs.Screen name="map" options={{ tabBarButton: () => null }} />
      </Tabs>
      <MoreSheet ref={moreRef} />
    </>
  );
}
