import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { AskSagaButton } from '@/components/AskSagaButton';
import { Screen } from '@/components/ui/Card';
import { UnderlineTabs } from '@/components/ui/controls';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { DecisionReportView } from '@/features/decision-report/DecisionReportView';
import { DailyFeedView } from '@/features/feed/DailyFeedView';
import { SettingsView } from '@/features/settings/SettingsView';

// The Newsletters tab holds the per-newsletter views as sub-tabs (mirrors the web's
// Daily feed / Dashboard / Decision report / Map / Settings sub-nav). The newsletter is
// chosen globally in the header and drives every sub-view.
type NewsletterView = 'feed' | 'dashboard' | 'report' | 'settings';

const VIEW_TABS: { value: NewsletterView; label: string }[] = [
  { value: 'feed', label: 'Daily feed' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'report', label: 'Decision report' },
  { value: 'settings', label: 'Settings' },
];

export default function NewslettersScreen() {
  const [view, setView] = useState<NewsletterView>('feed');

  return (
    <Screen>
      <AppHeader />

      {/* Per-newsletter sub-nav — scrollable so the five views never truncate. */}
      <View className="border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <UnderlineTabs options={VIEW_TABS} value={view} onChange={setView} />
        </ScrollView>
      </View>

      {view === 'feed' ? (
        <DailyFeedView />
      ) : view === 'dashboard' ? (
        <DashboardView />
      ) : view === 'report' ? (
        <DecisionReportView />
      ) : (
        <SettingsView />
      )}

      {/* Floating "Ask Scoup" chat — contextual to the current sub-view. */}
      <AskSagaButton view={view} />
    </Screen>
  );
}
