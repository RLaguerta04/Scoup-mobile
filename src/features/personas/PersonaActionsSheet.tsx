import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { IconCopy, IconEye, IconPencil, IconStar, IconTrash } from '@/components/navIcons';
import { Txt } from '@/components/ui/Txt';
import { renderBackdrop, sheetSurface } from '@/components/sheets/sheet';
import { colors } from '@/theme/tokens';
import type { IPersona } from '@/types';

// The per-card overflow (⋮) menu — the web PersonaCard's action icons. View / Edit /
// Duplicate / Delete, plus "Set as primary" when the persona isn't already the primary.
export type PersonaActionsHandle = { present: (persona: IPersona) => void };

export const PersonaActionsSheet = forwardRef<
  PersonaActionsHandle,
  {
    onView: (p: IPersona) => void;
    onEdit: (p: IPersona) => void;
    onDuplicate: (p: IPersona) => void;
    onDelete: (p: IPersona) => void;
    onSetPrimary: (p: IPersona) => void;
  }
>(({ onView, onEdit, onDuplicate, onDelete, onSetPrimary }, ref) => {
  const sheet = useRef<BottomSheetModal>(null);
  const [persona, setPersona] = useState<IPersona | null>(null);
  const snapPoints = useMemo(() => (persona?.active ? ['42%'] : ['50%']), [persona?.active]);

  useImperativeHandle(ref, () => ({
    present: (p) => {
      setPersona(p);
      sheet.current?.present();
    },
  }));

  const run = (fn: (p: IPersona) => void) => () => {
    const p = persona;
    sheet.current?.dismiss();
    if (p) fn(p);
  };

  const Row = ({
    icon: Icon,
    label,
    onPress,
    danger,
  }: {
    icon: React.ComponentType<{ size?: number; color?: string }>;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <Pressable onPress={onPress} className="flex-row items-center rounded-xl bg-surface2 px-3 py-3.5">
      <Icon size={19} color={danger ? '#e34948' : colors.ink2} />
      <Txt weight="medium" className="ml-3 text-[14px]" style={danger ? { color: '#e34948' } : undefined}>
        {label}
      </Txt>
    </Pressable>
  );

  return (
    <BottomSheetModal ref={sheet} snapPoints={snapPoints} backdropComponent={renderBackdrop} {...sheetSurface}>
      <BottomSheetView>
        <View className="px-4 pb-10 pt-1">
          <Txt weight="semibold" numberOfLines={1} className="text-[15px]">
            {persona?.name ?? 'Persona'}
          </Txt>
          {!!persona?.role && (
            <Txt numberOfLines={1} className="mt-0.5 text-[12px] text-ink-3">{persona.role}</Txt>
          )}

          <View className="mt-4 gap-1.5">
            <Row icon={IconEye} label="View persona" onPress={run(onView)} />
            {!persona?.active && (
              <Row icon={IconStar} label="Set as primary" onPress={run(onSetPrimary)} />
            )}
            <Row icon={IconPencil} label="Edit persona" onPress={run(onEdit)} />
            <Row icon={IconCopy} label="Duplicate persona" onPress={run(onDuplicate)} />
            <Row icon={IconTrash} label="Delete persona" onPress={run(onDelete)} danger />
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

PersonaActionsSheet.displayName = 'PersonaActionsSheet';
