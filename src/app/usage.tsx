import { useState } from 'react';
import { IconAlertTriangle, IconBell, IconClock } from '@tabler/icons-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconCheck, IconChevronDown } from '@/components/navIcons';
import { BackHeader } from '@/components/BackHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { useUsageReport } from '@/services/api/queries';
import { colors } from '@/theme/tokens';
import type { IUsageQuotaMetric, UsageGroup } from '@/types';

const RED = '#e34948';
const AMBER = '#e8890c';
const GREEN = '#127a53';
const BLUE = '#578bd9';

type Sev = 'ok' | 'watch' | 'critical' | 'reached';

const pctOf = (m: IUsageQuotaMetric): number | null =>
  m.limit === null ? null : m.limit <= 0 ? 0 : Math.round((m.used / m.limit) * 100);
const sevOf = (pct: number | null): Sev =>
  pct === null ? 'ok' : pct >= 100 ? 'reached' : pct >= 95 ? 'critical' : pct >= 80 ? 'watch' : 'ok';
const SEV_COLOR: Record<Sev, string> = { ok: colors.ink3, watch: AMBER, critical: RED, reached: RED };
const SEV_LABEL: Record<Sev, string> = { ok: '', watch: 'Watch', critical: 'Critical', reached: 'Reached' };
const isTracked = (m: IUsageQuotaMetric) => m.limit !== null || !!m.alertThresholds;

const GROUPS: { key: UsageGroup; label: string }[] = [
  { key: 'tokens', label: 'Tokens' },
  { key: 'scrapes', label: 'Scrapes' },
  { key: 'creation', label: 'Creation' },
  { key: 'plan', label: 'Plan' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};
const num = (n: number) => n.toLocaleString('en-US');

// The alert-threshold track — a dashed line with a tick at each threshold (blue, 100 = ink).
function AlertTrack({ thresholds }: { thresholds: number[] }) {
  return (
    <View className="mt-2 h-4 justify-center">
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, borderStyle: 'dashed' }} />
      {thresholds.map((t) => (
        <View
          key={t}
          style={{
            position: 'absolute',
            left: `${Math.min(t, 99)}%`,
            top: 3,
            bottom: 3,
            width: 2,
            borderRadius: 1,
            backgroundColor: t >= 100 ? colors.ink : BLUE,
          }}
        />
      ))}
    </View>
  );
}

// Token composition sub-rows (Write-ups / Chat / Analysis / Mail) — a share of the total.
function ShareRows({ shares }: { shares: NonNullable<IUsageQuotaMetric['shares']> }) {
  return (
    <View className="mt-2.5 gap-2">
      {shares.map((s) => (
        <View key={s.key} className="flex-row items-center gap-2">
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.color }} />
          <Txt className="w-20 text-[12px] text-ink-2">{s.label}</Txt>
          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface3">
            <View style={{ width: `${s.share}%`, height: '100%', borderRadius: 999, backgroundColor: s.color }} />
          </View>
          <Txt mono className="w-12 text-right text-[11px] text-ink-2">{s.share.toFixed(1)}%</Txt>
        </View>
      ))}
    </View>
  );
}

function MetricRow({ m }: { m: IUsageQuotaMetric }) {
  const capped = m.limit !== null;
  const ticks = !capped && m.alertThresholds;

  // Capped — used of limit + severity + meter + % left.
  if (capped) {
    const pct = pctOf(m);
    const sev = sevOf(pct);
    const left = pct === null ? 0 : Math.max(0, 100 - pct);
    return (
      <View className="py-2.5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <Txt weight="medium" className="text-[13px] text-ink">{m.label}</Txt>
            {sev !== 'ok' && (
              <View className="rounded-full px-1.5 py-0.5" style={{ backgroundColor: sev === 'watch' ? '#fdeccb' : '#fbe6e0' }}>
                <Txt mono weight="bold" className="text-[9px] uppercase tracking-wider" style={{ color: SEV_COLOR[sev] }}>
                  {SEV_LABEL[sev]}
                </Txt>
              </View>
            )}
          </View>
          <Txt mono className="text-[12px] text-ink-2">{num(m.used)} of {num(m.limit as number)}</Txt>
        </View>
        {m.unit && <Txt className="text-[11px] text-ink-3">{m.unit}</Txt>}
        <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface3">
          <View style={{ width: `${Math.min(pct ?? 0, 100)}%`, height: '100%', borderRadius: 999, backgroundColor: SEV_COLOR[sev] }} />
        </View>
        <Txt className="mt-1 text-[11px]" style={{ color: sev === 'ok' ? colors.ink3 : SEV_COLOR[sev] }}>
          {pct !== null && pct >= 100 ? 'At limit' : `${left}% left`}
        </Txt>
      </View>
    );
  }

  // Unlimited, with alert ticks (tokens/scrapes) — used count + dashed tick track.
  if (ticks) {
    return (
      <View className="py-2.5">
        <View className="flex-row items-center justify-between">
          <Txt weight="medium" className="text-[13px] text-ink">{m.label}</Txt>
          <Txt className="text-[12px] text-ink-3">Unlimited</Txt>
        </View>
        <Txt className="text-[11px] text-ink-3">
          {m.unit ? `${num(m.used)} ${m.unit}` : `${num(m.used)} used`}
        </Txt>
        <AlertTrack thresholds={m.alertThresholds!} />
        <Txt className="mt-1 text-[11px] text-ink-3">Alerts at {m.alertThresholds!.join(' · ')}%</Txt>
        {m.shares && <ShareRows shares={m.shares} />}
      </View>
    );
  }

  // Unlimited, plain (stories/personas) — just the used count.
  return (
    <View className="flex-row items-center justify-between py-2.5">
      <Txt weight="medium" className="text-[13px] text-ink">{m.label}</Txt>
      <Txt className="text-[12px] text-ink-3">
        {m.used > 0 ? `${num(m.used)} used · Unlimited` : 'Unlimited'}
      </Txt>
    </View>
  );
}

function AlertsSummary({ metrics }: { metrics: IUsageQuotaMetric[] }) {
  const [open, setOpen] = useState(false);
  const withAlerts = metrics.filter((m) => m.alertThresholds);
  if (withAlerts.length === 0) return null;
  const summary = withAlerts.map((m) => `${m.group} at ${m.alertThresholds!.join(', ')}%`).join('  ·  ');
  return (
    <Card className="gap-0">
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row items-center gap-2.5">
        <IconBell size={16} color={colors.ink2} />
        <View className="min-w-0 flex-1">
          <Txt weight="semibold" className="text-[13px]">Usage alerts</Txt>
          <Txt numberOfLines={open ? undefined : 1} className="mt-0.5 text-[11px] text-ink-3">{summary}</Txt>
        </View>
        <IconChevronDown size={16} color={colors.ink3} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open && (
        <Txt className="mt-2.5 text-[12px] leading-[17px] text-ink-3">
          You’ll be emailed when a tracked metric crosses these thresholds. Editing alerts is coming next.
        </Txt>
      )}
    </Card>
  );
}

export default function UsageScreen() {
  const { data, isLoading } = useUsageReport();
  const metrics = data?.metrics ?? [];
  const attention = metrics
    .filter((m) => m.limit !== null && sevOf(pctOf(m)) !== 'ok')
    .sort((a, b) => (pctOf(b) ?? -1) - (pctOf(a) ?? -1));
  const ranked = [...metrics].sort(
    (a, b) => (pctOf(b) ?? -1) - (pctOf(a) ?? -1) || a.label.localeCompare(b.label),
  );
  const top = ranked[0];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <BackHeader title="Usage" />
      {isLoading ? (
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 28, gap: 14 }}
          showsVerticalScrollIndicator={false}>
          {/* Attention panel */}
          <Card className="gap-0">
            {attention.length > 0 ? (
              <>
                <View className="flex-row items-center gap-2">
                  <IconAlertTriangle size={18} color={RED} />
                  <Txt weight="bold" className="text-[15px]">
                    {attention.length} {attention.length === 1 ? 'limit needs' : 'limits need'} attention
                  </Txt>
                </View>
                <View className="mt-2 gap-1">
                  {attention.map((m) => (
                    <Txt key={m.key} className="text-[13px] leading-[19px] text-ink-2">
                      {m.label} is at <Txt weight="semibold" className="text-[13px]">{pctOf(m)}%</Txt> of{' '}
                      {num(m.limit as number)}.
                    </Txt>
                  ))}
                </View>
                <Pressable
                  onPress={() => router.push('/subscription')}
                  className="mt-3 items-center self-start rounded-full bg-ink px-4 py-2.5 active:opacity-80">
                  <Txt weight="semibold" className="text-[13px] text-white">Upgrade plan</Txt>
                </Pressable>
              </>
            ) : (
              <View className="flex-row items-center gap-2">
                <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: GREEN }}>
                  <IconCheck size={15} color="#ffffff" />
                </View>
                <View className="min-w-0 flex-1">
                  <Txt weight="bold" className="text-[15px]">All limits healthy</Txt>
                  {top && (
                    <Txt className="text-[12px] text-ink-3">Highest is {top.label} at {pctOf(top) ?? 0}%.</Txt>
                  )}
                </View>
              </View>
            )}
          </Card>

          {/* Quota table */}
          {GROUPS.map((g) => {
            const rows = metrics.filter((m) => m.group === g.key);
            if (rows.length === 0) return null;
            const tracked = rows.some(isTracked);
            return (
              <Card key={g.key} className="gap-0">
                <View className="flex-row items-center justify-between">
                  <Txt mono weight="semibold" className="text-[11px] uppercase tracking-wider text-ink-3">
                    {g.label}
                  </Txt>
                  {tracked && data?.resetDate ? (
                    <View className="flex-row items-center gap-1">
                      <IconClock size={12} color={colors.ink3} />
                      <Txt className="text-[11px] text-ink-3">Resets {fmtDate(data.resetDate)}</Txt>
                    </View>
                  ) : (
                    <Txt className="text-[11px] text-ink-3">No limit on this plan</Txt>
                  )}
                </View>
                <View className="mt-1">
                  {rows.map((m, i) => (
                    <View key={m.key} className={i > 0 ? 'border-t border-border' : ''}>
                      <MetricRow m={m} />
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}

          {/* Usage alerts summary */}
          <AlertsSummary metrics={metrics} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
