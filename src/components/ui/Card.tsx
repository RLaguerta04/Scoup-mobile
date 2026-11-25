import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-card bg-surface border border-border p-4 ${className ?? ''}`}
      {...props}
    />
  );
}

export function Screen({
  children,
  edges = ['top'],
  className,
}: {
  children: ReactNode;
  edges?: Edge[];
  className?: string;
}) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-bg">
      <View className={`flex-1 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}

export function Divider({ className }: { className?: string }) {
  return <View className={`h-px bg-border ${className ?? ''}`} />;
}
