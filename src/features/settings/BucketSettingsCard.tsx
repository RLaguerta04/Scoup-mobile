import { Pressable, View } from 'react-native';
import { Card, Divider } from '@/components/ui/Card';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { IconChevronRight, IconCopy, IconPencil, IconTrash } from '@/components/navIcons';
import { colors } from '@/theme/tokens';
import type { IBucketSettings } from '@/types';

const MAX_CHIPS = 4;

function IconBtn({
  icon: Icon,
  onPress,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      className="h-8 w-8 items-center justify-center rounded-full active:bg-surface2">
      <Icon size={16} color={danger ? '#c0492f' : colors.ink3} />
    </Pressable>
  );
}

// The per-bucket "Products" card. Tapping the body pushes the bucket detail; the
// row of icon buttons at the bottom handles edit / duplicate / delete inline, and
// MANAGE opens the source-intake sheet. (Nested Pressables are fine on RN — the
// inner one wins the responder, so the icon taps don't trigger the card push.)
export function BucketSettingsCard({
  bucket,
  onOpen,
  onManageSources,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  bucket: IBucketSettings;
  onOpen: () => void;
  onManageSources: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const chips = bucket.keywordGroups.slice(0, MAX_CHIPS);
  const extra = bucket.keywordGroups.length - chips.length;
  const intakeLabel = bucket.sourceRestrict
    ? `Whitelisted · ${bucket.sourceCount} ${bucket.sourceCount === 1 ? 'source' : 'sources'}`
    : 'All sources';

  return (
    <Card className="mb-2.5">
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${bucket.name}`}
        className="active:opacity-70">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Txt weight="bold" className="flex-1 text-[16px]" numberOfLines={1}>{bucket.name}</Txt>
          <IconChevronRight size={18} color={colors.ink3} />
        </View>

        {bucket.description ? (
          <Txt numberOfLines={3} className="mt-1.5 text-[13px] leading-[19px] text-ink-3">
            {bucket.description}
          </Txt>
        ) : null}

        {chips.length > 0 && (
          <View className="mt-2.5 flex-row flex-wrap items-center" style={{ gap: 6 }}>
            {chips.map((g) => (
              <Pill key={g.id} label={g.name} tone="brand" />
            ))}
            {extra > 0 && <Txt weight="medium" className="text-[11px] text-ink-3">+{extra} more</Txt>}
          </View>
        )}
      </Pressable>

      <View className="mt-3.5 rounded-xl bg-surface2 p-3">
        <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
          <View className="flex-1">
            <Txt weight="semibold" className="text-[12px] text-ink-2">Source intake · {intakeLabel}</Txt>
            <Txt className="mt-0.5 text-[12px] text-ink-3">
              {bucket.sourceRestrict
                ? 'Only whitelisted sources feed this bucket.'
                : 'Every source in your garden feeds this bucket.'}
            </Txt>
          </View>
          <Pressable
            onPress={onManageSources}
            accessibilityRole="button"
            accessibilityLabel="Manage source intake"
            hitSlop={6}
            className="rounded-full border border-border bg-surface px-3 py-1.5 active:bg-surface2">
            <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide text-ink-2">Manage</Txt>
          </Pressable>
        </View>
      </View>

      <Divider className="mt-3.5" />
      <View className="mt-2.5 flex-row items-center" style={{ gap: 8 }}>
        <Txt className="flex-1 text-[11px] text-ink-3" numberOfLines={1}>
          {bucket.keywordGroups.length} {bucket.keywordGroups.length === 1 ? 'keyword group' : 'keyword groups'} · Created {bucket.createdAt}
        </Txt>
        <IconBtn icon={IconPencil} onPress={onEdit} />
        <IconBtn icon={IconCopy} onPress={onDuplicate} />
        <IconBtn icon={IconTrash} onPress={onDelete} danger />
      </View>
    </Card>
  );
}
