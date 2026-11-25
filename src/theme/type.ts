// The single source of truth for text sizing. Components reference a role (variant) via
// <Txt variant="…">, never a raw px value, so headings stay consistent app-wide. Each level
// is a fixed size + weight + line-height triple. See TYPOGRAPHY.md for the governing rules.
import type { TxtWeight } from '@/components/ui/Txt';

export type TypeVariant =
  | 'display' // a screen's one hero title — at most one per screen
  | 'title' // standard screen + sheet/dialog titles
  | 'section' // a block heading inside a screen, and card / list-row titles
  | 'body' // paragraphs, descriptions, most values
  | 'caption' // secondary meta, dates
  | 'label' // uppercase mono micro-labels / eyebrows
  | 'metric'; // big KPI numerals (StatTile)

export interface TypeSpec {
  size: number;
  lineHeight: number;
  weight: TxtWeight;
  mono?: boolean;
  uppercase?: boolean;
}

// Heading steps differ by ≥3px (22 / 18 / 15) so hierarchy is obvious; the text ramp
// (13 / 12 / 11) stays close but is separated by weight, casing and mono.
export const TYPE: Record<TypeVariant, TypeSpec> = {
  display: { size: 22, lineHeight: 26, weight: 'extrabold' },
  title: { size: 18, lineHeight: 22, weight: 'extrabold' },
  section: { size: 15, lineHeight: 20, weight: 'bold' },
  body: { size: 13, lineHeight: 19, weight: 'regular' },
  caption: { size: 12, lineHeight: 16, weight: 'medium' },
  label: { size: 11, lineHeight: 14, weight: 'medium', mono: true, uppercase: true },
  metric: { size: 20, lineHeight: 24, weight: 'bold' },
};
