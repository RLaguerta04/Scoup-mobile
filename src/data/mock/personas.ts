// Personas mock — the audiences each brief is written for (the web's Personas page).
// Ported so the names, roles, orgs, dossier sections and coverage-focus previews match
// the web screen. Keeps a mutable in-memory list so Add / Edit / Duplicate / Delete and
// "set primary" reflect for the session; the shape maps onto the real
// /api/v1/persona/artifacts routes, so swapping USE_MOCKS off stays invisible.
import type { IPersona, IPersonaDossier, IPersonaNewsletterRef, IPersonaSection } from '@/types';
import { NEWSLETTERS } from './entities';
import { intBetween, rngFor, type Rand } from './util';

type SectorTheme = 'telco' | 'banking' | 'government';

type PersonaSeed = {
  name: string;
  role: string;
  org: string;
  theme: SectorTheme;
  nls: readonly SectorTheme[]; // newsletters this persona subscribes to (by sector)
  focus: string; // coverage focus — the card preview (user dossier §1.2)
  prompt: string;
  active?: boolean;
};

// Realistic PH media-monitoring personas: telco comms, bank/fintech affairs, government.
const SEEDS: readonly PersonaSeed[] = [
  {
    name: 'Carmela Reyes',
    role: 'Head of Corporate Communications',
    org: 'Globe Telecom',
    theme: 'telco',
    nls: ['telco'],
    focus:
      'Tracks 5G rollout, network reliability, and customer-experience coverage, with alerts on NTC and DICT regulatory moves and competitor campaigns from PLDT and DITO.',
    prompt:
      'Head of Corporate Communications for a national telco. Prioritise broadsheet and online coverage of 5G expansion, network quality, and data pricing. Flag NTC and DICT regulatory stories, competitor moves by PLDT, Smart, and DITO, and any negative sentiment on dropped calls or outages. Deliver executive-ready daily summaries with a clear tone read.',
    active: true,
  },
  {
    name: 'Enrique Villanueva',
    role: 'Public Affairs Director',
    org: 'PLDT',
    theme: 'telco',
    nls: ['telco'],
    focus:
      'Watches fiber and enterprise-connectivity coverage, Senate and NTC hearings on service quality, and reputation risks tied to data-privacy and billing complaints.',
    prompt:
      'Public Affairs Director at PLDT. Monitor policy and regulatory coverage from the NTC, DICT, and the Senate, fiber and enterprise connectivity announcements, and competitor positioning. Escalate stories on service complaints, data privacy, and infrastructure disputes. Prefer a morning digest grouped by issue.',
  },
  {
    name: 'Divina Ocampo',
    role: 'Brand & Reputation Manager',
    org: 'DITO Telecommunity',
    theme: 'telco',
    nls: ['telco'],
    focus:
      'Follows subscriber-growth milestones, tower-rollout news, and social sentiment on DITO network speed versus the two incumbents.',
    prompt:
      'Brand and Reputation Manager at DITO Telecommunity. Track subscriber-growth milestones, tower and coverage expansion, and promo campaigns. Compare share of voice against Globe and PLDT. Surface social sentiment spikes and viral complaints quickly, with sampled posts per platform.',
  },
  {
    name: 'Rafael Mendoza',
    role: 'Chief Communications Officer',
    org: 'BDO Unibank',
    theme: 'banking',
    nls: ['banking'],
    focus:
      'Monitors earnings coverage, BSP rate decisions, and digital-banking features, with early warning on fraud, outage, or service-fee stories that can dent trust.',
    prompt:
      'Chief Communications Officer at BDO Unibank. Prioritise coverage of quarterly earnings, BSP policy-rate decisions, and digital-banking launches. Flag fraud, outage, and service-fee stories as reputational risks. Benchmark share of voice against BPI and Metrobank. Executive digest with sentiment and reach.',
  },
  {
    name: 'Patricia Lim',
    role: 'Head of Corporate Affairs',
    org: 'GCash',
    theme: 'banking',
    nls: ['banking'],
    focus:
      'Tracks e-wallet adoption milestones, BSP and SEC regulatory signals on digital finance, and user sentiment on app reliability and transaction fees.',
    prompt:
      'Head of Corporate Affairs at GCash. Monitor e-wallet adoption and user-milestone coverage, BSP and SEC regulation of digital finance and online lending, and partnerships. Watch sentiment on app downtime, failed transactions, and fees. Compare against Maya. Include per-platform social readouts.',
  },
  {
    name: 'Ferdinand Aquino',
    role: 'Media Relations Lead',
    org: 'Bangko Sentral ng Pilipinas',
    theme: 'banking',
    nls: ['banking', 'government'],
    focus:
      'Follows inflation and policy-rate reporting, peso and remittance stories, and how the central bank messaging lands across broadsheet, broadcast, and online.',
    prompt:
      'Media Relations Lead at the Bangko Sentral ng Pilipinas. Track inflation, policy-rate, peso, and remittance coverage, plus commentary on BSP regulations. Measure how official statements are picked up and framed across mediums. Neutral, factual digest with prominent-quote tracking.',
  },
  {
    name: 'Maria Clara Dizon',
    role: 'Spokesperson',
    org: 'Department of Information and Communications Technology',
    theme: 'government',
    nls: ['government', 'telco'],
    focus:
      'Watches national broadband and e-governance coverage, telco-regulation stories, and public sentiment on connectivity gaps in the provinces.',
    prompt:
      'Spokesperson for the DICT. Monitor coverage of the national broadband programme, e-governance rollouts, free public Wi-Fi, and telco regulation. Flag criticism on project delays and connectivity gaps. Track sentiment by region. Daily digest segmented by programme.',
  },
  {
    name: 'Gregorio Panganiban',
    role: 'Director, Public Information Office',
    org: 'Department of Public Works and Highways',
    theme: 'government',
    nls: ['government'],
    focus:
      'Monitors flood-control and road-project coverage, budget-utilisation scrutiny, and local sentiment around delayed or disputed infrastructure.',
    prompt:
      'Director of the DPWH Public Information Office. Prioritise coverage of flood-control, road, and bridge projects, budget-utilisation reports, and audit findings. Escalate corruption allegations and project-delay stories. Track provincial and NCR sentiment. Issue-grouped morning digest.',
  },
  {
    name: 'Luzviminda Castro',
    role: 'Assistant Secretary for Communications',
    org: 'Department of Budget and Management',
    theme: 'government',
    nls: ['government'],
    focus:
      'Tracks national-budget and GAA coverage, agency fund-release milestones, and how fiscal messaging is received by business and civil-society commentators.',
    prompt:
      'Assistant Secretary for Communications at the DBM. Monitor national-budget, GAA, and fund-release coverage, plus commentary from economists and civil society. Flag misinformation on budget allocations. Measure reach and tone of official releases. Executive summary with correction tracking.',
  },
  {
    name: 'Antonio Bautista',
    role: 'Head of Investor Relations',
    org: 'Metrobank',
    theme: 'banking',
    nls: ['banking'],
    focus:
      'Monitors earnings and analyst coverage, BSP rate signals, and capital or dividend news, tracking how results are framed by business media.',
    prompt:
      'Head of Investor Relations at Metrobank. Monitor earnings, analyst notes, BSP rate decisions, and capital or dividend announcements. Track share of voice against BDO and BPI and sentiment on guidance. Concise daily brief with prominence and reach scoring.',
  },
  {
    name: 'Sheila Marquez',
    role: 'Head of Marketing Communications',
    org: 'Converge ICT',
    theme: 'telco',
    nls: ['telco'],
    focus:
      'Tracks fiber-expansion and broadband-speed coverage, promo campaigns, and customer sentiment on installation and after-sales service.',
    prompt:
      'Head of Marketing Communications at Converge ICT. Monitor fiber-expansion and broadband-speed coverage, promos, and awards. Compare against PLDT Home and Globe At Home. Watch sentiment on installation backlogs and after-sales service, with sampled social posts. Daily digest.',
  },
  {
    name: 'Jose Mari Tan',
    role: 'Government Affairs Manager',
    org: 'Maya Bank',
    theme: 'banking',
    nls: ['banking', 'government'],
    focus:
      'Follows digital-bank licensing and BSP policy, government-disbursement partnerships, and sentiment on app reliability and lending practices.',
    prompt:
      'Government Affairs Manager at Maya Bank. Monitor BSP digital-bank regulation, SEC rules on online lending, and government-disbursement partnerships. Track policy signals and competitor GCash. Flag sentiment on app downtime and collections practices. Policy-focused daily digest.',
  },
];

const SECTOR_LABEL: Readonly<Record<SectorTheme, string>> = {
  telco: 'Telecommunications',
  banking: 'Banking & Finance',
  government: 'Government & Public Sector',
};

const ORG_OVERVIEW: Readonly<Record<SectorTheme, (org: string) => string>> = {
  telco: (org) =>
    `${org} is a Philippine telecommunications and digital-services provider competing on network quality, subscriber growth, and enterprise connectivity.`,
  banking: (org) =>
    `${org} is a Philippine financial institution operating across retail, digital, and enterprise banking under Bangko Sentral ng Pilipinas supervision.`,
  government: (org) =>
    `${org} is a national government agency accountable for public-service delivery and the transparent use of public funds.`,
};

const REPUTATION: Readonly<Record<SectorTheme, string>> = {
  telco: 'Reputation turns on network reliability and the transparent handling of outages, billing, and data-pricing issues.',
  banking: 'Reputation turns on trust and security, and on how quickly fraud, outage, and fee-related issues are addressed.',
  government: 'Reputation turns on timely delivery, transparent budgets, and credible responses to audit findings and project delays.',
};

const COMPETITORS: Readonly<Record<SectorTheme, string>> = {
  telco: 'Globe, PLDT, Smart, DITO, and Converge',
  banking: 'BDO, BPI, Metrobank, GCash, and Maya',
  government: 'peer national agencies, the Commission on Audit, and legislative oversight bodies',
};

// Inputs shared by seeds and user-created personas. `theme` is only known for seeds; a
// created persona falls back to generic organisation prose.
type DossierInput = {
  name: string;
  role: string;
  org: string;
  focus: string;
  theme?: SectorTheme;
};

const userSections = (p: DossierInput): IPersonaSection[] => [
  {
    id: '1.0',
    name: 'Role Summary',
    dynamic: false,
    content: `${p.name} is the ${p.role} at ${p.org} and owns how the organisation shows up across Philippine broadsheet, broadcast, and online media.`,
  },
  {
    id: '1.1',
    name: 'Identity',
    dynamic: false,
    content: `Name: ${p.name}. Role: ${p.role}. Organisation: ${p.org}.`,
  },
  {
    id: '1.2',
    name: 'Coverage Focus',
    dynamic: true,
    content: p.focus,
  },
  {
    id: '1.3',
    name: 'Reporting Preferences',
    dynamic: false,
    content:
      'Prefers an executive-ready daily digest ranked by reach and prominence, with a clear tone read per story and crisis-level negatives escalated within the hour.',
  },
];

const orgSections = (p: DossierInput): IPersonaSection[] => [
  {
    id: '2.0',
    name: 'Organization Overview',
    dynamic: false,
    content: p.theme
      ? ORG_OVERVIEW[p.theme](p.org)
      : `${p.org} is the organisation ${p.name} represents to Philippine media.`,
  },
  {
    id: '1.1',
    name: 'Identity',
    dynamic: false,
    content: `Organisation: ${p.org}. Sector: ${p.theme ? SECTOR_LABEL[p.theme] : 'Not specified'}. Primary spokesperson: ${p.name}.`,
  },
  {
    id: '2.2',
    name: 'Reputation Watch',
    dynamic: true,
    content: p.theme
      ? REPUTATION[p.theme]
      : 'Reputation turns on how quickly and transparently emerging issues are addressed in the press.',
  },
  {
    id: '2.3',
    name: 'Competitive Set',
    dynamic: false,
    content: `Benchmarks share of voice against ${p.theme ? COMPETITORS[p.theme] : 'its closest peers'}.`,
  },
];

const buildDossiers = (p: DossierInput, groupId: string): IPersonaDossier[] => [
  { id: `${groupId}-user`, name: 'User Profile Dossier', sections: userSections(p) },
  { id: `${groupId}-org`, name: 'Organization Profile Dossier', sections: orgSections(p) },
];

const newslettersFor = (themes: readonly SectorTheme[]): IPersonaNewsletterRef[] =>
  themes
    .map((theme) => NEWSLETTERS.find((nl) => nl.theme === theme))
    .filter((nl): nl is (typeof NEWSLETTERS)[number] => nl !== undefined)
    .map((nl) => ({ id: nl.id, name: nl.name }));

const pad2 = (value: number): string => String(value).padStart(2, '0');

// Deterministic ISO timestamp; hour/minute seeded so reloads stay identical.
const stamp = (month: number, day: number, rand: Rand): string =>
  `2026-${pad2(month)}-${pad2(day)}T${pad2(intBetween(rand, 8, 18))}:${pad2(intBetween(rand, 0, 59))}:00Z`;

const titleOf = (name: string, role: string, org: string): string =>
  [name, role, org].filter(Boolean).join(' | ');

const build = (seed: PersonaSeed, index: number): IPersona => {
  const rand = rngFor(`persona:${index}:${seed.name}`);
  const groupId = `mock-pg-${pad2(index + 1)}`;
  // Created Sept, edited Oct, in index order so "recent" puts the last seed first.
  const createdAt = stamp(9, index + 1, rand);
  const updatedAt = stamp(10, index + 1, rand);
  const dossiers = buildDossiers(seed, groupId);
  return {
    id: groupId,
    name: seed.name,
    role: seed.role,
    org: seed.org,
    title: titleOf(seed.name, seed.role, seed.org),
    dossierNames: dossiers.map((d) => d.name),
    coverageFocus: seed.focus,
    prompt: seed.prompt,
    active: seed.active ?? false,
    createdAt,
    updatedAt,
    newsletters: newslettersFor(seed.nls),
    dossiers,
  };
};

// Mutable session list — Add/Edit/Duplicate/Delete/setPrimary operate here.
let PERSONAS: IPersona[] = SEEDS.map(build);
let nextLocalId = 1;

const clone = (p: IPersona): IPersona => ({
  ...p,
  dossierNames: [...p.dossierNames],
  newsletters: p.newsletters.map((n) => ({ ...n })),
  dossiers: p.dossiers.map((d) => ({ ...d, sections: d.sections.map((s) => ({ ...s })) })),
});

// ─── Reads ─────────────────────────────────────────────────────────────────────
export const getPersonas = (): IPersona[] => PERSONAS.map(clone);

export type PersonaInput = {
  name: string;
  role: string;
  org: string;
  focus: string;
  prompt: string;
};

// ─── Mutations ───────────────────────────────────────────────────────────────
// New personas start inactive (not primary) and carry "" timestamps → the card shows
// "Just now". No Date.now so reloads stay deterministic.
export const createPersona = (input: PersonaInput): IPersona[] => {
  const groupId = `mock-pg-local-${nextLocalId++}`;
  const dossiers = buildDossiers(input, groupId);
  const row: IPersona = {
    id: groupId,
    name: input.name.trim(),
    role: input.role.trim(),
    org: input.org.trim(),
    title: titleOf(input.name.trim(), input.role.trim(), input.org.trim()),
    dossierNames: dossiers.map((d) => d.name),
    coverageFocus: input.focus.trim(),
    prompt: input.prompt.trim(),
    active: false,
    createdAt: '',
    updatedAt: '',
    newsletters: [],
    dossiers,
  };
  PERSONAS = [row, ...PERSONAS];
  return getPersonas();
};

export const updatePersona = (input: { id: string } & PersonaInput): IPersona[] => {
  PERSONAS = PERSONAS.map((p) => {
    if (p.id !== input.id) return p;
    const name = input.name.trim();
    const role = input.role.trim();
    const org = input.org.trim();
    const focus = input.focus.trim();
    // Rebuild dossiers so Role Summary / Identity / Coverage Focus reflect the edit.
    const dossiers = buildDossiers({ name, role, org, focus }, p.id);
    return {
      ...p,
      name,
      role,
      org,
      title: titleOf(name, role, org),
      coverageFocus: focus,
      prompt: input.prompt.trim(),
      dossierNames: dossiers.map((d) => d.name),
      dossiers,
      updatedAt: '',
    };
  });
  return getPersonas();
};

export const deletePersonas = (ids: readonly string[]): IPersona[] => {
  const kill = new Set(ids);
  PERSONAS = PERSONAS.filter((p) => !kill.has(p.id));
  return getPersonas();
};

export const duplicatePersona = (id: string): IPersona[] => {
  const idx = PERSONAS.findIndex((p) => p.id === id);
  if (idx === -1) return getPersonas();
  const src = PERSONAS[idx];
  const groupId = `mock-pg-local-${nextLocalId++}`;
  const name = `${src.name} (Copy)`;
  const copy: IPersona = {
    ...clone(src),
    id: groupId,
    name,
    title: titleOf(name, src.role, src.org),
    active: false, // a copy is never the primary
    createdAt: '',
    updatedAt: '',
    dossiers: buildDossiers({ name, role: src.role, org: src.org, focus: src.coverageFocus }, groupId),
  };
  copy.dossierNames = copy.dossiers.map((d) => d.name);
  PERSONAS = [...PERSONAS.slice(0, idx + 1), copy, ...PERSONAS.slice(idx + 1)];
  return getPersonas();
};

// Set the single primary persona: the chosen one becomes active, every other inactive.
export const setPrimary = (id: string): IPersona[] => {
  PERSONAS = PERSONAS.map((p) => ({ ...p, active: p.id === id }));
  return getPersonas();
};
