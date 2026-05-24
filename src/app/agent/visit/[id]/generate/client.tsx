"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Sample {
  question: string;
  answer: string;
}

const CHECKLIST_ITEMS = [
  { task: "Create client record in Agent App and fill Sections 1 to 6", group: "Data Collection" },
  { task: "Hit 'Generate Bot Profile' — wait for AI to build brain", group: "Data Collection" },
  { task: "Read 3 sample replies out loud to the owner for approval", group: "Data Collection" },
  { task: "Create owner login account (see above)", group: "Owner Setup" },
  { task: "Ask owner to open WhatsApp Business on their phone", group: "Link Setup" },
  { task: "Go to Settings → Greeting Message / Away Message", group: "Link Setup" },
  { task: "Type the greeting and paste the unique FactoryVoice link", group: "Link Setup" },
  { task: "Send a test message from your phone to verify auto-reply triggers", group: "Link Setup" },
  { task: "Click the link, enter a test phone number, and chat with the bot", group: "Link Setup" },
  { task: "Show owner the Owner Dashboard on their phone/computer", group: "Before Leaving" },
  { task: "Show them where captured leads and chat histories will appear", group: "Before Leaving" },
  { task: "Mark visit complete in Agent App", group: "Before Leaving" },
];

export function GenerateClient({ factoryId }: { factoryId: string }) {
  const router = useRouter();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [chatSlug, setChatSlug] = useState("");
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const [completing, setCompleting] = useState(false);
  const [visitComplete, setVisitComplete] = useState(false);

  // Owner account creation
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPin, setOwnerPin] = useState("");
  const [creatingOwner, setCreatingOwner] = useState(false);
  const [ownerCreated, setOwnerCreated] = useState(false);
  const [ownerError, setOwnerError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setSamples([]);
    setSystemPrompt("");

    try {
      const res = await fetch(`/api/factory/${factoryId}/generate-brain`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate");
        return;
      }

      setSystemPrompt(data.system_prompt);

      // Automatically fetch samples
      setLoadingSamples(true);
      const samplesRes = await fetch(`/api/factory/${factoryId}/samples`);
      const samplesData = await samplesRes.json();

      if (samplesRes.ok) {
        setSamples(samplesData.samples);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
      setLoadingSamples(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    setError("");

    try {
      const res = await fetch(`/api/factory/${factoryId}/approve`, {
        method: "PUT",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to approve");
        return;
      }

      setApproved(true);
      setChatSlug(data.slug);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  const chatUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/chat/${chatSlug}`
      : "";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Generate Bot Profile</h1>
            <p className="text-xs text-gray-500">
              Review AI-generated responses before going live
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/agent/visit/${factoryId}`)}
          >
            Back to Form
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Generate Button */}
        {!systemPrompt && !generating && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
            <p className="text-gray-600">
              Ready to generate the AI bot profile from the factory data you
              collected.
            </p>
            <Button onClick={handleGenerate} size="lg">
              Generate Bot Profile
            </Button>
          </div>
        )}

        {generating && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
            <div className="animate-pulse">
              Generating bot profile with AI... This takes about 10 seconds.
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* System Prompt Preview */}
        {systemPrompt && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-medium">Bot Brain (System Prompt)</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {systemPrompt}
              </p>
            </div>
          </div>
        )}

        {/* Sample Q&A */}
        {loadingSamples && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500 text-sm animate-pulse">
            Generating sample conversations...
          </div>
        )}

        {samples.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              Sample Conversations — Read these to the owner for approval
            </h3>
            {samples.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
                  <p className="text-sm font-medium text-blue-900">
                    Customer: &ldquo;{s.question}&rdquo;
                  </p>
                </div>
                <div className="px-5 py-3">
                  <div className="prose prose-sm max-w-none text-gray-700 [&>p]:m-0 [&>p]:mb-2 [&>ul]:my-1 [&>ul]:ml-4 [&>ol]:my-1 [&>ol]:ml-4 [&_li]:my-0.5 [&_strong]:font-semibold [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-2 [&_th]:bg-gray-50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-medium [&_th]:border [&_th]:border-gray-200 [&_td]:px-2 [&_td]:py-1 [&_td]:border [&_td]:border-gray-200 [&_hr]:my-2 [&_hr]:border-gray-200">
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
                                className="rounded-lg max-w-full mt-1 border border-gray-200"
                                style={{ minHeight: "80px", maxHeight: "300px", objectFit: "contain" }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </span>
                          );
                        },
                      }}
                    >
                      {s.answer}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approve / Regenerate */}
        {samples.length > 0 && !approved && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleGenerate}>
              Regenerate
            </Button>
            <Button
              onClick={handleApprove}
              loading={approving}
              className="flex-1"
            >
              Owner Approves — Go Live
            </Button>
          </div>
        )}

        {/* Approved — Show Chat Link + Owner Account + Checklist */}
        {approved && !visitComplete && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Bot is Live!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Now create the owner account and complete the setup checklist.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-green-200 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Chat Link</p>
                <p className="text-sm font-mono font-medium break-all">
                  {chatUrl}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-green-200 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">
                  WhatsApp Greeting Message (paste this)
                </p>
                <p className="text-sm text-gray-700">
                  Hi! Welcome to our business. Our AI assistant can instantly
                  answer your questions about stock, prices, and lead times.
                  Click here to chat: {chatUrl}
                </p>
              </div>
            </div>

            {/* Owner Account Setup */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-medium">Owner Account Setup</h3>
              </div>
              <div className="px-5 py-4">
                {ownerCreated ? (
                  <div className="bg-green-50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-green-800">
                      Owner account created successfully!
                    </p>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Email: <span className="font-mono">{ownerEmail}</span></p>
                      <p>PIN: <span className="font-mono">{ownerPin}</span></p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Share these credentials with the owner so they can log in to the dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Create a login for the factory owner so they can manage their dashboard.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Owner Name"
                        placeholder="Mr. Sharma"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                      />
                      <Input
                        label="Email"
                        placeholder="owner@company.com"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        required
                      />
                      <Input
                        label="PIN (min 4 chars)"
                        placeholder="123456"
                        type="text"
                        value={ownerPin}
                        onChange={(e) => setOwnerPin(e.target.value)}
                        required
                      />
                    </div>
                    {ownerError && (
                      <p className="text-xs text-red-600">{ownerError}</p>
                    )}
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (!ownerEmail || !ownerPin) {
                          setOwnerError("Email and PIN are required");
                          return;
                        }
                        setCreatingOwner(true);
                        setOwnerError("");
                        try {
                          const res = await fetch(
                            `/api/factory/${factoryId}/create-owner`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                name: ownerName,
                                email: ownerEmail,
                                pin: ownerPin,
                              }),
                            }
                          );
                          const data = await res.json();
                          if (!res.ok) {
                            setOwnerError(data.error || "Failed to create");
                          } else {
                            setOwnerCreated(true);
                          }
                        } catch {
                          setOwnerError("Network error");
                        } finally {
                          setCreatingOwner(false);
                        }
                      }}
                      loading={creatingOwner}
                    >
                      Create Owner Account
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Visit Checklist */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-medium">
                  Visit Checklist — {checklist.filter(Boolean).length}/{CHECKLIST_ITEMS.length}
                  {" "}completed
                </h3>
              </div>
              <div className="px-5 py-4 space-y-1">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 py-2 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[i]}
                      onChange={() =>
                        setChecklist((prev) => {
                          const next = [...prev];
                          next[i] = !next[i];
                          return next;
                        })
                      }
                      className="mt-0.5 w-4 h-4 rounded border-gray-300"
                    />
                    <div>
                      <p
                        className={`text-sm ${checklist[i] ? "text-gray-400 line-through" : "text-gray-800"}`}
                      >
                        {item.task}
                      </p>
                      {item.group !== CHECKLIST_ITEMS[i - 1]?.group && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.group}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={async () => {
                setCompleting(true);
                try {
                  await fetch(`/api/factory/${factoryId}/complete`, {
                    method: "PUT",
                  });
                  setVisitComplete(true);
                } finally {
                  setCompleting(false);
                }
              }}
              loading={completing}
              className="w-full"
              disabled={checklist.filter(Boolean).length < 8}
            >
              Mark Visit Complete
            </Button>
            {checklist.filter(Boolean).length < 8 && (
              <p className="text-xs text-gray-400 text-center">
                Complete at least 8 checklist items to finish the visit
              </p>
            )}
          </div>
        )}

        {/* Visit Complete */}
        {visitComplete && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
            <h3 className="text-xl font-semibold text-green-900">
              Visit Complete!
            </h3>
            <p className="text-sm text-green-700">
              The bot is live, the owner has been shown the dashboard, and
              all setup steps are done.
            </p>
            <Button
              onClick={() => router.push("/agent/dashboard")}
              variant="secondary"
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
