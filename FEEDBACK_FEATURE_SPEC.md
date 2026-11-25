# In-App Feedback & Commenting — Implementation Spec

**Status:** Draft for review (no code written yet)
**Scope:** Prototype-only, offline, on-device feedback capture with element-level anchoring and shareable export
**Target:** `scoup-mobile` (Expo SDK 58 / RN 0.88, custom standalone build — not Expo Go)
**Author:** Claude · 2026-11-23

---

## 1. Goal

Let testers leave comments/suggestions **inside** the installed prototype while exploring it, and **anchor each comment to a specific place in the UI** so it's obvious what the feedback refers to. The whole loop must work **fully offline**, and collected feedback must be **shareable back to the team as a single local file** (no server, no cloud account).

## 2. Design principles / constraints

1. **Offline-first.** No network at any point. Everything stored on-device.
2. **Local-only collection.** Feedback leaves a device only when the tester explicitly taps *Share*, via the OS Share sheet (email, Drive, messaging — their choice). The app never uploads anything itself.
3. **Additive & reversible.** No changes to existing screens, data layer, or navigation behavior. The feature is mounted once at the root and is otherwise self-contained under `src/features/feedback/`.
4. **Flag-gated.** Compiled in only when `EXPO_PUBLIC_FEEDBACK=true`. Off → the feature does not render and adds no UI. This keeps it out of any future production build.
5. **Reuse existing patterns.** The draggable FAB, bottom-sheet composer, SVG, gestures, and type scale all already exist in the repo — mirror them, don't reinvent.

## 3. How "anchor to a specific UI element" is solved

React Native has **no queryable DOM** at runtime, so we cannot cheaply identify "the Save button" semantically the way web tools do. Instrumenting every component with hit-testable IDs is invasive and brittle — rejected.

**Chosen approach — pin-on-screenshot** (the Figma / Marker.io / BugHerd model):
- Freeze the current screen to an image.
- The tester taps exactly on the element they mean → a numbered pin is dropped there.
- The screenshot + pin coordinates are stored with the comment.

This gives unambiguous "which element" context **visually**, with zero per-component instrumentation. Pin coordinates are stored **normalized (0..1)** so they render correctly at any screen size in both the in-app inbox and the exported HTML report.

## 4. Architecture overview

```
app/_layout.tsx (root)
└── providers … 
    ├── <View ref={appShotRef}>           ← wraps ONLY app content (capture target)
    │     └── <Stack> … all routes …
    └── {FEEDBACK_ENABLED && <FeedbackLayer shotRef={appShotRef} />}   ← sibling overlay
          ├── <FeedbackFab/>               draggable button, on every screen
          ├── <FeedbackActionMenu/>        "Comment on screen / Quick note / My feedback"
          ├── <AnnotationOverlay/>         screenshot + tap-to-pin
          ├── <FeedbackComposerSheet/>     category + text + save
          └── <NamePromptSheet/>           first-run reviewer name
```

Because `FeedbackLayer` is a **sibling** of the capture-wrapped `<Stack>`, the FAB / menu / overlay are never part of the screenshot — no timing hacks, no "hide then capture" race.

## 5. Dependencies to add

| Package | Purpose | Notes |
|---|---|---|
| `react-native-view-shot` | Capture the current screen to an image | `captureRef(appShotRef)`; autolinks; needs rebuild |
| `expo-file-system` | Persist comments JSON + screenshot files + write the export bundle | Expo module, autolinks |
| `expo-sharing` | Open the OS Share sheet on the export file | Expo module, autolinks |

Already present and reused: `@gorhom/bottom-sheet`, `react-native-svg`, `react-native-gesture-handler`, `react-native-reanimated`, `expo-clipboard`, `expo-constants`, `expo-device`, `zustand`.

> All three new libs are offline and bundle into the custom build. **This is why the feature should land before the first APK build** — adding native modules requires a rebuild anyway.

## 6. Data model — `src/features/feedback/types.ts`

```ts
export type FeedbackCategory = 'bug' | 'idea' | 'love' | 'question';

export interface FeedbackPin {
  id: string;
  xPct: number;   // 0..1, relative to screenshot width
  yPct: number;   // 0..1, relative to screenshot height
  index: number;  // display number (1,2,3…) within the comment
}

export interface FeedbackComment {
  id: string;
  createdAt: string;        // ISO — runtime Date is fine on-device
  updatedAt: string;
  reviewer: string;         // name/initials from the session
  route: string;            // usePathname(), e.g. "/story/42"
  routeTitle?: string;      // optional friendly label
  category: FeedbackCategory;
  text: string;
  screenshotFile?: string;  // filename under shots/, omitted for quick notes
  screenshotW?: number;     // captured px size (for aspect ratio)
  screenshotH?: number;
  pins: FeedbackPin[];      // [] for quick notes
  appVersion: string;       // from expo-constants
  deviceLabel?: string;     // from expo-device (e.g. "Pixel 7 · Android 14")
}

export interface FeedbackSession {
  reviewer: string;
  createdAt: string;
}
```

## 7. On-device storage — `src/features/feedback/storage.ts`

Uses `expo-file-system` `documentDirectory` (private to the app, survives restarts, cleared on uninstall):

```
<documentDirectory>/feedback/
  session.json              # FeedbackSession
  index.json                # FeedbackComment[]  (metadata only, no image bytes)
  shots/<commentId>.jpg     # one screenshot per pinned comment
```

- Screenshots saved as **JPEG, quality ~0.7, max width ~1080px** → ~100–300 KB each.
- `storage.ts` exposes: `loadSession`, `saveSession`, `loadComments`, `saveComment`, `deleteComment`, `clearAll`, `saveShot(id, tmpUri) → filename`, `shotUri(filename)`.
- Writes are through-functions called by the store so the JSON index and image files never drift.

## 8. State — `src/stores/feedbackStore.ts` (zustand, mirrors existing stores)

```ts
interface FeedbackState {
  hydrated: boolean;
  session: FeedbackSession | null;
  comments: FeedbackComment[];
  hydrate: () => Promise<void>;          // read storage on first mount
  setReviewer: (name: string) => Promise<void>;
  addComment: (c: FeedbackComment) => Promise<void>;
  updateComment: (id: string, patch: Partial<FeedbackComment>) => Promise<void>;
  removeComment: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}
```

In-memory for snappy UI, each mutation writes through to `storage.ts`. Hydrated once from `FeedbackLayer` on mount.

## 9. Component inventory

### New files
| File | Responsibility |
|---|---|
| `src/lib/featureFlags.ts` | `export const FEEDBACK_ENABLED = (process.env.EXPO_PUBLIC_FEEDBACK ?? 'false') === 'true';` |
| `src/features/feedback/types.ts` | Data model (section 6) |
| `src/features/feedback/storage.ts` | File-system persistence (section 7) |
| `src/stores/feedbackStore.ts` | Zustand store (section 8) |
| `src/features/feedback/FeedbackLayer.tsx` | Root orchestrator: hydrate, hold FAB + menu + overlay + composer, run capture→annotate→compose flow |
| `src/components/FeedbackFab.tsx` | Draggable button (mirror `AskSagaButton` + a `feedbackFabPositionStore`) |
| `src/features/feedback/FeedbackActionMenu.tsx` | Small sheet: *Comment on screen · Quick note · My feedback* |
| `src/features/feedback/AnnotationOverlay.tsx` | Full-screen screenshot + tap-to-drop numbered pins (SVG), "Add note" CTA |
| `src/features/feedback/FeedbackComposerSheet.tsx` | Category chips + text input + reviewer + Save (mirror `ConfirmSheet`) |
| `src/features/feedback/NamePromptSheet.tsx` | First-run reviewer name capture |
| `src/features/feedback/exportFeedback.ts` | Build bundle → write file → `Sharing.shareAsync` |
| `src/features/feedback/htmlReport.ts` | Generate the self-contained HTML string |
| `src/app/feedback.tsx` | **Inbox** route (pushed card): list by screen, edit/delete, Share/Clear actions |

### Modified files
| File | Change |
|---|---|
| `src/app/_layout.tsx` | Wrap `<Stack>` in `<View ref={appShotRef} style={{flex:1}}>`; render `{FEEDBACK_ENABLED && <FeedbackLayer shotRef={appShotRef}/>}`; add `<Stack.Screen name="feedback" options={{presentation:'card'}}/>` |
| `package.json` | Add the 3 deps (section 5) |
| `app.json` | No config-plugin entries required (all three autolink) |

## 10. Screenshot & pin mechanics

- **Capture:** `captureRef(shotRef, { format: 'jpg', quality: 0.7, result: 'tmpfile' })` → temp uri → `storage.saveShot(id, uri)`. Captures only app content (FAB/menu/overlay excluded by construction).
- **Pin placement:** `AnnotationOverlay` renders the screenshot in a container measured via `onLayout` (`dispW`, `dispH`). On tap at `(tapX, tapY)` → `xPct = tapX/dispW`, `yPct = tapY/dispH`. Pins drawn as numbered SVG circles.
- **Rendering anywhere:** multiply `xPct/yPct` by the current displayed size. Resolution-independent → identical in inbox and HTML report.
- Portrait-locked app (`orientation: portrait`) keeps the math simple (no rotation handling).

## 11. UX flows

**A. First run** — on first launch with the flag on, `NamePromptSheet` asks for a name/initials (skippable → "Anonymous"). Stored in `session.json`, editable later from the inbox.

**B. Comment on a specific element**
1. Tap FAB → menu → **Comment on this screen**.
2. Menu dismisses; `captureRef` grabs the screen.
3. `AnnotationOverlay` shows the frozen screenshot. Tester taps the element(s) → numbered pin(s) drop. (Tap a pin to remove.)
4. Tap **Add note** → `FeedbackComposerSheet`: category chips (🐞 Bug · 💡 Idea · ❤️ Love it · ❓ Question), text, reviewer prefilled → **Save**.
5. Comment persisted with screenshot + pins + route. Brief toast confirms.

**C. Quick note** (fast path, no screenshot) — FAB → **Quick note** → composer opens immediately, tagged to the current route. Save.

**D. My feedback (inbox)** — FAB → **My feedback** (or deep-link `/feedback`): comments grouped by screen; each row = thumbnail with pins + category badge + text + time; tap to edit, swipe/long-press to delete. Header shows counts per category.

**E. Share** — inbox → **Share feedback** → `exportFeedback` builds the bundle → OS Share sheet → tester sends it however they like. Optional **Copy as text** (via `expo-clipboard`) for a quick text-only paste. Optional **Clear all** after sharing.

**F. (Optional) Shake-to-comment** — a shake gesture opens the action menu. Nice-to-have, Phase 3.

## 12. Export format

**Primary: one self-contained `.html` file** — opens in any browser, nothing external required:
- Header: reviewer, device, app version, export date, totals by category.
- One section per screen (grouped by `route`).
- Each comment card: category badge, text, timestamp, and the **screenshot with pins overlaid** (absolutely-positioned numbered dots from `xPct/yPct`). Images inlined as base64.
- A `<script type="application/json">…</script>` block embeds the raw `FeedbackComment[]` in the **same file**, so it's both human-readable and machine-parseable.

Filename: `scoup-feedback-<reviewer>-<YYYYMMDD-HHmm>.html`. Shared via `Sharing.shareAsync(uri, { mimeType: 'text/html' })`.

> Size: ~20 comments with screenshots ≈ 5–8 MB of HTML (base64 adds ~33%). Fine to email/Drive. If a bundle exceeds a soft cap (e.g. 25 MB), warn and offer a text-only (no-screenshot) export.

## 13. Flag-gating & build integration

- `EXPO_PUBLIC_FEEDBACK=true` enables it. Set it for prototype builds via `.env`, the Gradle/CLI env, or an EAS profile `env`. Default/unset → feature absent.
- The UI is fully gated; to additionally strip the native libs from a production build, omit the three deps there (prototype branch keeps them). For a prototype-only app this is optional — dormant native modules are harmless.

## 14. Edge cases & caveats

- **Native map screenshots.** `view-shot` often can't capture native GL/map surfaces (`react-native-maps`), so the Map tab's tile area may come out blank/black; pins on the rest of the screen still work. (Consistent with the known offline-map limitation.)
- **Two FABs on the Newsletters tab.** `AskSagaButton` lives bottom-right there. Default the **feedback FAB to the left edge** to avoid collision; it has its own `feedbackFabPositionStore`.
- **Keyboard.** Composer uses the bottom-sheet keyboard handling already used elsewhere.
- **Multiple testers.** Each device is independent; the reviewer name travels in the export, so merged reports stay attributable.
- **Runtime dates.** `new Date()` / `Date.now()` are fine in the running app (only the build/workflow sandbox forbids them).
- **Storage growth.** JPEG + quality cap keeps it small; inbox shows total size; **Clear all** frees space.
- **Theme.** Match the existing light theme (`colors` tokens, `Txt variant` type scale). The FAB uses a distinct accent (e.g. `colors.brand` / `colors.link`) so it reads as a meta tool, not app chrome.

## 15. Phasing & acceptance criteria

**Phase 1 — core loop (no screenshots)**
- Flag, store, storage, FAB, action menu, quick-note composer, inbox, first-run name, **text/JSON export via Share sheet**.
- ✅ Done when: a tester can leave notes on 3 screens, reopen the app (persisted), and share a file that lists all notes with reviewer + screen + category + time.

**Phase 2 — pin-on-screenshot + rich report**
- `view-shot` capture, `AnnotationOverlay` with pins, screenshot storage, thumbnails in inbox, **self-contained HTML report** with pins drawn.
- ✅ Done when: a tester pins the "Save" button on a screen, writes a note, shares the HTML, and the opened report shows the screenshot with the numbered pin on that button.

**Phase 3 — niceties (optional)**
- Shake-to-comment, freehand arrows/boxes in annotation, per-screen comment badges, "mark exported".

## 16. Open decisions (need Marco's call)

1. **Reviewer identity:** prompt on first launch (recommended, editable) vs ask only at export time?
2. **Export format:** single self-contained HTML (recommended) / JSON only / both separate files?
3. **Annotation richness:** pins only for v1 (recommended), or also freehand drawing/arrows?
4. **After sharing:** keep feedback on device or offer auto-clear?
5. **FAB reach:** show on literally every screen (incl. pushed cards) — recommended — or tabs only?

## 17. Out of scope

- Any cloud sync, accounts, or server-side aggregation.
- iOS build/distribution (Android-only prototype).
- Threaded replies / multi-user conversations (this is one-way reviewer→team capture).
- Automatic merging of multiple testers' exports into one dashboard (could be a later desktop-side script).
