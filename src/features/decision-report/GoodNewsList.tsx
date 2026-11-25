import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Txt } from '@/components/ui/Txt';
import { compactNum } from './verdict';
import type { IDecisionStory } from '@/types';

// "Good news worth using" — the good-flagged stories, ranked by opportunity
// (web: ReportRail's good-news block). Each row opens the Story Canvas.
export function GoodNewsList({ stories }: { stories: IDecisionStory[] }) {
  const good = stories.filter((s) => s.good).sort((a, b) => b.opportunity - a.opportunity);
  if (good.length === 0) return null;
  return (
    <View className="mt-7">
      <Txt mono weight="semibold" className="text-[11px] uppercase tracking-wider text-ink-3">
        Good news worth using
      </Txt>
      <Txt mono className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-4">
        ranked by opportunity
      </Txt>
      <View className="mt-3" style={{ gap: 14 }}>
        {good.map((s) => (
          <Pressable
            key={s.id}
            onPress={() =>
              router.push({ pathname: '/report-story/[storyId]', params: { storyId: s.id } })
            }
            className="active:opacity-80">
            <Txt variant="section" numberOfLines={2}>
              {s.title}
            </Txt>
            <Txt mono className="mt-1 text-[11px] text-ink-3">
              opportunity {s.opportunity} · {compactNum(s.engagements)} engagements
            </Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
