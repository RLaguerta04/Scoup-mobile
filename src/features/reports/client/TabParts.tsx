import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { IReportWriteup } from '@/types';

// Shared EDCOM 2 tab primitives (web: components/edcom2/TabParts.tsx). Every tab opens with a
// TabLead (bold one-line lead + a muted "how to read" sub) and stacks WriteUpCards for the
// analyst narrative layer.

export function TabLead({ lead, sub }: { lead?: string; sub?: string }) {
  if (!lead && !sub) return null;
  return (
    <View className="mb-4">
      {lead ? <Txt weight="semibold" className="text-[15px] leading-[21px] text-ink">{lead}</Txt> : null}
      {sub ? <Txt className="mt-1 text-[12.5px] leading-[18px] text-ink-3">{sub}</Txt> : null}
    </View>
  );
}

export function WriteUpCard({ writeup }: { writeup: IReportWriteup }) {
  const dark = writeup.dark;
  return (
    <View
      className="rounded-xl p-4"
      style={dark ? { backgroundColor: colors.ink } : { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      {writeup.kicker ? (
        <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide" style={{ color: dark ? '#9aa0a6' : colors.ink3 }}>
          {writeup.kicker}
        </Txt>
      ) : null}
      <Txt weight="bold" className={`text-[15px] leading-[20px] ${writeup.kicker ? 'mt-1' : ''}`} style={{ color: dark ? '#ffffff' : colors.ink }}>
        {writeup.claim}
      </Txt>
      <Txt className="mt-1.5 text-[13px] leading-[19px]" style={{ color: dark ? '#d4d2cc' : colors.ink2 }}>
        {writeup.body}
      </Txt>
    </View>
  );
}

export function WriteUpList({ writeups }: { writeups?: IReportWriteup[] }) {
  if (!writeups?.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {writeups.map((w, i) => (
        <WriteUpCard key={i} writeup={w} />
      ))}
    </View>
  );
}

// A small label above a block (web: section sub-head / FieldLabel).
export function BlockLabel({ children }: { children: string }) {
  return (
    <Txt mono weight="medium" className="mb-2 text-[11px] uppercase tracking-wider text-ink-3">
      {children}
    </Txt>
  );
}
