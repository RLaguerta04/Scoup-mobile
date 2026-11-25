// Release notes mock — IReleaseNote[] with markdown content (mirrors the web's
// GET /api/v1/release-notes/). Newest first; the first is the "Latest".
import type { IReleaseNote } from '@/types';

const NOTES: IReleaseNote[] = [
  {
    id: '1',
    title: 'v2.4',
    environment: 'production',
    created_at: '2026-11-03T10:00:00Z',
    content: `### 📊 Evaluations

**What's New:**

- Evaluation **detail** with Home, Goals and Report tabs
- Every number **opens its evidence** in a sheet
- **New evaluation** flow with a lean brief builder

**UI Improvements:**

- On-track scorecard and goal-health chips on cards`,
  },
  {
    id: '2',
    title: 'v2.3',
    environment: 'staging',
    created_at: '2026-10-27T10:00:00Z',
    content: `### 🗂️ Reports

**What's New:**

- **Bucket groups** — combine buckets into one monthly writeup
- Edit report modules **via chat**

**UI Improvements:**

- Reordered the module list to match the web catalog`,
  },
  {
    id: '3',
    title: 'v2.2',
    environment: 'production',
    created_at: '2026-10-19T10:00:00Z',
    content: `### 📺 Channels

**What's New:**

- Social media **channels** with platform badges and follower counts

---

### 👤 Personas

**What's New:**

- Personas with **dossiers** and a single-primary toggle`,
  },
];

export const getReleaseNotes = (): IReleaseNote[] => NOTES.map((n) => ({ ...n }));
