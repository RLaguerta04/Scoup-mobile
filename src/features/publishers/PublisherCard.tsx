import { memo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { IconExternalLink, IconWorld } from '@/components/navIcons';
import { SwipeEditDelete } from '@/components/SwipeActions';
import { Checkbox } from '@/components/ui/Checkbox';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { colors } from '@/theme/tokens';
import type { IPublisher } from '@/types';
import { STATUS_LABEL, statusTone, type PublisherStatus } from './status';

const displayUrl = (url: string): string =>
  url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

function Logo({ uri, name }: { uri?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const letter = name.trim()[0]?.toUpperCase() ?? '?';
  return (
    <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-surface3">
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: 22, height: 22 }}
          contentFit="contain"
          transition={120}
          onError={() => setFailed(true)}
        />
      ) : name ? (
        <Txt weight="bold" className="text-[15px] text-ink-3">
          {letter}
        </Txt>
      ) : (
        <IconWorld size={20} color={colors.ink3} />
      )}
    </View>
  );
}

// Swipe a row left to reveal Edit / Delete (replaces the old ⋮ menu). Tapping the row does
// nothing (long-press enters multi-select). Swipe is disabled while selecting.
export const PublisherCard = memo(function PublisherCard({
  publisher,
  buckets,
  selectMode,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onLongPress,
}: {
  publisher: IPublisher;
  buckets?: string[];
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLongPress: () => void;
}) {
  const openUrl = () => {
    const url = publisher.website_url;
    if (url) void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <ReanimatedSwipeable
      enabled={!selectMode}
      friction={2}
      rightThreshold={36}
      overshootRight={false}
      renderRightActions={(_progress, _translation, methods) => (
        <SwipeEditDelete
          onEdit={() => {
            methods.close();
            onEdit();
          }}
          onDelete={() => {
            methods.close();
            onDelete();
          }}
        />
      )}>
      <Pressable
        onPress={selectMode ? onToggleSelect : undefined}
        onLongPress={onLongPress}
        delayLongPress={300}
        className={`flex-row items-center bg-bg px-4 py-3.5 active:bg-surface2 ${selected ? 'bg-surface2' : ''}`}>
        <View className="mr-3">
          <Logo uri={publisher.publisher_logo_url} name={publisher.publisher_name} />
        </View>

        <View className="min-w-0 flex-1">
          <Txt weight="semibold" numberOfLines={1} className="text-[15px] leading-[18px]">
            {publisher.publisher_name || 'Unknown'}
          </Txt>

          {/* Website URL — tappable, opens the browser (stops the card's own press). */}
          <Pressable
            onPress={openUrl}
            hitSlop={4}
            disabled={selectMode}
            className="mt-0.5 flex-row items-center self-start">
            <Txt numberOfLines={1} className="max-w-[220px] text-[12px] leading-[15px] text-link">
              {displayUrl(publisher.website_url) || 'No URL'}
            </Txt>
            {!!publisher.website_url && (
              <IconExternalLink size={12} color={colors.link} style={{ marginLeft: 4 }} />
            )}
          </Pressable>

          {buckets && buckets.length > 0 && (
            <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
              {buckets.map((b) => (
                <View key={b} className="rounded-full bg-surface3 px-2 py-0.5">
                  <Txt weight="medium" numberOfLines={1} className="text-[10px] text-ink-2">
                    {b}
                  </Txt>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="ml-2 flex-row items-center gap-1.5">
          {publisher.status != null && (
            <Pill
              label={STATUS_LABEL[publisher.status as PublisherStatus] ?? publisher.status}
              tone={statusTone(publisher.status)}
            />
          )}
          {selectMode && (
            <View className="p-1">
              <Checkbox checked={selected} />
            </View>
          )}
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
});
