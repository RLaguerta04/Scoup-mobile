// Email config mock — the Settings "Email" tab. Newsletter-level sendouts (schedules) +
// header branding, as a mutable session store seeded lazily from NEWSLETTERS (like settings.ts).
// Deterministic; no Date.now / Math.random.
import { NEWSLETTERS } from './entities';
import type { IEmailConfig, IEmailSendout } from '@/types';

type SendoutInput = Omit<IEmailSendout, 'id'>;

const buildConfig = (nlId: string): IEmailConfig => {
  const nl = NEWSLETTERS.find((n) => n.id === nlId) ?? NEWSLETTERS[0];
  const bucketIds = nl.buckets.map((b) => b.id);
  const firstTwo = bucketIds.slice(0, 2);
  const sendouts: IEmailSendout[] = [
    {
      id: `so-${nl.id}-1`,
      type: 'daily',
      days: [],
      sendoutTime: '08:00',
      subject: `${nl.name} — Daily Brief`,
      bucketIds: firstTwo.length ? firstTwo : bucketIds,
      toGroupIds: [],
      ccGroupIds: [],
      bccGroupIds: [],
      toEmails: ['team@m2comms.com'],
      ccEmails: [],
      bccEmails: [],
      alertThreshold: null,
    },
    {
      id: `so-${nl.id}-2`,
      type: 'weekly',
      days: ['Mon'],
      sendoutTime: '09:00',
      subject: `${nl.name} — Weekly Wrap`,
      bucketIds,
      toGroupIds: [],
      ccGroupIds: [],
      bccGroupIds: [],
      toEmails: ['leadership@m2comms.com'],
      ccEmails: [],
      bccEmails: [],
      alertThreshold: null,
    },
  ];
  return {
    newsletterId: nl.id,
    header: nl.name,
    subject: `${nl.name} Newsletter`,
    logoUrl: '',
    sendouts,
  };
};

const store = new Map<string, IEmailConfig>();
const ensure = (nlId: string): IEmailConfig => {
  let c = store.get(nlId);
  if (!c) {
    c = buildConfig(nlId);
    store.set(nlId, c);
  }
  return c;
};

const cloneSendout = (s: IEmailSendout): IEmailSendout => ({
  ...s,
  days: [...s.days],
  bucketIds: [...s.bucketIds],
  toGroupIds: [...s.toGroupIds],
  ccGroupIds: [...s.ccGroupIds],
  bccGroupIds: [...s.bccGroupIds],
  toEmails: [...s.toEmails],
  ccEmails: [...s.ccEmails],
  bccEmails: [...s.bccEmails],
});
const clone = (c: IEmailConfig): IEmailConfig => ({ ...c, sendouts: c.sendouts.map(cloneSendout) });

let nextId = 1;

// ─── Reads ───────────────────────────────────────────────────────────────────
export const getEmailConfig = (nlId: string): IEmailConfig => clone(ensure(nlId));

// ─── Mutations ───────────────────────────────────────────────────────────────
export const updateEmailBranding = (
  nlId: string,
  input: { header: string; subject: string; logoUrl: string },
): IEmailConfig => {
  const c = ensure(nlId);
  c.header = input.header;
  c.subject = input.subject;
  c.logoUrl = input.logoUrl.trim();
  return clone(c);
};

export const createSendout = (nlId: string, input: SendoutInput): IEmailConfig => {
  const c = ensure(nlId);
  c.sendouts = [...c.sendouts, cloneSendout({ ...input, id: `so-local-${nextId++}` })];
  return clone(c);
};

export const updateSendout = (
  nlId: string,
  sendoutId: string,
  input: SendoutInput,
): IEmailConfig => {
  const c = ensure(nlId);
  c.sendouts = c.sendouts.map((s) => (s.id === sendoutId ? cloneSendout({ ...input, id: sendoutId }) : s));
  return clone(c);
};

export const deleteSendout = (nlId: string, sendoutId: string): IEmailConfig => {
  const c = ensure(nlId);
  c.sendouts = c.sendouts.filter((s) => s.id !== sendoutId);
  return clone(c);
};
