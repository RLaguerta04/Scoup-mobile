import { View } from 'react-native';
import { MetricStrip } from './MetricStrip';
import { CanvasSection } from './section';
import type { ICanvasMetric } from '@/types';

// The 4-up metric grid (web: the inline "What is it to you" grid), 2×2 on a phone.
export function WhatIsItToYou({ metrics }: { metrics: ICanvasMetric[] }) {
  return (
    <CanvasSection kicker="What is it to you">
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {metrics.map((m) => (
          <View key={m.key} style={{ width: '48%' }}>
            <MetricStrip metric={m} />
          </View>
        ))}
      </View>
    </CanvasSection>
  );
}
