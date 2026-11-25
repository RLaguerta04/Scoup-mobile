import { Pressable, View } from 'react-native';
import { Divider } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { compactNum } from '../verdict';
import { useDrill } from '../drill/DrillContext';
import { CanvasSection } from './section';
import type { ICanvasCoverage } from '@/types';

function NumberTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View className="flex-1 rounded-card border border-border bg-surface p-3">
      <Label>{label}</Label>
      <Txt variant="metric" className="mt-1">{value}</Txt>
      <Txt variant="caption" className="mt-0.5 text-ink-3">{sub}</Txt>
    </View>
  );
}

// "MORE ON THIS STORY" — early-warning status + the two numbers + top coverage by story
// value (web: ReportStoryAlerts + NumbersSection).
export function MoreOnStory({
  alertStatus,
  alertText,
  searchVisits,
  postViews,
  topCoverage,
}: {
  alertStatus: string;
  alertText: string;
  searchVisits: number;
  postViews: number;
  topCoverage: ICanvasCoverage[];
}) {
  const drill = useDrill();
  return (
    <CanvasSection kicker="More on this story">
      <View className="rounded-card border border-border bg-surface p-4">
        <Label>Early-warning alerts</Label>
        <View className="mt-2 flex-row items-center" style={{ gap: 8 }}>
          <View className="rounded-full border border-border px-2 py-0.5">
            <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">{alertStatus}</Txt>
          </View>
          <Txt variant="body" className="flex-1 text-ink-2">{alertText}</Txt>
        </View>
      </View>

      <View className="mt-3 flex-row" style={{ gap: 10 }}>
        <NumberTile label="Est. search visits (Ahrefs)" value={compactNum(searchVisits)} sub="estimated visits to the online articles" />
        <NumberTile label="Post views" value={compactNum(postViews)} sub="the posts' own counts" />
      </View>

      <View className="mt-4">
        <Label>Top coverage by story value</Label>
        <View className="mt-1.5">
          {topCoverage.map((c, i) => (
            <View key={c.rank}>
              <Pressable
                {...drill(`coverage:${c.rank}`)}
                className="flex-row items-start py-2.5 active:bg-surface2"
                style={{ gap: 10 }}>
                <Txt mono weight="bold" className="text-[12px] text-ink-3" style={{ marginTop: 1 }}>
                  {c.rank}
                </Txt>
                <View className="flex-1">
                  <Txt weight="semibold" numberOfLines={2} className="text-[13px] leading-[18px]">
                    {c.title}
                  </Txt>
                  <Txt variant="caption" className="mt-0.5 text-ink-3">
                    {c.outlet} · {c.medium} · {c.date}
                  </Txt>
                </View>
                <Txt mono weight="bold" className="text-[12px] text-ink">{c.storyValue.toFixed(2)}</Txt>
              </Pressable>
              {i < topCoverage.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      </View>
    </CanvasSection>
  );
}
