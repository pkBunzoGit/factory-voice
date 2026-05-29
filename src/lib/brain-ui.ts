export type BrainResponse =
  | { ok: true; updated_at: string }
  | { ok: false; error: string };

export function parseBrainResponse(value: unknown): BrainResponse | null {
  if (!value || typeof value !== "object") return null;
  const b = value as { ok?: boolean; updated_at?: string; error?: string };
  if (b.ok === true && typeof b.updated_at === "string") {
    return { ok: true, updated_at: b.updated_at };
  }
  if (b.ok === false && typeof b.error === "string") {
    return { ok: false, error: b.error };
  }
  return null;
}

export function formatBotUpdatedAt(iso: string | null): string {
  if (!iso) return "Never";
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Unknown";
  }
}

export function brainStatusMessage(brain: BrainResponse | null): string {
  if (!brain) return "";
  if (brain.ok) return "Chat bot updated.";
  return `Chat bot update failed: ${brain.error}`;
}

/** Retry brain only (catalog/profile already saved). */
export async function retryBrainUpdate(): Promise<BrainResponse | null> {
  try {
    const res = await fetch("/api/owner/regenerate-brain", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    return parseBrainResponse(data.brain);
  } catch {
    return { ok: false, error: "Network error. Could not update chat bot." };
  }
}
