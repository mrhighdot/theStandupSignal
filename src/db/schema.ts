import { boolean, datetime, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  content: text("content").notNull(),
  occurredAt: datetime("occurred_at").notNull(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

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
