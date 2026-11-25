import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '@/components/BackHeader';
import { Card } from '@/components/ui/Card';
import { Label, Txt } from '@/components/ui/Txt';
import { useAccount, useChangePassword, useUpdateAccount } from '@/services/api/queries';
import { colors } from '@/theme/tokens';

const GREEN = '#127a53';

function Field({
  label,
  value,
  onChangeText,
  editable = true,
  secureTextEntry,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  placeholder?: string;
}) {
  return (
    <View className="mt-3">
      <Label>{label}</Label>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        autoCapitalize="none"
        autoCorrect={false}
        className={`mt-1.5 rounded-xl border border-border px-3.5 py-2.5 text-[15px] ${editable ? 'bg-surface text-ink' : 'bg-surface2 text-ink-3'}`}
        style={{ fontFamily: 'Archivo_400Regular' }}
      />
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.4 : 1 }}
      className="mt-4 items-center self-start rounded-full bg-ink px-5 py-2.5 active:opacity-80">
      <Txt weight="semibold" className="text-[13px] text-white">{label}</Txt>
    </Pressable>
  );
}

// "Account Info" — editable name + a change-password section (mock mutations). Mirrors the
// web's Personal Information + Security cards; profile-picture upload + forced-logout deferred.
export default function AccountInfoScreen() {
  const { data: account } = useAccount();
  const updateMut = useUpdateAccount();
  const pwMut = useChangePassword();

  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [saved, setSaved] = useState({ first: '', last: '' });
  const [nameSaved, setNameSaved] = useState(false);

  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !account) return;
    seeded.current = true;
    setFirst(account.firstName);
    setLast(account.lastName);
    setSaved({ first: account.firstName, last: account.lastName });
  }, [account]);

  const nameDirty = firstName.trim() !== saved.first || lastName.trim() !== saved.last;
  const saveName = () =>
    updateMut.mutate(
      { firstName, lastName },
      {
        onSuccess: (a) => {
          setSaved({ first: a.firstName, last: a.lastName });
          setNameSaved(true);
        },
      },
    );

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [pwErr, setPwErr] = useState('');
  const [pwDone, setPwDone] = useState(false);

  const changePw = () => {
    setPwErr('');
    setPwDone(false);
    if (!current) {
      setPwErr('Enter your current password.');
      return;
    }
    if (next.length < 8) {
      setPwErr('New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setPwErr('New passwords don’t match.');
      return;
    }
    pwMut.mutate(
      { current, next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
          setPwDone(true);
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <BackHeader title="Account Info" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 40, gap: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Personal Information */}
        <Card className="gap-0">
          <Txt weight="bold" className="text-[15px]">Personal Information</Txt>
          <Field label="First name" value={firstName} onChangeText={(t) => { setFirst(t); setNameSaved(false); }} />
          <Field label="Last name" value={lastName} onChangeText={(t) => { setLast(t); setNameSaved(false); }} />
          <Field label="Email" value={account?.email ?? ''} editable={false} />
          <View className="flex-row items-center gap-3">
            <PrimaryButton label="Save changes" onPress={saveName} disabled={!nameDirty || updateMut.isPending} />
            {nameSaved && !nameDirty && (
              <Txt weight="semibold" className="mt-4 text-[12px]" style={{ color: GREEN }}>✓ Saved</Txt>
            )}
          </View>
        </Card>

        {/* Security */}
        <Card className="gap-0">
          <View className="flex-row items-center justify-between">
            <Txt weight="bold" className="text-[15px]">Security</Txt>
            <Pressable onPress={() => setShow((s) => !s)} hitSlop={6}>
              <Txt weight="medium" className="text-[12px] text-ink-2">{show ? 'Hide' : 'Show'}</Txt>
            </Pressable>
          </View>
          <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry={!show} placeholder="••••••••" />
          <Field label="New password" value={next} onChangeText={setNext} secureTextEntry={!show} placeholder="At least 8 characters" />
          <Field label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry={!show} placeholder="Re-enter new password" />
          {!!pwErr && <Txt className="mt-2 text-[12px]" style={{ color: '#e34948' }}>{pwErr}</Txt>}
          {pwDone && <Txt weight="semibold" className="mt-2 text-[12px]" style={{ color: GREEN }}>✓ Password changed</Txt>}
          <PrimaryButton label="Change password" onPress={changePw} disabled={pwMut.isPending} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
