import { Pressable, View } from 'react-native';
import { Pill } from '@/components/ui/controls';
import { Label, Txt } from '@/components/ui/Txt';
import { compactNum } from '../verdict';
import { useDrill } from '../drill/DrillContext';
import { CanvasSection } from './section';
import type { ICanvasOutlet, ICanvasVoice } from '@/types';

// Full-width outlet row: name on the left, the "medium · items · story value" meta on the
// right — one consistent width with the voice cards (no %-width, which diverges on native).
// Drillable → that outlet's coverage.
function OutletChip({ o }: { o: ICanvasOutlet }) {
  const drill = useDrill();
  return (
    <Pressable
      {...drill(`outlet:${o.name}`)}
      className="flex-row items-center rounded-card border border-border bg-surface px-3 py-2.5 active:bg-surface2"
      style={{ gap: 10 }}>
      <Txt weight="bold" numberOfLines={1} className="flex-1 text-[13px]">{o.name}</Txt>
      <Txt variant="caption" numberOfLines={1} className="text-ink-3">
        {o.medium} · {o.items} {o.items === 1 ? 'item' : 'items'} · story value {o.storyValue.toFixed(2)}
      </Txt>
    </Pressable>
  );
}

function VoiceCard({ v }: { v: ICanvasVoice }) {
  const drill = useDrill();
  return (
    <Pressable {...drill(`voice:${v.name}`)} className="rounded-card border border-border bg-surface p-3 active:bg-surface2">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Txt weight="bold" className="text-[13px]">{v.name}</Txt>
        {v.keyVoice && <Pill label="Key voice" tone="brand" />}
        <Txt mono className="ml-auto text-[11px] text-ink-3">
          {v.platform} · voice score <Txt mono weight="bold" className="text-[11px] text-ink">{v.voiceScore}</Txt>
        </Txt>
      </View>
      <Txt variant="caption" className="mt-1.5 text-ink-3">
        {v.likes.toLocaleString()} likes · {v.comments.toLocaleString()} comments · {v.shares} shares · {v.engagementPct}% of engagement
      </Txt>
      <Txt variant="caption" className="mt-0.5 text-ink-3">
        {compactNum(v.views)} views · comments under it {v.negativePct}% negative ({v.topRead} read) · {v.status}
      </Txt>
    </Pressable>
  );
}

// "WHO IS INVOLVED" — outlets by story value + key voices + the reactions summary
// (web: DriversSection + ReactionsByPlatform).
export function WhoIsInvolved({
  note,
  outlets,
  voices,
  reactions,
}: {
  note: string;
  outlets: ICanvasOutlet[];
  voices: ICanvasVoice[];
  reactions: string;
}) {
  return (
    <CanvasSection kicker="Who is involved">
      <Txt variant="caption" className="text-ink-3">{note}</Txt>
      <View className="mt-3" style={{ gap: 10 }}>
        {outlets.map((o) => (
          <OutletChip key={o.name} o={o} />
        ))}
      </View>
      <View className="mt-3" style={{ gap: 10 }}>
        {voices.map((v) => (
          <VoiceCard key={v.name} v={v} />
        ))}
      </View>
      <View className="mt-4">
        <Label>Reactions by platform</Label>
        <Txt variant="caption" className="mt-1 text-ink-3">{reactions}</Txt>
      </View>
    </CanvasSection>
  );
}
