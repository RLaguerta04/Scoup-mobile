import { Pressable, View } from 'react-native';
import { IconPencil, IconTrash } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';

// The Edit / Delete buttons revealed by swiping a list row left (gesture-handler's
// ReanimatedSwipeable `renderRightActions`). Full-height, pinned to the right edge; Delete is
// destructive red. Fixed widths so the row opens a predictable amount.
export function SwipeEditDelete({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <View className="flex-row">
      <Pressable
        onPress={onEdit}
        className="w-[76px] items-center justify-center bg-surface3 active:opacity-70">
        <IconPencil size={20} color={colors.ink} />
        <Txt weight="medium" className="mt-1 text-[11px] text-ink-2">
          Edit
        </Txt>
      </Pressable>
      <Pressable
        onPress={onDelete}
        className="w-[76px] items-center justify-center active:opacity-80"
        style={{ backgroundColor: '#e34948' }}>
        <IconTrash size={20} color="#ffffff" />
        <Txt weight="medium" className="mt-1 text-[11px] text-white">
          Delete
        </Txt>
      </Pressable>
    </View>
  );
}
