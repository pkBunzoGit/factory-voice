import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";

const COOLDOWN_HOURS = 6;
const AI_WINDOW_DAYS = 30;

interface ChatMessageRow {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface SessionRow {
  id: string;
  started_at: string;
  chat_messages: ChatMessageRow[];
}

interface LeadRow {
  id: string;
  phone: string;
  name: string | null;
  created_at: string;
  chat_sessions: SessionRow[];
}

interface ScoredLead {
  leadId: string;
  phone: string;
  name: string | null;
  firstContact: string;
  lastActiveAt: string | null;
  totalMessages: number;
  userMessageCount: number;
  sessionCount: number;
  score: number;
  tier: "hot" | "warm" | "cold";
  recentConversation: string;
}

function computeEngagement(lead: LeadRow): ScoredLead {
  const sessions = lead.chat_sessions || [];
  const allMessages = sessions.flatMap((s) => s.chat_messages || []);
  const userMessages = allMessages.filter((m) => m.role === "user");

  const totalMessages = allMessages.length;
  const userMessageCount = userMessages.length;
  const sessionCount = sessions.length;

  let lastActiveAt: string | null = null;
  let conversationMinutes = 0;

  if (allMessages.length > 0) {
    const sorted = allMessages
      .map((m) => new Date(m.created_at).getTime())
      .sort((a, b) => a - b);
    lastActiveAt = new Date(sorted[sorted.length - 1]).toISOString();
    conversationMinutes = Math.round(
      (sorted[sorted.length - 1] - sorted[0]) / 60000
    );
  }

  const daysSinceLastActive = lastActiveAt
    ? (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
    : 999;

  const recencyBonus =
    daysSinceLastActive < 1
      ? 10
      : daysSinceLastActive < 3
        ? 6
        : daysSinceLastActive < 7
          ? 3
          : 0;

  const score =
    userMessageCount * 2 +
    sessionCount * 5 +
    recencyBonus +
    Math.min(conversationMinutes, 30);

  let tier: "hot" | "warm" | "cold";
  if (score >= 20) tier = "hot";
  else if (score >= 8) tier = "warm";
  else tier = "cold";

  // For AI: only include messages from last 30 days
  const cutoff = Date.now() - AI_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentMessages = allMessages.filter(
    (m) => new Date(m.created_at).getTime() >= cutoff
  );

  const recentConversation = recentMessages
    .map((m) => `${m.role === "user" ? "Customer" : "Bot"}: ${m.content}`)
    .join("\n");

  const displayName =
    typeof lead.name === "string" && lead.name.trim() ? lead.name.trim() : null;

  return {
    leadId: lead.id,
    phone: lead.phone,
    name: displayName,
    firstContact: lead.created_at,
    lastActiveAt,
    totalMessages,
    userMessageCount,
    sessionCount,
    score,
    tier,
    recentConversation,
  };
}

/**
 * For leads with very long recent conversations (>3000 chars),
 * summarize each session individually first, then combine.
 */
async function getConversationText(
  lead: ScoredLead,
  sessions: SessionRow[]
): Promise<string> {
  if (lead.recentConversation.length <= 3000) {
    return lead.recentConversation;
  }

  // Two-pass: summarize each session individually
  const cutoff = Date.now() - AI_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentSessions = sessions.filter((s) =>
    (s.chat_messages || []).some(
      (m) => new Date(m.created_at).getTime() >= cutoff
    )
  );

  const claude = getClaudeClient();
  const sessionSummaries: string[] = [];

  for (const s of recentSessions) {
    const msgs = s.chat_messages
      .filter((m) => new Date(m.created_at).getTime() >= cutoff)
      .map((m) => `${m.role === "user" ? "Customer" : "Bot"}: ${m.content}`)
      .join("\n");

    if (!msgs) continue;

    try {
      const res = await claude.messages.create({
        model: MODELS.chat,
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: `Summarize this customer chat session in 2-3 sentences. Focus on what the customer wants and their buying intent.\n\n${msgs}`,
          },
        ],
      });
      const text = res.content[0].type === "text" ? res.content[0].text : "";
      const date = new Date(s.started_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      sessionSummaries.push(`[${date}] ${text}`);
    } catch {
      // Skip failed session summaries
    }
  }

  return sessionSummaries.join("\n\n") || lead.recentConversation.slice(0, 3000);
}

async function generateReport(factoryId: string) {
  const supabase = createServiceClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select(
      `
      id, phone, name, created_at,
      chat_sessions (
        id, started_at,
        chat_messages ( id, role, content, created_at )
      )
    `
    )
    .eq("factory_id", factoryId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!leads || leads.length === 0) {
    return { leads: [], summary: { total: 0, hot: 0, warm: 0, cold: 0 } };
  }

  // Group by phone to handle duplicate lead rows
  const byPhone = new Map<string, LeadRow>();
  for (const lead of leads as unknown as LeadRow[]) {
    const existing = byPhone.get(lead.phone);
    const leadName =
      typeof lead.name === "string" && lead.name.trim() ? lead.name.trim() : null;
    if (!existing) {
      byPhone.set(lead.phone, { ...lead, name: leadName });
    } else {
      existing.chat_sessions = [
        ...(existing.chat_sessions || []),
        ...(lead.chat_sessions || []),
      ];
      if (leadName) existing.name = leadName;
      if (new Date(lead.created_at) < new Date(existing.created_at)) {
        existing.created_at = lead.created_at;
      }
    }
  }

  const mergedLeads = Array.from(byPhone.values());
  const scored = mergedLeads.map(computeEngagement).sort((a, b) => b.score - a.score);
  const leadsWithRecentChat = scored.filter((l) => l.recentConversation.length > 0);

  // Generate AI insights for leads with recent conversations
  let aiInsights: Record<string, string> = {};

  if (leadsWithRecentChat.length > 0) {
    const topLeads = leadsWithRecentChat.slice(0, 20);

    // Build conversation text for each lead (with two-pass for long ones)
    const sessionsMap = new Map<string, SessionRow[]>();
    for (const ml of mergedLeads) {
      sessionsMap.set(ml.id, ml.chat_sessions || []);
    }

    const conversationTexts = await Promise.all(
      topLeads.map(async (l) => {
        const sessions = sessionsMap.get(l.leadId) || [];
        return getConversationText(l, sessions);
      })
    );

    const summaryPrompt = topLeads
      .map(
        (l, i) =>
          `--- Lead ${i + 1} (${l.name || l.phone}, ${l.phone}, ${l.tier.toUpperCase()}, ${l.userMessageCount} msgs, ${l.sessionCount} visits) ---\n${conversationTexts[i]}`
      )
      .join("\n\n");

    try {
      const claude = getClaudeClient();
      const response = await claude.messages.create({
        model: MODELS.chat,
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are analyzing customer chat conversations for a business owner. For each lead below, write ONE concise sentence (max 20 words) summarizing what the customer is interested in and their buying intent level.

Format your response as JSON: {"lead_1": "summary", "lead_2": "summary", ...}

${summaryPrompt}

Return ONLY the JSON object, no markdown fences.`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      try {
        const cleaned = text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        topLeads.forEach((l, i) => {
          const key = `lead_${i + 1}`;
          if (parsed[key]) aiInsights[l.leadId] = parsed[key];
        });
      } catch {
        // JSON parsing failed — continue without insights
      }
    } catch {
      // Claude call failed — continue without insights
    }
  }

  const resultLeads = scored.map((l) => ({
    id: l.leadId,
    phone: l.phone,
    name: l.name,
    first_contact: l.firstContact,
    last_active: l.lastActiveAt,
    total_messages: l.totalMessages,
    user_messages: l.userMessageCount,
    sessions: l.sessionCount,
    score: l.score,
    tier: l.tier,
    insight: aiInsights[l.leadId] || null,
  }));

  const hot = resultLeads.filter((l) => l.tier === "hot").length;
  const warm = resultLeads.filter((l) => l.tier === "warm").length;
  const cold = resultLeads.filter((l) => l.tier === "cold").length;

  return {
    leads: resultLeads,
    summary: { total: resultLeads.length, hot, warm, cold },
  };
}

export async function GET(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    const supabase = createServiceClient();

    // Check for cached report
    if (!refresh) {
      const { data: cached } = await supabase
        .from("engagement_reports")
        .select("report_data, summary, generated_at, expires_at")
        .eq("factory_id", owner.factoryId)
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        return NextResponse.json({
          ...cached.report_data,
          summary: cached.summary,
          generated_at: cached.generated_at,
          expires_at: cached.expires_at,
          cached: true,
        });
      }
    }

    // Generate fresh report
    const report = await generateReport(owner.factoryId);

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000
    );

    // Upsert into engagement_reports
    await supabase.from("engagement_reports").upsert(
      {
        factory_id: owner.factoryId,
        report_data: { leads: report.leads },
        summary: report.summary,
        generated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "factory_id" }
    );

    return NextResponse.json({
      leads: report.leads,
      summary: report.summary,
      generated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      cached: false,
    });
  } catch (err) {
    console.error("Engagement error:", err);
    return NextResponse.json(
      { error: "Failed to generate engagement report" },
      { status: 500 }
    );
  }
}
