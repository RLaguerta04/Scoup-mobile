import { useRef } from 'react';
import { Pressable } from 'react-native';
import { AccountSheet } from '@/components/sheets/AccountSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { Txt } from '@/components/ui/Txt';
import { CURRENT_USER } from '@/lib/user';
import { colors } from '@/theme/tokens';

// The account avatar — a fixture of every main tab's header (top-right corner). Tapping it
// opens the AccountSheet (Profile / Account settings / Sign out). Self-contained so any
// screen can drop it in with no wiring.
export function ProfileAvatarButton() {
  const accountRef = useRef<SheetHandle>(null);
  return (
    <>
      <Pressable
        onPress={() => accountRef.current?.present()}
        accessibilityLabel="Account"
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.ink }}>
        <Txt weight="bold" className="text-[12px] text-white">
          {CURRENT_USER.initials}
        </Txt>
      </Pressable>
      <AccountSheet ref={accountRef} />
    </>
  );
}
