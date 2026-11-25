import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '@/components/BackHeader';
import { Markdown } from '@/components/Markdown';
import { Skeleton } from '@/components/ui/feedback';
import { Txt } from '@/components/ui/Txt';
import { useReleaseNotes } from '@/services/api/queries';
import { TODAY } from '@/lib/dateRange';
import { colors } from '@/theme/tokens';
import type { IReleaseNote } from '@/types';

const ENV: Record<IReleaseNote['environment'], { label: string; bg: string; fg: string }> = {
  dev: { label: 'Development', bg: '#e3edf9', fg: '#2f5b96' },
  staging: { label: 'Staging', bg: '#fdeccb', fg: '#8a5a00' },
  production: { label: 'Production', bg: '#e4f2ea', fg: '#127a53' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const absDate = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};
const relDate = (iso: string): string => {
  const days = Math.round((Date.parse(`${TODAY}T00:00:00Z`) - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const w = Math.round(days / 7);
  return w === 1 ? '1 week ago' : `${w} weeks ago`;
};

function NoteCard({ note, latest }: { note: IReleaseNote; latest: boolean }) {
  const env = ENV[note.environment];
  return (
    <View className="flex-row">
      {/* Timeline spine + node */}
      <View className="mr-3 w-3 items-center">
        <View className="h-3 w-3 rounded-full border-2" style={{ borderColor: colors.ink, backgroundColor: colors.bg }} />
        <View className="mt-1 w-0.5 flex-1 bg-border" />
      </View>

      <View className="min-w-0 flex-1 pb-5">
        <View className="flex-row flex-wrap items-center gap-2">
          <Txt weight="bold" className="text-[16px]">{note.title}</Txt>
          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: env.bg }}>
            <Txt weight="medium" className="text-[10px]" style={{ color: env.fg }}>{env.label}</Txt>
          </View>
          {latest && (
            <View className="rounded-full border px-2 py-0.5" style={{ borderColor: '#9fd6bb', backgroundColor: '#e4f2ea' }}>
              <Txt weight="semibold" className="text-[10px]" style={{ color: '#127a53' }}>Latest</Txt>
            </View>
          )}
        </View>
        <Txt className="mt-1 text-[12px] text-ink-3">
          {absDate(note.created_at)} · {relDate(note.created_at)}
        </Txt>
        {!!note.content && (
          <View className="mt-2.5 rounded-xl border border-border bg-surface p-3.5">
            <Markdown content={note.content} />
          </View>
        )}
      </View>
    </View>
  );
}

// "Release notes" — a timeline of release-note cards (env + Latest badges, dates, markdown
// body). Mirrors the web ReleaseNotesPage; the scroll-spy sidebar + edit flow are deferred.
export default function ReleaseNotesScreen() {
  const { data, isLoading } = useReleaseNotes();
  const notes = data ?? [];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <BackHeader title="Release notes" />
      {isLoading ? (
        <View className="gap-3 px-4 pt-2">
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}>
          {notes.map((n, i) => (
            <NoteCard key={n.id} note={n} latest={i === 0} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
