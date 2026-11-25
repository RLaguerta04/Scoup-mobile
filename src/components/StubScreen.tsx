import type { ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@/components/navIcons';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';

type TablerIcon = ComponentType<{ size?: number; color?: string; stroke?: number }>;

// Full-screen pushed stub for a destination reached from the More hub.
export function StubScreen({
  title,
  icon: Icon,
  blurb,
}: {
  title: string;
  icon: TablerIcon;
  blurb: string;
}) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="flex-row items-center px-2 py-2">
        {router.canGoBack() ? (
          <Pressable onPress={goBack} hitSlop={8} className="p-2">
            <IconChevronLeft size={24} color={colors.ink} />
          </Pressable>
        ) : null}
        <Txt weight="semibold" className={`text-[15px] ${router.canGoBack() ? '' : 'ml-2'}`}>
          {title}
        </Txt>
      </View>
      <View className="flex-1 items-center justify-center px-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-surface3">
          <Icon size={30} color={colors.ink} />
        </View>
        <Txt variant="title" className="mt-4 text-center">
          {title}
        </Txt>
        <Txt variant="body" className="mt-1.5 text-center text-ink-3">{blurb}</Txt>
        <View className="mt-3">
          <Pill label="Coming next" tone="brand" />
        </View>
      </View>
    </SafeAreaView>
  );
}
