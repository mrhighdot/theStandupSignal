import type { AiMemberDigest } from "@standup-types/ai.types";
import type { BlockerStatus } from "@standup-types/blocker.types";

export interface DigestPerson extends AiMemberDigest {
  memberId: number;
  blockerStatus: BlockerStatus;
  repeatCount: number;
}

export interface DigestPayload {
  date: string;
  people: DigestPerson[];
  generatedAt: string;
}
