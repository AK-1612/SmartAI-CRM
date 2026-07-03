import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { assistantApi } from "./api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Handle Web Speech API
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function AssistantChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! How can I help you with the CRM today?" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Init speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const speechToText = event.results[0][0].transcript;
        setQuery(speechToText);
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const mutation = useMutation({
    mutationFn: assistantApi.chat,
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error communicating with AI assistant." },
      ]);
    },
  });

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setQuery("");
    mutation.mutate({ query: text });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Widget */}
      {isOpen && (
        <div className="mb-4 flex h-[480px] w-96 flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-sm">CRM AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex max-w-[85%] flex-col ${
                  msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-800 border border-slate-200/50"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex items-start mr-auto max-w-[85%]">
                <div className="rounded-xl px-3 py-2 text-xs bg-slate-100 text-slate-500 italic animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="border-t border-slate-100 p-3 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(query)}
                placeholder="Ask me anything..."
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-slate-400 focus:outline-none"
              />
              
              {/* Voice button */}
              {SpeechRecognition && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`rounded-lg p-1.5 transition-colors border ${
                    isListening
                      ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                  }`}
                  title="Voice command input"
                >
                  🎤
                </button>
              )}

              <button
                onClick={() => handleSend(query)}
                disabled={!query.trim()}
                className="rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-transform active:scale-95 duration-150"
      >
        {isOpen ? "✕" : "🤖"}
      </button>
    </div>
  );
}
