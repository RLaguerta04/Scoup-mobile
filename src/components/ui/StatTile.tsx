import { View } from 'react-native';
import { Label, Txt } from './Txt';

export function StatTile({
  label,
  value,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
}) {
  return (
    <View>
      <Label>{label}</Label>
      <Txt variant="metric" className="mt-1">
        {value}
      </Txt>
      {sub ? (
        <Txt variant="caption" className="mt-0.5 text-ink-3" style={subColor ? { color: subColor } : undefined}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}
