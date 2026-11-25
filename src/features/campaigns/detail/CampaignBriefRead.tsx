import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { ICampaignBriefRead } from '@/types';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3 border-b border-border py-2.5">
      <Txt mono className="w-24 text-[11px] uppercase tracking-wide text-ink-3">{label}</Txt>
      <Txt className="min-w-0 flex-1 text-[14px] text-ink">{value}</Txt>
    </View>
  );
}

// Pre-launch read: the brief (what's launching + goals/targets) and the background, shown
// before there are any figures. Mirrors the web's Brief/Background screens on phones.
export function CampaignBriefRead({ brief }: { brief: ICampaignBriefRead }) {
  return (
    <View className="gap-3.5">
      {/* Lock state */}
      <View
        className="rounded-xl px-3.5 py-3"
        style={{ backgroundColor: brief.locked ? colors.surface3 : '#fbeccb' }}>
        <Txt
          weight="semibold"
          className="text-[13px]"
          style={{ color: brief.locked ? colors.ink2 : '#8a5a00' }}>
          {brief.locked ? 'Brief locked' : 'Brief not locked'}
        </Txt>
        <Txt className="mt-0.5 text-[12px] leading-[17px]" style={{ color: brief.locked ? colors.ink3 : '#8a5a00' }}>
          {brief.locked
            ? 'The brief is set. From launch day the weekly answer starts here.'
            : 'Lock the brief before launch day so the pre-launch baseline is captured.'}
        </Txt>
      </View>

      {/* What you're launching */}
      <Card className="gap-0">
        <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
          What you’re launching
        </Txt>
        <View className="mt-1.5">
          <Row label="Product" value={brief.product} />
          <Row label="Brand" value={brief.brand} />
          <Row label="Against" value={brief.competitor} />
          <Row label="Launch" value={brief.launchLabel} />
          <Row label="Window" value={brief.windowLabel} />
        </View>
      </Card>

      {/* Goals & targets */}
      <Card className="gap-0">
        <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
          Goals &amp; targets
        </Txt>
        <View className="mt-2 gap-2.5">
          {brief.goals.map((g, i) => (
            <View key={g.short} className="flex-row items-start gap-2.5">
              <Txt mono weight="semibold" className="pt-0.5 text-[10px] text-ink-3">
                {String(i + 1).padStart(2, '0')}
              </Txt>
              <View className="min-w-0 flex-1">
                <Txt weight="semibold" className="text-[13px]">{g.short}</Txt>
                <Txt className="mt-0.5 text-[12px] leading-[17px] text-ink-2">{g.target}</Txt>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Background */}
      <Card className="gap-0">
        <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
          Background
        </Txt>
        <Txt className="mt-1.5 text-[14px] leading-[21px] text-ink">{brief.background}</Txt>
      </Card>
    </View>
  );
}
