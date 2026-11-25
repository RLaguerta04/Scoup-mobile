// Endpoint functions. Each returns a typed view-model. In mock mode it serves
// generated sample data (with simulated latency so loading states are real); in
// real mode it will call the backend via apiClient and map the response onto the
// same view-model — so screens and hooks never change. The `USE_MOCKS` flag is the
// single switch.
import { MOCK_LATENCY_MS, USE_MOCKS } from '@/lib/config';
import * as mock from '@/data/mock/generators';
import * as publishersMock from '@/data/mock/publishers';
import * as channelsMock from '@/data/mock/channels';
import * as campaignsMock from '@/data/mock/campaigns';
import * as campaignDetailMock from '@/data/mock/campaignDetail';
import * as campaignDraftsMock from '@/data/mock/campaignDrafts';
import * as recipientGroupsMock from '@/data/mock/recipientGroups';
import * as decisionReportMock from '@/data/mock/decisionReport';
import * as settingsMock from '@/data/mock/settings';
import * as emailMock from '@/data/mock/emailConfig';
import * as clientReportsMock from '@/data/mock/clientReports';
import * as personasMock from '@/data/mock/personas';
import * as usageMock from '@/data/mock/usage';
import * as releaseNotesMock from '@/data/mock/releaseNotes';
import * as accountMock from '@/data/mock/account';
import { getStoryDetail } from '@/data/mock/storyDetail';
import type {
  ICampaignBriefInput,
  ICampaignDetail,
  ICampaignDraftForm,
  ICampaignSummary,
  IChannel,
  IDecisionEdition,
  IDecisionStoryDetail,
  INewsletterSettings,
  IEmailConfig,
  IEmailSendout,
  IClientReportCard,
  IClientReportDetail,
  IReportMonthSummary,
  ClientReportId,
  IPersona,
  IAccount,
  IPublisher,
  IRecipientGroup,
  IRecipientGroupMemberInput,
  IReleaseNote,
  IUsageReport,
  IUserUsage,
  Lens,
  RankBy,
  ReportCadence,
} from '@/types';
import type { DateRange } from '@/lib/dateRange';

const delay = <T>(value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));

// Real endpoints aren't wired yet. Each call site documents the backend route +
// the mapper that will convert its response to the view-model.
const notWired = (route: string): never => {
  throw new Error(
    `[scoup api] ${route}: real endpoint not wired. Implement the mapper before setting EXPO_PUBLIC_USE_MOCKS=false.`,
  );
};

export const fetchNewsletters = () =>
  USE_MOCKS ? delay(mock.getNewsletters()) : notWired('GET /api/v1/news-letter/');

export const fetchNewsletterTree = () =>
  USE_MOCKS ? delay(mock.getNewsletterTree()) : notWired('GET /api/v2/tree');

export const fetchThisPeriod = (
  newsletterId: string,
  range: DateRange,
  placeCode: string | null = null,
) =>
  USE_MOCKS
    ? delay(mock.getThisPeriod(newsletterId, range, placeCode))
    : notWired('GET /api/v2/this-period');

export const fetchStories = (
  newsletterId: string,
  range: DateRange,
  lens: Lens,
  rankBy: RankBy,
  filterSig: string,
  bucketId: number | null,
  placeCode: string | null = null,
) =>
  USE_MOCKS
    ? delay(mock.getStories(newsletterId, range, lens, rankBy, filterSig, bucketId, placeCode))
    : notWired('GET /api/v2/topics/');

export const fetchDashboardCharts = (
  newsletterId: string,
  range: DateRange,
  placeCode: string | null = null,
) =>
  USE_MOCKS
    ? delay(mock.getDashboardCharts(newsletterId, range, placeCode))
    : notWired('GET /api/v2/dashboard/charts');

export const fetchDashboardDrill = (newsletterId: string, range: DateRange, spec: string) =>
  USE_MOCKS
    ? delay(mock.getDashboardDrill(newsletterId, range, null, spec))
    : notWired('GET /api/v2/dashboard/records');

export const fetchStory = (id: string) =>
  USE_MOCKS ? delay(getStoryDetail(id)) : notWired('GET /api/v2/topics/:id');

export const fetchPosts = (newsletterId: string, lens: Lens, filterSig: string, bucketId: number | null) =>
  USE_MOCKS
    ? delay(mock.getPosts(newsletterId, lens, filterSig, bucketId))
    : notWired('GET /api/v2/posts/newsletter/:id');

export const fetchArticles = (newsletterId: string, lens: Lens, filterSig: string, bucketId: number | null) =>
  USE_MOCKS
    ? delay(mock.getArticles(newsletterId, lens, filterSig, bucketId))
    : notWired('GET /api/v2/posts/newsletter/:id');

export const fetchLocalMap = (newsletterId: string) =>
  USE_MOCKS
    ? delay(mock.getLocalMap(newsletterId))
    : notWired('GET /api/v2/geo-map');

export const fetchStoryMap = (newsletterId: string) =>
  USE_MOCKS
    ? delay(mock.getStoryMap(newsletterId))
    : notWired('GET /api/v2/dashboard/map');

export const fetchPlaceDetail = (city: string) =>
  USE_MOCKS
    ? delay(mock.getPlaceDetail(city))
    : notWired('GET /api/v2/geo-map/posts');

// ─── Map monitor ("Local" map tab) ───────────────────────────────────────────
export const fetchGeoMap = (newsletterId: string) =>
  USE_MOCKS ? delay(mock.getGeoMap(newsletterId)) : notWired('GET /api/v2/geo-map?level=city');

export const fetchMapPlaceDetail = (newsletterId: string, placeCode: string) =>
  USE_MOCKS
    ? delay(mock.getMapPlaceDetail(newsletterId, placeCode))
    : notWired('GET /api/v2/geo-map/{sentiment,pages,posts}');

// ─── Publishers ────────────────────────────────────────────────────────────
export const fetchPublishers = (): Promise<IPublisher[]> =>
  USE_MOCKS
    ? delay(publishersMock.getPublishers())
    : notWired('GET /api/v1/publishers/');

export const fetchPublisherBuckets = (
  newsletterId: string,
): Promise<Record<string, string[]>> =>
  USE_MOCKS
    ? delay(publishersMock.getPublisherBuckets(newsletterId))
    : notWired('GET /api/v1/publishers/buckets');

export const createPublisher = (input: {
  website_url: string;
  publisher_name: string;
}): Promise<IPublisher> =>
  USE_MOCKS
    ? delay(publishersMock.addPublisher(input))
    : notWired('POST /api/v1/publishers/');

export const editPublisher = (input: {
  id: string;
  website_url: string;
  publisher_name: string;
}): Promise<IPublisher | null> =>
  USE_MOCKS
    ? delay(publishersMock.updatePublisher(input))
    : notWired('PUT /api/v1/publishers/:id');

export const removePublishers = (
  ids: readonly string[],
): Promise<{ deleted: number }> =>
  USE_MOCKS
    ? delay(publishersMock.deletePublishers(ids))
    : notWired('DELETE /api/v1/publishers/');

// ─── Channels (Social Media Channels) ────────────────────────────────────────
export const fetchChannels = (): Promise<IChannel[]> =>
  USE_MOCKS ? delay(channelsMock.getChannels()) : notWired('GET /api/v1/influencer/');

export const fetchChannelBuckets = (
  newsletterId: string,
): Promise<Record<string, string[]>> =>
  USE_MOCKS
    ? delay(channelsMock.getChannelBuckets(newsletterId))
    : notWired('GET /api/v1/newsletters/:id/source-restrictions (social)');

export const createChannel = (input: { profile_url: string; name: string }): Promise<IChannel> =>
  USE_MOCKS ? delay(channelsMock.addChannel(input)) : notWired('POST /api/v1/influencer/');

export const editChannel = (input: {
  id: string;
  profile_url: string;
  name: string;
}): Promise<IChannel | null> =>
  USE_MOCKS ? delay(channelsMock.updateChannel(input)) : notWired('PUT /api/v1/influencer/:id');

export const removeChannels = (ids: readonly string[]): Promise<{ deleted: number }> =>
  USE_MOCKS ? delay(channelsMock.deleteChannels(ids)) : notWired('DELETE /api/v1/influencer/bulk');

// ─── Campaigns (Evaluations) ─────────────────────────────────────────────────
export const fetchCampaigns = (): Promise<ICampaignSummary[]> =>
  USE_MOCKS
    ? delay(campaignsMock.getCampaigns())
    : notWired('GET /api/v2/campaign-evaluator/campaigns');

export const deleteCampaignApi = (id: string): Promise<ICampaignSummary[]> =>
  USE_MOCKS
    ? delay(campaignsMock.deleteCampaign(id))
    : notWired(`DELETE /api/v2/campaign-evaluator/campaigns/${id}`);

export const fetchCampaignDetail = (id: string): Promise<ICampaignDetail | null> =>
  USE_MOCKS
    ? delay(campaignDetailMock.getCampaignDetail(id))
    : notWired(`GET /api/v2/campaign-evaluator/campaigns/${id}`);

// "+ New evaluation" — create a blank draft, then fill + lock its brief.
export const createCampaignApi = (): Promise<{ id: string }> =>
  USE_MOCKS
    ? delay(campaignDraftsMock.createDraft())
    : notWired('POST /api/v2/campaign-evaluator/campaigns');

export const fetchDraftForm = (id: string): Promise<ICampaignDraftForm | null> =>
  USE_MOCKS
    ? delay(campaignDraftsMock.getDraftForm(id))
    : notWired(`GET /api/v2/campaign-evaluator/campaigns/${id}/brief`);

export const updateBriefApi = (input: ICampaignBriefInput): Promise<ICampaignDetail | null> =>
  USE_MOCKS
    ? delay(campaignDraftsMock.updateDraftBrief(input))
    : notWired(`PATCH /api/v2/campaign-evaluator/campaigns/${input.id}/brief`);

export const lockBriefApi = (input: ICampaignBriefInput): Promise<ICampaignDetail | null> =>
  USE_MOCKS
    ? delay(campaignDraftsMock.lockDraftBrief(input))
    : notWired(`POST /api/v2/campaign-evaluator/campaigns/${input.id}/lock`);

// ─── Account usage (the account menu's Usage panel) ──────────────────────────
export const fetchUserUsage = (): Promise<IUserUsage> =>
  USE_MOCKS ? delay(usageMock.getUserUsage()) : notWired('GET /api/v1/usage/me');

export const fetchUsageReport = (): Promise<IUsageReport> =>
  USE_MOCKS ? delay(usageMock.getUsageReport()) : notWired('GET /api/v2/usage/forecast');

// ─── Release notes ───────────────────────────────────────────────────────────
export const fetchReleaseNotes = (): Promise<IReleaseNote[]> =>
  USE_MOCKS ? delay(releaseNotesMock.getReleaseNotes()) : notWired('GET /api/v1/release-notes/');

// ─── Account (editable profile) ──────────────────────────────────────────────
export const fetchAccount = (): Promise<IAccount> =>
  USE_MOCKS ? delay(accountMock.getAccount()) : notWired('GET /api/v1/user/me');

export const updateAccountApi = (input: {
  firstName: string;
  lastName: string;
}): Promise<IAccount> =>
  USE_MOCKS ? delay(accountMock.updateAccount(input)) : notWired('PUT /api/v1/user/me');

export const changePasswordApi = (input: {
  current: string;
  next: string;
}): Promise<{ ok: true }> =>
  USE_MOCKS ? delay(accountMock.changePassword(input)) : notWired('POST /api/v1/user/change-password');

// ─── Decision Report (the weekly "Nightwatch" decision brief) ────────────────
export const fetchDecisionEdition = (
  newsletterId: string,
  cadence: ReportCadence,
): Promise<IDecisionEdition> =>
  USE_MOCKS
    ? delay(decisionReportMock.getDecisionEdition(newsletterId, cadence))
    : notWired('GET /api/v2/decision-report/edition');

export const fetchDecisionStoryDetail = (
  newsletterId: string,
  storyId: string,
): Promise<IDecisionStoryDetail> =>
  USE_MOCKS
    ? delay(decisionReportMock.getDecisionStoryDetail(newsletterId, storyId))
    : notWired('GET /api/v2/decision-report/stories/:key');

// ─── Newsletter Settings (the "Settings" sub-tab — bucket management) ─────────
export const fetchNewsletterSettings = (newsletterId: string): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.getNewsletterSettings(newsletterId))
    : notWired('GET /api/v1/news-letter/:id');

export const renameNewsletterApi = (input: {
  newsletterId: string;
  name: string;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.renameNewsletter(input.newsletterId, input.name))
    : notWired('PUT /api/v1/news-letter/:id');

export const createBucketApi = (input: {
  newsletterId: string;
  name: string;
  description?: string;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.createBucket(input.newsletterId, { name: input.name, description: input.description }))
    : notWired('POST /api/v1/buckets/');

export const renameBucketApi = (input: {
  newsletterId: string;
  bucketId: number;
  name: string;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.renameBucket(input.newsletterId, input.bucketId, input.name))
    : notWired('PUT /api/v1/buckets/:id');

export const deleteBucketApi = (input: {
  newsletterId: string;
  bucketId: number;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.deleteBucket(input.newsletterId, input.bucketId))
    : notWired('DELETE /api/v1/buckets/:id');

export const duplicateBucketApi = (input: {
  newsletterId: string;
  bucketId: number;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.duplicateBucket(input.newsletterId, input.bucketId))
    : notWired('POST /api/v1/buckets/ (duplicate)');

export const saveBucketGroupApi = (input: {
  newsletterId: string;
  id?: string;
  name: string;
  bucketIds: number[];
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.saveBucketGroup(input.newsletterId, { id: input.id, name: input.name, bucketIds: input.bucketIds }))
    : notWired('PUT /api/v1/chat/reports/bucket-group-preference');

export const deleteBucketGroupApi = (input: {
  newsletterId: string;
  groupId: string;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.deleteBucketGroup(input.newsletterId, input.groupId))
    : notWired('PUT /api/v1/chat/reports/bucket-group-preference (empty)');

export const setSourceIntakeApi = (input: {
  newsletterId: string;
  bucketId: number;
  restrict: boolean;
  sourceIds: string[];
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.setSourceIntake(input.newsletterId, input.bucketId, input.restrict, input.sourceIds))
    : notWired('POST /api/v1/buckets/:id/sources/{publishers|influencers}/restrictions');

type KeywordGroupPayload = {
  name: string;
  mainKeywords: string[];
  additionalKeywords: string[];
  excludedKeywords: string[];
};

export const createKeywordGroupApi = (input: {
  newsletterId: string;
  bucketId: number;
  group: KeywordGroupPayload;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.createKeywordGroup(input.newsletterId, input.bucketId, input.group))
    : notWired('POST /api/v1/keyword-groups/');

export const updateKeywordGroupApi = (input: {
  newsletterId: string;
  bucketId: number;
  groupId: string;
  group: KeywordGroupPayload;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.updateKeywordGroup(input.newsletterId, input.bucketId, input.groupId, input.group))
    : notWired('PUT /api/v1/keyword-groups/:id');

export const duplicateKeywordGroupApi = (input: {
  newsletterId: string;
  bucketId: number;
  groupId: string;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.duplicateKeywordGroup(input.newsletterId, input.bucketId, input.groupId))
    : notWired('POST /api/v1/keyword-groups/ (duplicate)');

export const deleteKeywordGroupApi = (input: {
  newsletterId: string;
  bucketId: number;
  groupId: string;
}): Promise<INewsletterSettings> =>
  USE_MOCKS
    ? delay(settingsMock.deleteKeywordGroup(input.newsletterId, input.bucketId, input.groupId))
    : notWired('DELETE /api/v1/keyword-groups/:id');

// ─── Email config (Settings → Email tab · web: EmailConfig endpoints) ──────────
export const fetchEmailConfig = (newsletterId: string): Promise<IEmailConfig> =>
  USE_MOCKS
    ? delay(emailMock.getEmailConfig(newsletterId))
    : notWired('GET /api/v1/news-letter/:id/email-config');

export const updateEmailBrandingApi = (input: {
  newsletterId: string;
  header: string;
  subject: string;
  logoUrl: string;
}): Promise<IEmailConfig> =>
  USE_MOCKS
    ? delay(emailMock.updateEmailBranding(input.newsletterId, { header: input.header, subject: input.subject, logoUrl: input.logoUrl }))
    : notWired('PUT /api/v1/news-letter/:id/email-config (branding)');

export const createSendoutApi = (input: {
  newsletterId: string;
  sendout: Omit<IEmailSendout, 'id'>;
}): Promise<IEmailConfig> =>
  USE_MOCKS
    ? delay(emailMock.createSendout(input.newsletterId, input.sendout))
    : notWired('POST /api/v1/email-schedules/');

export const updateSendoutApi = (input: {
  newsletterId: string;
  sendoutId: string;
  sendout: Omit<IEmailSendout, 'id'>;
}): Promise<IEmailConfig> =>
  USE_MOCKS
    ? delay(emailMock.updateSendout(input.newsletterId, input.sendoutId, input.sendout))
    : notWired('PUT /api/v1/email-schedules/:id');

export const deleteSendoutApi = (input: {
  newsletterId: string;
  sendoutId: string;
}): Promise<IEmailConfig> =>
  USE_MOCKS
    ? delay(emailMock.deleteSendout(input.newsletterId, input.sendoutId))
    : notWired('DELETE /api/v1/email-schedules/:id');

// ─── Client Reports (Media Meter → Reports · web: reports.queries) ─────────────
export const fetchClientReportCards = (): Promise<IClientReportCard[]> =>
  USE_MOCKS ? delay(clientReportsMock.getClientReportCards()) : notWired('GET /api/v1/reports');

export const fetchClientReportDetail = (input: {
  id: ClientReportId;
  month?: string | null;
}): Promise<IClientReportDetail> =>
  USE_MOCKS
    ? delay(clientReportsMock.getClientReportDetail(input.id, input.month))
    : notWired('GET /api/v1/reports/:id');

export const fetchClientReportMonths = (id: ClientReportId): Promise<IReportMonthSummary[]> =>
  USE_MOCKS ? delay(clientReportsMock.getClientReportMonths(id)) : notWired('GET /api/v1/reports/:id/months');

// ─── Personas ────────────────────────────────────────────────────────────────
// Each mutation returns the full refreshed list, so the list query re-syncs after
// invalidation (the mock is the session source of truth, like Settings).
export const fetchPersonas = (): Promise<IPersona[]> =>
  USE_MOCKS ? delay(personasMock.getPersonas()) : notWired('GET /api/v1/persona/artifacts/');

export const createPersonaApi = (input: personasMock.PersonaInput): Promise<IPersona[]> =>
  USE_MOCKS ? delay(personasMock.createPersona(input)) : notWired('POST /api/v1/persona/artifacts/');

export const updatePersonaApi = (
  input: { id: string } & personasMock.PersonaInput,
): Promise<IPersona[]> =>
  USE_MOCKS ? delay(personasMock.updatePersona(input)) : notWired('PUT /api/v1/persona/artifacts/:id');

export const deletePersonasApi = (ids: string[]): Promise<IPersona[]> =>
  USE_MOCKS ? delay(personasMock.deletePersonas(ids)) : notWired('DELETE /api/v1/persona/group');

export const duplicatePersonaApi = (id: string): Promise<IPersona[]> =>
  USE_MOCKS
    ? delay(personasMock.duplicatePersona(id))
    : notWired('POST /api/v1/persona/artifacts/ (duplicate)');

export const setPrimaryPersonaApi = (id: string): Promise<IPersona[]> =>
  USE_MOCKS ? delay(personasMock.setPrimary(id)) : notWired('POST /api/v1/persona/active/:id');


// ─── Recipient Groups ────────────────────────────────────────────────────────
export const fetchRecipientGroups = (): Promise<IRecipientGroup[]> =>
  USE_MOCKS
    ? delay(recipientGroupsMock.getRecipientGroups())
    : notWired('GET /api/v1/recipient-groups/');

export const createRecipientGroup = (input: {
  name: string;
  description?: string;
}): Promise<IRecipientGroup> =>
  USE_MOCKS
    ? delay(recipientGroupsMock.addRecipientGroup(input))
    : notWired('POST /api/v1/recipient-groups/');

export const editRecipientGroup = (input: {
  id: string;
  name: string;
  description?: string;
  members: IRecipientGroupMemberInput[];
}): Promise<IRecipientGroup | null> =>
  USE_MOCKS
    ? delay(recipientGroupsMock.updateRecipientGroup(input))
    : notWired('PUT /api/v1/recipient-groups/:id');

export const removeRecipientGroup = (id: string): Promise<{ deleted: number }> =>
  USE_MOCKS
    ? delay(recipientGroupsMock.deleteRecipientGroup(id))
    : notWired('DELETE /api/v1/recipient-groups/:id');
