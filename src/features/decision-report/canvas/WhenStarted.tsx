import { Txt } from '@/components/ui/Txt';
import { CanvasCard } from './section';

// "WHEN DID IT START" — first moment + busiest hour (web: StartSection).
export function WhenStarted({ started, busiest }: { started: string; busiest: string }) {
  return (
    <CanvasCard className="gap-2">
      <Txt variant="body" className="text-ink-2">{started}</Txt>
      <Txt variant="body" className="text-ink-2">{busiest}</Txt>
    </CanvasCard>
  );
}
