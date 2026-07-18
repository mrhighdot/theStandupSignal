export type BlockerStatus = "none" | "new" | "repeat";

export interface BlockerRecord {
  id: number;
  memberId: number;
  description: string;
  normalizedKey: string;
  firstSeenDate: string;
  lastSeenDate: string;
  stillOpen: boolean;
  repeatCount: number;
}

export interface DetectedBlocker {
  description: string;
  normalizedKey: string;
  confidence: "high" | "medium" | "low";
}
