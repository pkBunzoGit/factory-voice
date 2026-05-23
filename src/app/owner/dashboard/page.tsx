import { redirect } from "next/navigation";
import { getOwnerFromCookie } from "@/lib/auth";
import { OwnerDashboardClient } from "./client";

export default async function OwnerDashboardPage() {
  const owner = await getOwnerFromCookie();
  if (!owner) redirect("/owner/login");

  return (
    <OwnerDashboardClient
      ownerId={owner.sub}
      factoryId={owner.factoryId}
    />
  );
}
