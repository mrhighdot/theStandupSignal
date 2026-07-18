import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import type { ActivityInput } from "@standup-types/activity.types";

/** Reads recent messages once per sync, avoiding a long-lived Discord gateway in the web server. */
export async function fetchDiscordActivity(memberIdByHandle: Map<string, number>, since: Date): Promise<ActivityInput[]> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!token || !channelId) throw new Error("DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID are required for Discord sync.");
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
  try {
    await client.login(token);
    const channel = await client.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) throw new Error("DISCORD_CHANNEL_ID must identify a text channel.");
    const messages = await channel.messages.fetch({ limit: 100 });
    return [...messages.values()].flatMap((message) => {
      const memberId = memberIdByHandle.get(message.author.username.toLowerCase());
      if (!memberId || message.author.bot || message.createdAt < since || !message.content.trim()) return [];
      return [{ memberId, source: "discord" as const, type: "chat_message" as const, content: message.content, occurredAt: message.createdAt }];
    });
  } finally { client.destroy(); }
}

/** Publishes the rendered digest to the configured channel after a successful generation. */
export async function publishToDiscord(content: string): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!token || !channelId) throw new Error("Discord publishing is not configured.");
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, { method: "POST", headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ content: content.slice(0, 2000) }) });
  if (!response.ok) throw new Error(`Discord publish failed (${response.status}): ${await response.text()}`);
}
