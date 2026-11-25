import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { IconDotsVertical } from '@/components/navIcons';
import { Divider } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Toggle } from '@/components/ui/Toggle';
import { Txt } from '@/components/ui/Txt';
import { formatLongDate } from '@/lib/format';
import { colors, scoupYellow } from '@/theme/tokens';
import type { IPersona } from '@/types';

// A persona card (the web PersonaCard). Tapping the body opens the detail; the ⋮ opens
// the actions sheet; the STATUS toggle sets this persona as the single primary. "Active"
// = primary, so the card gets an amber border + a floating PRIMARY PERSONA badge. In
// select mode the whole card toggles a checkbox (for bulk delete).
export const PersonaCard = memo(function PersonaCard({
  persona,
  onOpen,
  onActions,
  onSetPrimary,
  selectMode = false,
  selected = false,
  onToggleSelect,
  onLongPress,
}: {
  persona: IPersona;
  onOpen: () => void;
  onActions: () => void;
  onSetPrimary: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onLongPress?: () => void;
}) {
  const active = persona.active;

  // Turning the toggle ON promotes this persona to primary; turning the primary OFF is
  // blocked (you switch primary by activating another), so it's a no-op that snaps back.
  const onToggle = (next: boolean) => {
    if (next && !active) onSetPrimary();
  };

  const borderColor = selected ? colors.ink : active ? scoupYellow : colors.border;

  return (
    <View className="mx-4 my-1.5">
      {active && !selectMode && (
        <View className="absolute -top-2 left-4 z-10">
          <View className="rounded-full px-3 py-0.5" style={{ backgroundColor: '#fdeccb' }}>
            <Txt mono weight="semibold" className="text-[10px] uppercase tracking-wide text-[#9a6413]">
              Primary persona
            </Txt>
          </View>
        </View>
      )}

      <Pressable
        onPress={selectMode ? onToggleSelect : onOpen}
        onLongPress={onLongPress}
        delayLongPress={300}
        className="rounded-card border bg-surface p-4 active:opacity-90"
        style={{ borderColor }}>
        {/* Title + overflow / checkbox */}
        <View className="flex-row items-start" style={{ gap: 8 }}>
          <Txt weight="semibold" numberOfLines={2} className="flex-1 text-[15px] leading-[20px]">
            {persona.title}
          </Txt>
          {selectMode ? (
            <View className="-mt-0.5">
              <Checkbox checked={selected} />
            </View>
          ) : (
            <Pressable onPress={onActions} hitSlop={8} className="-mr-1 -mt-0.5 p-1">
              <IconDotsVertical size={18} color={colors.ink3} />
            </Pressable>
          )}
        </View>

        {persona.dossierNames.length > 0 && (
          <Txt mono weight="medium" numberOfLines={1} className="mt-1.5 text-[10px] uppercase tracking-wide text-ink-3">
            {persona.dossierNames.join(', ')}
          </Txt>
        )}

        <Txt numberOfLines={3} className="mt-2.5 text-[13px] leading-[19px] text-ink-2">
          {persona.coverageFocus}
        </Txt>

        <Txt className="mt-2.5 text-[11px] text-ink-3">
          Last edited <Txt weight="medium" className="text-[11px] text-ink-2">{formatLongDate(persona.updatedAt)}</Txt>
        </Txt>

        <Divider className="my-3" />

        <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
          <View>
            <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide text-ink-3">Status</Txt>
            <Txt
              weight="semibold"
              className="mt-0.5 text-[12px]"
              style={{ color: active ? '#9a6413' : colors.ink2 }}>
              {active ? 'ACTIVE' : 'INACTIVE'}
            </Txt>
          </View>
          <Toggle value={active} onValueChange={onToggle} disabled={selectMode} />
        </View>
      </Pressable>
    </View>
  );
});
