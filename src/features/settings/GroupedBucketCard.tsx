import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { IconPencil, IconTrash } from '@/components/navIcons';
import { colors } from '@/theme/tokens';
import type { IBucketGroupSummary } from '@/types';

// One "Bucket groups" card: the group name + its member-bucket chips, with edit/delete.
export function GroupedBucketCard({
  group,
  onEdit,
  onDelete,
}: {
  group: IBucketGroupSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="mb-2.5">
      <View className="flex-row items-start" style={{ gap: 10 }}>
        <View className="flex-1">
          <Txt weight="bold" className="text-[15px]" numberOfLines={1}>{group.name}</Txt>
          <View className="mt-2.5 flex-row flex-wrap" style={{ gap: 6 }}>
            {group.bucketNames.map((n, i) => (
              <Pill key={`${group.id}-${i}`} label={n} tone="neutral" />
            ))}
          </View>
        </View>
        <View className="flex-row" style={{ gap: 2 }}>
          <Pressable onPress={onEdit} hitSlop={6} className="h-8 w-8 items-center justify-center rounded-full active:bg-surface2">
            <IconPencil size={16} color={colors.ink3} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={6} className="h-8 w-8 items-center justify-center rounded-full active:bg-surface2">
            <IconTrash size={16} color="#c0492f" />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
