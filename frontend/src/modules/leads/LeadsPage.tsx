import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "./api";
import type { Lead, LeadStatus } from "../../types/api";

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  QUALIFIED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CONVERTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  LOST: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  
  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("Website");
  
  // Filter & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Queries
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: leadsApi.listLeads,
  });

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  // Mutations
  const createMutation = useMutation({
    mutationFn: leadsApi.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setCompany("");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      leadsApi.updateLead(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const rescoreMutation = useMutation({
    mutationFn: leadsApi.scoreLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: leadsApi.deleteLead,
    onSuccess: () => {
      setSelectedLeadId(null);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  // Duplicate warning check
  const isDuplicateEmail = leads.some(l => l.email.toLowerCase() === email.toLowerCase());

  // Filter & Prioritize leads (sorting by score desc is default in backend but enforced here too)
  const processedLeads = leads
    .filter(lead => {
      const matchesSearch = `${lead.first_name} ${lead.last_name} ${lead.company}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter ? lead.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.score - a.score); // Smart Lead Prioritization

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(leads, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "leads_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Lead Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Capture, score, and prioritize your sales pipeline with automated AI qualification and conversion prediction.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="self-start rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export Leads (JSON)
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
        {/* Left column: Create Lead & Filter List */}
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Capture New Lead</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate({
                  first_name: firstName,
                  last_name: lastName,
                  email,
                  phone,
                  company,
                  source,
                });
              }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
                <input
                  required
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
                  isDuplicateEmail ? "border-amber-400 bg-amber-50" : "border-slate-300 focus:border-slate-500"
                }`}
              />
              {isDuplicateEmail && (
                <p className="text-xs text-amber-600 font-medium">⚠️ A lead with this email address already exists!</p>
              )}
              <input
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <input
                placeholder="Company / Organization"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none bg-white"
              >
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Cold Call">Cold Call</option>
                <option value="Partner">Partner</option>
              </select>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full rounded-md bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createMutation.isPending ? "Saving Lead..." : "Save & AI Score Lead"}
              </button>
            </form>
          </section>

          {/* Leads Filtered List */}
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Leads Pipeline</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-slate-300 px-2 py-1 text-xs bg-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
            <input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            {isLoading ? (
              <p className="mt-4 text-center text-sm text-slate-500">Loading pipeline...</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {processedLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`flex w-full items-center justify-between py-3 px-2 text-left hover:bg-slate-50 rounded-md transition-colors ${
                      selectedLeadId === lead.id ? "bg-slate-50 font-medium" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{lead.company || "No Company"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        Score: {lead.score}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                        {lead.status}
                      </span>
                    </div>
                  </button>
                ))}
                {processedLeads.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">No leads found in this filter.</p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Lead Detail & AI Insights */}
        <div>
          {selectedLead ? (
            <div className="space-y-6">
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      {selectedLead.first_name} {selectedLead.last_name}
                    </h2>
                    <p className="text-sm text-slate-500">{selectedLead.company}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase ${STATUS_COLORS[selectedLead.status]}`}>
                      {selectedLead.status}
                    </span>
                    <span className="text-xs text-slate-400">Source: {selectedLead.source}</span>
                  </div>
                </div>

                {/* Score Section */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">AI Score</p>
                    <p className="mt-1 text-3xl font-extrabold text-indigo-600">{selectedLead.score}/100</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">Conversion Prob.</p>
                    <p className="mt-1 text-3xl font-extrabold text-slate-800">
                      {(selectedLead.conversion_probability * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* AI Qualification / Priority */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Insights & Qualification</h3>
                  <div className="rounded-md border border-indigo-100 bg-indigo-50/50 p-3.5 text-sm text-slate-700">
                    <p className="font-semibold text-indigo-800">
                      Status: {selectedLead.score >= 70 ? "✅ Auto-Qualified" : "⚠️ Needs Nurturing"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{selectedLead.ai_insights || "Recalculating details..."}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <p className="font-medium text-slate-900 break-all">{selectedLead.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <p className="font-medium text-slate-900">{selectedLead.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Status transitions */}
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <span className="text-xs text-slate-500 font-medium">Update Status:</span>
                  {(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as LeadStatus[]).map((status) => (
                    <button
                      key={status}
                      disabled={selectedLead.status === status || updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate({ id: selectedLead.id, status })}
                      className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                        selectedLead.status === status
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <button
                    onClick={() => rescoreMutation.mutate(selectedLead.id)}
                    disabled={rescoreMutation.isPending}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {rescoreMutation.isPending ? "Rescoring..." : "🔄 Force AI Rescore"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this lead?")) {
                        deleteMutation.mutate(selectedLead.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
                  >
                    Delete Lead
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-400">Select a lead from the pipeline list to view details, AI predictions, and interactions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
