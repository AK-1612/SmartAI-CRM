import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Ticket, TicketPriority } from "../../types/api";
import { supportApi, type TicketFilters } from "./api";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  open: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  escalated: "bg-red-100 text-red-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-200 text-slate-500"
};

const SENTIMENT_STYLES: Record<string, string> = {
  positive: "text-emerald-600",
  neutral: "text-slate-500",
  negative: "text-red-600"
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

function CreateTicketForm({ onCreated }: { onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      supportApi.createTicket({
        subject,
        description,
        customer_name: customerName,
        customer_email: customerEmail
      }),
    onSuccess: () => {
      setSubject("");
      setDescription("");
      setCustomerName("");
      setCustomerEmail("");
      onCreated();
    }
  });

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <input
        required
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        required
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          required
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Customer email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {mutation.isPending ? "Creating…" : "Create ticket (AI will categorize & score sentiment)"}
      </button>
    </form>
  );
}

function TicketDetail({ ticket, onUpdated }: { ticket: Ticket; onUpdated: () => void }) {
  const [agentId, setAgentId] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [suggested, setSuggested] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: ["ticket-comments", ticket.id],
    queryFn: () => supportApi.listComments(ticket.id)
  });

  const assignMutation = useMutation({
    mutationFn: () => supportApi.assign(ticket.id, Number(agentId)),
    onSuccess: onUpdated
  });
  const resolveMutation = useMutation({ mutationFn: () => supportApi.resolve(ticket.id), onSuccess: onUpdated });
  const escalateMutation = useMutation({ mutationFn: () => supportApi.escalate(ticket.id), onSuccess: onUpdated });
  const commentMutation = useMutation({
    mutationFn: () => supportApi.addComment(ticket.id, commentBody, false),
    onSuccess: () => {
      setCommentBody("");
      commentsQuery.refetch();
      onUpdated();
    }
  });

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{ticket.subject}</h3>
          <p className="mt-1 text-sm text-slate-600">{ticket.description}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span>
          Category: <strong className="text-slate-700">{ticket.category.replace("_", " ")}</strong>
        </span>
        <span>
          Priority: <strong className="text-slate-700">{ticket.priority}</strong>
        </span>
        {ticket.sentiment && (
          <span>
            Sentiment:{" "}
            <strong className={SENTIMENT_STYLES[ticket.sentiment]}>
              {ticket.sentiment} ({ticket.sentiment_score})
            </strong>
          </span>
        )}
        {ticket.is_response_sla_breached && <span className="font-medium text-red-600">Response SLA breached</span>}
        {ticket.is_resolution_sla_breached && <span className="font-medium text-red-600">Resolution SLA breached</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Agent user ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-32 rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
        <button
          onClick={() => assignMutation.mutate()}
          disabled={!agentId}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
        >
          Assign
        </button>
        <button
          onClick={() => resolveMutation.mutate()}
          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
        >
          Resolve
        </button>
        <button
          onClick={() => escalateMutation.mutate()}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
        >
          Escalate
        </button>
        <button
          onClick={async () => setSuggested((await supportApi.suggestResponse(ticket.id)).suggested_response)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100"
        >
          AI suggest response
        </button>
      </div>

      {suggested && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
          {suggested}
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comments</h4>
        <div className="mt-2 space-y-2">
          {commentsQuery.data?.map((comment) => (
            <div key={comment.id} className="rounded-md bg-slate-50 p-2 text-xs text-slate-700">
              <span className="font-medium">{comment.author_name ?? "System"}</span>: {comment.body}
            </div>
          ))}
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (commentBody.trim()) commentMutation.mutate();
          }}
        >
          <input
            placeholder="Reply to customer…"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
          />
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function Chatbot() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ from: "me" | "bot"; text: string }[]>([]);

  const mutation = useMutation({
    mutationFn: (text: string) => supportApi.chatbot(text),
    onSuccess: (reply) => setHistory((h) => [...h, { from: "bot", text: reply.answer }])
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">AI chatbot (KB-grounded)</h2>
      <div className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm">
        {history.map((entry, i) => (
          <p key={i} className={entry.from === "me" ? "text-slate-900" : "text-slate-600"}>
            <strong>{entry.from === "me" ? "You" : "Bot"}:</strong> {entry.text}
          </p>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          setHistory((h) => [...h, { from: "me", text: message }]);
          mutation.mutate(message);
          setMessage("");
        }}
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a support question…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Ask
        </button>
      </form>
    </section>
  );
}

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TicketFilters>({});
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const ticketsQuery = useQuery({ queryKey: ["tickets", filters], queryFn: () => supportApi.listTickets(filters) });
  const summaryQuery = useQuery({ queryKey: ["support-summary"], queryFn: supportApi.summary });

  const selectedTicket = ticketsQuery.data?.find((t) => t.id === selectedTicketId) ?? null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    queryClient.invalidateQueries({ queryKey: ["support-summary"] });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-950">Customer Support</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tickets are auto-categorized and sentiment-scored on creation, with SLA timers, an AI response
          assistant, and a knowledge-base chatbot.
        </p>
      </header>

      {summaryQuery.data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(summaryQuery.data.by_status).map(([status, count]) => (
            <div key={status} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{status}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{count}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New ticket</h2>
            <div className="mt-3">
              <CreateTicketForm onCreated={refresh} />
            </div>
          </section>
          <Chatbot />
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tickets</h2>
              <div className="flex gap-2 text-xs">
                <select
                  value={filters.status ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                  className="rounded border border-slate-300 px-2 py-1"
                >
                  <option value="">All statuses</option>
                  {Object.keys(STATUS_STYLES).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.priority ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, priority: (e.target.value || undefined) as TicketPriority | undefined }))
                  }
                  className="rounded border border-slate-300 px-2 py-1"
                >
                  <option value="">All priorities</option>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {ticketsQuery.data?.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`flex w-full items-center justify-between py-2 text-left text-sm hover:bg-slate-50 ${
                    selectedTicketId === ticket.id ? "bg-slate-50" : ""
                  }`}
                >
                  <span>
                    <span className="font-medium text-slate-900">#{ticket.id}</span> {ticket.subject}
                  </span>
                  <StatusBadge status={ticket.status} />
                </button>
              ))}
              {ticketsQuery.isSuccess && ticketsQuery.data.length === 0 && (
                <p className="py-2 text-xs text-slate-400">No tickets match these filters.</p>
              )}
            </div>
          </section>

          {selectedTicket && <TicketDetail ticket={selectedTicket} onUpdated={refresh} />}
        </div>
      </div>
    </div>
  );
}
