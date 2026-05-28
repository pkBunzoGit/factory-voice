import { NextResponse } from "next/server";
import { getOwnerFromCookie } from "@/lib/auth";
import { fetchUpcomingEvents } from "@/lib/events-calendar";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const owner = await getOwnerFromCookie();
    if (!owner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await fetchUpcomingEvents("ZM");
    const year = new Date().getFullYear();

    // Get post counts per event for this factory
    const supabase = createServiceClient();
    const { data: posts } = await supabase
      .from("wish_posts")
      .select("event_date, generation_number")
      .eq("factory_id", owner.factoryId)
      .eq("year", year);

    const postCounts: Record<string, number> = {};
    for (const p of posts || []) {
      postCounts[p.event_date] = Math.max(postCounts[p.event_date] || 0, p.generation_number);
    }

    const eventsWithCounts = events.map((e) => ({
      ...e,
      generated: postCounts[e.date] || 0,
      maxPosts: 3,
    }));

    return NextResponse.json({ events: eventsWithCounts });
  } catch {
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
