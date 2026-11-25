import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { IconCalendar, IconChevronDown } from '@/components/navIcons';
import { ProfileAvatarButton } from '@/components/ProfileAvatarButton';
import { Txt } from '@/components/ui/Txt';
import { DatePickerSheet } from '@/components/sheets/DatePickerSheet';
import { NewsletterSheet } from '@/components/sheets/NewsletterSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { useNewsletters } from '@/services/api/queries';
import { usePeriodStore } from '@/stores/periodStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { rangeLabel } from '@/lib/dateRange';
import { colors } from '@/theme/tokens';

// Compact command-center header, shared by every tab: newsletter dropdown (left),
// reporting-period date pill + account avatar (right). The active section is named
// by the bottom tab, so no title here.
export function AppHeader() {
  const newsletterRef = useRef<SheetHandle>(null);
  const dateRef = useRef<SheetHandle>(null);

  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const bucketId = useSelectionStore((s) => s.bucketId);
  const { data: newsletters = [] } = useNewsletters();
  const current = newsletters.find((n) => n.id === newsletterId);
  const bucket = current?.buckets.find((b) => b.id === bucketId);

  const from = usePeriodStore((s) => s.from);
  const to = usePeriodStore((s) => s.to);

  return (
    <View className="flex-row items-center justify-between bg-bg px-4 pb-2 pt-1">
      <Pressable
        onPress={() => newsletterRef.current?.present()}
        className="mr-2 flex-shrink flex-row items-center rounded-full border border-border bg-surface px-3 py-2"
        style={{ maxWidth: '54%' }}>
        <Txt weight="semibold" className="text-[14px]" numberOfLines={1}>
          {current?.name ?? 'Newsletter'}
          {bucket ? <Txt weight="medium" className="text-ink-3"> › {bucket.name}</Txt> : null}
        </Txt>
        <IconChevronDown size={16} color={colors.ink3} style={{ marginLeft: 4 }} />
      </Pressable>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => dateRef.current?.present()}
          className="flex-row items-center rounded-full border border-border bg-surface px-3 py-2">
          <IconCalendar size={15} color={colors.ink2} />
          <Txt mono weight="medium" className="ml-1.5 text-[12px] text-ink">
            {rangeLabel({ from, to })}
          </Txt>
        </Pressable>
        <ProfileAvatarButton />
      </View>

      <NewsletterSheet ref={newsletterRef} />
      <DatePickerSheet ref={dateRef} />
    </View>
  );
}
