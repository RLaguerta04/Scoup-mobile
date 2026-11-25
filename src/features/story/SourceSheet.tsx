import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExternalLink, X } from 'lucide-react-native';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { useSourceSheet } from '@/stores/sourceSheetStore';
import { colors } from '@/theme/tokens';

// The sheet a `[^n]` citation chip opens — the mobile take on the web's footnote popover +
// click-through. A plain absolute overlay (backdrop + bottom card) driven by the source-sheet
// store; deliberately not a gorhom modal so it renders reliably from a store update.
export function SourceSheet() {
  const footnote = useSourceSheet((s) => s.footnote);
  const close = useSourceSheet((s) => s.close);
  const insets = useSafeAreaInsets();

  if (!footnote) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        onPress={close}
        accessibilityLabel="Close source"
        style={StyleSheet.absoluteFill}
        className="bg-black/30"
      />
      <View
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-bg px-5 pt-3"
        style={{
          paddingBottom: 20 + insets.bottom,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
        }}>
        <View className="mb-3 h-1 w-10 self-center rounded-full bg-border" />
        <View className="flex-row items-start justify-between">
          <Pill label={footnote.label} />
          <Pressable onPress={close} hitSlop={8} accessibilityLabel="Close">
            <X size={18} color={colors.ink3} />
          </Pressable>
        </View>
        <Txt weight="bold" className="mt-3 text-[16px] leading-snug">
          {footnote.title}
        </Txt>
        <Txt className="mt-1 text-[12px] text-ink-3">{footnote.source}</Txt>
        <Txt className="mt-3 text-[14px] leading-relaxed text-ink-2">{footnote.preview}</Txt>
        <Pressable
          onPress={() => Linking.openURL(footnote.url)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${footnote.source}`}
          className="mt-4 flex-row items-center self-start rounded-full bg-ink px-4 py-2.5">
          <ExternalLink size={15} color="#ffffff" />
          <Txt weight="semibold" className="ml-2 text-[13px] text-white">
            Open link
          </Txt>
        </Pressable>
        <Txt className="mt-3 text-[11px] text-ink-3" numberOfLines={1}>
          {footnote.url}
        </Txt>
      </View>
    </View>
  );
}
