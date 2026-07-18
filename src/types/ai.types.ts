import type { ActivityType } from "@standup-types/activity.types";

export interface AiActivity {
  type: ActivityType;
  content: string;
  time: string;
}

export interface AiMemberInput {
  member: string;
  activity: AiActivity[];
  yesterdaysOpenBlockers: string[];
  openWorkSignals: string[];
}

export interface AiMemberDigest {
  member: string;
  summary: string;
  blockerDetected: boolean;
  blockerDescription: string | null;
  blockerNormalizedKey: string | null;
  matchesYesterday: boolean;
  confidence: "high" | "medium" | "low";
}

export interface AiSignalCandidate {
  id: number;
  description: string;
}

export interface AiSignalCorrelationInput {
  description: string;
  candidates: AiSignalCandidate[];
}

export interface AiSignalCorrelation {
  matchedId: number | null;
}
