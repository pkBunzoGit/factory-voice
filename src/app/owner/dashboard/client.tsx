"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";

type Tab = "leads" | "chat" | "products" | "combos" | "engagement" | "profile";

interface LeadRow {
  id: string;
  phone: string;
  created_at: string;
  last_visit_at: string;
  message_count: number;
  session_count: number;
  session_id: string | null;
}

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface SessionGroup {
  session_id: string;
  visit_number: number;
  started_at: string;
  messages: ChatMsg[];
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
  const [chatSessions, setChatSessions] = useState<SessionGroup[]>([]);
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
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

  // Load all chat sessions for a lead
  async function loadChat(lead: LeadRow) {
    if (!lead.session_id && !lead.id) return;
    setSelectedLead(lead);
    setTab("chat");
    setChatLoading(true);

    try {
      const res = await fetch(`/api/owner/chats?lead_id=${lead.id}`);
      const data = await res.json();
      const sessions: SessionGroup[] = data.sessions || [];
      setChatSessions(sessions);
      setActiveSessionIdx(sessions.length - 1);
    } catch {
      setChatSessions([]);
      setActiveSessionIdx(0);
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
        <div className="flex gap-2 mb-6 flex-wrap">
          <button className={tabClass("leads")} onClick={() => setTab("leads")}>
            Leads
          </button>
          <button className={tabClass("chat")} onClick={() => setTab("chat")}>
            Chat History
          </button>
          <button className={tabClass("products")} onClick={() => setTab("products")}>
            Products
          </button>
          <button className={tabClass("combos")} onClick={() => setTab("combos")}>
            Combos
          </button>
          <button className={tabClass("engagement")} onClick={() => setTab("engagement")}>
            Engagement
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
                      Last Visit
                    </th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">
                      Visits
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
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => loadChat(lead)}
                    >
                      <td className="px-5 py-3 font-mono">{lead.phone}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">
                        {new Date(lead.last_visit_at || lead.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                        {lead.session_count || 1}
                      </td>
                      <td className="px-5 py-3">{lead.message_count}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadChat(lead);
                          }}
                        >
                          View Chat
                        </Button>
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
            ) : chatSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No messages found for this lead.
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Chat with {selectedLead.phone}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {chatSessions.length} {chatSessions.length === 1 ? "visit" : "visits"}
                      </p>
                    </div>
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
                </div>

                {/* Session tabs */}
                <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 overflow-x-auto bg-white">
                  {chatSessions.map((s, idx) => (
                    <button
                      key={s.session_id}
                      onClick={() => setActiveSessionIdx(idx)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        idx === activeSessionIdx
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Visit {s.visit_number}
                      <span className={`ml-1.5 ${idx === activeSessionIdx ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(s.started_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Active session header */}
                <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-700">
                    Visit {chatSessions[activeSessionIdx].visit_number} &mdash;{" "}
                    {new Date(chatSessions[activeSessionIdx].started_at).toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                    <span className="text-blue-400 ml-2">
                      ({chatSessions[activeSessionIdx].messages.length} messages)
                    </span>
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setActiveSessionIdx((i) => Math.max(0, i - 1))}
                      disabled={activeSessionIdx === 0}
                      className="px-2 py-0.5 text-xs rounded bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setActiveSessionIdx((i) => Math.min(chatSessions.length - 1, i + 1))}
                      disabled={activeSessionIdx === chatSessions.length - 1}
                      className="px-2 py-0.5 text-xs rounded bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Messages for active session */}
                <div className="max-h-[500px] overflow-y-auto px-4 py-4 space-y-3">
                  {chatSessions[activeSessionIdx].messages.map((m) => (
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
                        <div className="prose prose-sm max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ul]:ml-4 [&>ol]:my-1 [&>ol]:ml-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-2 [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium [&_th]:border [&_th]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-gray-200 [&_hr]:my-2 [&_hr]:border-gray-200">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              img: ({ src, alt }) => {
                                const imgSrc = typeof src === "string" ? src : undefined;
                                return (
                                  <span className="block mt-2">
                                    <img
                                      src={imgSrc}
                                      alt={alt || ""}
                                      className="rounded-lg max-w-full mt-1 cursor-pointer border border-gray-200"
                                      style={{ minHeight: "80px", maxHeight: "300px", objectFit: "contain" }}
                                      onClick={() => imgSrc && window.open(imgSrc, "_blank")}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                    {alt && (
                                      <span className="block text-xs text-gray-400 mt-1">
                                        {alt} — tap to view full size
                                      </span>
                                    )}
                                  </span>
                                );
                              },
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <OwnerProductsTab factoryId={factoryId} />
        )}

        {/* Combos Tab */}
        {tab === "combos" && (
          <OwnerCombosTab factoryId={factoryId} />
        )}

        {/* Engagement Tab */}
        {tab === "engagement" && (
          <EngagementTab
            onViewChat={(leadId) => {
              const lead = leads.find((l) => l.id === leadId);
              if (lead) {
                loadChat(lead);
              }
            }}
          />
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

// --- Owner Products Tab ---

interface ProductRow {
  category: string;
  sub_category: string;
  name: string;
  size_spec: string;
  unit_price: string;
  price_unit: string;
}

const EMPTY_ROW: ProductRow = {
  category: "",
  sub_category: "",
  name: "",
  size_spec: "",
  unit_price: "",
  price_unit: "",
};

function OwnerProductsTab({ factoryId }: { factoryId: string }) {
  const [rows, setRows] = useState<ProductRow[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/owner/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.products?.length > 0) {
          setRows(
            data.products.map((p: Record<string, unknown>) => ({
              category: p.category || "",
              sub_category: p.sub_category || "",
              name: p.name || "",
              size_spec: p.size_spec || "",
              unit_price: p.unit_price != null ? String(p.unit_price) : "",
              price_unit: p.price_unit || "",
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function updateRow(index: number, field: keyof ProductRow, value: string) {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setStatus("");
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? [{ ...EMPTY_ROW }] : prev.filter((_, i) => i !== index)));
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const validRows = rows
        .filter((r) => r.category.trim() && r.name.trim())
        .map((r) => ({
          category: r.category.trim(),
          sub_category: r.sub_category.trim() || null,
          name: r.name.trim(),
          size_spec: r.size_spec.trim() || null,
          unit_price: r.unit_price ? parseFloat(r.unit_price) : null,
          price_unit: r.price_unit.trim() || null,
        }));

      const res = await fetch("/api/owner/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: validRows }),
      });

      if (res.ok) {
        setStatus("Products saved! Regenerating bot...");
        await fetch("/api/owner/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "_trigger_regen", data: {} }),
        });
        setStatus("Products saved & bot updated!");
      } else {
        setStatus("Failed to save products.");
      }
    } catch {
      setStatus("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Loading products...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Product Catalog</h3>
        <div className="flex items-center gap-2">
          {status && (
            <span className={`text-xs ${status.includes("Failed") || status.includes("error") ? "text-red-600" : "text-green-600"}`}>
              {status}
            </span>
          )}
          <Button size="sm" onClick={save} loading={saving}>
            Save & Update Bot
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-1 font-medium text-gray-600">Category*</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Sub-cat</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Name*</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Size/Spec</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Price</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Unit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50">
                {(["category", "sub_category", "name", "size_spec", "unit_price", "price_unit"] as const).map((f) => (
                  <td key={f} className="py-1 px-1">
                    <input
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                      type={f === "unit_price" ? "number" : "text"}
                      value={row[f]}
                      onChange={(e) => updateRow(i, f, e.target.value)}
                    />
                  </td>
                ))}
                <td className="py-1 px-1 text-center">
                  <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" className="mt-3" onClick={addRow}>
        + Add Row
      </Button>
    </div>
  );
}

// --- Owner Combos Tab ---

interface OwnerComboData {
  id?: string;
  name: string;
  tags: Record<string, string>;
  items: Array<{ name: string; qty: number; unit_price: number; total: number }>;
  grand_total: string;
  image_url: string;
}

function OwnerCombosTab({ factoryId }: { factoryId: string }) {
  const [combos, setCombos] = useState<OwnerComboData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/owner/combos")
      .then((r) => r.json())
      .then((data) => {
        if (data.combos) {
          setCombos(
            data.combos.map((c: Record<string, unknown>) => ({
              id: c.id,
              name: (c.name as string) || "",
              tags: (c.tags as Record<string, string>) || {},
              items: (c.items as OwnerComboData["items"]) || [],
              grand_total: c.grand_total != null ? String(c.grand_total) : "",
              image_url: (c.image_url as string) || "",
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus("Uploading image...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("factory_id", factoryId);

      const uploadRes = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        setStatus("Upload failed");
        setUploading(false);
        return;
      }

      const { url } = await uploadRes.json();
      setUploading(false);
      setExtracting(true);
      setStatus("Extracting data with AI...");

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const res = await fetch("/api/owner/combos/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: base64, media_type: file.type }),
          });

          if (!res.ok) {
            setStatus("Extraction failed");
            setExtracting(false);
            return;
          }

          const { extracted } = await res.json();
          const newCombo: OwnerComboData = {
            name: extracted.package_name || "Untitled Package",
            tags: extracted.tags || {},
            items: extracted.items || [],
            grand_total: extracted.grand_total ? String(extracted.grand_total) : "",
            image_url: url,
          };

          setCombos((prev) => [...prev, newCombo]);
          setEditingIndex(combos.length);
          setStatus("Data extracted! Review below.");
          setExtracting(false);
        } catch {
          setStatus("Extraction failed");
          setExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setStatus("Upload failed");
      setUploading(false);
    }

    e.target.value = "";
  }

  async function saveCombo(index: number) {
    const combo = combos[index];
    setSavingId(index);
    setStatus("");

    try {
      if (combo.id) {
        await fetch(`/api/owner/combos?combo_id=${combo.id}`, { method: "DELETE" });
      }

      const res = await fetch("/api/owner/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: combo.name,
          tags: combo.tags || {},
          items: combo.items,
          grand_total: combo.grand_total ? parseFloat(combo.grand_total) : null,
          image_url: combo.image_url || null,
        }),
      });

      if (res.ok) {
        const { combo: saved } = await res.json();
        setCombos((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], id: saved.id };
          return updated;
        });
        setEditingIndex(null);
        setStatus("Combo saved!");
      } else {
        setStatus("Failed to save combo");
      }
    } catch {
      setStatus("Failed to save combo");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteCombo(index: number) {
    const combo = combos[index];
    if (combo.id) {
      await fetch(`/api/owner/combos?combo_id=${combo.id}`, { method: "DELETE" });
    }
    setCombos((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  function updateField(index: number, field: string, value: string) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function updateTag(ci: number, key: string, value: string) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[ci] = { ...updated[ci], tags: { ...updated[ci].tags, [key]: value } };
      return updated;
    });
  }

  function renameTag(ci: number, oldKey: string, newKey: string) {
    if (!newKey.trim() || oldKey === newKey) return;
    setCombos((prev) => {
      const updated = [...prev];
      const tags = { ...updated[ci].tags };
      const val = tags[oldKey];
      delete tags[oldKey];
      tags[newKey.trim()] = val;
      updated[ci] = { ...updated[ci], tags };
      return updated;
    });
  }

  function removeTag(ci: number, key: string) {
    setCombos((prev) => {
      const updated = [...prev];
      const tags = { ...updated[ci].tags };
      delete tags[key];
      updated[ci] = { ...updated[ci], tags };
      return updated;
    });
  }

  function addTag(ci: number) {
    const existing = Object.keys(combos[ci].tags);
    let key = "detail";
    let i = 1;
    while (existing.includes(key)) key = `detail_${i++}`;
    updateTag(ci, key, "");
  }

  function updateItem(ci: number, ii: number, field: string, value: string) {
    setCombos((prev) => {
      const updated = [...prev];
      const items = [...updated[ci].items];
      items[ii] = {
        ...items[ii],
        [field]: field === "name" ? value : parseFloat(value) || 0,
      };
      if (field === "qty" || field === "unit_price") {
        items[ii].total = items[ii].qty * items[ii].unit_price;
      }
      updated[ci] = { ...updated[ci], items };
      return updated;
    });
  }

  function addItem(ci: number) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[ci] = {
        ...updated[ci],
        items: [...updated[ci].items, { name: "", qty: 0, unit_price: 0, total: 0 }],
      };
      return updated;
    });
  }

  function removeItem(ci: number, ii: number) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[ci] = {
        ...updated[ci],
        items: updated[ci].items.filter((_, i) => i !== ii),
      };
      return updated;
    });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Loading combos...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Combo Solutions / Packages</h3>
        <div className="flex items-center gap-2">
          {status && (
            <span className={`text-xs ${status.includes("fail") || status.includes("Fail") ? "text-red-600" : "text-green-600"}`}>
              {status}
            </span>
          )}
          <label className="cursor-pointer">
            <span className="inline-flex items-center px-3 py-1.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800">
              {uploading ? "Uploading..." : extracting ? "Extracting..." : "+ Add from Image"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading || extracting}
            />
          </label>
        </div>
      </div>

      {combos.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No combo solutions yet. Upload a price sheet image to get started.
        </div>
      )}

      {combos.map((combo, ci) => {
        const isEditing = editingIndex === ci;
        return (
          <div key={ci} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {combo.image_url && (
                  <img
                    src={combo.image_url}
                    alt={combo.name}
                    className="w-28 h-20 object-cover rounded-lg border mb-2 cursor-pointer"
                    onClick={() => window.open(combo.image_url, "_blank")}
                  />
                )}
                {isEditing ? (
                  <div className="space-y-2">
                    <Input label="Package Name" value={combo.name} onChange={(e) => updateField(ci, "name", e.target.value)} />
                    {Object.entries(combo.tags).map(([key, val]) => (
                      <div key={key} className="flex items-end gap-2">
                        <div className="w-1/3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                          <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" value={key} onChange={(e) => renameTag(ci, key, e.target.value)} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                          <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" value={val} onChange={(e) => updateTag(ci, key, e.target.value)} />
                        </div>
                        <button type="button" onClick={() => removeTag(ci, key)} className="text-red-400 hover:text-red-600 text-xs font-medium pb-1">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addTag(ci)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">+ Add Detail</button>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-sm">{combo.name}</h4>
                    {Object.keys(combo.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(combo.tags).filter(([, v]) => v).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{k}: {v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingIndex(ci)}>
                    Edit
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteCombo(ci)}>
                  Delete
                </Button>
              </div>
            </div>

            {(isEditing || combo.items.length > 0) && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="text-left py-1 px-1 font-medium">Item</th>
                      <th className="text-left py-1 px-1 font-medium w-16">Qty</th>
                      <th className="text-left py-1 px-1 font-medium w-20">Price</th>
                      <th className="text-left py-1 px-1 font-medium w-20">Total</th>
                      {isEditing && <th className="w-14"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {combo.items.map((item, ii) => (
                      <tr key={ii} className="border-b border-gray-50">
                        <td className="py-1 px-1">
                          {isEditing ? (
                            <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm" value={item.name} onChange={(e) => updateItem(ci, ii, "name", e.target.value)} />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="py-1 px-1">
                          {isEditing ? (
                            <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm" type="number" value={item.qty} onChange={(e) => updateItem(ci, ii, "qty", e.target.value)} />
                          ) : (
                            item.qty
                          )}
                        </td>
                        <td className="py-1 px-1">
                          {isEditing ? (
                            <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm" type="number" value={item.unit_price} onChange={(e) => updateItem(ci, ii, "unit_price", e.target.value)} />
                          ) : (
                            item.unit_price
                          )}
                        </td>
                        <td className="py-1 px-1">
                          {isEditing ? <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50" value={item.total} readOnly /> : item.total}
                        </td>
                        {isEditing && (
                          <td className="py-1 px-1 text-center">
                            <button onClick={() => removeItem(ci, ii)} className="text-red-400 hover:text-red-600 text-xs">
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isEditing && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => addItem(ci)}>
                  + Add Item
                </Button>
                <div className="flex-1" />
                <Input placeholder="Grand Total" type="number" value={combo.grand_total} onChange={(e) => updateField(ci, "grand_total", e.target.value)} className="w-28" />
                <Button size="sm" onClick={() => saveCombo(ci)} loading={savingId === ci}>
                  Confirm & Save
                </Button>
              </div>
            )}

            {!isEditing && combo.grand_total && (
              <div className="text-right font-semibold text-sm">
                Grand Total: {combo.grand_total}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Engagement Tab ---

interface EngagementLead {
  id: string;
  phone: string;
  first_contact: string;
  last_active: string | null;
  total_messages: number;
  user_messages: number;
  sessions: number;
  score: number;
  tier: "hot" | "warm" | "cold";
  insight: string | null;
}

interface EngagementSummary {
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

interface WeeklyLeadReport {
  phone: string;
  tier: "hot" | "warm" | "cold";
  messages_this_week: number;
  sessions_this_week: number;
  insight: string | null;
}

interface WeeklyReportData {
  leads: WeeklyLeadReport[];
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

interface WeeklyReportEntry {
  week_start: string;
  week_end: string;
  report_data: WeeklyReportData;
  generated_at: string;
}

const TIER_STYLES = {
  hot: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", label: "Hot" },
  warm: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", label: "Warm" },
  cold: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "Cold" },
};

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function EngagementTab({
  onViewChat,
}: {
  onViewChat: (leadId: string) => void;
}) {
  const [subTab, setSubTab] = useState<"live" | "weekly">("live");

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setSubTab("live")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            subTab === "live"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setSubTab("weekly")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            subTab === "weekly"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Weekly
        </button>
      </div>

      {subTab === "live" && <LiveEngagement onViewChat={onViewChat} />}
      {subTab === "weekly" && <WeeklyEngagement />}
    </div>
  );
}

// --- Live Engagement Sub-tab ---

function LiveEngagement({ onViewChat }: { onViewChat: (leadId: string) => void }) {
  const [leads, setLeads] = useState<EngagementLead[]>([]);
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTier, setFilterTier] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(false);

  async function loadEngagement(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const url = refresh ? "/api/owner/engagement?refresh=true" : "/api/owner/engagement";
      const res = await fetch(url);
      const data = await res.json();
      setLeads(data.leads || []);
      setSummary(data.summary || null);
      setGeneratedAt(data.generated_at || null);
      setExpiresAt(data.expires_at || null);
      setCanRefresh(data.expires_at ? new Date(data.expires_at) <= new Date() : true);
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEngagement();
  }, []);

  // Check cooldown expiry every 30s
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      setCanRefresh(new Date(expiresAt) <= new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const filtered = filterTier === "all" ? leads : leads.filter((l) => l.tier === filterTier);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Analyzing customer engagement...</p>
        <p className="text-xs text-gray-400 mt-1">AI is summarizing conversations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cache status bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {generatedAt && (
            <>
              <span>Last updated: {formatTime(generatedAt)}</span>
              {expiresAt && !canRefresh && (
                <span className="ml-3 text-gray-400">
                  Next refresh: {formatTime(expiresAt)}
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={() => loadEngagement(true)}
          disabled={!canRefresh || refreshing}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
            canRefresh && !refreshing
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {refreshing ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </span>
          ) : canRefresh ? (
            "Refresh"
          ) : (
            "Refresh (cooldown)"
          )}
        </button>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
          No leads yet. Share your chat link to start receiving enquiries.
        </div>
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => setFilterTier("all")}
                className={`rounded-xl border p-3 text-center transition-colors ${filterTier === "all" ? "bg-black text-white border-black" : "bg-white border-gray-200 hover:bg-gray-50"}`}
              >
                <p className="text-xl font-semibold">{summary.total}</p>
                <p className="text-xs mt-0.5 opacity-70">All Leads</p>
              </button>
              <button
                onClick={() => setFilterTier("hot")}
                className={`rounded-xl border p-3 text-center transition-colors ${filterTier === "hot" ? "bg-red-600 text-white border-red-600" : "bg-white border-gray-200 hover:bg-red-50"}`}
              >
                <p className="text-xl font-semibold">{summary.hot}</p>
                <p className="text-xs mt-0.5 opacity-70">Hot</p>
              </button>
              <button
                onClick={() => setFilterTier("warm")}
                className={`rounded-xl border p-3 text-center transition-colors ${filterTier === "warm" ? "bg-amber-500 text-white border-amber-500" : "bg-white border-gray-200 hover:bg-amber-50"}`}
              >
                <p className="text-xl font-semibold">{summary.warm}</p>
                <p className="text-xs mt-0.5 opacity-70">Warm</p>
              </button>
              <button
                onClick={() => setFilterTier("cold")}
                className={`rounded-xl border p-3 text-center transition-colors ${filterTier === "cold" ? "bg-blue-500 text-white border-blue-500" : "bg-white border-gray-200 hover:bg-blue-50"}`}
              >
                <p className="text-xl font-semibold">{summary.cold}</p>
                <p className="text-xs mt-0.5 opacity-70">Cold</p>
              </button>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((lead) => {
              const style = TIER_STYLES[lead.tier];
              return (
                <div
                  key={lead.id}
                  className={`${style.bg} border ${style.border} rounded-xl p-4 transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">{lead.phone}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>

                      {lead.insight && (
                        <p className="text-sm text-gray-700 mb-2">{lead.insight}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{lead.user_messages} messages sent</span>
                        <span>{lead.sessions} {lead.sessions === 1 ? "visit" : "visits"}</span>
                        <span>Last active: {timeAgo(lead.last_active)}</span>
                        <span>First contact: {new Date(lead.first_contact).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => onViewChat(lead.id)}
                    >
                      View Chat
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              No {filterTier} leads found.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Weekly Engagement Sub-tab ---

function WeeklyEngagement() {
  const [reports, setReports] = useState<WeeklyReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);

  useEffect(() => {
    fetch("/api/owner/engagement/weekly")
      .then((r) => r.json())
      .then((data) => setReports(data.reports || []))
      .finally(() => setLoading(false));
  }, []);

  async function generateWeek(weeksAgo: number) {
    setGenerating(weeksAgo);
    try {
      const res = await fetch(`/api/owner/engagement/weekly?weeks_ago=${weeksAgo}&refresh=true`);
      const data = await res.json();
      if (data.report) {
        const entry: WeeklyReportEntry = {
          week_start: data.week_start,
          week_end: data.week_end,
          report_data: data.report,
          generated_at: data.generated_at,
        };
        setReports((prev) => {
          const filtered = prev.filter((r) => r.week_start !== data.week_start);
          return [entry, ...filtered].sort(
            (a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
          );
        });
      }
    } catch {
      // Failed to generate
    } finally {
      setGenerating(null);
    }
  }

  const weekLabels = ["This Week", "Last Week", "2 Weeks Ago"];

  // Map week index (0=this, 1=last, 2=two ago) to matching report
  function getWeekBoundsClient(weeksAgo: number) {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday - weeksAgo * 7);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split("T")[0];
  }

  function findReport(weeksAgo: number): WeeklyReportEntry | undefined {
    const weekStart = getWeekBoundsClient(weeksAgo);
    return reports.find((r) => r.week_start === weekStart);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading weekly reports...</p>
      </div>
    );
  }

  const currentReport = findReport(activeWeek);

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="flex gap-2">
        {weekLabels.map((label, idx) => (
          <button
            key={idx}
            onClick={() => setActiveWeek(idx)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeWeek === idx
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Report content */}
      {currentReport ? (
        <WeeklyReportCard
          report={currentReport}
          weeksAgo={activeWeek}
          onRegenerate={() => generateWeek(activeWeek)}
          regenerating={generating === activeWeek}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500 mb-3">
            No report generated for {weekLabels[activeWeek].toLowerCase()} yet.
          </p>
          <button
            onClick={() => generateWeek(activeWeek)}
            disabled={generating !== null}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {generating === activeWeek ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating report...
              </span>
            ) : (
              "Generate Report"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function WeeklyReportCard({
  report,
  weeksAgo,
  onRegenerate,
  regenerating,
}: {
  report: WeeklyReportEntry;
  weeksAgo: number;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const data = report.report_data;
  const s = data.summary;

  return (
    <div className="space-y-4">
      {/* Report header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">{data.week_label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Generated: {formatTime(report.generated_at)}
            </p>
          </div>
          {weeksAgo > 0 && (
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {regenerating ? "Regenerating..." : "Regenerate"}
            </button>
          )}
        </div>

        {/* AI Summary */}
        {s.ai_summary && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-3">
            <p className="text-sm text-blue-900">{s.ai_summary}</p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold">{s.total_leads}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold text-green-700">{s.new_leads}</p>
            <p className="text-xs text-gray-500">New</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold text-purple-700">{s.returning_leads}</p>
            <p className="text-xs text-gray-500">Returning</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold text-red-700">{s.hot}</p>
            <p className="text-xs text-gray-500">Hot</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold text-amber-700">{s.warm}</p>
            <p className="text-xs text-gray-500">Warm</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-semibold text-blue-700">{s.cold}</p>
            <p className="text-xs text-gray-500">Cold</p>
          </div>
        </div>
      </div>

      {/* Per-lead breakdown */}
      {data.leads.length > 0 ? (
        <div className="space-y-2">
          {data.leads.map((lead, idx) => {
            const style = TIER_STYLES[lead.tier];
            return (
              <div
                key={idx}
                className={`${style.bg} border ${style.border} rounded-xl p-4`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-medium">{lead.phone}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
                {lead.insight && (
                  <p className="text-sm text-gray-700 mb-2">{lead.insight}</p>
                )}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{lead.messages_this_week} messages</span>
                  <span>{lead.sessions_this_week} {lead.sessions_this_week === 1 ? "visit" : "visits"}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
          No customer activity this week.
        </div>
      )}
    </div>
  );
}
