import { createContext, useContext } from 'react';
import type { GestureResponderEvent } from 'react-native';

// The evidence-drill handler, supplied by DrillProvider. Null elsewhere, so drillable
// elements fall back to inert (mirrors the web's DrillContext being null off the report).
export type DrillHandler = (spec: string) => void;
export const DrillCtx = createContext<DrillHandler | null>(null);

type DrillProps = {
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityRole?: 'button';
};

// Spread `{...drill(spec)}` onto a Pressable to make it open the node behind `spec`. Returns
// `{}` (inert) when there's no provider or no spec — exactly like the web's useDrill().
export function useDrill(): (spec?: string) => DrillProps {
  const handler = useContext(DrillCtx);
  return (spec) =>
    spec && handler ? { onPress: () => handler(spec), accessibilityRole: 'button' } : {};
}
