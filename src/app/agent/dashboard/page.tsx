import { redirect } from "next/navigation";
import { getAgentFromCookie } from "@/lib/auth";
import { AgentDashboardClient } from "./client";

export default async function AgentDashboardPage() {
  const agent = await getAgentFromCookie();
  if (!agent) redirect("/agent/login");

  return <AgentDashboardClient agentId={agent.sub} />;
}
