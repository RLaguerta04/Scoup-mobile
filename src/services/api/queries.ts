// TanStack Query hooks — the only thing screens import to read data. Query keys
// and shapes are stable across mock/real, so swapping the data source is invisible.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './scoup';
import type { DateRange } from '@/lib/dateRange';
import type { ClientReportId, Lens, RankBy, ReportCadence } from '@/types';

export const useNewsletters = () =>
  useQuery({ queryKey: ['newsletters'], queryFn: api.fetchNewsletters });

export const useNewsletterTree = () =>
  useQuery({ queryKey: ['newsletter-tree'], queryFn: api.fetchNewsletterTree });

export const useThisPeriod = (
  newsletterId: string,
  range: DateRange,
  placeCode: string | null = null,
) =>
  useQuery({
    queryKey: ['this-period', newsletterId, range.from, range.to, placeCode],
    queryFn: () => api.fetchThisPeriod(newsletterId, range, placeCode),
    enabled: !!newsletterId,
  });

export const useStories = (
  newsletterId: string,
  range: DateRange,
  lens: Lens,
  rankBy: RankBy,
  filterSig: string,
  bucketId: number | null,
  placeCode: string | null = null,
) =>
  useQuery({
    queryKey: ['stories', newsletterId, range.from, range.to, lens, rankBy, filterSig, bucketId, placeCode],
    queryFn: () => api.fetchStories(newsletterId, range, lens, rankBy, filterSig, bucketId, placeCode),
    enabled: !!newsletterId,
  });

export const useDashboardCharts = (
  newsletterId: string,
  range: DateRange,
  placeCode: string | null = null,
) =>
  useQuery({
    queryKey: ['dashboard-charts', newsletterId, range.from, range.to, placeCode],
    queryFn: () => api.fetchDashboardCharts(newsletterId, range, placeCode),
    enabled: !!newsletterId,
  });

// The records (+ short analysis) behind a tapped chart figure. `spec` identifies the figure
// (e.g. 'outlet:GMA-7', 'tone:Negative'); the query is idle until one is tapped.
export const useDashboardDrill = (newsletterId: string, range: DateRange, spec: string | null) =>
  useQuery({
    queryKey: ['dashboard-drill', newsletterId, range.from, range.to, spec],
    queryFn: () => api.fetchDashboardDrill(newsletterId, range, spec!),
    enabled: !!newsletterId && !!spec,
  });

export const useStory = (id: string) =>
  useQuery({ queryKey: ['story', id], queryFn: () => api.fetchStory(id), enabled: !!id });

export const useCampaigns = () =>
  useQuery({ queryKey: ['campaigns'], queryFn: api.fetchCampaigns });

export const useDeleteCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCampaignApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
};

export const useCampaignDetail = (id: string) =>
  useQuery({
    queryKey: ['campaign-detail', id],
    queryFn: () => api.fetchCampaignDetail(id),
    enabled: !!id,
  });

// ─── New evaluation (draft brief builder) ────────────────────────────────────
export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCampaignApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
};

export const useDraftForm = (id: string) =>
  useQuery({
    queryKey: ['campaign-draft', id],
    queryFn: () => api.fetchDraftForm(id),
    enabled: !!id,
  });

// Saving or locking a brief refreshes the draft form, its detail, and the list.
const useInvalidateDraft = () => {
  const qc = useQueryClient();
  return (id: string) => {
    qc.invalidateQueries({ queryKey: ['campaign-draft', id] });
    qc.invalidateQueries({ queryKey: ['campaign-detail', id] });
    qc.invalidateQueries({ queryKey: ['campaigns'] });
  };
};

export const useUpdateBrief = () => {
  const invalidate = useInvalidateDraft();
  return useMutation({
    mutationFn: api.updateBriefApi,
    onSuccess: (data) => data && invalidate(data.id),
  });
};

export const useLockBrief = () => {
  const invalidate = useInvalidateDraft();
  return useMutation({
    mutationFn: api.lockBriefApi,
    onSuccess: (data) => data && invalidate(data.id),
  });
};

// ─── Account usage ───────────────────────────────────────────────────────────
export const useUserUsage = () =>
  useQuery({ queryKey: ['user-usage'], queryFn: api.fetchUserUsage });

export const useUsageReport = () =>
  useQuery({ queryKey: ['usage-report'], queryFn: api.fetchUsageReport });

// ─── Release notes ───────────────────────────────────────────────────────────
export const useReleaseNotes = () =>
  useQuery({ queryKey: ['release-notes'], queryFn: api.fetchReleaseNotes });

// ─── Account (editable profile) ──────────────────────────────────────────────
export const useAccount = () =>
  useQuery({ queryKey: ['account'], queryFn: api.fetchAccount });

export const useUpdateAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateAccountApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account'] }),
  });
};

export const useChangePassword = () => useMutation({ mutationFn: api.changePasswordApi });

export const usePosts = (newsletterId: string, lens: Lens, filterSig: string, bucketId: number | null) =>
  useQuery({
    queryKey: ['posts', newsletterId, lens, filterSig, bucketId],
    queryFn: () => api.fetchPosts(newsletterId, lens, filterSig, bucketId),
    enabled: !!newsletterId,
  });

export const useArticles = (newsletterId: string, lens: Lens, filterSig: string, bucketId: number | null) =>
  useQuery({
    queryKey: ['articles', newsletterId, lens, filterSig, bucketId],
    queryFn: () => api.fetchArticles(newsletterId, lens, filterSig, bucketId),
    enabled: !!newsletterId,
  });

export const useLocalMap = (newsletterId: string) =>
  useQuery({
    queryKey: ['local-map', newsletterId],
    queryFn: () => api.fetchLocalMap(newsletterId),
    enabled: !!newsletterId,
  });

export const useStoryMap = (newsletterId: string) =>
  useQuery({
    queryKey: ['story-map', newsletterId],
    queryFn: () => api.fetchStoryMap(newsletterId),
    enabled: !!newsletterId,
  });

// ─── Map monitor ("Local" map tab) ───────────────────────────────────────────
export const useGeoMap = (newsletterId: string) =>
  useQuery({
    queryKey: ['geo-map', newsletterId],
    queryFn: () => api.fetchGeoMap(newsletterId),
    enabled: !!newsletterId,
  });

export const useMapPlaceDetail = (newsletterId: string, placeCode: string | null) =>
  useQuery({
    queryKey: ['map-place-detail', newsletterId, placeCode],
    queryFn: () => api.fetchMapPlaceDetail(newsletterId, placeCode!),
    enabled: !!newsletterId && !!placeCode,
  });

export const usePlaceDetail = (city: string | null) =>
  useQuery({
    queryKey: ['place-detail', city],
    queryFn: () => api.fetchPlaceDetail(city!),
    enabled: !!city,
  });

// ─── Publishers ────────────────────────────────────────────────────────────
export const usePublishers = () =>
  useQuery({ queryKey: ['publishers'], queryFn: api.fetchPublishers });

export const usePublisherBuckets = (newsletterId: string | null) =>
  useQuery({
    queryKey: ['publisher-buckets', newsletterId],
    queryFn: () => api.fetchPublisherBuckets(newsletterId!),
    enabled: !!newsletterId,
  });

// Each mutation invalidates the list (and the bucket maps, which key off publisher
// ids) so the UI reflects the change without any manual cache surgery.
const useInvalidatePublishers = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['publishers'] });
    qc.invalidateQueries({ queryKey: ['publisher-buckets'] });
  };
};

export const useCreatePublisher = () => {
  const invalidate = useInvalidatePublishers();
  return useMutation({
    mutationFn: api.createPublisher,
    onSuccess: invalidate,
  });
};

export const useUpdatePublisher = () => {
  const invalidate = useInvalidatePublishers();
  return useMutation({
    mutationFn: api.editPublisher,
    onSuccess: invalidate,
  });
};

export const useDeletePublishers = () => {
  const invalidate = useInvalidatePublishers();
  return useMutation({
    mutationFn: (ids: readonly string[]) => api.removePublishers(ids),
    onSuccess: invalidate,
  });
};

// ─── Channels (Social Media Channels) ────────────────────────────────────────
export const useChannels = () =>
  useQuery({ queryKey: ['channels'], queryFn: api.fetchChannels });

export const useChannelBuckets = (newsletterId: string | null) =>
  useQuery({
    queryKey: ['channel-buckets', newsletterId],
    queryFn: () => api.fetchChannelBuckets(newsletterId!),
    enabled: !!newsletterId,
  });

const useInvalidateChannels = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['channels'] });
    qc.invalidateQueries({ queryKey: ['channel-buckets'] });
  };
};

export const useCreateChannel = () => {
  const invalidate = useInvalidateChannels();
  return useMutation({ mutationFn: api.createChannel, onSuccess: invalidate });
};

export const useUpdateChannel = () => {
  const invalidate = useInvalidateChannels();
  return useMutation({ mutationFn: api.editChannel, onSuccess: invalidate });
};

export const useDeleteChannels = () => {
  const invalidate = useInvalidateChannels();
  return useMutation({
    mutationFn: (ids: readonly string[]) => api.removeChannels(ids),
    onSuccess: invalidate,
  });
};

// ─── Decision Report ─────────────────────────────────────────────────────────
export const useDecisionEdition = (newsletterId: string, cadence: ReportCadence) =>
  useQuery({
    queryKey: ['decision-report', newsletterId, cadence],
    queryFn: () => api.fetchDecisionEdition(newsletterId, cadence),
    enabled: !!newsletterId,
  });

export const useDecisionStoryDetail = (newsletterId: string, storyId: string) =>
  useQuery({
    queryKey: ['decision-story', newsletterId, storyId],
    queryFn: () => api.fetchDecisionStoryDetail(newsletterId, storyId),
    enabled: !!newsletterId && !!storyId,
  });

// ─── Newsletter Settings ───────────────────────────────────────────────────────
// The list query and the pushed bucket detail both read this one key, so every mutation
// invalidates it and both re-sync (like Recipients).
export const useNewsletterSettings = (newsletterId: string) =>
  useQuery({
    queryKey: ['newsletter-settings', newsletterId],
    queryFn: () => api.fetchNewsletterSettings(newsletterId),
    enabled: !!newsletterId,
  });

const useInvalidateSettings = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['newsletter-settings'] });
};

export const useRenameNewsletter = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.renameNewsletterApi, onSuccess: invalidate });
};
export const useCreateBucket = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.createBucketApi, onSuccess: invalidate });
};
export const useRenameBucket = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.renameBucketApi, onSuccess: invalidate });
};
export const useDeleteBucket = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.deleteBucketApi, onSuccess: invalidate });
};
export const useDuplicateBucket = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.duplicateBucketApi, onSuccess: invalidate });
};
export const useSaveBucketGroup = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.saveBucketGroupApi, onSuccess: invalidate });
};
export const useDeleteBucketGroup = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.deleteBucketGroupApi, onSuccess: invalidate });
};
export const useSetSourceIntake = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.setSourceIntakeApi, onSuccess: invalidate });
};
export const useCreateKeywordGroup = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.createKeywordGroupApi, onSuccess: invalidate });
};
export const useUpdateKeywordGroup = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.updateKeywordGroupApi, onSuccess: invalidate });
};
export const useDuplicateKeywordGroup = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.duplicateKeywordGroupApi, onSuccess: invalidate });
};
export const useDeleteKeywordGroup = () => {
  const invalidate = useInvalidateSettings();
  return useMutation({ mutationFn: api.deleteKeywordGroupApi, onSuccess: invalidate });
};

// ─── Email config ──────────────────────────────────────────────────────────────
export const useEmailConfig = (newsletterId: string) =>
  useQuery({
    queryKey: ['email-config', newsletterId],
    queryFn: () => api.fetchEmailConfig(newsletterId),
    enabled: !!newsletterId,
  });

const useInvalidateEmailConfig = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['email-config'] });
};
export const useUpdateEmailBranding = () => {
  const invalidate = useInvalidateEmailConfig();
  return useMutation({ mutationFn: api.updateEmailBrandingApi, onSuccess: invalidate });
};
export const useCreateSendout = () => {
  const invalidate = useInvalidateEmailConfig();
  return useMutation({ mutationFn: api.createSendoutApi, onSuccess: invalidate });
};
export const useUpdateSendout = () => {
  const invalidate = useInvalidateEmailConfig();
  return useMutation({ mutationFn: api.updateSendoutApi, onSuccess: invalidate });
};
export const useDeleteSendout = () => {
  const invalidate = useInvalidateEmailConfig();
  return useMutation({ mutationFn: api.deleteSendoutApi, onSuccess: invalidate });
};

// ─── Client Reports ──────────────────────────────────────────────────────────
export const useClientReportCards = () =>
  useQuery({ queryKey: ['client-report-cards'], queryFn: api.fetchClientReportCards });

export const useClientReportDetail = (id: ClientReportId, month?: string | null) =>
  useQuery({
    queryKey: ['client-report', id, month ?? 'latest'],
    queryFn: () => api.fetchClientReportDetail({ id, month }),
    enabled: !!id,
  });

export const useClientReportMonths = (id: ClientReportId) =>
  useQuery({
    queryKey: ['client-report-months', id],
    queryFn: () => api.fetchClientReportMonths(id),
    enabled: !!id,
  });

// ─── Personas ────────────────────────────────────────────────────────────────
// One list query; every mutation invalidates it so the grid re-syncs (the mock is the
// session source of truth).
export const usePersonas = () =>
  useQuery({ queryKey: ['personas'], queryFn: api.fetchPersonas });

const useInvalidatePersonas = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['personas'] });
};

export const useCreatePersona = () => {
  const invalidate = useInvalidatePersonas();
  return useMutation({ mutationFn: api.createPersonaApi, onSuccess: invalidate });
};
export const useUpdatePersona = () => {
  const invalidate = useInvalidatePersonas();
  return useMutation({ mutationFn: api.updatePersonaApi, onSuccess: invalidate });
};
export const useDeletePersonas = () => {
  const invalidate = useInvalidatePersonas();
  return useMutation({ mutationFn: api.deletePersonasApi, onSuccess: invalidate });
};
export const useDuplicatePersona = () => {
  const invalidate = useInvalidatePersonas();
  return useMutation({ mutationFn: api.duplicatePersonaApi, onSuccess: invalidate });
};
export const useSetPrimaryPersona = () => {
  const invalidate = useInvalidatePersonas();
  return useMutation({ mutationFn: api.setPrimaryPersonaApi, onSuccess: invalidate });
};

// ─── Recipient Groups ────────────────────────────────────────────────────────
export const useRecipientGroups = () =>
  useQuery({ queryKey: ['recipient-groups'], queryFn: api.fetchRecipientGroups });

// Every mutation invalidates the one list key, so both the list and the detail
// screen (which reads the same query) re-sync without manual cache surgery.
const useInvalidateRecipientGroups = () => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['recipient-groups'] });
};

export const useCreateRecipientGroup = () => {
  const invalidate = useInvalidateRecipientGroups();
  return useMutation({ mutationFn: api.createRecipientGroup, onSuccess: invalidate });
};

export const useUpdateRecipientGroup = () => {
  const invalidate = useInvalidateRecipientGroups();
  return useMutation({ mutationFn: api.editRecipientGroup, onSuccess: invalidate });
};

export const useDeleteRecipientGroup = () => {
  const invalidate = useInvalidateRecipientGroups();
  return useMutation({
    mutationFn: (id: string) => api.removeRecipientGroup(id),
    onSuccess: invalidate,
  });
};
