import type { ActivitySource } from "@standup-types/activity.types";

export type WorkSignalType = "assignment" | "acknowledgement" | "progress" | "blocker" | "review_request" | "completion";
export type WorkSignalStatus = "open" | "resolved";

export interface WorkSignalInput {
  memberId: number;
  rawActivityId?: number;
  source: ActivitySource;
  type: WorkSignalType;
  description: string;
  taskKey?: string;
  confidence: "high" | "medium" | "low";
  occurredAt: Date;
}

export interface WorkSignalRecord extends WorkSignalInput {
  id: number;
  status: WorkSignalStatus;
  resolvedAt: Date | null;
}
