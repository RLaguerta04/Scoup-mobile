import { Pressable, View } from 'react-native';
import { IconChevronLeft } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';

// A plain back + title header for pushed detail screens.
export function BackHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center gap-1 px-2 py-2">
      <Pressable
        onPress={goBack}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
        <IconChevronLeft size={24} color={colors.ink} />
      </Pressable>
      <Txt variant="title" numberOfLines={1} className="flex-1">
        {title}
      </Txt>
    </View>
  );
}
