import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCheck,
  IconTrash,
  IconX,
} from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';

export type KeywordTone = 'main' | 'additional' | 'excluded';

// The three keyword palettes, matching the web KEYWORD_BADGE_COLORS (main=blue,
// additional=green, excluded=red).
const TONES: Record<KeywordTone, { bg: string; text: string; x: string }> = {
  main: { bg: '#eff6ff', text: '#001799', x: '#6b8fd6' },
  additional: { bg: '#ebffee', text: '#009951', x: '#3fb27a' },
  excluded: { bg: '#fee9e7', text: '#c00f0c', x: '#cf6b67' },
};

// A chip-input for a keyword set (the web's TagInput): tags wrap as removable UPPERCASE,
// quote-wrapped badges; typing + Enter (or comma) adds; the footer carries the match rule
// and undo / redo / clear-all. Controlled — the editor owns the array.
export function KeywordTagInput({
  label,
  required,
  tone,
  value,
  onChange,
  placeholder,
  footerLabel,
}: {
  label: string;
  required?: boolean;
  tone: KeywordTone;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  footerLabel: string;
}) {
  const palette = TONES[tone];
  const [draft, setDraft] = useState('');
  // Undo/redo history, local to the field (the editor is pushed fresh per group).
  const [past, setPast] = useState<string[][]>([]);
  const [future, setFuture] = useState<string[][]>([]);

  const commit = (next: string[]) => {
    setPast((p) => [...p, value]);
    setFuture([]);
    onChange(next);
  };

  const addFrom = (text: string) => {
    const tokens = text
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (tokens.length === 0) return;
    const next = [...value];
    for (const t of tokens) if (!next.includes(t)) next.push(t);
    if (next.length !== value.length) commit(next);
    setDraft('');
  };

  const remove = (tag: string) => commit(value.filter((t) => t !== tag));

  const undo = () => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [value, ...f]);
    onChange(prev);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, value]);
    onChange(next);
  };

  return (
    <View>
      <View className="mb-1.5 flex-row items-center" style={{ gap: 6 }}>
        <View className="size-2 rounded-full" style={{ backgroundColor: palette.text }} />
        <Txt weight="semibold" className="text-[14px]">
          {label}
        </Txt>
        {required ? <Txt className="text-[14px]" style={{ color: '#c0492f' }}>*</Txt> : null}
      </View>

      <View className="rounded-xl border border-border bg-surface p-2.5">
        {/* Tags */}
        {value.length > 0 && (
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {value.map((tag) => (
              <View
                key={tag}
                className="flex-row items-center rounded-md py-1 pl-2.5 pr-1.5"
                style={{ backgroundColor: palette.bg, gap: 4 }}>
                <Txt mono weight="medium" className="text-[11px]" style={{ color: palette.text }}>
                  &quot;{tag}&quot;
                </Txt>
                <Pressable onPress={() => remove(tag)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Remove ${tag}`}>
                  <IconX size={13} color={palette.x} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Footer: match rule + undo/redo/clear */}
        {value.length > 0 && (
          <View className="mt-2 flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <IconCheck size={13} color={colors.ink3} />
              <Txt className="text-[11px] text-ink-3">{footerLabel}</Txt>
            </View>
            <View className="flex-row items-center" style={{ gap: 2 }}>
              <IconBtn icon={IconArrowBackUp} onPress={undo} disabled={past.length === 0} label="Undo" />
              <IconBtn icon={IconArrowForwardUp} onPress={redo} disabled={future.length === 0} label="Redo" />
              <View className="mx-0.5 h-4 w-px bg-border" />
              <IconBtn icon={IconTrash} onPress={() => commit([])} disabled={value.length === 0} label="Clear all" danger />
            </View>
          </View>
        )}

        {/* Input */}
        <TextInput
          value={draft}
          onChangeText={(t) => {
            // Treat a trailing comma as a submit so pasted lists chip up.
            if (t.endsWith(',')) addFrom(t);
            else setDraft(t);
          }}
          onSubmitEditing={() => addFrom(draft)}
          blurOnSubmit={false}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          autoCapitalize="characters"
          autoCorrect={false}
          className={`${value.length > 0 ? 'mt-2 border-t border-border pt-2' : ''} px-1 text-[14px] text-ink`}
          style={{ fontFamily: 'Archivo_400Regular' }}
        />
      </View>
    </View>
  );
}

function IconBtn({
  icon: Icon,
  onPress,
  disabled,
  label,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
  disabled?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ opacity: disabled ? 0.3 : 1 }}
      className="h-7 w-7 items-center justify-center rounded-full active:bg-surface2">
      <Icon size={15} color={danger ? '#c0492f' : colors.ink3} />
    </Pressable>
  );
}
