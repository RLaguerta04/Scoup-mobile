import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BarList } from '@/components/charts/BarList';
import { IconCheck, IconCopy } from '@/components/navIcons';
import { Label, Txt } from '@/components/ui/Txt';
import { colors, sentiment } from '@/theme/tokens';
import { CanvasSection } from './section';
import type { IRankBar } from '@/types';

const RANK_COLOR: Record<IRankBar['tone'], string> = {
  ink: colors.ink,
  risk: sentiment.negative,
  momentum: colors.brand,
};

// Copies the suggested action to the clipboard, flashing a "Copied" state (web: CopyButton).
function CopyAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    // Web clipboard can reject on a permission/focus gate — the feedback already fired.
    try {
      await Clipboard.setStringAsync(text);
    } catch {
      // ignore
    }
  };
  return (
    <Pressable
      onPress={onCopy}
      hitSlop={6}
      className="flex-row items-center self-start rounded-full border border-border bg-surface px-3 py-1.5 active:opacity-80"
      style={{ gap: 6 }}>
      {copied ? <IconCheck size={13} color={sentiment.positive} /> : <IconCopy size={13} color={colors.ink3} />}
      <Txt weight="semibold" className="text-[12px]" style={{ color: copied ? sentiment.positive : colors.ink2 }}>
        {copied ? 'Copied' : 'Copy'}
      </Txt>
    </Pressable>
  );
}

// "WHAT SHOULD BE DONE" — suggested action + next + the Story size / Risk / Momentum bars
// (web: the inline aside + ScoreBars).
export function WhatShouldBeDone({
  suggested,
  next,
  whyRanks,
  note,
}: {
  suggested: string;
  next: string;
  whyRanks: IRankBar[];
  note: string;
}) {
  const toneByLabel = Object.fromEntries(whyRanks.map((r) => [r.label, r.tone]));
  return (
    <CanvasSection kicker="What should be done">
      <Txt variant="body" className="text-ink-2">{suggested}</Txt>
      <View className="mt-2">
        <CopyAction text={suggested} />
      </View>
      <View className="mt-3">
        <Label>Next</Label>
        <Txt variant="body" className="mt-1 text-ink-2">{next}</Txt>
      </View>
      <View className="mt-4">
        <Label>Why it ranks here</Label>
        <View className="mt-2.5">
          <BarList
            items={whyRanks.map((r) => ({ label: r.label, value: r.value }))}
            format={(v) => String(v)}
            colorFor={(label) => RANK_COLOR[toneByLabel[label] ?? 'ink']}
            valueWidth="w-10"
          />
        </View>
        <Txt variant="caption" className="mt-2.5 text-ink-3">{note}</Txt>
      </View>
    </CanvasSection>
  );
}
