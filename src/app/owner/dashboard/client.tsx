"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";

// Tab icon components
function IconLeads({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-1.997m-.313-3.378A4.5 4.5 0 0014.25 6a4.5 4.5 0 00-8.5 2.25c0 1.06.368 2.033.978 2.8" /></svg>;
}
function IconChat({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
}
function IconProducts({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
}
function IconCombos({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" /></svg>;
}
function IconLocations({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
}
function IconCompetitors({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
}
function IconWishes({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
}
function IconEngagement({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>;
}
function IconProfile({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>;
}
function IconSettings({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}

type Tab = "leads" | "chat" | "products" | "combos" | "locations" | "competitors" | "wishes" | "engagement" | "profile" | "settings" | "email-summarizer" | "ad-generation" | "social-competitors";

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
    logo_url?: string | null;
    brand_colors?: { primary: string; secondary: string; accent: string } | null;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Brand identity state
  const [brandColors, setBrandColors] = useState({ primary: "", secondary: "", accent: "" });
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMsg, setBrandMsg] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load leads + factory info on mount
  useEffect(() => {
    fetch("/api/owner/leads")
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .finally(() => setLeadsLoading(false));

    fetch("/api/owner/profile")
      .then((r) => r.json())
      .then((data) => {
        setFactoryInfo(data.factory || null);
        if (data.profiles) setProfiles(data.profiles);
        if (data.factory?.brand_colors) {
          setBrandColors({
            primary: data.factory.brand_colors.primary || "",
            secondary: data.factory.brand_colors.secondary || "",
            accent: data.factory.brand_colors.accent || "",
          });
        }
      });
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

  // Reload profile if switching to tab and it hasn't been loaded
  useEffect(() => {
    if (tab === "profile" && profiles.length === 0 && !factoryInfo) {
      setProfileLoading(true);
      fetch("/api/owner/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfiles(data.profiles || []);
          setFactoryInfo(data.factory || null);
          if (data.factory?.brand_colors) {
            setBrandColors({
              primary: data.factory.brand_colors.primary || "",
              secondary: data.factory.brand_colors.secondary || "",
              accent: data.factory.brand_colors.accent || "",
            });
          }
        })
        .finally(() => setProfileLoading(false));
    }
  }, [tab, profiles.length, factoryInfo]);

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

  async function saveBrandColors() {
    setBrandSaving(true);
    setBrandMsg("");
    try {
      const res = await fetch("/api/owner/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_colors: brandColors }),
      });
      if (res.ok) {
        setFactoryInfo((prev) => prev ? { ...prev, brand_colors: brandColors } : prev);
        setBrandMsg("Brand colors saved!");
      } else {
        setBrandMsg("Failed to save. Try again.");
      }
    } catch {
      setBrandMsg("Network error.");
    } finally {
      setBrandSaving(false);
      setTimeout(() => setBrandMsg(""), 3000);
    }
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    setBrandMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("factory_id", factoryId);
      formData.append("bucket", "factory-logos");

      const uploadRes = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        setBrandMsg(`Upload failed: ${err.error}`);
        return;
      }
      const { url } = await uploadRes.json();

      const saveRes = await fetch("/api/owner/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: url }),
      });
      if (saveRes.ok) {
        setFactoryInfo((prev) => prev ? { ...prev, logo_url: url } : prev);
        setBrandMsg("Logo uploaded!");
      } else {
        setBrandMsg("Failed to save logo URL.");
      }
    } catch {
      setBrandMsg("Upload failed.");
    } finally {
      setLogoUploading(false);
      setTimeout(() => setBrandMsg(""), 3000);
    }
  }

  async function removeLogo() {
    setBrandSaving(true);
    try {
      await fetch("/api/owner/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: null }),
      });
      setFactoryInfo((prev) => prev ? { ...prev, logo_url: null } : prev);
      setBrandMsg("Logo removed.");
    } catch {
      setBrandMsg("Failed to remove logo.");
    } finally {
      setBrandSaving(false);
      setTimeout(() => setBrandMsg(""), 3000);
    }
  }

  async function handleLogout() {
    await fetch("/api/owner/logout", { method: "POST" });
    router.push("/owner/login");
  }

  const sectionLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const tabs: { id: Tab; label: string; icon: React.ReactNode; iconBg: string; iconColor: string }[] = [
    { id: "leads",       label: "Leads",           icon: <IconLeads />,       iconBg: "bg-indigo-100",  iconColor: "text-indigo-600" },
    { id: "chat",        label: "Chat History",    icon: <IconChat />,        iconBg: "bg-sky-100",     iconColor: "text-sky-600" },
    { id: "products",    label: "Products",        icon: <IconProducts />,    iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { id: "combos",      label: "Combos",          icon: <IconCombos />,      iconBg: "bg-teal-100",    iconColor: "text-teal-600" },
    { id: "locations",   label: "Locations",       icon: <IconLocations />,   iconBg: "bg-rose-100",    iconColor: "text-rose-600" },
    { id: "competitors", label: "Competitors",     icon: <IconCompetitors />, iconBg: "bg-orange-100",  iconColor: "text-orange-600" },
    { id: "wishes",      label: "Wish Posts",      icon: <IconWishes />,      iconBg: "bg-pink-100",    iconColor: "text-pink-600" },
    { id: "engagement",  label: "Engagement",      icon: <IconEngagement />,  iconBg: "bg-violet-100",  iconColor: "text-violet-600" },
    { id: "profile",     label: "Business Profile",icon: <IconProfile />,     iconBg: "bg-cyan-100",    iconColor: "text-cyan-600" },
    { id: "settings",    label: "Settings",        icon: <IconSettings />,    iconBg: "bg-gray-200",    iconColor: "text-gray-600" },
  ];

  const comingSoonTabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "email-summarizer", label: "Email Summarizer", emoji: "✉️" },
    { id: "ad-generation", label: "Ad Generation", emoji: "📣" },
    { id: "social-competitors", label: "Social Competitors", emoji: "🔍" },
  ];

  const factoryName = factoryInfo?.name || "FactoryVoice";
  const initials = factoryName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{factoryName}</h1>
              <p className="text-[11px] text-gray-500">Owner Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-57px)] sticky top-[57px] border-r border-gray-200/60 bg-white/50 backdrop-blur-sm px-3 py-5 gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-gray-100 text-gray-900 shadow-sm font-semibold"
                  : "text-gray-800 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${t.iconBg} ${t.iconColor}`}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
          <div className="mt-3 mb-1 px-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Coming Soon</p>
          </div>
          {comingSoonTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-amber-50 text-amber-800 shadow-sm font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-100 text-base leading-none flex-shrink-0">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </aside>

        {/* Mobile Tab Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-200/60 px-2 py-1.5 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
                  tab === t.id ? "text-gray-900" : "text-gray-500"
                }`}
              >
                <span className={`w-6 h-6 rounded-md flex items-center justify-center ${tab === t.id ? t.iconBg : "bg-gray-100"} ${t.iconColor}`}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
            <div className="w-px bg-gray-200 mx-1 self-stretch" />
            {comingSoonTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
                  tab === t.id ? "bg-amber-50 text-amber-800" : "text-gray-600"
                }`}
              >
                <span className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-100 text-sm">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 pb-24 md:pb-6">
          {/* Stats */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <IconLeads className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-xs text-gray-500">Total Leads</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{leads.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <IconChat className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-500">Total Messages</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {leads.reduce((sum, l) => sum + l.message_count, 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4 col-span-2 md:col-span-1 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.343" /></svg>
                  </div>
                  <p className="text-xs text-gray-500">Chat Link</p>
                </div>
                {factoryInfo && (
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/chat/${factoryInfo.slug}`;
                      navigator.clipboard.writeText(link);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="text-xs font-mono mt-1 text-indigo-600 truncate">
                {factoryInfo
                  ? `${typeof window !== "undefined" ? window.location.origin : ""}/chat/${factoryInfo.slug}`
                  : "—"}
              </p>
            </div>
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

        {/* Locations Tab */}
        {tab === "locations" && (
          <OwnerLocationsTab factoryId={factoryId} />
        )}

        {/* Competitors Tab */}
        {tab === "competitors" && (
          <CompetitorsTab />
        )}

        {/* Wish Posts Tab */}
        {tab === "wishes" && (
          <WishPostsTab
            brandColors={factoryInfo?.brand_colors || null}
          />
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
            {/* Brand Identity Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                <h3 className="text-sm font-medium">Brand Identity</h3>
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Used in Wish Posts</span>
              </div>
              <div className="px-5 py-4 space-y-5">
                {/* Logo Section */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Company Logo</p>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                      {factoryInfo?.logo_url ? (
                        <img
                          src={factoryInfo.logo_url}
                          alt="Company logo"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${logoUploading ? "border-gray-200 text-gray-400 bg-gray-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                        {logoUploading ? (
                          <>
                            <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            {factoryInfo?.logo_url ? "Replace Logo" : "Upload Logo"}
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={logoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadLogo(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {factoryInfo?.logo_url && (
                        <button
                          onClick={removeLogo}
                          disabled={brandSaving}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Remove
                        </button>
                      )}
                      <p className="text-[10px] text-gray-400">PNG, JPG, SVG — max 5MB. Square logos work best.</p>
                    </div>
                  </div>
                </div>

                {/* Brand Colors Section */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-3">Brand Colors</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(["primary", "secondary", "accent"] as const).map((colorKey) => (
                      <div key={colorKey}>
                        <p className="text-[10px] text-gray-500 mb-1 capitalize">{colorKey}</p>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                          <input
                            type="color"
                            value={brandColors[colorKey] || "#000000"}
                            onChange={(e) => setBrandColors((prev) => ({ ...prev, [colorKey]: e.target.value }))}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={brandColors[colorKey]}
                            placeholder="#000000"
                            onChange={(e) => setBrandColors((prev) => ({ ...prev, [colorKey]: e.target.value }))}
                            className="flex-1 text-xs font-mono text-gray-700 bg-transparent outline-none min-w-0"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Leave empty to let AI choose colors that fit your industry.</p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Button size="sm" onClick={saveBrandColors} loading={brandSaving}>
                    Save Brand Settings
                  </Button>
                  {brandMsg && (
                    <span className={`text-xs ${brandMsg.includes("failed") || brandMsg.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
                      {brandMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>

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

        {/* Settings Tab */}
        {tab === "settings" && (
          <SettingsTab />
        )}

        {/* Coming Soon Tabs */}
        {tab === "email-summarizer" && (
          <ComingSoonBanner
            emoji="✉️"
            title="Email Summarizer"
            desc="Auto-summarize customer emails and flag important leads with AI. Get a daily digest of what matters most — without reading every email."
            color="blue"
          />
        )}
        {tab === "ad-generation" && (
          <ComingSoonBanner
            emoji="📣"
            title="Ad Generation"
            desc="Create ready-to-post ad creatives for Facebook, WhatsApp & Google directly from your product catalog — with AI-written copy and branded visuals."
            color="purple"
          />
        )}
        {tab === "social-competitors" && (
          <ComingSoonBanner
            emoji="🔍"
            title="Social Media Competitor Analysis"
            desc="Track competitor activity on Facebook & Instagram and get AI-powered weekly insights on their content strategy, promotions, and customer engagement."
            color="amber"
          />
        )}
      </main>
      </div>
    </div>
  );
}

// --- Coming Soon Banner ---

function ComingSoonBanner({ emoji, title, desc, color }: {
  emoji: string;
  title: string;
  desc: string;
  color: "blue" | "purple" | "amber";
}) {
  const palettes = {
    blue:   { bg: "bg-blue-50",   border: "border-blue-200",   badge: "bg-blue-100 text-blue-700",   icon: "text-blue-500",  ring: "ring-blue-200" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", icon: "text-purple-500", ring: "ring-purple-200" },
    amber:  { bg: "bg-amber-50",  border: "border-amber-200",  badge: "bg-amber-100 text-amber-700",  icon: "text-amber-500",  ring: "ring-amber-200" },
  };
  const p = palettes[color];

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`max-w-md w-full text-center rounded-2xl border-2 ${p.border} ${p.bg} p-10 shadow-sm`}>
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white ring-4 ${p.ring} shadow-sm mb-5 text-3xl`}>
          {emoji}
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${p.badge}`}>COMING SOON</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{desc}</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          We&apos;re working on it — stay tuned for updates
        </div>
      </div>
    </div>
  );
}

// --- Settings Tab ---

function SettingsTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPassword.length < 6) {
      setMsg({ text: "New password must be at least 6 characters", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ text: "New passwords do not match", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/owner/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ text: data.error || "Failed to update password", type: "error" });
      } else {
        setMsg({ text: "Password updated successfully!", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMsg({ text: "Network error. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      {/* Password Reset */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Change Password</h3>
        <p className="text-xs text-gray-500 mb-5">Update your owner account password</p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="At least 6 characters"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Repeat new password"
              required
            />
          </div>
          {msg && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {msg.type === "success"
                ? <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              }
              {msg.text}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

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
  tags: Record<string, string>;
  image_url: string;
}

const EMPTY_ROW: ProductRow = {
  category: "",
  sub_category: "",
  name: "",
  size_spec: "",
  unit_price: "",
  price_unit: "",
  tags: {},
  image_url: "",
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
              category: (p.category as string) || "",
              sub_category: (p.sub_category as string) || "",
              name: (p.name as string) || "",
              size_spec: (p.size_spec as string) || "",
              unit_price: p.unit_price != null ? String(p.unit_price) : "",
              price_unit: (p.price_unit as string) || "",
              tags: (p.tags as Record<string, string>) || {},
              image_url: (p.image_url as string) || "",
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
    setRows((prev) => [...prev, { ...EMPTY_ROW, tags: {} }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? [{ ...EMPTY_ROW, tags: {} }] : prev.filter((_, i) => i !== index)));
  }

  function updateTag(rowIdx: number, key: string, value: string) {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIdx] = { ...updated[rowIdx], tags: { ...updated[rowIdx].tags, [key]: value } };
      return updated;
    });
    setStatus("");
  }

  function removeTag(rowIdx: number, key: string) {
    setRows((prev) => {
      const updated = [...prev];
      const newTags = { ...updated[rowIdx].tags };
      delete newTags[key];
      updated[rowIdx] = { ...updated[rowIdx], tags: newTags };
      return updated;
    });
  }

  function addTagToRow(rowIdx: number) {
    const existing = Object.keys(rows[rowIdx].tags);
    let key = "";
    let i = 1;
    while (existing.includes(key)) key = `_new_${i++}`;
    updateTag(rowIdx, key, "");
  }

  function renameTag(rowIdx: number, oldKey: string, newKey: string) {
    if (!newKey.trim() || newKey === oldKey) return;
    setRows((prev) => {
      const updated = [...prev];
      const newTags = { ...updated[rowIdx].tags };
      const value = newTags[oldKey];
      delete newTags[oldKey];
      newTags[newKey.trim()] = value;
      updated[rowIdx] = { ...updated[rowIdx], tags: newTags };
      return updated;
    });
  }

  async function uploadProductImage(rowIdx: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("factory_id", factoryId);
    formData.append("bucket", "product-images");
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      if (!res.ok) return;
      const { url } = await res.json();
      setRows((prev) => {
        const updated = [...prev];
        updated[rowIdx] = { ...updated[rowIdx], image_url: url };
        return updated;
      });
      setStatus("");
    } catch {}
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
          tags: r.tags,
          image_url: r.image_url || null,
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
              <th className="text-left py-2 px-1 font-medium text-gray-600" colSpan={5}>Name, Size, Price & Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 align-top">
                <td className="py-1 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    value={row.category}
                    onChange={(e) => updateRow(i, "category", e.target.value)}
                  />
                </td>
                <td className="py-1 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    value={row.sub_category}
                    onChange={(e) => updateRow(i, "sub_category", e.target.value)}
                  />
                </td>
                <td className="py-1 px-1" colSpan={5}>
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      <input
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Product name"
                        value={row.name}
                        onChange={(e) => updateRow(i, "name", e.target.value)}
                      />
                      <input
                        className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Size/Spec"
                        value={row.size_spec}
                        onChange={(e) => updateRow(i, "size_spec", e.target.value)}
                      />
                      <input
                        className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Price"
                        type="number"
                        value={row.unit_price}
                        onChange={(e) => updateRow(i, "unit_price", e.target.value)}
                      />
                      <input
                        className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Unit"
                        value={row.price_unit}
                        onChange={(e) => updateRow(i, "price_unit", e.target.value)}
                      />
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs px-2">
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
                      {Object.entries(row.tags).map(([key, value], tagIdx) => (
                        <span key={tagIdx} className="inline-flex items-center gap-0.5 bg-gray-100 border border-gray-200 rounded-full text-xs">
                          <input
                            className="w-16 bg-transparent px-2 py-0.5 text-xs font-medium text-gray-700 focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
                            placeholder="e.g. warranty"
                            value={key}
                            onChange={(e) => renameTag(i, key, e.target.value)}
                            onBlur={(e) => { if (!e.target.value.trim()) removeTag(i, key); }}
                          />
                          <span className="text-gray-400">:</span>
                          <input
                            className="w-20 bg-transparent px-1 py-0.5 text-xs text-gray-600 focus:outline-none placeholder:text-gray-400"
                            placeholder="e.g. 2 years"
                            value={value}
                            onChange={(e) => updateTag(i, key, e.target.value)}
                          />
                          <button type="button" onClick={() => removeTag(i, key)} className="text-gray-400 hover:text-red-500 pr-1.5">
                            &times;
                          </button>
                        </span>
                      ))}
                      <button type="button" onClick={() => addTagToRow(i)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
                        Add Tag
                      </button>
                    </div>
                    {/* Product image */}
                    <div className="flex items-center gap-2 pl-0.5">
                      {row.image_url ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={row.image_url}
                            alt={row.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(row.image_url, "_blank")}
                          />
                          <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadProductImage(i, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Add Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadProductImage(i, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
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

// --- Owner Locations Tab ---

interface LocationRow {
  name: string;
  city: string;
  area: string;
  phone: string;
  location_type: string;
}

const EMPTY_LOCATION: LocationRow = {
  name: "",
  city: "",
  area: "",
  phone: "",
  location_type: "distributor",
};

function OwnerLocationsTab({ factoryId }: { factoryId: string }) {
  const [rows, setRows] = useState<LocationRow[]>([{ ...EMPTY_LOCATION }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/owner/locations")
      .then((r) => r.json())
      .then((data) => {
        if (data.locations?.length > 0) {
          setRows(
            data.locations.map((l: Record<string, unknown>) => ({
              name: (l.name as string) || "",
              city: (l.city as string) || "",
              area: (l.area as string) || "",
              phone: (l.phone as string) || "",
              location_type: (l.location_type as string) || "distributor",
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function updateRow(index: number, field: keyof LocationRow, value: string) {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setStatus("");
  }

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_LOCATION }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length <= 1 ? [{ ...EMPTY_LOCATION }] : prev.filter((_, i) => i !== index)));
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const validRows = rows
        .filter((r) => r.name.trim() && r.city.trim())
        .map((r) => ({
          name: r.name.trim(),
          city: r.city.trim(),
          area: r.area.trim() || null,
          phone: r.phone.trim() || null,
          location_type: r.location_type || "distributor",
        }));

      const res = await fetch("/api/owner/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: validRows }),
      });

      if (res.ok) {
        setStatus("Locations saved! Regenerating bot...");
        await fetch("/api/owner/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "_trigger_regen", data: {} }),
        });
        setStatus("Locations saved & bot updated!");
      } else {
        setStatus("Failed to save locations.");
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
        Loading locations...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Distributor / Store Locations</h3>
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
              <th className="text-left py-2 px-1 font-medium text-gray-600">Name*</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">City*</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Area</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Phone</th>
              <th className="text-left py-2 px-1 font-medium text-gray-600">Type</th>
              <th className="w-14"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 align-top">
                <td className="py-1 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. ABC Distributors"
                    value={row.name}
                    onChange={(e) => updateRow(i, "name", e.target.value)}
                  />
                </td>
                <td className="py-1 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. Lusaka"
                    value={row.city}
                    onChange={(e) => updateRow(i, "city", e.target.value)}
                  />
                </td>
                <td className="py-1 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. Industrial Area"
                    value={row.area}
                    onChange={(e) => updateRow(i, "area", e.target.value)}
                  />
                </td>
                <td className="py-1 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. +260..."
                    value={row.phone}
                    onChange={(e) => updateRow(i, "phone", e.target.value)}
                  />
                </td>
                <td className="py-1 px-1">
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    value={row.location_type}
                    onChange={(e) => updateRow(i, "location_type", e.target.value)}
                  >
                    <option value="distributor">Distributor</option>
                    <option value="store">Store</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                </td>
                <td className="py-1 px-1 text-center">
                  <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 text-xs px-2">
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

// --- Competitors Tab ---

interface CompetitorRow {
  id?: string;
  name: string;
  city: string;
  products_summary: string;
  strengths: string;
  weaknesses: string;
  is_ai_generated: boolean;
}

interface CompetitiveAnalysis {
  overall_position: string;
  advantages: string[];
  gaps: string[];
  opportunities: string[];
  pricing_position: string;
}

function CompetitorsTab() {
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [analysis, setAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/owner/competitors")
      .then((r) => r.json())
      .then((data) => {
        if (data.competitors?.length > 0) {
          setCompetitors(
            data.competitors.map((c: Record<string, unknown>) => ({
              id: c.id,
              name: (c.name as string) || "",
              city: (c.city as string) || "",
              products_summary: (c.products_summary as string) || "",
              strengths: (c.strengths as string) || "",
              weaknesses: (c.weaknesses as string) || "",
              is_ai_generated: c.is_ai_generated ?? true,
            }))
          );
        }
        if (data.report) setAnalysis(data.report);
        if (data.generated_at) setGeneratedAt(data.generated_at);
      })
      .finally(() => setLoading(false));
  }, []);

  async function runAnalysis() {
    setAnalyzing(true);
    setStatus("");
    try {
      const res = await fetch("/api/owner/competitors/analyze", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        setStatus(`Error: ${err.error}`);
        return;
      }
      const data = await res.json();
      setCompetitors(
        (data.competitors || []).map((c: Record<string, unknown>) => ({
          id: c.id,
          name: (c.name as string) || "",
          city: (c.city as string) || "",
          products_summary: (c.products_summary as string) || "",
          strengths: (c.strengths as string) || "",
          weaknesses: (c.weaknesses as string) || "",
          is_ai_generated: c.is_ai_generated ?? true,
        }))
      );
      setAnalysis(data.report || null);
      setGeneratedAt(data.generated_at || null);
      setStatus("Analysis complete!");
    } catch {
      setStatus("Failed to generate analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveEdits() {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/owner/competitors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitors: competitors.map((c) => ({
            name: c.name,
            city: c.city,
            products_summary: c.products_summary,
            strengths: c.strengths,
            weaknesses: c.weaknesses,
            is_ai_generated: false,
          })),
        }),
      });
      if (res.ok) {
        setEditingIdx(null);
        setStatus("Saved!");
      } else {
        setStatus("Failed to save.");
      }
    } catch {
      setStatus("Network error.");
    } finally {
      setSaving(false);
    }
  }

  function updateCompetitor(idx: number, field: keyof CompetitorRow, value: string) {
    setCompetitors((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  }

  function removeCompetitor(idx: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));
  }

  function addCompetitor() {
    setCompetitors((prev) => [
      ...prev,
      { name: "", city: "", products_summary: "", strengths: "", weaknesses: "", is_ai_generated: false },
    ]);
    setEditingIdx(competitors.length);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
        Loading competitive analysis...
      </div>
    );
  }

  const hasData = competitors.length > 0 || analysis;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-medium">Competitive Analysis</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              AI-powered analysis of your competitive landscape
            </p>
          </div>
          <div className="flex items-center gap-2">
            {status && (
              <span className={`text-xs ${status.includes("Error") || status.includes("Failed") ? "text-red-600" : "text-green-600"}`}>
                {status}
              </span>
            )}
            <Button size="sm" onClick={runAnalysis} loading={analyzing}>
              {hasData ? "Re-analyze" : "Generate Analysis"}
            </Button>
          </div>
        </div>
        {generatedAt && (
          <p className="text-xs text-gray-400">
            Last analyzed: {new Date(generatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
          </p>
        )}
        {analyzing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            AI is analyzing your market and identifying competitors...
          </div>
        )}
      </div>

      {!hasData && !analyzing && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <div className="text-gray-400 mb-3">
            <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No competitive analysis yet</p>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Click &quot;Generate Analysis&quot; to let AI discover your competitors and analyze your market position.
          </p>
        </div>
      )}

      {/* Analysis Report */}
      {analysis && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h4 className="text-sm font-medium">Market Position</h4>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-800">{analysis.overall_position}</p>
            {analysis.pricing_position && (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Pricing: {analysis.pricing_position}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Advantages */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h5 className="text-xs font-medium text-green-800 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Your Strengths
              </h5>
              <ul className="space-y-1.5">
                {analysis.advantages.map((a, i) => (
                  <li key={i} className="text-xs text-green-900">{a}</li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h5 className="text-xs font-medium text-amber-800 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Watch Out For
              </h5>
              <ul className="space-y-1.5">
                {analysis.gaps.map((g, i) => (
                  <li key={i} className="text-xs text-amber-900">{g}</li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h5 className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Opportunities
              </h5>
              <ul className="space-y-1.5">
                {analysis.opportunities.map((o, i) => (
                  <li key={i} className="text-xs text-blue-900">{o}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Competitor Cards */}
      {competitors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Competitors ({competitors.length})</h4>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={addCompetitor}>
                + Add
              </Button>
              {editingIdx !== null && (
                <Button size="sm" onClick={saveEdits} loading={saving}>
                  Save Changes
                </Button>
              )}
            </div>
          </div>

          {competitors.map((comp, idx) => {
            const isEditing = editingIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="Competitor name"
                          value={comp.name}
                          onChange={(e) => updateCompetitor(idx, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="Location"
                          value={comp.city}
                          onChange={(e) => updateCompetitor(idx, "city", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">What they sell</label>
                      <input
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Product summary"
                        value={comp.products_summary}
                        onChange={(e) => updateCompetitor(idx, "products_summary", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Strengths</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="What they're good at"
                          value={comp.strengths}
                          onChange={(e) => updateCompetitor(idx, "strengths", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Weaknesses</label>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="Where they fall short"
                          value={comp.weaknesses}
                          onChange={(e) => updateCompetitor(idx, "weaknesses", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingIdx(null)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">
                        Done
                      </button>
                      <button onClick={() => removeCompetitor(idx)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => setEditingIdx(idx)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-sm font-semibold">{comp.name}</h5>
                        {comp.city && (
                          <p className="text-xs text-gray-500">{comp.city}</p>
                        )}
                      </div>
                      {comp.is_ai_generated && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                          AI discovered
                        </span>
                      )}
                    </div>
                    {comp.products_summary && (
                      <p className="text-xs text-gray-600 mb-2">{comp.products_summary}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {comp.strengths && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 shrink-0">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                          <p className="text-xs text-gray-600">{comp.strengths}</p>
                        </div>
                      )}
                      {comp.weaknesses && (
                        <div className="flex items-start gap-1.5">
                          <span className="text-red-400 mt-0.5 shrink-0">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5" /></svg>
                          </span>
                          <p className="text-xs text-gray-600">{comp.weaknesses}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">Click to edit</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Owner Combos Tab ---

interface OwnerComboData {
  id?: string;
  name: string;
  tags: Record<string, string>;
  items: Array<{ name: string; qty: number; unit_price: number; total: number; image_url?: string }>;
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
    let key = "";
    let i = 1;
    while (existing.includes(key)) key = `_new_${i++}`;
    updateTag(ci, key, "");
  }

  async function uploadItemImage(comboIndex: number, itemIndex: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("factory_id", factoryId);
    formData.append("bucket", "product-images");
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      if (!res.ok) return;
      const { url } = await res.json();
      setCombos((prev) => {
        const updated = [...prev];
        const items = [...updated[comboIndex].items];
        items[itemIndex] = { ...items[itemIndex], image_url: url };
        updated[comboIndex] = { ...updated[comboIndex], items };
        return updated;
      });
    } catch {}
  }

  function updateItem(ci: number, ii: number, field: string, value: string) {
    setCombos((prev) => {
      const updated = [...prev];
      const items = [...updated[ci].items];
      const isStringField = field === "name" || field === "image_url";
      items[ii] = {
        ...items[ii],
        [field]: isStringField ? value : parseFloat(value) || 0,
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
                    {Object.entries(combo.tags).map(([key, val], tagIdx) => (
                      <div key={tagIdx} className="flex items-end gap-2">
                        <div className="w-1/3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                          <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="e.g. crop, spacing" value={key} onChange={(e) => renameTag(ci, key, e.target.value)} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                          <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="e.g. tomato, 30cm" value={val} onChange={(e) => updateTag(ci, key, e.target.value)} />
                        </div>
                        <button type="button" onClick={() => removeTag(ci, key)} className="text-red-400 hover:text-red-600 text-xs font-medium pb-1">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addTag(ci)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
                      Add Detail
                    </button>
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
                      {isEditing && <th className="text-left py-1 px-1 font-medium w-20">Image</th>}
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
                        {isEditing ? (
                          <td className="py-1 px-1">
                            <div className="flex items-center gap-1.5">
                              {item.image_url ? (
                                <>
                                  <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(item.image_url, "_blank")} />
                                  <label className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Change
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadItemImage(ci, ii, file);
                                      e.target.value = "";
                                    }} />
                                  </label>
                                </>
                              ) : (
                                <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-gray-300 text-[11px] text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  Image
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadItemImage(ci, ii, file);
                                    e.target.value = "";
                                  }} />
                                </label>
                              )}
                            </div>
                          </td>
                        ) : (
                          <td className="py-1 px-1">
                            {item.image_url && <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded-md border border-gray-200" />}
                          </td>
                        )}
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

// --- Wish Posts Tab ---

interface WishEvent {
  date: string;
  name: string;
  region: string;
  emoji: string;
  generated: number;
  maxPosts: number;
}

interface WishPost {
  id: string;
  event_name: string;
  event_date: string;
  image_url: string;
  caption: string;
  generation_number: number;
  created_at: string;
}

function WishPostsTab({
  brandColors,
}: {
  brandColors: { primary: string; secondary: string; accent: string } | null;
}) {
  const [events, setEvents] = useState<WishEvent[]>([]);
  const [posts, setPosts] = useState<WishPost[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/owner/wishes/events")
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .finally(() => setLoadingEvents(false));

    fetch("/api/owner/wishes")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts || []))
      .finally(() => setLoadingPosts(false));
  }, []);

  async function generatePost(event: WishEvent) {
    setGenerating(event.date);
    setStatus("");
    try {
      const res = await fetch("/api/owner/wishes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: event.name, event_date: event.date, event_region: event.region }),
      });

      if (!res.ok) {
        const err = await res.json();
        setStatus(`Error: ${err.error}`);
        return;
      }

      const { post } = await res.json();
      setPosts((prev) => [post, ...prev]);
      setEvents((prev) =>
        prev.map((e) =>
          e.date === event.date ? { ...e, generated: e.generated + 1 } : e
        )
      );
      setStatus("Post generated!");
    } catch {
      setStatus("Failed to generate post.");
    } finally {
      setGenerating(null);
    }
  }

  function copyCaption(post: WishPost) {
    navigator.clipboard.writeText(post.caption);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const postsByEvent: Record<string, WishPost[]> = {};
  for (const p of posts) {
    const key = `${p.event_date}-${p.event_name}`;
    if (!postsByEvent[key]) postsByEvent[key] = [];
    postsByEvent[key].push(p);
  }

  const loading = loadingEvents || loadingPosts;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Loading events and posts...</p>
      </div>
    );
  }

  const activeBrandColors = [brandColors?.primary, brandColors?.secondary, brandColors?.accent].filter(Boolean) as string[];
  const hasBrandColors = activeBrandColors.length > 0;

  return (
    <div className="space-y-5">
      {/* Brand colors indicator */}
      {hasBrandColors && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700">Brand colors applied</p>
            <p className="text-[10px] text-gray-400">Your brand colors will be used when generating posts</p>
          </div>
          {activeBrandColors.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {activeBrandColors.map((color) => (
                <span
                  key={color}
                  className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium mb-1">Upcoming Events</h3>
        <p className="text-xs text-gray-500 mb-4">Next 30 days — click Generate to create a branded wish post</p>

        {status && (
          <div className={`text-xs mb-3 px-3 py-2 rounded-lg ${status.includes("Error") || status.includes("Failed") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {status}
          </div>
        )}

        {events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No events in the next 30 days.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const isGenerating = generating === event.date;
              const canGenerate = event.generated < event.maxPosts;
              const [mm, dd] = event.date.split("-");
              const dateLabel = new Date(2024, parseInt(mm) - 1, parseInt(dd)).toLocaleDateString("en-US", { month: "short", day: "numeric" });

              return (
                <div
                  key={event.date + event.name}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    event.region === "zambia"
                      ? "bg-green-50 border-green-200"
                      : event.region === "africa"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{event.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{event.name}</p>
                      <p className="text-xs text-gray-500">{dateLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {event.generated > 0 && (
                      <span className="text-xs text-gray-500">
                        {event.generated}/{event.maxPosts} generated
                      </span>
                    )}
                    <button
                      onClick={() => generatePost(event)}
                      disabled={!canGenerate || isGenerating}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        !canGenerate
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isGenerating
                            ? "bg-gray-200 text-gray-500 cursor-wait"
                            : "bg-black text-white hover:bg-gray-800"
                      }`}
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </span>
                      ) : !canGenerate ? (
                        "Limit reached"
                      ) : (
                        "Generate"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generated Posts */}
      {Object.keys(postsByEvent).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Generated Posts</h3>

          {Object.entries(postsByEvent).map(([key, eventPosts]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-sm font-semibold">{eventPosts[0].event_name}</h4>
                <span className="text-xs text-gray-400">
                  ({eventPosts.length}/3 generated)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {eventPosts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.event_name}
                      className="w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(post.image_url, "_blank")}
                    />
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                        {post.caption}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyCaption(post)}
                          className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-center"
                        >
                          {copiedId === post.id ? "Copied!" : "Copy Caption"}
                        </button>
                        <a
                          href={post.image_url}
                          download={`${post.event_name.replace(/\s+/g, "_")}_${post.generation_number}.png`}
                          className="px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Generated {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(postsByEvent).length === 0 && (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-500">No wish posts yet</p>
          </div>
          <p className="text-xs text-gray-400">
            Select an upcoming event above and click Generate to create a branded social media post.
          </p>
        </div>
      )}
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
