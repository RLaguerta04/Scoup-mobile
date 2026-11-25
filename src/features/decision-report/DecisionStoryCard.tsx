import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import { ScoreBar, TrackerTag, VerdictBadge } from './badges';
import { TREND_GLYPH } from './verdict';
import type { IDecisionStory } from '@/types';

// One "Decide this week" row (web: ReportRail row). Rank + verdict + title + the rail
// note + a priority bar and trend. A borderless row with a hairline bottom separator
// (none on the last row); tapping pushes the full-screen Story Canvas.
export function DecisionStoryCard({ story, isLast }: { story: IDecisionStory; isLast?: boolean }) {
  const trendColor =
    story.trend === 'Rising'
      ? sentiment.positive
      : story.trend === 'Fading'
        ? sentiment.negative
        : colors.ink3;
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/report-story/[storyId]', params: { storyId: story.id } })
      }
      className="active:bg-surface2">
      <View className={`py-4 ${isLast ? '' : 'border-b border-border'}`}>
        <View className="flex-row items-start" style={{ gap: 10 }}>
          <Txt mono weight="bold" className="text-[14px] text-ink-3" style={{ marginTop: 1 }}>
            {story.rank}
          </Txt>
          <View className="flex-1">
            <VerdictBadge verdict={story.verdict} />
            <Txt variant="section" numberOfLines={2} className="mt-1.5">
              {story.title}
            </Txt>
            <Txt variant="body" numberOfLines={2} className="mt-1 text-ink-3">
              {story.actionLine}
            </Txt>
            <View className="mt-2.5 flex-row items-center" style={{ gap: 10 }}>
              <ScoreBar value={story.priority} verdict={story.verdict} />
              <Txt mono weight="bold" className="text-[12px] text-ink">
                {story.priority}
              </Txt>
              <Txt weight="semibold" className="text-[11px]" style={{ color: trendColor }}>
                {TREND_GLYPH[story.trend]} {story.trend}
              </Txt>
            </View>
            {story.trackerDay != null && (
              <View className="mt-2">
                <TrackerTag storyId={story.id} day={story.trackerDay} />
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
