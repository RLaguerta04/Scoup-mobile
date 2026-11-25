import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { AlertKind, IDecisionAlert, IDecisionTracker } from '@/types';

// Alert kind → label + accent (web: pushes / incidents / radar / escalate). Escalate and
// incident read red (the loud ones), push amber, radar the link blue.
const KIND: Record<AlertKind, { label: string; color: string }> = {
  escalate: { label: 'Escalate', color: '#b24a14' },
  incident: { label: 'Incident', color: '#b24a14' },
  push: { label: 'Push', color: '#9a6413' },
  radar: { label: 'Radar', color: colors.link },
};

// The "Alerts · hour by hour" mode (web: ReportAlerts replay, leaned to a time-ordered list).
// Each alert opens its story canvas — or, for an ESCALATE on a story with an open crisis
// tracker, the tracker itself.
export function AlertsView({
  alerts,
  summary,
  trackers,
}: {
  alerts: IDecisionAlert[];
  summary: string;
  trackers: IDecisionTracker[];
}) {
  const trackerIds = new Set(trackers.map((t) => t.id));
  const openAlert = (a: IDecisionAlert) => {
    if (a.kind === 'escalate' && trackerIds.has(a.storyId)) {
      router.push({ pathname: '/report-tracker/[trackerId]', params: { trackerId: a.storyId } });
    } else {
      router.push({ pathname: '/report-story/[storyId]', params: { storyId: a.storyId } });
    }
  };
  return (
    <View>
      <View className="flex-row items-end justify-between">
        <Txt variant="section">Alerts</Txt>
        <Txt mono className="text-[10px] uppercase tracking-wider text-ink-3">
          hour by hour
        </Txt>
      </View>
      <Txt variant="body" className="mt-1 text-ink-3">
        {summary}
      </Txt>

      <View className="mt-2">
        {alerts.map((a, i) => {
          const k = KIND[a.kind];
          return (
            <Pressable key={a.id} onPress={() => openAlert(a)} className="active:bg-surface2">
              <View className={`py-3 ${i === alerts.length - 1 ? '' : 'border-b border-border'}`}>
                <View className="flex-row items-center justify-between">
                  <Txt mono weight="bold" className="text-[9px] uppercase tracking-wide" style={{ color: k.color }}>
                    {k.label}
                  </Txt>
                  <Txt mono className="text-[10px] text-ink-3">
                    {a.time}
                  </Txt>
                </View>
                <Txt weight="semibold" className="mt-1 text-[14px]" numberOfLines={2}>
                  {a.storyTitle}
                </Txt>
                <Txt variant="body" className="mt-0.5 text-ink-3" numberOfLines={2}>
                  {a.text}
                </Txt>
                {a.metric ? (
                  <Txt mono className="mt-1 text-[11px] text-ink-2">
                    {a.metric}
                  </Txt>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
