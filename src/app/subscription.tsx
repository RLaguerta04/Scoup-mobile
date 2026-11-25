import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconCheck } from '@/components/navIcons';
import { BackHeader } from '@/components/BackHeader';
import { Card } from '@/components/ui/Card';
import { Txt } from '@/components/ui/Txt';
import { PLANS, type IPlan } from '@/data/mock/subscriptionPlans';
import { colors } from '@/theme/tokens';

type Billing = 'monthly' | 'yearly';

function Allowance({ a }: { a: IPlan['allowances'][number] }) {
  return (
    <View className="flex-1">
      <Txt mono className="text-[10px] uppercase tracking-wide text-ink-3">{a.title}</Txt>
      <View className="mt-0.5 flex-row items-baseline">
        <Txt weight="bold" className="text-[15px]">{a.value}</Txt>
        {a.unit && <Txt className="ml-0.5 text-[11px] text-ink-3">{a.unit}</Txt>}
      </View>
      <Txt className="text-[10px] text-ink-3">{a.sub}</Txt>
    </View>
  );
}

function PlanCard({ plan, billing }: { plan: IPlan; billing: Billing }) {
  const outline = plan.ctaVariant === 'outline';
  return (
    <Card className="gap-0">
      <View className="flex-row items-center gap-2">
        <Txt weight="bold" className="text-[17px]">{plan.name}</Txt>
        <View className="rounded-full bg-surface3 px-2 py-0.5">
          <Txt mono weight="medium" className="text-[10px] uppercase tracking-wide text-ink-2">
            {plan.scope}
          </Txt>
        </View>
      </View>
      <Txt className="mt-1 text-[12px] leading-[17px] text-ink-3">{plan.tagline}</Txt>

      <View className="mt-3 flex-row items-baseline">
        <Txt weight="bold" className="text-[26px] leading-[30px]">{plan.price[billing]}</Txt>
        {plan.priceNote && <Txt className="ml-2 text-[12px] text-ink-3">{plan.priceNote}</Txt>}
      </View>
      {plan.billingNote && (
        <Txt className="mt-0.5 text-[11px] text-ink-3">{plan.billingNote[billing]}</Txt>
      )}

      <View className="mt-3 flex-row gap-3 rounded-xl bg-surface2 p-3">
        <Allowance a={plan.allowances[0]} />
        <View className="w-px bg-border" />
        <Allowance a={plan.allowances[1]} />
      </View>

      <Txt weight="semibold" className="mt-3 text-[12px] text-ink-2">{plan.featuresHeading}</Txt>
      <View className="mt-1.5 gap-1.5">
        {plan.features.map((f) => (
          <View key={f} className="flex-row items-start gap-2">
            <IconCheck size={15} color={colors.ink3} style={{ marginTop: 1 }} />
            <Txt className="min-w-0 flex-1 text-[13px] leading-[18px] text-ink-2">{f}</Txt>
          </View>
        ))}
      </View>

      <Pressable
        className={`mt-4 items-center rounded-full py-3 active:opacity-80 ${outline ? 'border border-border bg-surface' : 'bg-ink'}`}>
        <Txt weight="semibold" className="text-[14px]" style={{ color: outline ? colors.ink : '#ffffff' }}>
          {plan.cta}
        </Txt>
      </Pressable>
    </Card>
  );
}

// "Subscription" — the web's pricing grid (billing toggle + plan tiers), stacked single
// column on mobile. Static plan data; CTAs are inert (no checkout on mobile).
export default function SubscriptionScreen() {
  const [billing, setBilling] = useState<Billing>('yearly');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <BackHeader title="Subscription" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 28, gap: 14 }}
        showsVerticalScrollIndicator={false}>
        <Txt className="text-[13px] leading-[19px] text-ink-3">
          Pick the plan that fits how many brands you track. Switch or cancel anytime.
        </Txt>

        {/* Billing toggle */}
        <View className="flex-row self-start rounded-full bg-surface3 p-1">
          {(['monthly', 'yearly'] as const).map((b) => {
            const active = billing === b;
            return (
              <Pressable
                key={b}
                onPress={() => setBilling(b)}
                className={`flex-row items-center rounded-full px-3.5 py-1.5 ${active ? 'bg-surface' : ''}`}>
                <Txt weight={active ? 'semibold' : 'medium'} className={`text-[13px] ${active ? 'text-ink' : 'text-ink-3'}`}>
                  {b === 'monthly' ? 'Monthly' : 'Yearly'}
                </Txt>
                {b === 'yearly' && (
                  <Txt weight="semibold" className="ml-1.5 text-[11px]" style={{ color: '#127a53' }}>
                    · Save 17%
                  </Txt>
                )}
              </Pressable>
            );
          })}
        </View>

        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} billing={billing} />
        ))}

        <Txt className="text-center text-[11px] text-ink-3">
          Prices in USD. Allowances are fair-use guidance, not hard caps.
        </Txt>
      </ScrollView>
    </SafeAreaView>
  );
}
