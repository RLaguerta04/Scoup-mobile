import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, ChevronLeft, Download } from 'lucide-react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { CoverageTab, NarrativeTab, SocialTab } from '@/features/story/sections';
import { StoryPanel, type PanelTab } from '@/features/story/StoryPanel';
import { SourceSheet } from '@/features/story/SourceSheet';
import { Card, Divider } from '@/components/ui/Card';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { useStory } from '@/services/api/queries';
import { compact, peso } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { colors, tone as toneColor } from '@/theme/tokens';

type Section = 'narrative' | 'coverage' | 'social';

// Order mirrors the web's Story lens tabs (plain labels — the ALL/MW/SV lens codes are
// internal only and no longer shown on the tab strip).
const TABS: { value: Section; label: string }[] = [
  { value: 'narrative', label: 'Narrative' },
  { value: 'coverage', label: 'Coverage' },
  { value: 'social', label: 'Social posts' },
];

// Compact key-number tile (12 fit in the header card, vs StatTile's 26px value). When `onPress`
// is set the label turns into a blue link (web parity: only Comments and Alignment are links).
function KeyNum({
  label,
  value,
  sub,
  subColor,
  onPress,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      className="w-1/3 pb-3 pr-2"
      {...(onPress ? { onPress, accessibilityRole: 'button', accessibilityLabel: `${label}, ${value}` } : {})}>
      <Txt
        mono
        numberOfLines={3}
        className="text-[9px] uppercase tracking-wide"
        style={{ color: onPress ? colors.link : colors.ink3 }}>
        {label}
      </Txt>
      <Txt weight="bold" className="mt-0.5 text-[18px] leading-tight">
        {value}
      </Txt>
      {sub ? (
        <Txt className="mt-0.5 text-[10px] text-ink-3" style={subColor ? { color: subColor } : undefined}>
          {sub}
        </Txt>
      ) : null}
    </Wrapper>
  );
}

// A key-numbers group — a tile row. No origin header (the desktop rail separates the
// MediaWatch and SharedView groups with a gap, not labels).
function KeyGroup({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap">{children}</View>;
}

export default function StoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: story, isLoading } = useStory(id ?? '');
  const [section, setSection] = useState<Section>('narrative');
  const [toast, setToast] = useState(false);

  // "Charts and comments" — the story's own charts, comments and AI assistant.
  const panelRef = useRef<BottomSheetModal>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('charts');
  // Open the panel on a given tab (the Comments / Alignment key-number links use this).
  const openPanel = useCallback((t: PanelTab) => {
    setPanelTab(t);
    panelRef.current?.present();
  }, []);
  const snapPoints = useMemo(() => ['92%'], []);
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.3} />
    ),
    [],
  );

  const onDownload = () => {
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <View className="flex-row items-center justify-between px-2 py-2">
        <Pressable onPress={goBack} hitSlop={8} className="flex-row items-center p-2">
          <ChevronLeft size={22} color={colors.ink} />
          <Txt weight="semibold" className="ml-0.5 text-[15px]">
            Daily feed
          </Txt>
        </Pressable>
        <Pressable
          onPress={onDownload}
          hitSlop={8}
          className="mr-1 flex-row items-center rounded-full border border-border bg-surface px-3 py-1.5">
          <Download size={14} color={colors.ink2} />
          <Txt mono weight="medium" className="ml-1.5 text-[10px] uppercase tracking-wider text-ink-2">
            Download report
          </Txt>
        </Pressable>
      </View>

      {isLoading ? (
        <View className="p-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-6 h-24 w-full" />
        </View>
      ) : !story ? (
        <EmptyState title="Story not found" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          stickyHeaderIndices={[4]}
          showsVerticalScrollIndicator={false}>
          <Pill label={story.bucketName} />
          <Txt weight="extrabold" className="mt-2 text-[22px] leading-tight">
            {story.title}
          </Txt>
          <Txt className="mt-1.5 text-[12px] text-ink-3">Built for {story.persona}</Txt>
          <Txt className="mt-2 mb-3 text-[14px] leading-relaxed text-ink-2">{story.summary}</Txt>

          <View className="border-b border-border bg-bg pt-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
              <View className="flex-row">
                {TABS.map((t) => {
                  const active = section === t.value;
                  return (
                    <Pressable key={t.value} onPress={() => setSection(t.value)} className="mr-5">
                      <Txt
                        weight={active ? 'bold' : 'medium'}
                        className={`pb-2 text-[14px] ${active ? 'text-ink' : 'text-ink-3'}`}>
                        {t.label}
                      </Txt>
                      <View className={`h-0.5 rounded-full ${active ? 'bg-ink' : 'bg-transparent'}`} />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Key numbers — the groups shown follow the active lens. MediaWatch is trimmed to
              Articles + Outlets (web real-topic view), plus the legacy AVE lines. */}
          <Card className="mt-4">
            {section !== 'social' ? (
              <>
                <KeyGroup>
                  <KeyNum label="Articles" value={String(story.articles)} />
                  <KeyNum label="Outlets" value={String(story.outlets)} />
                  {/* Legacy AVE lines — moved off the feed card; kept here for KPI continuity. */}
                  <KeyNum label="Ad value (legacy)" value={story.adValue > 0 ? peso(story.adValue) : 'Not known'} />
                  <KeyNum label="PR value (legacy)" value={story.prValue > 0 ? peso(story.prValue) : 'Not known'} />
                </KeyGroup>
                <Txt className="mt-1 text-[11px] leading-[15px] text-ink-3">
                  Ad / PR value are legacy AVE lines. AMEC&apos;s Barcelona Principles 4.0 say AVEs should not be
                  used; they are shown for continuity with your KPIs.
                </Txt>
              </>
            ) : null}
            {section === 'narrative' ? <Divider className="my-3" /> : null}
            {section !== 'coverage' ? (
              <KeyGroup>
                <KeyNum label="Posts" value={compact(story.posts)} />
                <KeyNum
                  label="Comments"
                  value={compact(story.comments)}
                  onPress={() => openPanel('comments')}
                />
                <KeyNum label="Score today (Scoup, with views)" value={compact(story.engScore)} />
                <KeyNum
                  label="Velocity"
                  value={`${compact(story.velocity)}/hr`}
                  sub={story.momentum < 0 ? '↓ slowing' : story.momentum > 0 ? '↑ rising' : undefined}
                  subColor={story.momentum < 0 ? toneColor.negative : toneColor.positive}
                />
                <KeyNum
                  label="Alignment"
                  value={`${story.alignment.withPct}%`}
                  sub="with"
                  onPress={() => openPanel('charts')}
                />
              </KeyGroup>
            ) : null}
          </Card>

          {section === 'narrative' ? (
            <NarrativeTab story={story} onOpenTab={setSection} />
          ) : section === 'coverage' ? (
            <CoverageTab story={story} />
          ) : (
            <SocialTab story={story} />
          )}
        </ScrollView>
      )}

      {story ? (
        <>
          <Pressable
            onPress={() => panelRef.current?.present()}
            className="absolute bottom-5 flex-row items-center self-center rounded-full bg-ink px-5 py-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 10,
              elevation: 6,
            }}>
            <BarChart3 size={16} color="#ffffff" />
            <Txt weight="semibold" className="ml-2 text-[13px] text-white">
              Charts &amp; comments
            </Txt>
          </Pressable>

          <BottomSheetModal
            ref={panelRef}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: colors.bg }}
            handleIndicatorStyle={{ backgroundColor: colors.border }}>
            <BottomSheetScrollView>
              <StoryPanel story={story} section={section} tab={panelTab} onTabChange={setPanelTab} />
            </BottomSheetScrollView>
          </BottomSheetModal>
        </>
      ) : null}

      {toast ? (
        <View
          className="absolute bottom-7 self-center rounded-full bg-ink px-4 py-2.5"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 10,
            elevation: 6,
          }}>
          <Txt className="text-[12px] text-white">Report export is coming soon</Txt>
        </View>
      ) : null}

      {/* Opens when a [^n] citation chip in the prose is tapped. */}
      <SourceSheet />
    </SafeAreaView>
  );
}
