// Publisher ingestion-status vocabulary + presentation. Mirrors the web's
// PUBLISHER_STATUSES list and getStatusTone() mapping (utils/stringHelpers.ts), but
// expressed as our Pill tones. Status reflects where a source sits in the crawl
// pipeline: Done = indexed, Processing/Queued = working, Failed/Error/DoesNotExist = stuck.
import type { PillTone } from '@/components/ui/controls';
import type { IPublisherStatus } from '@/types';

export type PublisherStatus = Exclude<IPublisherStatus, null>;

/** Filter options — the full set, in the same order as the web. */
export const PUBLISHER_STATUSES: PublisherStatus[] = [
  'Done',
  'Processing',
  'Queued',
  'Failed',
  'Error',
  'DoesNotExist',
];

export const STATUS_LABEL: Record<PublisherStatus, string> = {
  Done: 'Done',
  Processing: 'Processing',
  Queued: 'Queued',
  Failed: 'Failed',
  Error: 'Error',
  DoesNotExist: 'Does not exist',
};

export const statusTone = (status: IPublisherStatus): PillTone => {
  switch (status) {
    case 'Done':
      return 'positive';
    case 'Processing':
      return 'info';
    case 'Queued':
      return 'brand';
    case 'Failed':
    case 'Error':
      return 'negative';
    default:
      return 'neutral';
  }
};
