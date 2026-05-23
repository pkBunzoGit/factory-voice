"use client";

import { useEffect, useRef, useState } from "react";
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
  } | null>(null);
  const [phase, setPhase] = useState<"loading" | "lead" | "chat" | "error">(
    "loading"
  );
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

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPhone(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/chat/${slug}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to start chat");
        return;
      }

      setSessionId(data.session_id);
      setMessages([
        {
          role: "assistant",
          content: `Welcome to ${factory?.name}! How can I help you today? Ask me about our products, prices, or lead times.`,
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
                  Welcome! Please enter your WhatsApp number so{" "}
                  {factory?.name} can follow up with your quotes.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-3">
                <Input
                  label="Your WhatsApp Number"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  required
                />

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
              {m.content || (
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
