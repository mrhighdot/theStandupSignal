import type { AiMemberDigest } from "@standup-types/ai.types";
import type { BlockerStatus } from "@standup-types/blocker.types";
import type { WorkSignalType } from "@standup-types/work-signal.types";

export interface DigestWorkSignal {
  type: WorkSignalType;
  description: string;
}

export interface DigestPerson extends AiMemberDigest {
  memberId: number;
  blockerStatus: BlockerStatus;
  repeatCount: number;
  openWorkSignals: DigestWorkSignal[];
}

export interface DigestPayload {
  date: string;
  people: DigestPerson[];
  generatedAt: string;
}
