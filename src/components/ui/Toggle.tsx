import { Pressable, View } from 'react-native';
import { colors } from '@/theme/tokens';

// On/off switch — the one primitive the app was missing. Matches the web Reports
// page's amber toggle (on = scoup yellow). Touch-sized; the knob slides via a style
// transform so no animation dep is needed.
const SCOUP_YELLOW = '#ffba49';

export function Toggle({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange?: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled || !onValueChange}
      onPress={() => onValueChange?.(!value)}
      hitSlop={6}
      style={{ opacity: disabled ? 0.5 : 1 }}
      className="h-[26px] w-[46px] justify-center rounded-full px-0.5"
      // className can't take a runtime color, so the track fill is inline.
    >
      <View
        className="h-[26px] w-[46px] absolute left-0 top-0 rounded-full"
        style={{ backgroundColor: value ? SCOUP_YELLOW : colors.surface4 }}
      />
      <View
        className="h-[20px] w-[20px] rounded-full bg-white"
        style={{
          transform: [{ translateX: value ? 22 : 0 }],
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      />
    </Pressable>
  );
}
