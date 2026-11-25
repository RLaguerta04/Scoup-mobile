import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { type Href, usePathname, useRouter } from 'expo-router';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import {
  IconChartPie,
  IconChartPieFilled,
  IconChevronRight,
  IconFlag,
  IconFlagFilled,
  IconMap2,
  IconSend,
  IconSendFilled,
} from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';

export interface MoreSheetHandle {
  present: () => void;
}

// The "More" overflow as a pop-up sheet (presented from the More tab instead of navigating).
// Lists the web sections that don't get a one-tap bottom tab, in the web's order; tapping one
// dismisses the sheet and opens that section. The row whose destination is the current route
// shows an active state: its *Filled icon on an ink badge, a highlighted row, a bolder label.
const ITEMS = [
  { label: 'Map', href: '/map', Icon: IconMap2, IconActive: IconMap2, hint: 'Local map of posts by place' },
  { label: 'Reports', href: '/reports', Icon: IconChartPie, IconActive: IconChartPieFilled, hint: 'Report modules per bucket' },
  { label: 'Campaigns', href: '/campaigns', Icon: IconFlag, IconActive: IconFlagFilled, hint: 'Evaluations and backgrounds' },
  { label: 'Recipient groups', href: '/recipient-groups', Icon: IconSend, IconActive: IconSendFilled, hint: 'Who each brief is sent to' },
] as const;

export const MoreSheet = forwardRef<MoreSheetHandle>((_, ref) => {
  const router = useRouter();
  const pathname = usePathname();
  const sheet = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => ({ present: () => sheet.current?.present() }), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.3} />
    ),
    [],
  );

  const open = (href: string) => {
    sheet.current?.dismiss();
    // navigate (not push) — these are tab screens, so this switches tabs and keeps the
    // bottom bar without stacking a screen (which would show a back button).
    router.navigate(href as Href);
  };

  return (
    <BottomSheetModal
      ref={sheet}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}>
      <BottomSheetView style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 }}>
        <Txt weight="extrabold" className="text-[18px]" style={{ marginBottom: 14, paddingHorizontal: 8 }}>
          More
        </Txt>
        <View>
          {ITEMS.map((it) => {
            const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
            const Glyph = active ? it.IconActive : it.Icon;
            return (
              <Pressable
                key={it.href}
                onPress={() => open(it.href)}
                className={`flex-row items-center rounded-2xl active:opacity-60 ${active ? 'bg-surface2' : ''}`}
                style={{ paddingVertical: 14, paddingHorizontal: 8 }}>
                <View
                  className="items-center justify-center rounded-full"
                  style={{ height: 40, width: 40, backgroundColor: active ? colors.ink : colors.surface3 }}>
                  <Glyph size={20} color={active ? '#ffffff' : colors.ink} />
                </View>
                <View className="flex-1" style={{ marginLeft: 14 }}>
                  <Txt weight={active ? 'bold' : 'semibold'} className="text-[16px]">
                    {it.label}
                  </Txt>
                  <Txt className="text-[12.5px] text-ink-3" style={{ marginTop: 2 }}>
                    {it.hint}
                  </Txt>
                </View>
                <IconChevronRight size={18} color={active ? colors.ink : colors.ink3} />
              </Pressable>
            );
          })}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
MoreSheet.displayName = 'MoreSheet';
