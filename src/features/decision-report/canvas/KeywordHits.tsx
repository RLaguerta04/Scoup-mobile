import { Pressable, View } from 'react-native';
import { Label, Txt } from '@/components/ui/Txt';
import { useDrill } from '../drill/DrillContext';
import type { IKeywordHit } from '@/types';

// "KEYWORD HITS telco 37 · service 4" (web: KeywordHits). Each chip drills to the coverage
// behind that keyword.
export function KeywordHits({ hits }: { hits: IKeywordHit[] }) {
  const drill = useDrill();
  if (!hits.length) return null;
  return (
    <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
      <Label>Keyword hits</Label>
      {hits.map((h) => (
        <Pressable
          key={h.term}
          {...drill(`kw:${h.term}`)}
          className="flex-row items-center rounded-full bg-surface3 px-2.5 py-1 active:opacity-70"
          style={{ gap: 5 }}>
          <Txt className="text-[12px] text-ink-2">{h.term}</Txt>
          <Txt mono weight="bold" className="text-[11px] text-ink">{h.count}</Txt>
        </Pressable>
      ))}
    </View>
  );
}
