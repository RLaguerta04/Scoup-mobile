import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Txt } from '@/components/ui/Txt';
import { IconCopy, IconPencil, IconTrash } from '@/components/navIcons';
import { colors } from '@/theme/tokens';
import type { IKeywordGroupSummary } from '@/types';

// Same three palettes as the editor (web KEYWORD_BADGE_COLORS).
const TONES = {
  main: { bg: '#eff6ff', text: '#001799' },
  additional: { bg: '#ebffee', text: '#009951' },
  excluded: { bg: '#fee9e7', text: '#c00f0c' },
} as const;
const MAX_CHIPS = 4;

function KeywordRow({ label, tone, keywords }: { label: string; tone: keyof typeof TONES; keywords: string[] }) {
  if (keywords.length === 0) return null;
  const palette = TONES[tone];
  const shown = keywords.slice(0, MAX_CHIPS);
  const extra = keywords.length - shown.length;
  return (
    <View style={{ gap: 6 }}>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <View className="size-2 rounded-full" style={{ backgroundColor: palette.text }} />
        <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide text-ink-3">
          {label}
        </Txt>
      </View>
      <View className="flex-row flex-wrap" style={{ gap: 6 }}>
        {shown.map((k) => (
          <View key={k} className="rounded-md px-2 py-0.5" style={{ backgroundColor: palette.bg }}>
            <Txt mono weight="medium" className="text-[11px]" style={{ color: palette.text }}>
              &quot;{k}&quot;
            </Txt>
          </View>
        ))}
        {extra > 0 && (
          <View className="rounded-md border border-border px-2 py-0.5">
            <Txt weight="medium" className="text-[11px] text-ink-3">
              +{extra} more
            </Txt>
          </View>
        )}
      </View>
    </View>
  );
}

function IconBtn({
  icon: Icon,
  onPress,
  label,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className="h-8 w-8 items-center justify-center rounded-full active:bg-surface2">
      <Icon size={16} color={danger ? '#c0492f' : colors.ink3} />
    </Pressable>
  );
}

// A keyword-group card (web: BucketCard/KeywordsCard). Tap the body → editor; the top-right
// actions edit / duplicate / delete the group. In select mode the body toggles the checkbox.
export function KeywordGroupCard({
  group,
  selectMode,
  selected,
  onToggleSelect,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  group: IKeywordGroupSummary;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="mb-2.5">
      <View className="flex-row items-start" style={{ gap: 10 }}>
        {selectMode && (
          <View className="pt-0.5">
            <Checkbox checked={selected} />
          </View>
        )}
        <Pressable
          onPress={selectMode ? onToggleSelect : onOpen}
          accessibilityRole="button"
          accessibilityLabel={selectMode ? `Select ${group.name}` : `Edit ${group.name}`}
          className="min-w-0 flex-1 active:opacity-80">
          <Txt weight="bold" className="text-[15px]" numberOfLines={1}>
            {group.name}
          </Txt>
          <Txt numberOfLines={2} className="mt-1 text-[12px] leading-[17px] text-ink-3">
            {group.summary || 'Keywords summary will be generated automatically'}
          </Txt>
          <View className="mt-3" style={{ gap: 10 }}>
            <KeywordRow label="Main keywords" tone="main" keywords={group.mainKeywords} />
            <KeywordRow label="Additional keywords" tone="additional" keywords={group.additionalKeywords} />
            <KeywordRow label="Excluded keywords" tone="excluded" keywords={group.excludedKeywords} />
          </View>
        </Pressable>
        {!selectMode && (
          <View className="flex-row" style={{ gap: 2 }}>
            <IconBtn icon={IconPencil} onPress={onEdit} label={`Edit ${group.name}`} />
            <IconBtn icon={IconCopy} onPress={onDuplicate} label={`Duplicate ${group.name}`} />
            <IconBtn icon={IconTrash} onPress={onDelete} label={`Delete ${group.name}`} danger />
          </View>
        )}
      </View>
    </Card>
  );
}
