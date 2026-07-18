import type { DigestPerson } from "@standup-types/digest.types";

/** Renders a reusable person digest fragment for full pages and HTMX refreshes. */
export function digestPersonCard(person: DigestPerson): string {
  const blocker = person.blockerStatus === "repeat"
    ? `<p class="mt-4 border-l-4 border-amber-500 bg-amber-100 px-4 py-3 text-sm font-bold">REPEATING · DAY ${person.repeatCount}<br><span class="font-medium">${escapeHtml(person.blockerDescription ?? "")}</span></p>`
    : person.blockerStatus === "new"
      ? `<p class="mt-4 border-l-4 border-stone-500 bg-stone-200 px-4 py-3 text-sm"><b>NEW BLOCKER</b><br>${escapeHtml(person.blockerDescription ?? "")}</p>`
      : `<p class="mt-4 text-xs font-bold uppercase tracking-wider text-emerald-700">No blocker detected</p>`;
  const confidence = person.blockerStatus !== "none" && person.confidence === "low" ? `<span class="ml-2 text-xs font-medium text-stone-500">low confidence</span>` : "";
  return `<article class="signal-rule py-6"><div class="flex items-baseline justify-between gap-4"><h2 class="text-xl font-black">${escapeHtml(person.member)}</h2><span class="text-xs font-bold uppercase tracking-widest text-stone-500">${person.blockerStatus}</span></div><p class="mt-2 max-w-3xl text-lg leading-relaxed">${escapeHtml(person.summary)}</p>${blocker}${confidence}</article>`;
}

/** Escapes AI and user-provided copy before inserting it into HTML fragments. */
export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
