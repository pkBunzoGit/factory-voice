import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { getClaudeClient, MODELS } from "@/lib/claude";

const MAX_WEEKS_KEPT = 3;

function getWeekBounds(weeksAgo: number = 0): { start: Date; end: Date } {
  const now = new Date();
  // Find most recent Monday 00:00 IST
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMonday - weeksAgo * 7);
  thisMonday.setHours(0, 0, 0, 0);

  const sunday = new Date(thisMonday);
  sunday.setDate(thisMonday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: thisMonday, end: sunday };
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

interface WeeklyReportData {
  leads: Array<{
    phone: string;
    tier: "hot" | "warm" | "cold";
    messages_this_week: number;
    sessions_this_week: number;
    insight: string | null;
  }>;
  summary: {
    total_leads: number;
    new_leads: number;
    returning_leads: number;
    total_messages: number;
    hot: number;
    warm: number;
    cold: number;
    ai_summary: string | null;
  };
  week_label: string;
}

async function generateWeeklyReport(
  factoryId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<WeeklyReportData> {
  const supabase = createServiceClient();

  // Fetch all leads for this factory
  const { data: leads } = await supabase
    .from("leads")
    .select(
      `
      id, phone, created_at,
      chat_sessions (
        id, started_at,
        chat_messages ( id, role, content, created_at )
      )
    `
    )
    .eq("factory_id", factoryId);

  if (!leads || leads.length === 0) {
    return {
      leads: [],
      summary: {
        total_leads: 0,
        new_leads: 0,
        returning_leads: 0,
        total_messages: 0,
        hot: 0,
        warm: 0,
        cold: 0,
        ai_summary: null,
      },
      week_label: `${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    };
  }

  // Group by phone
  type LeadData = {
    id: string;
    phone: string;
    created_at: string;
    chat_sessions: Array<{
      id: string;
      started_at: string;
      chat_messages: Array<{
        id: string;
        role: string;
        content: string;
        created_at: string;
      }>;
    }>;
  };

  const byPhone = new Map<string, LeadData>();
  for (const lead of leads as unknown as LeadData[]) {
    const existing = byPhone.get(lead.phone);
    if (!existing) {
      byPhone.set(lead.phone, { ...lead });
    } else {
      existing.chat_sessions = [
        ...(existing.chat_sessions || []),
        ...(lead.chat_sessions || []),
      ];
      if (new Date(lead.created_at) < new Date(existing.created_at)) {
        existing.created_at = lead.created_at;
      }
    }
  }

  const wsTime = weekStart.getTime();
  const weTime = weekEnd.getTime();

  const weeklyLeads: Array<{
    phone: string;
    isNew: boolean;
    messagesThisWeek: number;
    sessionsThisWeek: number;
    conversationText: string;
    tier: "hot" | "warm" | "cold";
  }> = [];

  for (const lead of byPhone.values()) {
    // Filter sessions to this week only
    const weekSessions = (lead.chat_sessions || []).filter((s) => {
      const t = new Date(s.started_at).getTime();
      return t >= wsTime && t <= weTime;
    });

    if (weekSessions.length === 0) continue;

    const weekMessages = weekSessions.flatMap((s) =>
      (s.chat_messages || []).filter((m) => {
        const t = new Date(m.created_at).getTime();
        return t >= wsTime && t <= weTime;
      })
    );

    if (weekMessages.length === 0) continue;

    const userMsgCount = weekMessages.filter((m) => m.role === "user").length;
    const isNew = new Date(lead.created_at).getTime() >= wsTime;

    let tier: "hot" | "warm" | "cold";
    const weekScore = userMsgCount * 2 + weekSessions.length * 5;
    if (weekScore >= 15) tier = "hot";
    else if (weekScore >= 6) tier = "warm";
    else tier = "cold";

    const conversationText = weekMessages
      .map((m) => `${m.role === "user" ? "Customer" : "Bot"}: ${m.content}`)
      .join("\n");

    weeklyLeads.push({
      phone: lead.phone,
      isNew,
      messagesThisWeek: weekMessages.length,
      sessionsThisWeek: weekSessions.length,
      conversationText,
      tier,
    });
  }

  weeklyLeads.sort(
    (a, b) =>
      b.messagesThisWeek - a.messagesThisWeek ||
      b.sessionsThisWeek - a.sessionsThisWeek
  );

  // Generate AI insights
  let perLeadInsights: Record<string, string> = {};
  let overallSummary: string | null = null;

  if (weeklyLeads.length > 0) {
    const leadsForAI = weeklyLeads.slice(0, 15);

    // Two-pass for long conversations
    const conversationInputs = await Promise.all(
      leadsForAI.map(async (l) => {
        if (l.conversationText.length <= 3000) return l.conversationText;

        try {
          const claude = getClaudeClient();
          const res = await claude.messages.create({
            model: MODELS.chat,
            max_tokens: 200,
            messages: [
              {
                role: "user",
                content: `Summarize this customer conversation in 3-4 sentences. Focus on what they want, their budget/quantity needs, and buying intent.\n\n${l.conversationText}`,
              },
            ],
          });
          return res.content[0].type === "text"
            ? res.content[0].text
            : l.conversationText.slice(0, 3000);
        } catch {
          return l.conversationText.slice(0, 3000);
        }
      })
    );

    const weekLabel = `${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;

    const prompt = leadsForAI
      .map(
        (l, i) =>
          `--- Lead ${i + 1} (${l.phone}, ${l.isNew ? "NEW" : "RETURNING"}, ${l.tier.toUpperCase()}, ${l.messagesThisWeek} msgs, ${l.sessionsThisWeek} visits) ---\n${conversationInputs[i]}`
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
            content: `You are analyzing a business's weekly customer engagement for the week of ${weekLabel}.

Here are the customer conversations from this week:

${prompt}

Provide TWO things:
1. "overall": A 2-3 sentence executive summary of the week's engagement (how many leads, who's most promising, any recommended follow-ups).
2. "per_lead": For each lead, ONE sentence (max 20 words) about what they want and their buying intent.

Format as JSON:
{
  "overall": "...",
  "per_lead": {"lead_1": "...", "lead_2": "...", ...}
}

Return ONLY the JSON, no markdown fences.`,
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
        overallSummary = parsed.overall || null;
        if (parsed.per_lead) {
          leadsForAI.forEach((l, i) => {
            const key = `lead_${i + 1}`;
            if (parsed.per_lead[key]) perLeadInsights[l.phone] = parsed.per_lead[key];
          });
        }
      } catch {
        // JSON parsing failed
      }
    } catch {
      // Claude call failed
    }
  }

  const newLeads = weeklyLeads.filter((l) => l.isNew).length;
  const totalMessages = weeklyLeads.reduce(
    (sum, l) => sum + l.messagesThisWeek,
    0
  );

  return {
    leads: weeklyLeads.map((l) => ({
      phone: l.phone,
      tier: l.tier,
      messages_this_week: l.messagesThisWeek,
      sessions_this_week: l.sessionsThisWeek,
      insight: perLeadInsights[l.phone] || null,
    })),
    summary: {
      total_leads: weeklyLeads.length,
      new_leads: newLeads,
      returning_leads: weeklyLeads.length - newLeads,
      total_messages: totalMessages,
      hot: weeklyLeads.filter((l) => l.tier === "hot").length,
      warm: weeklyLeads.filter((l) => l.tier === "warm").length,
      cold: weeklyLeads.filter((l) => l.tier === "cold").length,
      ai_summary: overallSummary,
    },
    week_label: `${weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const weeksAgoParam = request.nextUrl.searchParams.get("weeks_ago");
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";

    // Default: return all cached weekly reports (up to 3)
    if (weeksAgoParam === null && !refresh) {
      const { data: reports } = await supabase
        .from("weekly_reports")
        .select("week_start, week_end, report_data, generated_at")
        .eq("factory_id", owner.factoryId)
        .order("week_start", { ascending: false })
        .limit(MAX_WEEKS_KEPT);

      return NextResponse.json({ reports: reports || [] });
    }

    // Generate report for specific week
    const weeksAgo = Math.max(0, Math.min(2, parseInt(weeksAgoParam || "0")));
    const { start, end } = getWeekBounds(weeksAgo);
    const weekStartStr = formatDate(start);
    const weekEndStr = formatDate(end);

    // Check cache
    if (!refresh) {
      const { data: cached } = await supabase
        .from("weekly_reports")
        .select("report_data, generated_at")
        .eq("factory_id", owner.factoryId)
        .eq("week_start", weekStartStr)
        .single();

      if (cached) {
        return NextResponse.json({
          report: cached.report_data,
          generated_at: cached.generated_at,
          week_start: weekStartStr,
          week_end: weekEndStr,
          cached: true,
        });
      }
    }

    // Generate fresh weekly report
    const report = await generateWeeklyReport(owner.factoryId, start, end);

    // Upsert into weekly_reports
    await supabase.from("weekly_reports").upsert(
      {
        factory_id: owner.factoryId,
        week_start: weekStartStr,
        week_end: weekEndStr,
        report_data: report,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "factory_id,week_start" }
    );

    // Cleanup: delete reports older than 3 weeks
    const oldestAllowed = getWeekBounds(MAX_WEEKS_KEPT - 1);
    await supabase
      .from("weekly_reports")
      .delete()
      .eq("factory_id", owner.factoryId)
      .lt("week_start", formatDate(oldestAllowed.start));

    return NextResponse.json({
      report,
      generated_at: new Date().toISOString(),
      week_start: weekStartStr,
      week_end: weekEndStr,
      cached: false,
    });
  } catch (err) {
    console.error("Weekly engagement error:", err);
    return NextResponse.json(
      { error: "Failed to generate weekly report" },
      { status: 500 }
    );
  }
}
