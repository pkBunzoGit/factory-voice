"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";

type Tab = "leads" | "chat" | "profile";

interface LeadRow {
  id: string;
  phone: string;
  created_at: string;
  message_count: number;
  session_id: string | null;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ProfileSection {
  section: string;
  data: Record<string, string>;
}

export function OwnerDashboardClient({
  ownerId,
  factoryId,
}: {
  ownerId: string;
  factoryId: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // Chat viewer state
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Profile state
  const [profiles, setProfiles] = useState<ProfileSection[]>([]);
  const [factoryInfo, setFactoryInfo] = useState<{
    name: string;
    city: string;
    slug: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Load leads
  useEffect(() => {
    fetch("/api/owner/leads")
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .finally(() => setLeadsLoading(false));
  }, []);

  // Load chat for selected lead
  async function loadChat(lead: LeadRow) {
    if (!lead.session_id) return;
    setSelectedLead(lead);
    setTab("chat");
    setChatLoading(true);

    try {
      const res = await fetch(
        `/api/owner/chats?session_id=${lead.session_id}`
      );
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch {
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  }

  // Load profile
  useEffect(() => {
    if (tab === "profile" && profiles.length === 0) {
      setProfileLoading(true);
      fetch("/api/owner/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfiles(data.profiles || []);
          setFactoryInfo(data.factory || null);
        })
        .finally(() => setProfileLoading(false));
    }
  }, [tab, profiles.length]);

  function startEdit(section: ProfileSection) {
    setEditingSection(section.section);
    setEditData({ ...section.data });
    setSaveMsg("");
  }

  async function saveEdit() {
    if (!editingSection) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch("/api/owner/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: editingSection, data: editData }),
      });

      if (res.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.section === editingSection ? { ...p, data: editData } : p
          )
        );
        setEditingSection(null);
        setSaveMsg("Saved! Bot profile updated.");
      } else {
        setSaveMsg("Failed to save. Try again.");
      }
    } catch {
      setSaveMsg("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/owner/logout", { method: "POST" });
    router.push("/owner/login");
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-black text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  const sectionLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">FactoryVoice</h1>
            <p className="text-xs text-gray-500">Owner Dashboard</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Leads</p>
            <p className="text-2xl font-semibold mt-1">{leads.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Messages</p>
            <p className="text-2xl font-semibold mt-1">
              {leads.reduce((sum, l) => sum + l.message_count, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 md:col-span-1">
            <p className="text-sm text-gray-500">Chat Link</p>
            <p className="text-sm font-mono mt-1 text-blue-600 break-all">
              {factoryInfo
                ? `${typeof window !== "undefined" ? window.location.origin : ""}/chat/${factoryInfo.slug}`
                : "—"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button className={tabClass("leads")} onClick={() => setTab("leads")}>
            Leads
          </button>
          <button className={tabClass("chat")} onClick={() => setTab("chat")}>
            Chat History
          </button>
          <button
            className={tabClass("profile")}
            onClick={() => setTab("profile")}
          >
            Business Profile
          </button>
        </div>

        {/* Leads Tab */}
        {tab === "leads" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {leadsLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Loading leads...
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No leads yet. Share your chat link to start receiving enquiries.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-600">
                      Phone
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">
                      Messages
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-mono">{lead.phone}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">{lead.message_count}</td>
                      <td className="px-5 py-3 text-right">
                        {lead.session_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadChat(lead)}
                          >
                            View Chat
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {tab === "chat" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {!selectedLead ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Select a lead from the Leads tab to view their conversation.
              </div>
            ) : chatLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Loading conversation...
              </div>
            ) : (
              <>
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Chat with {selectedLead.phone}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLead(null);
                      setTab("leads");
                    }}
                  >
                    Back to Leads
                  </Button>
                </div>
                <div className="max-h-[500px] overflow-y-auto px-4 py-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No messages in this conversation.
                    </p>
                  ) : (
                    chatMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
                            m.role === "user"
                              ? "bg-blue-50 text-blue-900"
                              : "bg-gray-50 text-gray-800"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1 opacity-60">
                            {m.role === "user" ? "Customer" : "AI Bot"}
                          </p>
                          {m.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="space-y-4">
            {profileLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                Loading profile...
              </div>
            ) : profiles.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                No profile data found.
              </div>
            ) : (
              profiles.map((p) => (
                <div
                  key={p.section}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      {sectionLabel(p.section)}
                    </h3>
                    {editingSection !== p.section && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {editingSection === p.section ? (
                      <>
                        {Object.entries(editData).map(([key, value]) => (
                          <div key={key}>
                            {value.length > 50 ? (
                              <TextArea
                                label={sectionLabel(key)}
                                value={value}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                              />
                            ) : (
                              <Input
                                label={sectionLabel(key)}
                                value={value}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                              />
                            )}
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveEdit}
                            loading={saving}
                          >
                            Save & Update Bot
                          </Button>
                        </div>
                      </>
                    ) : (
                      Object.entries(p.data as Record<string, string>)
                        .filter(([, v]) => v && v.trim())
                        .map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-gray-500">
                              {sectionLabel(key)}
                            </p>
                            <p className="text-sm text-gray-800">{value}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              ))
            )}

            {saveMsg && (
              <p
                className={`text-sm px-4 py-2 rounded-lg ${
                  saveMsg.includes("Saved")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {saveMsg}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
