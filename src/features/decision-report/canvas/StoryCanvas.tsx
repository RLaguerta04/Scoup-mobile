import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@/components/navIcons';
import { UnderlineTabs } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Label, Txt } from '@/components/ui/Txt';
import { useDecisionEdition, useDecisionStoryDetail } from '@/services/api/queries';
import { useSelectionStore } from '@/stores/selectionStore';
import { goBack } from '@/lib/nav';
import { colors } from '@/theme/tokens';
import { TrendBadge, VerdictBadge } from '../badges';
import { BriefSummary } from '../BriefSummary';
import { AcrossTab } from '../tabs/AcrossTab';
import { FeltTab } from '../tabs/FeltTab';
import { GoodNewsTab } from '../tabs/GoodNewsTab';
import { RestTab } from '../tabs/RestTab';
import { DrillProvider } from '../drill/DrillSheet';
import { CanvasNav } from './CanvasNav';
import { HowItUnfolded } from './HowItUnfolded';
import { KeywordHits } from './KeywordHits';
import { MoreOnStory } from './MoreOnStory';
import { ScoupPills } from './ScoupPills';
import { WhatDoPeopleFeel } from './WhatDoPeopleFeel';
import { WhatIsItToYou } from './WhatIsItToYou';
import { WhatShouldBeDone } from './WhatShouldBeDone';
import { WhenStarted } from './WhenStarted';
import { WhoIsInvolved } from './WhoIsInvolved';

// The content sections (web: ReportDocTabs). Like the web, these tabs sit above the story
// canvas: "Stories" IS the selected story's canvas, the other four are edition-wide.
type Section = 'stories' | 'felt' | 'across' | 'good' | 'rest';
const SECTIONS: { value: Section; label: string }[] = [
  { value: 'stories', label: 'Stories' },
  { value: 'felt', label: 'How people felt' },
  { value: 'across', label: 'Across all stories' },
  { value: 'good', label: 'Good news' },
  { value: 'rest', label: 'The rest of the week' },
];
const SECTION_LABEL: Record<Section, string> = {
  stories: 'Stories',
  felt: 'How people felt',
  across: 'Across all stories',
  good: 'Good news',
  rest: 'The rest of the week',
};

// Short title for the prev/next buttons.
const clip = (s: string, n = 28) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// The full Story Canvas (web: ReportStoryCanvas) with the content-section tabs above it, like
// the web's center column. "Stories" shows the selected story's canvas (prev/next walk the
// edition); the other tabs show the edition-wide content. The badge/title/dek/stats come from
// the IDecisionStory in the cached edition; the deep sections from useDecisionStoryDetail.
export function StoryCanvas({ storyId }: { storyId: string }) {
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const { data: edition } = useDecisionEdition(newsletterId, 'weekly');
  const stories = edition?.stories ?? [];

  // Track the selected story by id (known from the route param at first render, so no
  // async seeding effect); prev/next just swap the id. idx is derived once stories load.
  const [selectedId, setSelectedId] = useState(storyId);
  const idx = stories.length ? Math.max(0, stories.findIndex((s) => s.id === selectedId)) : 0;
  const story = stories[idx];
  const { data: detail, isLoading } = useDecisionStoryDetail(newsletterId, story?.id ?? '');

  const [section, setSection] = useState<Section>('stories');

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const toTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });
  const go = (next: number) => {
    if (next < 0 || next >= stories.length) return;
    setSelectedId(stories[next].id);
    toTop();
  };
  const pickSection = (s: Section) => {
    setSection(s);
    toTop();
  };
  // A drilled story record jumps the canvas to that story.
  const jumpTo = (id: string) => {
    setSelectedId(id);
    setSection('stories');
    toTop();
  };

  const headerTitle =
    section !== 'stories'
      ? SECTION_LABEL[section]
      : story
        ? `No. ${idx + 1} of ${stories.length}`
        : 'Story';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-1 px-2 py-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View className="min-w-0 flex-1">
          {!!edition && (
            <Txt numberOfLines={1} className="text-[12px] text-ink-3">
              ✉ {edition.newsletterName}
            </Txt>
          )}
          <Txt variant="title" numberOfLines={1}>
            {headerTitle}
          </Txt>
        </View>
      </View>

      {/* Section tabs — underline tabs (matching the Newsletters sub-nav), scrollable since
          the five labels are long. Above the canvas, like the web's center column. */}
      <View className="border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <UnderlineTabs options={SECTIONS} value={section} onChange={pickSection} />
        </ScrollView>
      </View>

      {!edition ? (
        <View className="gap-3 px-4 pt-4">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </View>
      ) : !story ? (
        <View className="flex-1 items-center justify-center">
          <EmptyState title="Story not found" hint="It may have dropped out of this week's brief." />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}>
          {section === 'felt' ? (
            <FeltTab stories={edition.stories} mostLiked={edition.context.mostLiked} />
          ) : section === 'across' ? (
            <AcrossTab stories={edition.stories} timeline={edition.timeline} />
          ) : section === 'good' ? (
            <GoodNewsTab stories={edition.stories} />
          ) : section === 'rest' ? (
            <RestTab stories={edition.stories} context={edition.context} press={edition.press} />
          ) : (
            <>
              {/* THIS WEEK — the edition lead, at the top of the Stories tab, above the story
                  (web: ReportSummary under the Stories tab) */}
              <View className="mb-4">
                <BriefSummary kicker="This week" leadLine={edition.leadLine} summary={edition.summary} />
              </View>

              <DrillProvider edition={edition} story={story} detail={detail} onOpenStory={jumpTo}>
              {/* 1 — prev/next */}
              <CanvasNav
                index={idx}
                total={stories.length}
                prevTitle={idx > 0 ? clip(stories[idx - 1].title) : undefined}
                nextTitle={idx < stories.length - 1 ? clip(stories[idx + 1].title) : undefined}
                onPrev={() => go(idx - 1)}
                onNext={() => go(idx + 1)}
              />

              {/* 2 — badges */}
              <View className="mt-4 flex-row flex-wrap items-center" style={{ gap: 10 }}>
                <VerdictBadge verdict={story.verdict} />
                <TrendBadge trend={story.trend} momentum={story.momentum} />
                <Txt mono className="text-[11px] text-ink-3">Priority {story.priority}/100</Txt>
              </View>

              {/* 3 — scoup pills */}
              <View className="mt-3">
                <ScoupPills weightedEngagement={story.weightedEngagement} velocity={story.velocity} />
              </View>

              {/* 4 — keyword hits */}
              <View className="mt-3">
                <KeywordHits hits={story.keywordHits} />
              </View>

              {/* 5 — title + what-is-the-story + dek */}
              <Txt variant="display" className="mt-4">{story.title}</Txt>
              <Label className="mt-4">What is the story</Label>
              <Txt variant="body" className="mt-1.5 text-[15px] leading-[22px] text-ink-2">{story.dek}</Txt>

              {/* 6 — stats line */}
              <Txt variant="caption" className="mt-3 text-ink-3">
                {story.comments.toLocaleString()} comments read · {story.negativeCommentsPct}% negative · {story.articles} articles · Momentum {story.momentum} · late share {story.lateSharePct}%
              </Txt>

              {isLoading || !detail ? (
                <View className="mt-6 gap-3">
                  <Skeleton className="h-24 rounded-card" />
                  <Skeleton className="h-40 rounded-card" />
                  <Skeleton className="h-28 rounded-card" />
                </View>
              ) : (
                <>
                  {/* 7 — when did it start */}
                  <View className="mt-7">
                    <Label>When did it start</Label>
                    <View className="mt-2.5">
                      <WhenStarted started={detail.startedText} busiest={detail.busiestHourText} />
                    </View>
                  </View>

                  {/* 8 — how did it unfold */}
                  <View className="mt-7">
                    <Label>How did it unfold</Label>
                    <View className="mt-2.5">
                      <HowItUnfolded
                        windows={detail.briefWindows}
                        hourly={detail.hourly}
                        note={detail.unfoldNote}
                        narrative={detail.unfoldNarrative}
                        moments={detail.moments}
                      />
                    </View>
                  </View>

                  {/* 9 — what is it to you */}
                  <WhatIsItToYou metrics={detail.metrics} />

                  {/* 10 — who is involved */}
                  <WhoIsInvolved
                    note={detail.involvedNote}
                    outlets={detail.outlets}
                    voices={detail.voices}
                    reactions={detail.reactionsSummary}
                  />

                  {/* 11 — what do people feel */}
                  <WhatDoPeopleFeel
                    note={detail.feelNote}
                    analysis={detail.feelAnalysis}
                    tone={detail.tone}
                    personaTone={detail.personaTone}
                    emotions={detail.emotions}
                    trustText={detail.trustText}
                    concentrationText={detail.concentrationText}
                    concentrationDetail={detail.concentrationDetail}
                    sampleComments={detail.sampleComments}
                  />

                  {/* 12 — what should be done */}
                  <WhatShouldBeDone
                    suggested={detail.suggestedAction}
                    next={detail.nextText}
                    whyRanks={detail.whyRanks}
                    note={detail.whyRanksNote}
                  />

                  {/* 13 — more on this story */}
                  <MoreOnStory
                    alertStatus={detail.alertStatus}
                    alertText={detail.alertText}
                    searchVisits={detail.searchVisits}
                    postViews={detail.postViews}
                    topCoverage={detail.topCoverage}
                  />
                </>
              )}
            </DrillProvider>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
