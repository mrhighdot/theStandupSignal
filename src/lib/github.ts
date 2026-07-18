import type { ActivityInput } from "@standup-types/activity.types";

interface GitHubCommit { sha: string; commit: { message: string; author: { date: string } }; author: { login: string } | null }
interface GitHubPull { number: number; title: string; user: { login: string }; created_at: string; merged_at: string | null }
interface GitHubReviewComment { id: number; pull_request_url: string; user: { login: string } | null; body: string; created_at: string }

/** Pulls recent commits, pull requests, and review comments from scoped repositories so sync routes remain transport-only. */
export async function fetchGitHubActivity(memberIdByHandle: Map<string, number>, since: Date): Promise<ActivityInput[]> {
  const token = process.env.GITHUB_TOKEN;
  const repos = (process.env.GITHUB_REPOS ?? "").split(",").map((repo) => repo.trim()).filter(Boolean);
  if (!token || repos.length === 0) throw new Error("GITHUB_TOKEN and GITHUB_REPOS are required for GitHub sync.");
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
  const activities: ActivityInput[] = [];
  for (const repo of repos) {
    const commits = await githubFetch<GitHubCommit[]>(`/repos/${repo}/commits?since=${encodeURIComponent(since.toISOString())}`, headers);
    for (const commit of commits) {
      const memberId = commit.author ? memberIdByHandle.get(commit.author.login.toLowerCase()) : undefined;
      if (memberId) activities.push({ memberId, source: "github", type: "commit", externalId: `commit:${repo}:${commit.sha}`, content: `${repo}: ${commit.commit.message} (${commit.sha.slice(0, 7)})`, occurredAt: new Date(commit.commit.author.date) });
    }
    const pulls = await githubFetch<GitHubPull[]>(`/repos/${repo}/pulls?state=all&sort=updated&direction=desc&per_page=100`, headers);
    for (const pull of pulls) {
      const memberId = memberIdByHandle.get(pull.user.login.toLowerCase());
      if (!memberId) continue;
      if (new Date(pull.created_at) >= since) activities.push({ memberId, source: "github", type: "pr_open", externalId: `pr:${repo}:${pull.number}:open`, content: `${repo}: opened PR #${pull.number} — ${pull.title}`, occurredAt: new Date(pull.created_at) });
      if (pull.merged_at && new Date(pull.merged_at) >= since) activities.push({ memberId, source: "github", type: "pr_merge", externalId: `pr:${repo}:${pull.number}:merge`, content: `${repo}: merged PR #${pull.number} — ${pull.title}`, occurredAt: new Date(pull.merged_at) });
    }
    const reviewComments = await githubFetch<GitHubReviewComment[]>(`/repos/${repo}/pulls/comments?sort=created&direction=desc&since=${encodeURIComponent(since.toISOString())}`, headers);
    for (const comment of reviewComments) {
      const memberId = comment.user ? memberIdByHandle.get(comment.user.login.toLowerCase()) : undefined;
      if (!memberId || new Date(comment.created_at) < since) continue;
      const prNumber = comment.pull_request_url.match(/\/pulls\/(\d+)$/)?.[1] ?? "?";
      activities.push({ memberId, source: "github", type: "review_comment", externalId: `review:${repo}:${comment.id}`, content: `${repo}: reviewed PR #${prNumber} — ${comment.body}`, occurredAt: new Date(comment.created_at) });
    }
  }
  return activities;
}

/** Calls GitHub's REST API with a clear failure instead of silently returning partial activity. */
async function githubFetch<T>(path: string, headers: Record<string, string>): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API failed (${response.status}): ${await response.text()}`);
  return response.json() as Promise<T>;
}
