import { Pressable, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';
import { IconTrash } from '@/components/navIcons';
import type { IEmailSendout } from '@/types';

const TYPE_BADGE: Record<IEmailSendout['type'], { label: string; bg: string; text: string }> = {
  daily: { label: 'DAILY', bg: '#ebffee', text: '#009951' },
  weekly: { label: 'WEEKLY', bg: '#fff3e0', text: '#b45309' },
  alert: { label: 'ALERT', bg: '#fee9e7', text: '#c00f0c' },
};

export function formatTime(t: string): string {
  if (!t) return '';
  const [hStr, m] = t.split(':');
  const h = Number(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m ?? '00'} ${ampm}`;
}

// A sendout (schedule) summary card — web: ScheduleItem collapsed header. Time/Continuous +
// type badge, subject, bucket badges, and a cadence · recipients line. Tap → editor.
export function SendoutCard({
  sendout,
  bucketNames,
  onOpen,
  onDelete,
}: {
  sendout: IEmailSendout;
  bucketNames: string[];
  onOpen: () => void;
  onDelete: () => void;
}) {
  const badge = TYPE_BADGE[sendout.type];
  const shown = bucketNames.slice(0, 3);
  const extra = bucketNames.length - shown.length;
  const cadence =
    sendout.type === 'alert'
      ? 'Continuous'
      : sendout.type === 'weekly'
        ? sendout.days.length
          ? sendout.days.join(', ')
          : 'Weekly'
        : 'Every day';
  const recipientCount =
    sendout.toEmails.length + sendout.toGroupIds.length + sendout.ccGroupIds.length + sendout.bccGroupIds.length;

  return (
    <Card className="mb-2.5">
      <View className="flex-row items-start" style={{ gap: 10 }}>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${sendout.type} sendout`}
          className="min-w-0 flex-1 active:opacity-80">
          <View className="flex-row flex-wrap items-center" style={{ gap: 8 }}>
            <Txt weight="bold" className="text-[17px]">
              {sendout.type === 'alert' ? 'Continuous' : formatTime(sendout.sendoutTime)}
            </Txt>
            <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
              <Txt mono weight="medium" className="text-[10px] tracking-wide" style={{ color: badge.text }}>
                {badge.label}
              </Txt>
            </View>
          </View>
          <Txt numberOfLines={1} className="mt-1 text-[13px] text-ink-2">
            {sendout.subject || 'No subject line'}
          </Txt>
          {shown.length > 0 && (
            <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 6 }}>
              {shown.map((n) => (
                <View key={n} className="rounded-sm border border-border bg-surface px-2 py-0.5">
                  <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide text-ink-2" numberOfLines={1}>
                    {n}
                  </Txt>
                </View>
              ))}
              {extra > 0 && <Txt weight="medium" className="text-[11px] text-ink-3">+{extra} more</Txt>}
            </View>
          )}
          <Txt className="mt-2 text-[11px] text-ink-3">
            {cadence}
            {recipientCount > 0 ? ` · ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}` : ''}
          </Txt>
        </Pressable>
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete sendout"
          hitSlop={6}
          className="h-8 w-8 items-center justify-center rounded-full active:bg-surface2">
          <IconTrash size={16} color="#c0492f" />
        </Pressable>
      </View>
    </Card>
  );
}
