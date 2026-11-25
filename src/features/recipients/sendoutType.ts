import type { ISendoutType } from '@/types';

// The look of each sendout type on a group's "Used in" strip and the legend — the
// web's SENDOUT_TYPE_META (scoup_ui_v2 src/features/recipient-groups/constants), as
// native values. `dot` is the raw hex used for the colored bullet (inline style).
export interface SendoutTypeStyle {
  label: string; // "Daily" — legend
  upper: string; // "DAILY" — chip badge
  dot: string; // bullet color
}

export const SENDOUT_TYPE: Record<ISendoutType, SendoutTypeStyle> = {
  daily: { label: 'Daily', upper: 'DAILY', dot: '#067647' },
  weekly: { label: 'Weekly', upper: 'WEEKLY', dot: '#B45309' },
  alert: { label: 'Alert', upper: 'ALERT', dot: '#B42318' },
};

// Legend order, left to right (matches the web page header).
export const SENDOUT_TYPE_ORDER: ISendoutType[] = ['daily', 'weekly', 'alert'];
