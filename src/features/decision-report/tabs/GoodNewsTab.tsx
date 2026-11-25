import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Divider } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { sentiment } from '@/theme/tokens';
import type { IDecisionStory } from '@/types';

// "Good news" — stories whose comments lean favorable, most favorable first
// (web: ReportGoodNews). Net stance = positive minus negative.
export function GoodNewsTab({ stories }: { stories: IDecisionStory[] }) {
  const good = stories.filter((s) => s.net > 0).sort((a, b) => b.net - a.net);
  return (
    <View className="rounded-card border border-border bg-surface p-4">
      <Label>Good news worth using</Label>
      <Txt variant="body" className="mt-1.5 text-ink-2">
        Stories where the comments lean favorable, most favorable first. Net stance is positive minus
        negative.
      </Txt>
      {good.length === 0 ? (
        <Txt variant="body" className="mt-3 text-ink-3">No story has a net favorable stance this week.</Txt>
      ) : (
        <View className="mt-3">
          {good.map((s, i) => (
            <View key={s.id}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/report-story/[storyId]', params: { storyId: s.id } })
                }
                className="py-3 active:opacity-70">
                <Txt weight="semibold" numberOfLines={2} className="text-[14px] leading-[19px]">
                  {s.title}
                </Txt>
                <Txt mono className="mt-1 text-[11px] text-ink-3">
                  net stance{' '}
                  <Txt mono weight="semibold" className="text-[11px]" style={{ color: sentiment.positive }}>
                    +{s.net}
                  </Txt>{' '}
                  · {s.positivePct}% positive
                </Txt>
              </Pressable>
              {i < good.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
