import { redirect } from "next/navigation";
import { getAgentFromCookie } from "@/lib/auth";
import { GenerateClient } from "./client";

export default async function GeneratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agent = await getAgentFromCookie();
  if (!agent) redirect("/agent/login");

  const { id } = await params;
  return <GenerateClient factoryId={id} />;
}
