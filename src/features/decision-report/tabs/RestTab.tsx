import { ScrollView, View } from 'react-native';
import { BarList } from '@/components/charts/BarList';
import { Divider } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import type {
  DayStatus,
  IDecisionContext,
  IDecisionFigure,
  IDecisionPress,
  IDecisionStory,
} from '@/types';

function PressGroup({ title, items, format }: { title: string; items: { label: string; value: number }[]; format: (v: number) => string }) {
  return (
    <View className="mt-4">
      <Txt mono weight="medium" className="mb-2 text-[10px] uppercase tracking-wide text-ink-3">
        {title}
      </Txt>
      <BarList items={items} format={format} valueWidth="w-[72px]" />
    </View>
  );
}

const STATUS: Record<DayStatus, { bg: string; fg: string }> = {
  GREEN: { bg: '#e4f0ea', fg: '#0a7a52' },
  AMBER: { bg: '#fdefd4', fg: '#9a6413' },
  RED: { bg: '#fbe6dc', fg: '#b24a14' },
};

// A week-against-normal figure tile (fixed width for the horizontal strip).
function Figure({ f }: { f: IDecisionFigure }) {
  return (
    <View className="rounded-card border border-border bg-surface p-3" style={{ width: 150 }}>
      <Label>{f.label}</Label>
      <Txt variant="metric" className="mt-1">{f.value}</Txt>
      <Txt variant="caption" className="mt-0.5 text-ink-3">{f.sub}</Txt>
    </View>
  );
}

// A report-level figure (full-width — the subs are long).
function ReportFigure({ f }: { f: IDecisionFigure }) {
  return (
    <View className="rounded-card border border-border bg-surface p-3">
      <Label>{f.label}</Label>
      <Txt weight="bold" className="mt-1 text-[18px]">{f.value}</Txt>
      <Txt variant="caption" className="mt-0.5 text-ink-3">{f.sub}</Txt>
    </View>
  );
}

// "The rest of the week" — week-against-normal figures, report-level figures, and the
// per-story net-sentiment-by-day rows (web: ReportContext + ScoupReportCard).
export function RestTab({
  stories,
  context,
  press,
}: {
  stories: IDecisionStory[];
  context: IDecisionContext;
  press: IDecisionPress;
}) {
  return (
    <View>
      <Txt variant="body" className="text-ink-3">
        The week against normal, the coverage behind the stories, and what was counted.
      </Txt>

      {/* The week against normal */}
      <View className="mt-5">
        <Label>The week against normal</Label>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 16, paddingTop: 10 }}>
          {context.weekAgainstNormal.map((f) => (
            <Figure key={f.label} f={f} />
          ))}
        </ScrollView>
      </View>

      {/* Report-level figures */}
      <View className="mt-6">
        <Label>Scoup’s report-level figures, on this period</Label>
        <View className="mt-3" style={{ gap: 10 }}>
          {context.reportFigures.map((f) => (
            <ReportFigure key={f.label} f={f} />
          ))}
        </View>
      </View>

      {/* Press coverage (web: PressTiles) */}
      <View className="mt-6">
        <Label>Press coverage</Label>
        <Txt variant="caption" className="mt-0.5 text-ink-3">
          articles by medium, the top outlets, and the keywords that hit
        </Txt>
        <View className="mt-3 rounded-card border border-border bg-surface p-4">
          <PressGroup title="By medium" items={press.byMedium} format={(v) => String(v)} />
          <PressGroup title="Top outlets" items={press.topOutlets} format={(v) => `${v} items`} />
          <PressGroup title="Keyword hits" items={press.keywordHits} format={(v) => String(v)} />
        </View>
      </View>

      {/* Net comment sentiment by day */}
      <View className="mt-6">
        <Label>Net comment sentiment by day, against the floor</Label>
        <View className="mt-3 rounded-card border border-border bg-surface px-4">
          {stories.map((s, i) => {
            const st = STATUS[s.dayStatus];
            return (
              <View key={s.id}>
                <View className="flex-row items-center py-3" style={{ gap: 8 }}>
                  <View className="flex-1">
                    <Txt weight="semibold" numberOfLines={1} className="text-[13px]">{s.title}</Txt>
                    <Txt variant="caption" className="mt-0.5 text-ink-3">
                      {s.mentions.toLocaleString()} mentions · {s.negativeCommentsPct}% negative of{' '}
                      {s.comments.toLocaleString()} read
                    </Txt>
                  </View>
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: st.bg }}>
                    <Txt mono weight="semibold" className="text-[10px]" style={{ color: st.fg }}>
                      {s.dayStatus}
                    </Txt>
                  </View>
                </View>
                {i < stories.length - 1 && <Divider />}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
