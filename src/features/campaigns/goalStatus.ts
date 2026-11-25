import { IconAlertTriangle, IconCheck, IconClock, IconX } from '@tabler/icons-react-native';
import type { ComponentType } from 'react';
import { colors, sentiment } from '@/theme/tokens';
import type { GoalStatus } from '@/types';

type IconComp = ComponentType<{ size?: number; color?: string }>;

// The look of each goal status on a card's health strip — the web's GOAL_STATUS
// (scoup_ui_v2 src/features/campaigns/constants/goalStatus.ts), as native style values.
export interface GoalStatusStyle {
  word: string; // full label (a11y)
  Icon: IconComp;
  fill: string; // the square's background (transparent for 'early')
  glyph: string; // the icon colour
  dashed: boolean; // 'early' is an outline, not a fill
  border: string; // border colour when dashed
}

const AMBER = '#e8890c'; // "at risk" — matches the web's status-watch-bar

export const GOAL_STATUS: Record<GoalStatus, GoalStatusStyle> = {
  good: {
    word: 'On track',
    Icon: IconCheck,
    fill: sentiment.positive, // #159d72
    glyph: '#ffffff',
    dashed: false,
    border: 'transparent',
  },
  warn: {
    word: 'At risk',
    Icon: IconAlertTriangle,
    fill: AMBER,
    glyph: '#ffffff',
    dashed: false,
    border: 'transparent',
  },
  bad: {
    word: 'Off track',
    Icon: IconX,
    fill: sentiment.negative, // #e34948
    glyph: '#ffffff',
    dashed: false,
    border: 'transparent',
  },
  early: {
    word: 'Too early to call',
    Icon: IconClock,
    fill: 'transparent',
    glyph: colors.ink3, // #73726c
    dashed: true,
    border: colors.ink3,
  },
};
