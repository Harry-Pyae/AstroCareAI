// Type-only transport contract. No credentials or server runtime code belong here.
export interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string;
  submissionTime?: string;
  link?: string;
}

export type SpaceWeatherType = 'FLR' | 'CME' | 'GST' | 'SEP';
export type DonkiUpstream = 'nasa_gateway' | 'nasa_ccmc';

export interface SpaceWeatherEvent {
  id: string;
  eventType: SpaceWeatherType;
  occurredAt: string;
  classification: string | null;
  submissionTime?: string;
  link?: string;
}

export interface SpaceWeatherIssue {
  code: string;
  retryAfterSeconds?: number;
}

export interface SpaceWeatherCategory {
  eventType: SpaceWeatherType;
  status: 'available' | 'unavailable';
  events: SpaceWeatherEvent[];
  totalCount: number;
  fetchedAt?: string;
  upstream?: DonkiUpstream;
  error?: SpaceWeatherIssue;
}

export interface SpaceWeatherWindow {
  startDate: string;
  endDate: string;
}

export interface SpaceWeatherResponse {
  source: 'nasa_donki';
  upstream: DonkiUpstream | 'mixed';
  freshness: 'live' | 'cached';
  fetchedAt: string;
  events: SolarFlare[];
  categories: SpaceWeatherCategory[];
  partial: boolean;
  window?: SpaceWeatherWindow;
}
