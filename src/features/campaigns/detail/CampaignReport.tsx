import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';
import type { ICampaignReport } from '@/types';

// The Report write-up — a headline plus "where we stand / what it means / what to do now"
// sections. A lean version of the web's CampaignReportPage (charts stubbed as prose).
export function CampaignReport({ report }: { report: ICampaignReport }) {
  return (
    <View className="gap-3.5">
      <Txt weight="bold" className="text-[18px] leading-[25px]">
        {report.headline}
      </Txt>
      {report.sections.map((s) => (
        <Card key={s.heading} className="gap-0">
          <Txt mono weight="medium" className="text-[11px] uppercase tracking-wide text-ink-3">
            {s.heading}
          </Txt>
          <Txt className="mt-1.5 text-[14px] leading-[21px] text-ink">{s.body}</Txt>
        </Card>
      ))}
    </View>
  );
}
