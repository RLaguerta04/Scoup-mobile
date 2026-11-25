import { useCallback, useMemo, useRef } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3 } from 'lucide-react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { IconFilter } from '@/components/navIcons';
import { FilterSheet } from '@/components/sheets/FilterSheet';
import type { SheetHandle } from '@/components/sheets/sheet';
import { SegmentedControl } from '@/components/ui/controls';
import { EmptyState, Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { floatingTabBarClearance } from '@/components/FloatingTabBar';
import { ArticleCardView, PostCardView, StoryCardView } from '@/features/feed/cards';
import { ThisPeriodContent } from '@/features/feed/ThisPeriodContent';
import { useArticles, usePosts, useStories, useThisPeriod } from '@/services/api/queries';
import { useFilterStore } from '@/stores/filterStore';
import {
  countActiveFilters,
  filterSignature,
  useMentionsFilterStore,
} from '@/stores/mentionsFilterStore';
import { usePeriodStore } from '@/stores/periodStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { colors } from '@/theme/tokens';
import type { IArticleItem, IPostItem, IStoryCard, MentionsTab } from '@/types';

// Every source, all three content types (the web dropped the lens toggle — the feed shows
// All unless the plan is MediaWatch-only, which is handled in the data layer, not the UI).
const TABS: MentionsTab[] = ['stories', 'articles', 'posts'];
const TAB_LABEL: Record<MentionsTab, string> = {
  stories: 'Stories',
  articles: 'Articles',
  posts: 'Posts',
};
function SkeletonList() {
  return (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} className="px-4 py-4">
          <Skeleton className="h-3 w-28" />
          <View className="mt-2 flex-row gap-3">
            <View className="flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-full" />
            </View>
            <Skeleton className="h-[72px] w-[72px] rounded-xl" />
          </View>
          <Skeleton className="mt-3 h-3 w-1/2" />
        </View>
      ))}
    </View>
  );
}

// The newsletter's Daily feed — the first sub-view of the Newsletters tab. Pulls the
// globally-selected newsletter/period and renders Stories / Articles / Posts, with the
// "Rank by" control on Stories (press has no BE order) and filters everywhere.
export function DailyFeedView() {
  const insets = useSafeAreaInsets();
  const newsletterId = useSelectionStore((s) => s.newsletterId);
  const bucketId = useSelectionStore((s) => s.bucketId);
  const { tab, setTab, lens } = useFilterStore();

  const rankBy = useMentionsFilterStore((s) => s.rankBy);
  const filters = useMentionsFilterStore((s) => s.filters);
  const filterSig = useMemo(() => filterSignature(filters), [filters]);
  const activeCount = countActiveFilters(filters);
  const from = usePeriodStore((s) => s.from);
  const to = usePeriodStore((s) => s.to);
  const range = useMemo(() => ({ from, to }), [from, to]);

  const sheetRef = useRef<BottomSheetModal>(null);
  const filterRef = useRef<SheetHandle>(null);
  const snapPoints = useMemo(() => ['92%'], []);
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.3} />
    ),
    [],
  );

  const stories = useStories(newsletterId, range, lens, rankBy, filterSig, bucketId);
  const posts = usePosts(newsletterId, lens, filterSig, bucketId);
  const articles = useArticles(newsletterId, lens, filterSig, bucketId);
  const period = useThisPeriod(newsletterId, range);

  const loading =
    tab === 'stories' ? stories.isLoading : tab === 'posts' ? posts.isLoading : articles.isLoading;
  const data: (IStoryCard | IPostItem | IArticleItem)[] =
    tab === 'stories' ? stories.data ?? [] : tab === 'posts' ? posts.data ?? [] : articles.data ?? [];

  const renderItem = useCallback(
    ({ item }: { item: IStoryCard | IPostItem | IArticleItem }) => {
      if (tab === 'stories') return <StoryCardView story={item as IStoryCard} lens={lens} rankBy={rankBy} />;
      if (tab === 'posts') return <PostCardView post={item as IPostItem} />;
      return <ArticleCardView article={item as IArticleItem} />;
    },
    [tab, lens, rankBy],
  );

  return (
    <View className="flex-1">
      <FlatList
        style={{ flex: 1 }}
        data={loading ? [] : data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View className="flex-row items-center gap-2 px-4 pb-2 pt-3">
            {/* Content type */}
            <View className="flex-1">
              <SegmentedControl
                options={TABS.map((v) => ({
                  value: v,
                  label: TAB_LABEL[v],
                  count:
                    v === 'stories'
                      ? stories.data?.length
                      : v === 'articles'
                        ? articles.data?.length
                        : posts.data?.length,
                }))}
                value={tab}
                onChange={setTab}
              />
            </View>
            {/* Filters (the "Rank by" control lives inside this sheet, Stories tab only) */}
            <Pressable
              onPress={() => filterRef.current?.present()}
              hitSlop={6}
              className="flex-row items-center justify-center rounded-full border border-border bg-surface px-2.5 py-2">
              <IconFilter size={16} color={colors.ink} />
              {activeCount > 0 && (
                <View className="ml-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1">
                  <Txt mono className="text-[10px] text-white">
                    {activeCount}
                  </Txt>
                </View>
              )}
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonList />
          ) : (
            <EmptyState title="No results in this selection" hint="Try a wider date range." />
          )
        }
        ItemSeparatorComponent={() => <View className="mx-4 h-px bg-border" />}
        contentContainerStyle={{ paddingBottom: floatingTabBarClearance(insets.bottom) + 72 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => sheetRef.current?.present()}
        className="absolute flex-row items-center self-center rounded-full bg-ink px-5 py-3"
        style={{
          // Sit just above the floating tab bar (which overlays the bottom) so taps land here,
          // not on the bar. Tracks the device's safe-area inset via the shared bar metric.
          bottom: floatingTabBarClearance(insets.bottom) + 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 6,
        }}>
        <BarChart3 size={16} color="#ffffff" />
        <Txt weight="semibold" className="ml-2 text-[13px] text-white">
          This period
        </Txt>
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.bg }}
        handleIndicatorStyle={{ backgroundColor: colors.border }}>
        <BottomSheetScrollView>
          {period.data ? (
            <ThisPeriodContent data={period.data} />
          ) : (
            <View className="p-6">
              <Skeleton className="h-48 w-full" />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      <FilterSheet ref={filterRef} showRankBy={tab === 'stories'} />
    </View>
  );
}
