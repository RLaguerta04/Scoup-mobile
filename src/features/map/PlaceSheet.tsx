import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { Pill } from '@/components/ui/controls';
import { ToneBar } from '@/components/charts/ToneBar';
import { compact } from '@/lib/format';
import type { IPlaceDetail } from '@/types';

const sentTone = (s: string) =>
  s === 'positive' ? 'positive' : s === 'negative' ? 'negative' : 'neutral';

export function PlaceSheet({ place }: { place: IPlaceDetail }) {
  const n = place.sentimentPostCount;
  const sv = place.sentiment;
  const share = (pct: number) => ({ count: Math.round((pct / 100) * n), pct });

  return (
    <View className="gap-3 px-4 pb-12 pt-1">
      <Txt weight="extrabold" className="text-[22px]">
        {place.city}
      </Txt>

      <Card>
        <Label>Sentiment · {place.city}</Label>
        {sv ? (
          <View className="mt-3">
            <ToneBar positive={share(sv.positive)} neutral={share(sv.neutral)} negative={share(sv.negative)} />
            <Txt className="mt-2 text-[12px] text-ink-3">overall comment sentiment of {n} posts</Txt>
          </View>
        ) : (
          <Txt className="mt-2 text-[13px] text-ink-3">No sentiment yet</Txt>
        )}
      </Card>

      <Card>
        <Label>Most posts · Last 7 days</Label>
        <View className="mt-3 gap-2">
          {place.mostPosts.map((p, i) => (
            <View key={p.name} className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Txt mono className="w-5 text-[12px] text-ink-3">
                  {i + 1}
                </Txt>
                <View>
                  <Txt weight="semibold" className="text-[13px]">
                    {p.name}
                  </Txt>
                  <Txt className="text-[11px] text-ink-3">{p.district}</Txt>
                </View>
              </View>
              <Txt mono weight="bold" className="text-[13px]">
                {p.posts}
              </Txt>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Label>Top posts · {place.city}</Label>
        <View className="mt-3 gap-3">
          {place.topPosts.map((p) => (
            <View key={p.id}>
              <View className="flex-row items-center justify-between">
                <Txt weight="semibold" className="text-[13px]">
                  {p.author}
                </Txt>
                <Pill label={p.sentiment} tone={sentTone(p.sentiment)} />
              </View>
              <Txt className="mt-1 text-[13px] text-ink-2">{p.text}</Txt>
              <Txt mono className="mt-1 text-[11px] text-ink-3">
                {compact(p.engagements)} engagements
              </Txt>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
