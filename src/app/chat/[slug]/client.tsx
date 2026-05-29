"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatClient({ slug }: { slug: string }) {
  const [factory, setFactory] = useState<{
    id: string;
    name: string;
    city: string;
    welcome_intro?: string;
  } | null>(null);
  const [phase, setPhase] = useState<"loading" | "lead" | "chat" | "error">(
    "loading"
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [submittingPhone, setSubmittingPhone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/chat/${slug}/init`)
      .then((r) => r.json())
      .then((data) => {
        if (data.factory) {
          setFactory(data.factory);
          setPhase("lead");
        } else {
          setErrorMsg(data.error || "Business not found");
          setPhase("error");
        }
      })
      .catch(() => {
        setErrorMsg("Failed to load. Please try again.");
        setPhase("error");
      });
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPhone(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/chat/${slug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to start chat");
        return;
      }

      setSessionId(data.session_id);
      const intro = factory?.welcome_intro
        ? `\n\n${factory.welcome_intro}`
        : "";
      setMessages([
        {
          role: "assistant",
          content: `Welcome to ${factory?.name}!${intro}\n\nHow can I help you today?\n\nMwaiseni ku ${factory?.name}! Ndingakuthandizeni bwanji lero?`,
        },
      ]);
      setPhase("chat");
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmittingPhone(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setSending(true);

    // Add placeholder for assistant response
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`/api/chat/${slug}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, session_id: sessionId }),
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6);
            if (payload === "[DONE]") break;

            try {
              const parsed = JSON.parse(payload);
              if (parsed.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + parsed.text,
                  };
                  return updated;
                });
              }
            } catch {
              // skip malformed chunk
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Connection lost. Please try again.",
        };
        return updated;
      });
    } finally {
      setSending(false);
    }
  }

  // After streaming completes, split ---Q--- into two bubbles with a delay
  const prevSendingRef = useRef(false);
  const pendingQuestionRef = useRef<string | null>(null);

  useEffect(() => {
    const wasSending = prevSendingRef.current;
    prevSendingRef.current = sending;

    if (!wasSending || sending) return;

    // Streaming just finished — check for delimiter in the last message
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant" || !last.content.includes("---Q---")) return prev;

      const [mainPart, ...rest] = last.content.split("---Q---");
      const questionPart = rest.join("---Q---").trim();
      if (!questionPart) return prev;

      pendingQuestionRef.current = questionPart;
      const updated = [...prev];
      updated[updated.length - 1] = { role: "assistant", content: mainPart.trim() };
      return updated;
    });

    const timeoutId = setTimeout(() => {
      const q = pendingQuestionRef.current;
      if (q) {
        setMessages((prev) => [...prev, { role: "assistant", content: q }]);
        pendingQuestionRef.current = null;
      }
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [sending]);

  // Loading state
  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  // Error state
  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <p className="text-gray-600 font-medium">{errorMsg}</p>
          <p className="text-sm text-gray-400 mt-2">
            This link may be invalid or the business is not yet active.
          </p>
        </div>
      </div>
    );
  }

  // Lead gate
  if (phase === "lead") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            {/* Header */}
            <div className="bg-green-600 px-5 py-4 text-white">
              <h1 className="font-semibold text-lg">{factory?.name}</h1>
              <p className="text-green-100 text-sm">{factory?.city}</p>
            </div>

            {/* Lead form */}
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  Welcome! Enter your name and WhatsApp number so{" "}
                  {factory?.name} can follow up with your quotes.
                </p>
              </div>

              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="customer-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Your Name
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. John Banda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-900 placeholder:text-gray-400"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="whatsapp-number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Your WhatsApp Number
                  </label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-offset-1 focus-within:ring-gray-900">
                    <span className="inline-flex items-center px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-sm font-medium text-gray-700 shrink-0">
                      +260
                    </span>
                    <input
                      id="whatsapp-number"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="971234567"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10)
                        )
                      }
                      className="block w-full px-3 py-2.5 text-sm focus:outline-none placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    9 digits (e.g. 971234567) or 10 with leading 0 (e.g. 0971234567)
                  </p>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600">{errorMsg}</p>
                )}

                <Button
                  type="submit"
                  loading={submittingPhone}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Start Chat
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="h-screen flex flex-col bg-gray-100 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-green-600 px-4 py-3 text-white flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-bold text-lg">
          {factory?.name?.[0] || "F"}
        </div>
        <div>
          <p className="font-semibold text-sm">{factory?.name}</p>
          <p className="text-green-100 text-xs">AI Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-green-500 text-white rounded-br-md"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
              }`}
            >
              {m.content ? (
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
                    {m.content.split("---Q---")[0].trim()}
                  </ReactMarkdown>
                </div>
              ) : (
                <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-gray-200 flex gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors disabled:bg-gray-300 shrink-0"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
