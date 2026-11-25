import { useRef, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { AccountSheet } from '@/components/sheets/AccountSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { CURRENT_USER } from '@/lib/user';
import { colors } from '@/theme/tokens';

// Header for the global section tabs (Reports / Campaigns / Recipient groups). These live in
// the tab navigator — reached from the More sheet with the bottom bar kept — so they never get
// a back button: just the title and the account avatar. An optional `action` (e.g. an
// icon-only add button) sits just left of the avatar.
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const accountRef = useRef<SheetHandle>(null);
  return (
    <View className="flex-row items-center justify-between bg-bg px-4 pb-2 pt-1">
      <View className="flex-1 flex-row items-center">
        <Txt variant="title">{title}</Txt>
      </View>
      <View className="flex-row items-center gap-2">
        {action}
        <Pressable
          onPress={() => accountRef.current?.present()}
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.ink }}>
          <Txt weight="bold" className="text-[12px] text-white">
            {CURRENT_USER.initials}
          </Txt>
        </Pressable>
      </View>
      <AccountSheet ref={accountRef} />
    </View>
  );
}
