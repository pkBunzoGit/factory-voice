"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Factory } from "@/lib/types";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export function AgentDashboardClient({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/factory/list")
      .then((r) => r.json())
      .then((data) => setFactories(data.factories || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/agent/logout", { method: "POST" });
    router.push("/agent/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">FactoryVoice</h1>
            <p className="text-xs text-gray-500">Agent Dashboard</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Factory Visits</h2>
          <Link href="/agent/visit/new">
            <Button size="sm">New Visit</Button>
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : factories.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
            No factory visits yet. Start your first visit above.
          </div>
        ) : (
          <div className="space-y-3">
            {factories.map((f) => (
              <Link
                key={f.id}
                href={`/agent/visit/${f.id}`}
                className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.city}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[f.visit_status] || ""}`}
                    >
                      {f.visit_status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
