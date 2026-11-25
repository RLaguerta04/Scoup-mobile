import { type ComponentRef, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconChevronLeft,
  IconHistory,
  IconMessage,
  IconPlus,
  IconSend,
} from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { usePersonas } from '@/services/api/queries';
import { goBack } from '@/lib/nav';
import { SagaMark } from '@/components/SagaMark';
import { colors } from '@/theme/tokens';
import type { IPersona } from '@/types';
import {
  SAGA_DESCRIPTION,
  SAGA_VIEW,
  respondToSaga,
  type SagaTurn,
  type SagaView,
} from './sagaChat';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  turn?: SagaTurn;
}

// The newsletter AI assistant ("Saga") — a full-screen contextual chat opened from the
// floating button. Mock-scripted (the web streams a real LLM). Greeting + starters change
// with the view; answers are grounded in the sample feed.
export function SagaChatView({ view }: { view: SagaView }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const idRef = useRef(0);
  const nextId = () => `m-${idRef.current++}`;

  const { data: personas = [] } = usePersonas();
  const [tab, setTab] = useState<'chats' | 'history'>('chats');
  const [persona, setPersona] = useState<IPersona | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');

  const cfg = SAGA_VIEW[view];

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const t = respondToSaga(text, view);
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text },
      { id: nextId(), role: 'assistant', text: t.reply, turn: t },
    ]);
    setInput('');
  };

  const newChat = () => {
    setMessages([]);
    setTab('chats');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center gap-2 px-2 py-2">
        <Pressable
          onPress={goBack}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconChevronLeft size={24} color={colors.ink} />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-1">
          <TabButton
            label="Chats"
            Icon={IconMessage}
            active={tab === 'chats'}
            onPress={() => setTab('chats')}
          />
          <TabButton
            label="History"
            Icon={IconHistory}
            active={tab === 'history'}
            onPress={() => setTab('history')}
          />
        </View>
        <Pressable
          onPress={newChat}
          hitSlop={8}
          accessibilityLabel="New chat"
          className="h-9 w-9 items-center justify-center rounded-full active:bg-surface2">
          <IconPlus size={20} color={colors.ink2} />
        </Pressable>
      </View>

      {tab === 'history' ? (
        <View className="flex-1 items-center justify-center px-8">
          <IconHistory size={28} color={colors.ink3} />
          <Txt weight="semibold" className="mt-3 text-[15px]">
            No past chats yet
          </Txt>
          <Txt className="mt-1 text-center text-[13px] text-ink-3">
            Chats you start here will show up so you can pick them back up.
          </Txt>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center gap-5 px-2">
                <SagaMark size={48} />
                <View className="items-center gap-1.5">
                  <Txt weight="bold" className="text-center text-[20px]">
                    {cfg.title}
                  </Txt>
                  <Txt className="max-w-[320px] text-center text-[14px] leading-[20px] text-ink-3">
                    {SAGA_DESCRIPTION}
                  </Txt>
                </View>
                <View className="gap-2 self-stretch">
                  {cfg.starters.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => send(s)}
                      className="items-center rounded-full border border-border bg-surface px-4 py-2.5 active:opacity-80">
                      <Txt weight="medium" className="text-[13px] text-ink-2">
                        {s}
                      </Txt>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((m) =>
                m.role === 'user' ? (
                  <View key={m.id} className="max-w-[84%] self-end rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5">
                    <Txt className="text-[14px] leading-[20px] text-white">{m.text}</Txt>
                  </View>
                ) : (
                  <View key={m.id} className="max-w-[90%] self-start gap-1.5">
                    {m.turn && (
                      <View className="flex-row items-center gap-1.5 self-start rounded-full border border-border bg-surface px-2.5 py-1">
                        <Txt mono className="text-[10px] text-ink-3">
                          {m.turn.steps} steps · {m.turn.seconds}
                          {m.turn.memory > 0 ? ` · ${m.turn.memory} memory` : ''}
                        </Txt>
                      </View>
                    )}
                    <Txt className="text-[14px] leading-[21px] text-ink">{m.text}</Txt>
                  </View>
                ),
              )
            )}
          </ScrollView>

          {/* Answering as */}
          <View className="border-t border-border bg-bg px-4 pt-2.5">
            <View className="flex-row items-center gap-2">
              <Txt className="text-[12px] text-ink-3">Answering as</Txt>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, flexShrink: 1 }}
                contentContainerStyle={{ gap: 6, paddingRight: 8 }}
                keyboardShouldPersistTaps="handled">
                <PersonaChip label="No persona" active={!persona} onPress={() => setPersona(null)} />
                {personas.map((p) => (
                  <PersonaChip
                    key={p.id}
                    label={p.name}
                    active={persona?.id === p.id}
                    onPress={() => setPersona(p)}
                  />
                ))}
              </ScrollView>
            </View>
            <Txt className="mt-1 text-[11px] text-ink-3">
              {persona ? `Answers written for ${persona.name}.` : 'Objective answers, the same for every reader.'}
            </Txt>

            {/* Composer */}
            <View
              style={{ paddingBottom: Math.max(insets.bottom, 10) }}
              className="mt-2 flex-row items-center gap-2 pb-2.5">
              <View className="flex-1 flex-row items-center rounded-full border border-border bg-surface px-3.5 py-2.5">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => send(input)}
                  returnKeyType="send"
                  placeholder="Type a message…"
                  placeholderTextColor={colors.ink3}
                  className="flex-1 text-[14px] text-ink"
                  style={{ fontFamily: 'Archivo_400Regular', padding: 0 }}
                />
              </View>
              <Pressable
                onPress={() => send(input)}
                disabled={!input.trim()}
                style={{ opacity: input.trim() ? 1 : 0.4 }}
                className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-80">
                <IconSend size={18} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </>
      )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function TabButton({
  label,
  Icon,
  active,
  onPress,
}: {
  label: string;
  Icon: typeof IconMessage;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? 'bg-surface2' : ''}`}>
      <Icon size={14} color={active ? colors.ink : colors.ink3} />
      <Txt weight={active ? 'semibold' : 'medium'} className={`text-[13px] ${active ? 'text-ink' : 'text-ink-3'}`}>
        {label}
      </Txt>
    </Pressable>
  );
}

function PersonaChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${active ? 'border-ink bg-[#fdefd4]' : 'border-border bg-surface'}`}>
      <Txt
        weight="medium"
        numberOfLines={1}
        className={`text-[12px] ${active ? 'text-[#9a6413]' : 'text-ink-2'}`}>
        {label}
      </Txt>
    </Pressable>
  );
}
