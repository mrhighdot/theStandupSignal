export type ActivitySource = "github" | "discord";
export type ActivityType = "commit" | "pr_open" | "pr_merge" | "review_comment" | "chat_message";

export interface ActivityInput {
  memberId: number;
  source: ActivitySource;
  type: ActivityType;
  content: string;
  occurredAt: Date;
}

export interface MemberActivity extends ActivityInput {
  displayName: string;
}
