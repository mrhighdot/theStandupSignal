import { boolean, datetime, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  githubHandle: varchar("github_handle", { length: 100 }),
  discordHandle: varchar("discord_handle", { length: 100 }),
  displayName: varchar("display_name", { length: 160 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rawActivity = mysqlTable("raw_activity", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("member_id").notNull().references(() => teamMembers.id),
  source: mysqlEnum("source", ["github", "discord"]).notNull(),
  type: mysqlEnum("type", ["commit", "pr_open", "pr_merge", "review_comment", "chat_message"]).notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  content: text("content").notNull(),
  occurredAt: datetime("occurred_at").notNull(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
}, (table) => [index("raw_activity_source_external_id_idx").on(table.source, table.externalId)]);

export const digests = mysqlTable("digests", {
  id: int("id").autoincrement().primaryKey(),
  digestDate: varchar("digest_date", { length: 10 }).notNull().unique(),
  payloadJson: text("payload_json").notNull(),
  publishedAt: datetime("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockers = mysqlTable("blockers", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("member_id").notNull().references(() => teamMembers.id),
  description: text("description").notNull(),
  normalizedKey: varchar("normalized_key", { length: 255 }).notNull(),
  firstSeenDate: varchar("first_seen_date", { length: 10 }).notNull(),
  lastSeenDate: varchar("last_seen_date", { length: 10 }).notNull(),
  stillOpen: boolean("still_open").notNull().default(true),
  repeatCount: int("repeat_count").notNull().default(1),
});

export const workSignals = mysqlTable("work_signals", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("member_id").notNull().references(() => teamMembers.id),
  rawActivityId: int("raw_activity_id").references(() => rawActivity.id),
  source: mysqlEnum("source", ["github", "discord"]).notNull(),
  type: mysqlEnum("type", ["assignment", "acknowledgement", "progress", "blocker", "review_request", "completion"]).notNull(),
  description: text("description").notNull(),
  taskKey: varchar("task_key", { length: 255 }),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).notNull(),
  status: mysqlEnum("status", ["open", "resolved"]).notNull().default("open"),
  occurredAt: datetime("occurred_at").notNull(),
  resolvedAt: datetime("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
