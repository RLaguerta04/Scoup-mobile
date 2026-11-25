import { Pressable, View } from 'react-native';
import { IconCheck } from '@/components/navIcons';

// Square checkbox — extracted from the publishers list so the Reports toolbar's
// "Select all" can reuse it. Checked = filled ink; unchecked = bordered surface.
export function Checkbox({
  checked,
  onPress,
  disabled,
}: {
  checked: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const box = (
    <View
      className={`h-[22px] w-[22px] items-center justify-center rounded-md border ${
        checked ? 'border-ink bg-ink' : 'border-border-strong bg-surface'
      }`}>
      {checked && <IconCheck size={15} color="#ffffff" />}
    </View>
  );
  if (!onPress) return box;
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={6} style={{ opacity: disabled ? 0.5 : 1 }}>
      {box}
    </Pressable>
  );
}
