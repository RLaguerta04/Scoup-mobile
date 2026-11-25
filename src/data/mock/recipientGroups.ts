// Recipient Groups mock — reusable email lists a newsletter's sendout goes to.
// Ported from the web app's handler (scoup_ui_v2/src/mocks/handlers/recipientGroups.ts):
// the eight canonical groups, their descriptions and exactly the "Used in" sendouts
// shown on the web Recipient Groups page. Member counts match the web screenshot
// (7/10/3/7/4/11/9/11); member identities are generated deterministically from a
// Filipino name pool. Unlike a read-only generator this keeps a mutable in-memory
// list so New / Edit / Delete reflect for the session — the shape matches the real
// `*/recipient-groups/` endpoints, so the swap to a backend is invisible.
import type {
  IRecipientGroup,
  IRecipientGroupMemberInput,
  IRecipientGroupUsage,
  ISendoutType,
} from '@/types';
import { intBetween, pick, rngFor, shuffle, type Rand } from './util';

// The three newsletters whose sendouts a group can be wired into (the web fixtures).
const TEL = 'Telecommunications Newsletter';
const BF = 'Banking & Finance Newsletter';
const GPS = 'Government & Public Sector Newsletter';

const SUBJECT: Record<ISendoutType, string> = {
  daily: 'Daily Digest',
  weekly: 'Weekly Roundup',
  alert: 'Breaking Coverage Alert',
};

// A group's definition: its copy, the email domain its members sit on, how many
// members it has, and the sendouts it's used in. The usage order is the order the
// card renders them (first three visible, the rest behind "+N more"), reproducing
// the web page exactly.
interface GroupDef {
  name: string;
  description: string;
  domain: string;
  memberCount: number;
  usedIn: Array<[newsletter: string, type: ISendoutType]>;
}

const GROUP_DEFS: readonly GroupDef[] = [
  {
    name: 'Executive Committee',
    description: 'Senior leadership who receive the flagship daily and weekly digests.',
    domain: 'm2comms.ph',
    memberCount: 7,
    usedIn: [[GPS, 'alert'], [GPS, 'daily'], [BF, 'weekly'], [TEL, 'daily'], [TEL, 'weekly']],
  },
  {
    name: 'Corporate Communications',
    description: 'In-house comms team that drafts statements and monitors coverage.',
    domain: 'm2comms.ph',
    memberCount: 10,
    usedIn: [[TEL, 'alert'], [TEL, 'weekly'], [BF, 'alert'], [GPS, 'weekly']],
  },
  {
    name: 'Regional Managers',
    description: 'Luzon, Visayas, and Mindanao leads looped into regional sendouts.',
    domain: 'scoup.ph',
    memberCount: 3,
    usedIn: [[BF, 'alert'], [BF, 'weekly']],
  },
  {
    name: 'Media Relations',
    description: 'PR and press officers handling journalist inquiries and alerts.',
    domain: 'm2comms.ph',
    memberCount: 7,
    usedIn: [[BF, 'daily'], [GPS, 'daily'], [BF, 'alert'], [TEL, 'daily'], [TEL, 'alert'], [GPS, 'weekly']],
  },
  {
    name: 'Crisis Response Team',
    description: 'On-call group paged for breaking, high-severity coverage alerts.',
    domain: 'scoup.ph',
    memberCount: 4,
    usedIn: [[GPS, 'alert'], [TEL, 'weekly'], [BF, 'alert']],
  },
  {
    name: 'Board of Directors',
    description: 'Board members receiving the curated weekly executive summary.',
    domain: 'm2comms.ph',
    memberCount: 11,
    usedIn: [[GPS, 'alert']],
  },
  {
    name: 'Marketing & Digital',
    description: 'Brand, social, and performance marketing — not yet wired to a sendout.',
    domain: 'scoup.ph',
    memberCount: 9,
    usedIn: [],
  },
  {
    name: 'Government Affairs',
    description: 'Public-sector liaisons tracking policy and regulatory coverage.',
    domain: 'm2comms.ph',
    memberCount: 11,
    usedIn: [],
  },
];

// Name + role pools for generated members (PR/comms org, Filipino names).
const NAMES: readonly string[] = [
  'Ramon del Rosario', 'Maria Clara Santos', 'Joselito Fernandez', 'Andrea Lim',
  'Patrick Villanueva', 'Krista Mercado', 'Noel Bautista', 'Celine Aquino',
  'Miguel Tan', 'Rowena Cruz', 'Carlo Mangahas', 'Bea Gonzales',
  'Enrico Pascual', 'Divina Reyes', 'Francis Lagman', 'Isabel Ocampo',
];

const ROLES: readonly string[] = [
  'Communications Lead', 'PR Manager', 'Media Relations Officer', 'Account Director',
  'Brand Manager', 'Press Officer', 'Head of Comms', 'Digital Strategist',
  'Policy Analyst', 'Regional Lead', 'Executive Assistant', 'Managing Director',
];

// Fixed reference instant (no Date.now) so created/updated stamps are stable.
const BASE_MS = Date.parse('2026-11-04T09:00:00Z');
const DAY_MS = 86_400_000;

const slug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('.');

const buildMembers = (def: GroupDef): IRecipientGroup['members'] => {
  const rand = rngFor(`rg:members:${def.name}`);
  const names = shuffle(rand, NAMES).slice(0, def.memberCount);
  const roles = shuffle(rand, ROLES);
  return names.map((fullName, i) => ({
    id: `rgm_${slug(def.name)}_${i}`,
    email: `${slug(fullName)}@${def.domain}`,
    role: roles[i % roles.length],
    sort_order: i,
  }));
};

const buildUsedIn = (def: GroupDef): IRecipientGroupUsage[] =>
  def.usedIn.map(([newsletter, type], i) => ({
    schedule_id: `sched_${slug(def.name)}_${i}`,
    newsletter_name: newsletter,
    subject: `${newsletter}: ${SUBJECT[type]}`,
    type,
  }));

// Stable id per group name (survives filtering / reload).
const groupId = (name: string): string =>
  `rg_${Math.floor(rngFor(`rg-id:${name}`)() * 0xff_ff_ff_ff)
    .toString(16)
    .padStart(8, '0')}`;

const buildGroups = (): IRecipientGroup[] => {
  const rand = rngFor('recipient-groups:v1');
  return GROUP_DEFS.map((def) => {
    const createdMs = BASE_MS - intBetween(rand, 60, 420) * DAY_MS;
    const updatedMs = BASE_MS - intBetween(rand, 0, 20) * DAY_MS;
    return {
      id: groupId(def.name),
      name: def.name,
      description: def.description,
      created_at: new Date(createdMs).toISOString(),
      updated_at: new Date(updatedMs).toISOString(),
      members: buildMembers(def),
      used_in: buildUsedIn(def),
    };
  });
};

// Mutable session list — New/Edit/Delete operate here. Seeded once at module load.
let GROUPS: IRecipientGroup[] = buildGroups();

// Monotonic counters for ids minted this session (no Date.now / Math.random).
let nextLocalGroupId = 1;
let nextLocalMemberId = 1;

// ─── Reads ───────────────────────────────────────────────────────────────────
export const getRecipientGroups = (): IRecipientGroup[] => GROUPS.map((g) => ({ ...g }));

// ─── Mutations ───────────────────────────────────────────────────────────────
// Create is name + description only — members are added afterward on the detail
// screen (mirrors the web, where the modal creates the shell and the editor fills it).
export const addRecipientGroup = (input: {
  name: string;
  description?: string;
}): IRecipientGroup => {
  const now = new Date(BASE_MS).toISOString();
  const row: IRecipientGroup = {
    id: `rg_local_${nextLocalGroupId++}`,
    name: input.name.trim(),
    description: (input.description ?? '').trim(),
    created_at: now,
    updated_at: now,
    members: [],
    used_in: [],
  };
  GROUPS = [row, ...GROUPS];
  return row;
};

// Edit replaces description and the entire member list (the web's PUT semantics).
// sort_order is re-derived from display order. used_in is read-only (owned by sendouts).
export const updateRecipientGroup = (input: {
  id: string;
  name: string;
  description?: string;
  members: IRecipientGroupMemberInput[];
}): IRecipientGroup | null => {
  let updated: IRecipientGroup | null = null;
  GROUPS = GROUPS.map((g) => {
    if (g.id !== input.id) return g;
    updated = {
      ...g,
      name: input.name.trim() || g.name,
      description: (input.description ?? '').trim(),
      updated_at: new Date(BASE_MS).toISOString(),
      members: input.members.map((m, i) => ({
        id: `rgm_local_${nextLocalMemberId++}`,
        email: m.email.trim(),
        role: m.role.trim(),
        sort_order: i,
      })),
    };
    return updated;
  });
  return updated;
};

export const deleteRecipientGroup = (id: string): { deleted: number } => {
  const before = GROUPS.length;
  GROUPS = GROUPS.filter((g) => g.id !== id);
  return { deleted: before - GROUPS.length };
};
