import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Txt } from '@/components/ui/Txt';

// Inline **bold** — bold runs become nested <Txt weight="bold"> (carrying the line's
// colour/size), plain runs stay strings that inherit the parent Txt.
function inline(text: string, cls: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <Txt key={i} weight="bold" className={cls}>
        {p.slice(2, -2)}
      </Txt>
    ) : (
      p
    ),
  );
}

// A lean markdown renderer for release-note bodies: ### headings, **bold**, "- " bullets,
// "---" dividers, and paragraphs. Not a full engine — just enough for the note content.
export function Markdown({ content }: { content: string }) {
  const out: ReactNode[] = [];
  content.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (line === '') return;
    if (line === '---') {
      out.push(<View key={i} className="my-1 h-px bg-border" />);
      return;
    }
    if (line.startsWith('### ')) {
      out.push(
        <Txt key={i} weight="bold" className="mt-1 text-[14px] text-ink">
          {line.slice(4).replace(/\*\*/g, '')}
        </Txt>,
      );
      return;
    }
    if (line.startsWith('- ')) {
      const cls = 'text-[13px] leading-[19px] text-ink-2';
      out.push(
        <View key={i} className="flex-row gap-2">
          <Txt className="text-[13px] text-ink-3">•</Txt>
          <Txt className={`min-w-0 flex-1 ${cls}`}>{inline(line.slice(2), cls)}</Txt>
        </View>,
      );
      return;
    }
    const cls = 'text-[13px] leading-[19px] text-ink-2';
    out.push(
      <Txt key={i} className={cls}>
        {inline(line, cls)}
      </Txt>,
    );
  });
  return <View className="gap-1.5">{out}</View>;
}
