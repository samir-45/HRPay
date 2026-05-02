import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { Bot, X, Send, Minimize2, Maximize2, Sparkles } from "lucide-react";

const LIME = "hsl(82 80% 48%)";
const API = "/api";

interface Message { role: "user" | "assistant"; content: string; }

function formatMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

export function AIAssistant() {
  const { token } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your **HRPay AI assistant**. Ask me anything about HR, payroll, leave, recruitment, or performance management." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const r = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify({ message: userMsg, page: location }),
      });
      const data = await r.json() as { reply: string };
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't connect. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full shadow-xl transition-all hover:scale-110 active:scale-95"
        style={{ background: LIME }}
        title="AI Assistant"
      >
        <Bot className="h-6 w-6 text-foreground" />
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-foreground text-white text-[10px] font-bold">AI</span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-border bg-white transition-all ${minimized ? "w-72 h-14" : "w-80 h-[500px] sm:w-96"}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-t-2xl shrink-0" style={{ background: LIME }}>
        <Sparkles className="h-4 w-4 text-foreground" />
        <p className="font-bold text-foreground text-sm flex-1">HRPay AI Assistant</p>
        <button onClick={() => setMinimized(m => !m)} className="text-foreground/70 hover:text-foreground transition-colors">
          {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </button>
        <button onClick={() => setOpen(false)} className="text-foreground/70 hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="size-6 shrink-0 rounded-full flex items-center justify-center mr-2 mt-0.5" style={{ background: LIME }}>
                    <Bot className="h-3.5 w-3.5 text-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}
                  style={msg.role === "user" ? { background: "hsl(220 15% 15%)" } : {}}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="size-6 shrink-0 rounded-full flex items-center justify-center mr-2" style={{ background: LIME }}>
                  <Bot className="h-3.5 w-3.5 text-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  {[0, 0.2, 0.4].map(d => (
                    <span key={d} className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {["Pending leave requests", "Process payroll", "Headcount by dept", "Create job posting"].map(s => (
                <button key={s} onClick={() => { setInput(s); }} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              rows={1}
              placeholder="Ask me anything about HR…"
              className="flex-1 resize-none text-sm text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
              style={{ maxHeight: 72 }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex size-8 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:opacity-90"
              style={{ background: LIME }}
            >
              <Send className="h-3.5 w-3.5 text-foreground" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
