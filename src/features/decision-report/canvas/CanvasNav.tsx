import { Pressable, View } from 'react-native';
import { IconChevronLeft, IconChevronRight } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';

// Prev/Next story nav (web: the "1 of 6 · J/K" row + adjacent-story buttons). Drives the
// canvas's index state; disabled at the ends.
export function CanvasNav({
  index,
  total,
  prevTitle,
  nextTitle,
  onPrev,
  onNext,
}: {
  index: number;
  total: number;
  prevTitle?: string;
  nextTitle?: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={onPrev}
        disabled={!prevTitle}
        hitSlop={6}
        className="flex-1 flex-row items-center active:opacity-60"
        style={{ opacity: prevTitle ? 1 : 0.3 }}>
        <IconChevronLeft size={16} color={colors.ink3} />
        <Txt numberOfLines={1} className="ml-0.5 flex-shrink text-[12px] text-ink-3">
          {prevTitle ?? 'Start'}
        </Txt>
      </Pressable>
      <Txt mono className="mx-2 text-[11px] uppercase tracking-wider text-ink-3">
        {index + 1} of {total}
      </Txt>
      <Pressable
        onPress={onNext}
        disabled={!nextTitle}
        hitSlop={6}
        className="flex-1 flex-row items-center justify-end active:opacity-60"
        style={{ opacity: nextTitle ? 1 : 0.3 }}>
        <Txt numberOfLines={1} className="mr-0.5 flex-shrink text-right text-[12px] text-ink-3">
          {nextTitle ?? 'End'}
        </Txt>
        <IconChevronRight size={16} color={colors.ink3} />
      </Pressable>
    </View>
  );
}
