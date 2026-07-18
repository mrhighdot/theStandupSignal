import type { AiMemberDigest, AiMemberInput, AiSignalCorrelation, AiSignalCorrelationInput } from "@standup-types/ai.types";

const systemPrompt = `You produce precise async standup digests. Return one JSON object only; no markdown or preamble.
Only mark blocker_detected true for an explicit, concrete issue preventing progress. Never flag a complaint, uncertainty, or passing status mention as a blocker. Precision is more important than recall.
When there is a blocker, create a stable short kebab-case canonical key based on the impediment, ignoring wording. Examples: "waiting for design review of ticket UI" -> "design-review-ticket-ui"; "cannot access staging" -> "staging-access-permissions"; "API quota is stopping deploys" -> "api-rate-limit-increase".
Use high confidence for explicit blockers, medium for strongly implied blockers, and low only when uncertain. You may also receive this person's currently open work signals (assignments, acknowledgements, progress notes, blockers, review requests) as background context: use them to write a more accurate summary, but never treat one as today's activity or as grounds for a blocker on its own. The response schema keys are member, summary, blocker_detected, blocker_description, blocker_normalized_key, matches_yesterday, confidence.`;

const correlationPrompt = `You match a new coordination note against a short list of candidate notes from the same person's still-open work signals. Return one JSON object only; no markdown or preamble.
Decide whether the new note describes finishing or superseding the same underlying task as exactly one candidate. Precision is more important than recall: if no candidate is clearly the same task, return null.
Ignore wording differences; match on the underlying task, not phrasing. The response schema is one key, matched_id, holding the matching candidate's id or null.`;

/** Summarizes one person's activity with a JSON contract so blocker state is safe to persist. */
export async function summarizeMember(input: AiMemberInput): Promise<AiMemberDigest> {
  const response = await fetch(`${(process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requiredEnv("AI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "gpt-5.6",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify({ member: input.member, activity: input.activity, yesterdays_open_blockers: input.yesterdaysOpenBlockers, open_work_signals: input.openWorkSignals }) }],
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

/** Asks whether a task-key-less note completes one of a person's open signals, so wording differences don't block resolution. */
export async function correlateSignal(input: AiSignalCorrelationInput): Promise<AiSignalCorrelation> {
  if (input.candidates.length === 0) return { matchedId: null };
  const response = await fetch(`${(process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${requiredEnv("AI_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "gpt-5.6",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: correlationPrompt }, { role: "user", content: JSON.stringify({ note: input.description, candidates: input.candidates }) }],
    }),
  });
  if (!response.ok) throw new Error(`AI completion failed (${response.status}): ${await response.text()}`);
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI completion returned no message content.");
  return parseCorrelation(content, input.candidates);
}

/** Parses and validates the correlation contract so an unrecognized candidate id can never resolve the wrong signal. */
function parseCorrelation(content: string, candidates: AiSignalCorrelationInput["candidates"]): AiSignalCorrelation {
  const raw: unknown = JSON.parse(content);
  if (!raw || typeof raw !== "object") throw new Error("AI response was not an object.");
  const matchedId = (raw as Record<string, unknown>).matched_id;
  if (matchedId === null || matchedId === undefined) return { matchedId: null };
  if (typeof matchedId !== "number" || !candidates.some((candidate) => candidate.id === matchedId)) throw new Error("AI correlation did not satisfy the contract.");
  return { matchedId };
}

/** Fails fast for missing credentials instead of issuing a confusing anonymous API call. */
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for AI digest generation.`);
  return value;
}
