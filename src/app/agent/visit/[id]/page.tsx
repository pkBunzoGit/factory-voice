import { redirect } from "next/navigation";
import { getAgentFromCookie } from "@/lib/auth";
import { VisitClient } from "./client";

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agent = await getAgentFromCookie();
  if (!agent) redirect("/agent/login");

  const { id } = await params;
  return <VisitClient factoryId={id} />;
}
