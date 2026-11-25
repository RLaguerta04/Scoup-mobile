import { View } from 'react-native';
import { Txt } from './Txt';

export function Skeleton({ className }: { className?: string }) {
  return <View className={`rounded-md bg-surface4 ${className ?? ''}`} />;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <Txt weight="bold" className="text-center text-base text-ink">
        {title}
      </Txt>
      {hint && (
        <Txt className="mt-1.5 text-center text-[13px] text-ink-3">{hint}</Txt>
      )}
    </View>
  );
}
