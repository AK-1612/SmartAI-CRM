import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { assistantApi } from "./api";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function AssistantPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your SmartAI CRM Assistant. Ask me anything about your leads, reports, or pipeline activities! E.g. 'Show this month's sales report' or 'List hot leads'.",
      timestamp: new Date(),
    },
  ]);

  const mutation = useMutation({
    mutationFn: assistantApi.chat,
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble reaching the AI service. Please verify your settings and API keys.",
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      },
    ]);
    setQuery("");

    mutation.mutate({ query: userMessage });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold text-slate-950">AI Virtual CRM Assistant</h1>
        <p className="mt-1 text-sm text-slate-600">
          Query leads, generate reports, search CRM data, or automate actions using natural language commands.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col h-[550px]">
        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col max-w-[80%] ${
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex flex-col items-start mr-auto max-w-[80%]">
              <div className="rounded-lg px-4 py-2.5 text-sm bg-slate-100 text-slate-500 italic animate-pulse">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="border-t border-slate-100 p-4 flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, generate reports, ask for suggestions..."
            className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
            disabled={mutation.isPending}
          />
          <button
            type="submit"
            disabled={mutation.isPending || !query.trim()}
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
