import type { ReactNode } from 'react';
import { Txt } from '@/components/ui/Txt';
import { useSourceSheet } from '@/stores/sourceSheetStore';
import { colors } from '@/theme/tokens';
import type { IStoryFootnote } from '@/types';

// Renders BE prose that may carry `[^n]` citation markers (web parity: "Numbered markers open
// their sources"). Each marker becomes a small blue, tappable number that opens the Source sheet
// for the matching footnote. `renderCited` returns inline nodes so it can drop into any <Txt>.

// Inline tokens the prose may carry: `[^n]` citation, `**bold**`, `==highlight==` (quote).
const TOKEN = /\[\^(\d+)\]|\*\*([^*]+)\*\*|==([^=]+)==/g;

// A yellow-highlighted span — the web's notable-quote highlight.
function HighlightText({ children }: { children: string }) {
  return (
    <Txt className="text-ink" style={{ backgroundColor: '#fdf3d4' }}>
      {children}
    </Txt>
  );
}

// Inline, tappable citation marker — a small outlined chip with the number, matching the web's
// footnote marker (muted, thin border, no brackets). A nested <Txt> so it flows within the prose
// on both web and native (an inline <View> chip doesn't lay out inside Text on native Fabric); a
// leading space sits outside the border so the chip doesn't touch the preceding word.
function FootnoteChip({ footnote }: { footnote?: IStoryFootnote }) {
  const open = useSourceSheet((s) => s.open);
  if (!footnote) return null;
  return (
    <>
      {' '}
      <Txt
        mono
        onPress={() => open(footnote)}
        accessibilityRole="button"
        accessibilityLabel={`Source ${footnote.n}: ${footnote.label}`}
        style={{
          fontSize: 9,
          color: colors.ink3,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 4,
          paddingHorizontal: 3.5,
          paddingVertical: 1,
        }}>
        {footnote.n}
      </Txt>
    </>
  );
}

// Split `text` into inline spans: plain text, citation chips, bold spans and highlighted quotes.
export function renderCited(text: string, footnotes: IStoryFootnote[]): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(<Txt key={key++}>{text.slice(last, m.index)}</Txt>);
    if (m[1] != null) {
      const n = Number(m[1]);
      out.push(<FootnoteChip key={key++} footnote={footnotes.find((f) => f.n === n)} />);
    } else if (m[2] != null) {
      out.push(
        <Txt key={key++} weight="bold" className="text-ink">
          {m[2]}
        </Txt>,
      );
    } else if (m[3] != null) {
      out.push(<HighlightText key={key++}>{m[3]}</HighlightText>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Txt key={key++}>{text.slice(last)}</Txt>);
  return out;
}

export function CitedText({
  text,
  footnotes,
  className,
}: {
  text: string;
  footnotes: IStoryFootnote[];
  className?: string;
}) {
  return (
    <Txt className={className ?? 'text-[14px] leading-relaxed text-ink-2'}>
      {renderCited(text, footnotes)}
    </Txt>
  );
}
