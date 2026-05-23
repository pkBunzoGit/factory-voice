"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewVisitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/factory/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create factory");
        return;
      }

      router.push(`/agent/visit/${data.factory.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-lg font-semibold">New Factory Visit</h1>
          <p className="text-xs text-gray-500">Create a new client record</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Factory / Company Name"
            placeholder="e.g. Sharma Steel Fabricators"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="City"
            placeholder="e.g. Mumbai"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Create & Start Visit
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
