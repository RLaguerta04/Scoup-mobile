# Typography — the heading/text scale

One scale, referenced by **role** (not raw px). Defined in [`src/theme/type.ts`](src/theme/type.ts)
and applied through the `variant` prop on the `Txt` primitive
([`src/components/ui/Txt.tsx`](src/components/ui/Txt.tsx)):

```tsx
<Txt variant="title">Thursday 31 December</Txt>
<Txt variant="section">Decide this week</Txt>
<Txt variant="body" className="text-ink-3">…description…</Txt>
```

`variant` sets **size + line-height + default weight/mono**. `className` still sets colour,
margins, alignment, etc. An explicit `weight`/`mono` overrides the variant's default.

## The scale

| Variant | Size / Weight / Leading | Use it for |
|---|---|---|
| `display` | 22 · extrabold · 26 | A screen's one hero title. **Max one per screen**, only when the screen is about a single thing (e.g. a Story headline). Most screens skip it. |
| `title` | 18 · extrabold · 22 | The standard screen title + every sheet/dialog title. |
| `section` | 15 · bold · 20 | A heading that labels a block inside a screen, **and** card / list-row titles. |
| `body` | 13 · regular · 19 | Paragraphs, descriptions, most values. (14 only for a lead paragraph.) |
| `caption` | 12 · medium · 16 | Secondary meta, dates, "written by…". |
| `label` | 11 · mono medium · UPPERCASE | Eyebrow kickers and micro-labels. (The `Label` component is the shortcut.) |
| `metric` | 20 · bold · 24 | Big KPI numerals (`StatTile`). |

## The five rules

1. **Sizes come only from the scale.** No new ad-hoc `text-[Npx]` on headings — add a variant if a role is missing.
2. **One `display` per screen, max.** No hero? The top title is `title` (18).
3. **One role → one size.** Every card title is `section`; every screen title is `title`. Never the same role at two sizes on two screens.
4. **Heading steps differ by ≥3px** (22 / 18 / 15) so bigger is obvious. The text ramp (13 / 12 / 11) stays close but is separated by weight, casing and mono.
5. **Weight carries emphasis within a level**, not a +1px bump. Use `weight="semibold"`, not `15→16`.

## Migration status

Applied: the shared primitives (`Txt`, `StatTile`→`metric`, `SectionHeader`→`title`), the whole
Decision Report page, and every pushed screen-title header (Reports / Campaigns / Recipient groups /
Publishers / bucket config / story canvas / stubs).

Not yet migrated (still hard-coded at the right-ish size, convert opportunistically): the Daily feed
story/article card titles (16–17 → should be `section` 15), the per-story `sections.tsx` headings
(16 → `section`), and the bottom-sheet titles (already 18 = `title`, just not via the variant).
