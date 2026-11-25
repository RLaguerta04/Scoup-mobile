import { Image, Pressable, View } from 'react-native';
import { Card, Divider } from '@/components/ui/Card';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { IClientReportCard } from '@/types';

// The report logos (web: mocks/logos/*.png), at their intrinsic aspect ratios.
const LOGOS: Record<string, { src: number; aspect: number }> = {
  edcom2: { src: require('../../../../assets/images/report-logos/edcom2.png'), aspect: 600 / 139 },
  'ph-auto': { src: require('../../../../assets/images/report-logos/toyota.png'), aspect: 123 / 80 },
};

// A client-report list card (web: ReportListCard). Title + meta + bold lede stat + tag badges +
// "Open ›". The rail tag (E2 / PH) stands in for the desktop logo. Tap → the report detail.
export function ClientReportCard({ card, onOpen }: { card: IClientReportCard; onOpen: () => void }) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${card.title}`}
      className="active:opacity-80">
      <Card className="mb-3">
        <View className="flex-row items-start" style={{ gap: 10 }}>
          <View className="min-w-0 flex-1">
            <Txt weight="bold" className="text-[16px] leading-[21px]">{card.title}</Txt>
            <Txt className="mt-0.5 text-[12px] text-ink-3">{card.meta}</Txt>
          </View>
          {LOGOS[card.id] ? (
            <Image
              source={LOGOS[card.id].src}
              style={{ height: 24, aspectRatio: LOGOS[card.id].aspect, maxWidth: 124 }}
              resizeMode="contain"
              accessibilityLabel={`${card.railLabel} logo`}
            />
          ) : (
            <View className="h-7 items-center justify-center rounded-md bg-ink px-2">
              <Txt mono weight="bold" className="text-[11px] tracking-wide text-white">{card.railTag}</Txt>
            </View>
          )}
        </View>

        <Txt weight="semibold" className="mt-2.5 text-[14px] leading-[20px]">{card.lede}</Txt>

        <Divider className="mt-3" />
        <View className="mt-3 flex-row flex-wrap items-center" style={{ gap: 6 }}>
          {card.tags.map((t) => (
            <Pill key={t.label} label={t.label} tone={t.isLine ? 'default' : 'neutral'} />
          ))}
          <View className="ml-auto flex-row items-center">
            <Txt weight="medium" className="text-[13px]" style={{ color: colors.link }}>Open ›</Txt>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
