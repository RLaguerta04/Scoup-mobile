import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  IconChartPie,
  IconCreditCard,
  IconLogout,
  IconRocket,
  IconSettings,
} from '@/components/navIcons';
import { Label, Txt } from '@/components/ui/Txt';
import { UsagePanel } from '@/features/account/UsagePanel';
import { USE_MOCKS } from '@/lib/config';
import { CURRENT_USER } from '@/lib/user';
import { colors, tone } from '@/theme/tokens';
import { renderBackdrop, sheetSurface, type SheetHandle } from './sheet';

// The account menu items, mirroring the web's UserAccountDropdown.
const ROWS: { label: string; Icon: typeof IconChartPie; href: Href }[] = [
  { label: 'Usage and plan', Icon: IconChartPie, href: '/usage' },
  { label: 'Account Info', Icon: IconSettings, href: '/account-info' },
  { label: 'Subscription', Icon: IconCreditCard, href: '/subscription' },
  { label: 'Release notes', Icon: IconRocket, href: '/release-notes' },
];

export const AccountSheet = forwardRef<SheetHandle>((_, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  useImperativeHandle(ref, () => ({ present: () => sheet.current?.present() }));
  const snapPoints = useMemo(() => ['90%'], []);
  const close = () => sheet.current?.dismiss();
  const go = (href: Href) => {
    close();
    router.push(href);
  };

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Identity */}
        <View className="flex-row items-center pt-1">
          <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: colors.ink }}>
            <Txt weight="bold" className="text-[15px] text-white">
              {CURRENT_USER.initials}
            </Txt>
          </View>
          <View className="ml-3">
            <Txt weight="bold" className="text-[16px]">
              {CURRENT_USER.name}
            </Txt>
            <Txt className="text-[12px] text-ink-3">{CURRENT_USER.email}</Txt>
          </View>
        </View>

        {/* Usage */}
        <View className="mt-5">
          <UsagePanel onViewFull={() => go('/usage')} />
        </View>

        <View className="my-4 h-px bg-border" />

        {/* Menu */}
        <View className="gap-1.5">
          {ROWS.map((r) => (
            <Pressable
              key={r.label}
              onPress={() => go(r.href)}
              className="flex-row items-center rounded-xl bg-surface2 px-3 py-3 active:opacity-80">
              <r.Icon size={20} color={colors.ink2} />
              <Txt weight="medium" className="ml-3 text-[14px]">
                {r.label}
              </Txt>
            </Pressable>
          ))}
        </View>

        {/* Data source (mobile-only mock indicator) */}
        <View className="mt-4 rounded-xl border border-border px-3 py-3">
          <Label>Data source</Label>
          <Txt weight="semibold" className="mt-1 text-[13px]">
            {USE_MOCKS ? 'Sample data (mock)' : 'Live API'}
          </Txt>
        </View>

        {/* Logout */}
        <Pressable onPress={close} className="mt-4 flex-row items-center rounded-xl px-3 py-3 active:opacity-80">
          <IconLogout size={20} color={tone.negative} />
          <Txt weight="semibold" className="ml-3 text-[14px]" style={{ color: tone.negative }}>
            Logout
          </Txt>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

AccountSheet.displayName = 'AccountSheet';
