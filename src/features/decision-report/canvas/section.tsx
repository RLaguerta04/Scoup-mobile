import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Label } from '@/components/ui/Txt';

// A canvas section: an uppercase mono kicker (web: CanvasKicker) over its content.
export function CanvasSection({
  kicker,
  children,
  className,
}: {
  kicker: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={`mt-7 ${className ?? ''}`}>
      <Label>{kicker}</Label>
      <View className="mt-2.5">{children}</View>
    </View>
  );
}

// The bordered card the web uses for When-did-it-start / How-did-it-unfold / the numbers.
export function CanvasCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-card border border-border bg-surface p-4 ${className ?? ''}`}>
      {children}
    </View>
  );
}
