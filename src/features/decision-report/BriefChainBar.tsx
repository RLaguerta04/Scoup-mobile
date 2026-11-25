import { Pressable, View } from 'react-native';
import { Txt } from '@/components/ui/Txt';
import type { IDecisionEdition, ReportCadence } from '@/types';

// Compact mode row — the web's ReportChainBar reduced to a phone strip: the "<cadence> brief"
// pill and the "Alerts · hour by hour" pill (both tappable to switch mode), plus a crisis-open
// chip. The Daily/Weekly/Monthly cadence lives in its own control below (DecisionReportView).
const CADENCE_WORD: Record<ReportCadence, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export type ReportMode = 'brief' | 'alerts';

export function BriefChainBar({
  edition,
  mode,
  onModeChange,
}: {
  edition: IDecisionEdition;
  mode: ReportMode;
  onModeChange: (mode: ReportMode) => void;
}) {
  const n = edition.crisisOpen;
  const crisisLabel = n === 1 ? '1 crisis open' : `${n} crises open`;
  return (
    <View>
      <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
        <Pressable
          onPress={() => onModeChange('brief')}
          className={`rounded-full px-3 py-1.5 ${mode === 'brief' ? 'bg-ink' : 'border border-border bg-surface'}`}>
          <Txt weight="semibold" className={`text-[12px] ${mode === 'brief' ? 'text-white' : 'text-ink-3'}`}>
            {CADENCE_WORD[edition.cadence]} brief · {edition.preparedTime}
          </Txt>
        </Pressable>
        <Pressable
          onPress={() => onModeChange('alerts')}
          className={`rounded-full px-3 py-1.5 ${mode === 'alerts' ? 'bg-ink' : 'border border-border bg-surface'}`}>
          <Txt
            weight={mode === 'alerts' ? 'semibold' : 'medium'}
            className={`text-[12px] ${mode === 'alerts' ? 'text-white' : 'text-ink-3'}`}>
            Alerts · hour by hour
          </Txt>
        </Pressable>
        {n > 0 && (
          <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: '#fdefd4' }}>
            <Txt mono weight="bold" className="text-[11px] uppercase tracking-wide" style={{ color: '#9a6413' }}>
              ⚠ {crisisLabel}
            </Txt>
          </View>
        )}
      </View>
      {n === 0 && (
        <Txt mono weight="medium" className="mt-2 text-[11px] uppercase tracking-wider text-ink-3">
          No crisis tracker open
        </Txt>
      )}
    </View>
  );
}
