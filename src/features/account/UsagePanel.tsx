import { Pressable, View } from 'react-native';
import { IconArrowRight } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { useUserUsage } from '@/services/api/queries';
import { colors } from '@/theme/tokens';

const RED = '#e34948';

const pct = (used: number, limit: number | null): number =>
  limit && limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;

function Bar({ value, highlight }: { value: number; highlight: boolean }) {
  return (
    <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface3">
      <View
        style={{ width: `${value}%`, height: '100%', borderRadius: 999, backgroundColor: highlight ? RED : colors.ink3 }}
      />
    </View>
  );
}

// The account Usage panel — total tokens (with Prompt/Completion/Cache shares), buckets and
// stories, each with a bar that turns red near the cap. RN port of the web's SidebarUsage.
export function UsagePanel({ onViewFull }: { onViewFull?: () => void }) {
  const { data } = useUserUsage();
  if (!data) return null;

  const totalTokens = data.promptTokensUsed + data.completionTokensUsed + data.cacheTokensUsed;
  const tokenPct = pct(totalTokens, data.tokenLimit);
  const share = (used: number) => (totalTokens > 0 ? Math.round((used / totalTokens) * 100) : 0);
  const bucketPct = pct(data.bucketsUsed, data.bucketLimit);
  const storyPct = pct(data.storiesUsed, data.storyLimit);

  const sections = [
    {
      key: 'tokens',
      label: 'TOKENS',
      summary: `${tokenPct}%`,
      summaryHi: tokenPct >= 90,
      items: [
        { label: 'Total Tokens', pct: tokenPct, hi: tokenPct >= 90 },
        { label: 'Prompt', pct: share(data.promptTokensUsed), hi: false },
        { label: 'Completion', pct: share(data.completionTokensUsed), hi: false },
        { label: 'Cache', pct: share(data.cacheTokensUsed), hi: false },
      ],
    },
    {
      key: 'creation',
      label: 'CREATION',
      summary: data.bucketLimit === null ? `Buckets ${data.bucketsUsed} used` : `Buckets ${bucketPct}%`,
      summaryHi: bucketPct >= 90,
      items: [{ label: 'Buckets', pct: data.bucketLimit === null ? 0 : bucketPct, hi: bucketPct >= 90 }],
    },
    {
      key: 'stories',
      label: 'STORIES',
      summary: data.storyLimit === null ? `${data.storiesUsed} used` : `${storyPct}%`,
      summaryHi: storyPct >= 90,
      items: [{ label: 'Stories', pct: data.storyLimit === null ? 0 : storyPct, hi: storyPct >= 90 }],
    },
  ];
  const nearCap = sections.some((s) => s.items.some((i) => i.hi));

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Txt mono weight="semibold" className="text-[12px] uppercase tracking-wide text-ink-2">
          Usage
        </Txt>
        {nearCap && (
          <View className="rounded-full bg-[#fbe6e0] px-2 py-0.5">
            <Txt mono weight="bold" className="text-[9px] uppercase tracking-wider" style={{ color: '#b24a14' }}>
              Near cap
            </Txt>
          </View>
        )}
      </View>

      <View className="mt-2.5 gap-3">
        {sections.map((s) => (
          <View key={s.key}>
            <View className="flex-row items-center justify-between">
              <Txt mono weight="semibold" className="text-[11px] uppercase tracking-wider text-ink-3">
                {s.label}
              </Txt>
              <Txt weight="medium" className="text-[11px]" style={{ color: s.summaryHi ? RED : colors.ink2 }}>
                {s.summary}
              </Txt>
            </View>
            <View className="mt-1.5 gap-2">
              {s.items.map((it) => (
                <View key={it.label}>
                  <View className="flex-row items-center justify-between">
                    <Txt className="text-[12px] text-ink-2">{it.label}</Txt>
                    <Txt mono weight="medium" className="text-[11px]" style={{ color: it.hi ? RED : colors.ink3 }}>
                      {it.pct}%
                    </Txt>
                  </View>
                  <Bar value={it.pct} highlight={it.hi} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {onViewFull && (
        <Pressable onPress={onViewFull} hitSlop={6} className="mt-3 flex-row items-center gap-1 self-start">
          <Txt weight="medium" className="text-[12px] text-ink-2 underline">
            View full usage
          </Txt>
          <IconArrowRight size={13} color={colors.ink2} />
        </Pressable>
      )}
    </View>
  );
}
