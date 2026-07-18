import type { AiMemberDigest, AiMemberInput } from "@standup-types/ai.types";

const systemPrompt = `You produce precise async standup digests. Return one JSON object only; no markdown or preamble.
Only mark blocker_detected true for an explicit, concrete issue preventing progress. Never flag a complaint, uncertainty, or passing status mention as a blocker. Precision is more important than recall.
When there is a blocker, create a stable short kebab-case canonical key based on the impediment, ignoring wording. Examples: "waiting for design review of ticket UI" -> "design-review-ticket-ui"; "cannot access staging" -> "staging-access-permissions"; "API quota is stopping deploys" -> "api-rate-limit-increase".
Use high confidence for explicit blockers, medium for strongly implied blockers, and low only when uncertain. The response schema keys are member, summary, blocker_detected, blocker_description, blocker_normalized_key, matches_yesterday, confidence.`;

/** Summarizes one person's activity with a JSON contract so blocker state is safe to persist. */
export async function summarizeMember(input: AiMemberInput): Promise<AiMemberDigest> {
  const response = await fetch(`${(process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requiredEnv("AI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "gpt-5.6",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify({ member: input.member, activity: input.activity, yesterdays_open_blockers: input.yesterdaysOpenBlockers }) }],
    }),
  });
  if (!response.ok) throw new Error(`AI completion failed (${response.status}): ${await response.text()}`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI completion returned no message content.");
  return parseDigest(content, input.member);
}

/** Parses and validates the AI contract so malformed responses never corrupt blocker history. */
function parseDigest(content: string, member: string): AiMemberDigest {
  const raw: unknown = JSON.parse(content);
  if (!raw || typeof raw !== "object") throw new Error("AI response was not an object.");
  const value = raw as Record<string, unknown>;
  const blockerDetected = value.blocker_detected === true;
  const confidence = value.confidence;
  if (typeof value.summary !== "string" || !["high", "medium", "low"].includes(String(confidence))) throw new Error("AI response did not satisfy the digest contract.");
  if (blockerDetected && (typeof value.blocker_description !== "string" || typeof value.blocker_normalized_key !== "string")) throw new Error("Detected blocker lacks a description or canonical key.");
  return { member: typeof value.member === "string" ? value.member : member, summary: value.summary, blockerDetected, blockerDescription: blockerDetected ? value.blocker_description as string : null, blockerNormalizedKey: blockerDetected ? value.blocker_normalized_key as string : null, matchesYesterday: value.matches_yesterday === true, confidence: confidence as AiMemberDigest["confidence"] };
}

/** Fails fast for missing credentials instead of issuing a confusing anonymous API call. */
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for AI digest generation.`);
  return value;
}
