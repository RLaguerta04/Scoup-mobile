import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';

// The lead line + a "Read the summary" disclosure (web: ReportSummary's <details>). An
// optional mono kicker (e.g. "This week") sits above the lead, matching the web's "THIS WEEK ·".
export function BriefSummary({
  leadLine,
  summary,
  kicker,
}: {
  leadLine: string;
  summary: string;
  kicker?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="rounded-card border border-border bg-surface2 p-3.5">
      {kicker ? (
        <Txt mono weight="medium" className="mb-1 text-[10px] uppercase tracking-wider text-ink-3">
          {kicker}
        </Txt>
      ) : null}
      <Txt variant="section" className="text-ink">
        {leadLine}
      </Txt>
      {open && <Txt variant="body" className="mt-2 text-ink-2">{summary}</Txt>}
      <Pressable onPress={() => setOpen((o) => !o)} hitSlop={6} className="mt-2 self-start">
        <Txt variant="caption" weight="semibold" style={{ color: colors.link }}>
          {open ? 'Hide the summary' : 'Read the summary'}
        </Txt>
      </Pressable>
    </View>
  );
}
