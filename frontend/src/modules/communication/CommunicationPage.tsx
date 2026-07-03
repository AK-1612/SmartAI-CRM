import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { communicationApi } from "./api";
import { leadsApi } from "../leads/api";

export default function CommunicationPage() {
  const queryClient = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP">("EMAIL");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Queries
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["comm-logs"],
    queryFn: communicationApi.listLogs,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["comm-templates"],
    queryFn: communicationApi.listTemplates,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: leadsApi.listLeads,
  });

  // Mutations
  const sendMutation = useMutation({
    mutationFn: communicationApi.sendLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comm-logs"] });
      // Clear form
      setContent("");
      setSubject("");
    },
  });

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find(t => t.id === Number(templateId));
    if (!template) return;

    // Fill channel and fields
    setChannel(template.channel as "EMAIL" | "SMS" | "WHATSAPP");
    setSubject(template.subject_template || "");
    
    // Attempt interpolation if lead is selected
    let interpolatedBody = template.body_template;
    if (selectedLeadId) {
      const lead = leads.find(l => l.id === Number(selectedLeadId));
      if (lead) {
        interpolatedBody = interpolatedBody
          .replace(/\{\{\s*first_name\s*\}\}/g, lead.first_name)
          .replace(/\{\{\s*last_name\s*\}\}/g, lead.last_name)
          .replace(/\{\{\s*company\s*\}\}/g, lead.company || "your company");
      }
    }
    setContent(interpolatedBody);
  };

  // Handle lead selection to prefill recipient
  const handleLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) {
      setRecipient("");
      return;
    }
    const lead = leads.find(l => l.id === Number(leadId));
    if (lead) {
      setRecipient(channel === "EMAIL" ? lead.email : lead.phone);
    }
  };

  const handleChannelChange = (newChannel: "EMAIL" | "SMS" | "WHATSAPP") => {
    setChannel(newChannel);
    if (selectedLeadId) {
      const lead = leads.find(l => l.id === Number(selectedLeadId));
      if (lead) {
        setRecipient(newChannel === "EMAIL" ? lead.email : lead.phone);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !content) return;
    
    sendMutation.mutate({
      lead: selectedLeadId ? Number(selectedLeadId) : undefined,
      recipient,
      channel,
      subject: channel === "EMAIL" ? subject : undefined,
      content,
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-950">Communication Hub</h1>
        <p className="mt-1 text-sm text-slate-600">
          Send multichannel communications and template messages via Email, Twilio SMS, and WhatsApp with full audit logs.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1.5fr]">
        {/* Left Column: Compose Message */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Send New Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Lead selector (optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Link to Lead</label>
              <select
                value={selectedLeadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none bg-white"
              >
                <option value="">No linked lead (ad-hoc message)</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.first_name} {l.last_name} ({l.company || "No Company"})
                  </option>
                ))}
              </select>
            </div>

            {/* Template selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Use Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none bg-white"
              >
                <option value="">Select a template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.channel}] {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel Selection tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Channel</label>
              <div className="flex gap-2">
                {(["EMAIL", "SMS", "WHATSAPP"] as const).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => handleChannelChange(ch)}
                    className={`flex-1 rounded-md py-1.5 text-xs font-semibold border transition-colors ${
                      channel === ch
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Recipient</label>
              <input
                required
                placeholder={channel === "EMAIL" ? "email@example.com" : "+1234567890"}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            {/* Email Subject */}
            {channel === "EMAIL" && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subject</label>
                <input
                  required={channel === "EMAIL"}
                  placeholder="Subject line"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
            )}

            {/* Message Body */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Message Content</label>
              <textarea
                required
                rows={5}
                placeholder="Type your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="w-full rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </section>

        {/* Right Column: Outbox Logs */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Communication Logs</h2>
          {logsLoading ? (
            <p className="text-center text-sm text-slate-500 py-6">Loading communication history...</p>
          ) : (
            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[550px] pr-1">
              {logs.map((log) => (
                <div key={log.id} className="py-3.5 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{log.recipient}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                      log.status === "SENT" || log.status === "DELIVERED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : log.status === "FAILED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold">{log.channel}</span>
                    <span>•</span>
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  {log.subject && <p className="text-xs font-semibold text-slate-700">Subj: {log.subject}</p>}
                  <p className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 p-2.5 rounded border border-slate-100/50 mt-1">
                    {log.content}
                  </p>
                  {log.error_message && (
                    <p className="text-xs font-semibold text-rose-600 mt-1">⚠️ Error: {log.error_message}</p>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-400">No communication logs recorded yet.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
