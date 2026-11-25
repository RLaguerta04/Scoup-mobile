import { memo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { IconExternalLink } from '@/components/navIcons';
import { SwipeEditDelete } from '@/components/SwipeActions';
import { Checkbox } from '@/components/ui/Checkbox';
import { Pill } from '@/components/ui/controls';
import { Txt } from '@/components/ui/Txt';
import { STATUS_LABEL, statusTone, type PublisherStatus } from '@/features/publishers/status';
import { compact } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { IChannel } from '@/types';
import { PLATFORM } from './platform';

const displayUrl = (url: string): string => url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

// Neutral avatar (same look as the Publishers logo) carrying a small platform badge in the
// corner. Channels have no logo image in the mock, so the avatar shows the initial letter
// (stripping an @ handle or r/ subreddit prefix); the brand-colored corner chip keeps the
// platform instantly readable.
function ChannelAvatar({ channel }: { channel: IChannel }) {
  const [failed, setFailed] = useState(false);
  const p = PLATFORM[channel.platform];
  const label = (channel.handle || channel.name || '').replace(/^r\//i, '').replace(/^@/, '');
  const letter = label.match(/[a-z0-9]/i)?.[0]?.toUpperCase() ?? '?';
  const showImage = !!channel.logoUrl && !failed;
  return (
    <View className="h-10 w-10">
      <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-surface3">
        {showImage ? (
          <Image
            source={{ uri: channel.logoUrl }}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
            transition={120}
            onError={() => setFailed(true)}
          />
        ) : (
          <Txt weight="bold" className="text-[15px] text-ink-3">
            {letter}
          </Txt>
        )}
      </View>
      <View
        className="absolute items-center justify-center rounded-full"
        style={{
          right: -3,
          bottom: -3,
          height: 18,
          width: 18,
          backgroundColor: p.color,
          borderWidth: 2,
          borderColor: '#ffffff',
        }}>
        <p.Icon size={11} color="#ffffff" />
      </View>
    </View>
  );
}

// Swipe a row left to reveal Edit / Delete (replaces the old ⋮ menu). Tapping the row does
// nothing (long-press enters multi-select). Swipe is disabled while selecting.
export const ChannelCard = memo(function ChannelCard({
  channel,
  buckets,
  selectMode,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onLongPress,
}: {
  channel: IChannel;
  buckets?: string[];
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLongPress: () => void;
}) {
  const openUrl = () => {
    if (channel.profile_url) void Linking.openURL(channel.profile_url).catch(() => undefined);
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
          <ChannelAvatar channel={channel} />
        </View>

        <View className="min-w-0 flex-1">
          <Txt weight="semibold" numberOfLines={1} className="text-[15px] leading-[18px]">
            {channel.handle || channel.name || 'Unnamed source'}
          </Txt>

          {/* Profile URL — tappable, opens the browser (stops the card's own press). */}
          <Pressable
            onPress={openUrl}
            hitSlop={4}
            disabled={selectMode}
            className="mt-0.5 flex-row items-center self-start">
            <Txt numberOfLines={1} className="max-w-[220px] text-[12px] leading-[15px] text-link">
              {displayUrl(channel.profile_url) || 'No URL'}
            </Txt>
            {!!channel.profile_url && (
              <IconExternalLink size={12} color={colors.link} style={{ marginLeft: 4 }} />
            )}
          </Pressable>

          <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
            <Txt mono weight="medium" className="text-[11px] text-ink-2">
              {compact(channel.followers)} followers
            </Txt>
            {buckets?.map((b) => (
              <View key={b} className="rounded-full bg-surface3 px-2 py-0.5">
                <Txt weight="medium" numberOfLines={1} className="text-[10px] text-ink-2">
                  {b}
                </Txt>
              </View>
            ))}
          </View>
        </View>

        <View className="ml-2 flex-row items-center gap-1.5">
          {channel.status != null && (
            <Pill
              label={STATUS_LABEL[channel.status as PublisherStatus] ?? channel.status}
              tone={statusTone(channel.status)}
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
