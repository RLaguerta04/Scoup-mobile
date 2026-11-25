import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconInfoCircle, IconPencil, IconTrash } from '@/components/navIcons';
import { Card, Divider } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { IRecipientGroup } from '@/types';
import { UsageChip } from './UsageChip';

// How many "Used in" chips show before the "+N more" toggle (the web's
// VISIBLE_USAGE_LIMIT). On a phone the rest expand inline rather than in a popover.
const VISIBLE_USAGE_LIMIT = 3;

// Small ghost icon button for the card's edit / delete affordances.
function IconButton({
  onPress,
  label,
  danger,
  children,
}: {
  onPress: () => void;
  label: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={label}
      className={`h-8 w-8 items-center justify-center rounded-full ${danger ? 'active:bg-[#fef3f2]' : 'active:bg-surface2'}`}>
      {children}
    </Pressable>
  );
}

export function RecipientGroupCard({
  group,
  onDelete,
}: {
  group: IRecipientGroup;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);

  const open = () => router.push({ pathname: '/recipient-group/[id]', params: { id: group.id } });

  const count = group.members.length;
  const usages = showAll ? group.used_in : group.used_in.slice(0, VISIBLE_USAGE_LIMIT);
  const hidden = group.used_in.length - VISIBLE_USAGE_LIMIT;

  return (
    <Pressable onPress={open} className="active:opacity-90">
      <Card className="gap-0">
        {/* Name + edit/delete */}
        <View className="flex-row items-start gap-2">
          <Txt weight="bold" numberOfLines={1} className="flex-1 text-[15px]">
            {group.name}
          </Txt>
          <IconButton onPress={open} label={`Edit ${group.name}`}>
            <IconPencil size={17} color={colors.ink3} />
          </IconButton>
          <IconButton onPress={onDelete} label={`Delete ${group.name}`} danger>
            <IconTrash size={17} color="#b42318" />
          </IconButton>
        </View>

        <Txt mono className="mt-0.5 text-[11px] uppercase text-ink-3">
          {count} {count === 1 ? 'member' : 'members'}
        </Txt>

        <Txt numberOfLines={2} className="mt-2 text-[13px] leading-[18px] text-ink-3">
          {group.description || 'No description yet'}
        </Txt>

        <Divider className="mt-3 mb-3" />

        {/* Used in */}
        {group.used_in.length > 0 ? (
          <View>
            <Label>Used in</Label>
            <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 6 }}>
              {usages.map((u) => (
                <UsageChip key={u.schedule_id} usage={u} />
              ))}
              {hidden > 0 && !showAll && (
                <Pressable
                  onPress={() => setShowAll(true)}
                  hitSlop={6}
                  className="rounded-full border border-border bg-surface px-2 py-1 active:opacity-70">
                  <Txt mono weight="medium" className="text-[11px] text-ink-3">
                    +{hidden} more
                  </Txt>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View className="flex-row items-center">
            <IconInfoCircle size={14} color={colors.ink3} />
            <Txt className="ml-1.5 text-[12px] text-ink-3">Not used in any sendouts yet</Txt>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
