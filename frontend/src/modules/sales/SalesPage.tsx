import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Plus, 
  Filter, 
  Briefcase 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getDeals, createDeal, updateDeal, getForecast, Deal, ForecastData } from '../../api/sales';
import { getContacts, Contact } from '../../api/contacts';

const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

export default function SalesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [contactId, setContactId] = useState('');
  const [value, setValue] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [stage, setStage] = useState<typeof STAGES[number]>('Prospecting');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dealsData, forecastData, contactsResponse] = await Promise.all([
        getDeals(),
        getForecast(),
        getContacts({ page: 1, page_size: 100 })
      ]);
      setDeals(dealsData);
      setForecast(forecastData);
      setContacts(contactsResponse.items || []);
    } catch (e) {
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contactId || !value || !closeDate) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await createDeal({
        name,
        contact_id: contactId,
        value: parseFloat(value),
        close_date: closeDate,
        stage,
        status: stage === 'Closed Won' ? 'Won' : stage === 'Closed Lost' ? 'Lost' : 'Open'
      });
      toast.success('Deal created successfully');
      setModalOpen(false);
      // Reset form
      setName('');
      setContactId('');
      setValue('');
      setCloseDate('');
      setStage('Prospecting');
      fetchData();
    } catch (err) {
      toast.error('Failed to create deal');
    }
  };

  const handleStageChange = async (dealId: string, newStage: typeof STAGES[number]) => {
    let status: 'Open' | 'Won' | 'Lost' = 'Open';
    if (newStage === 'Closed Won') status = 'Won';
    if (newStage === 'Closed Lost') status = 'Lost';

    try {
      await updateDeal(dealId, { stage: newStage, status });
      toast.success('Deal stage updated');
      fetchData();
    } catch (err) {
      toast.error('Failed to update stage');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow text-sm text-slate-500">Pipeline Management</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Pipeline</h1>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Deal
        </button>
      </div>

      {/* Forecast & Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950">
            <DollarSign size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Pipeline</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">
              ${(forecast?.pipeline_total ?? 0).toLocaleString()}
            </b>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-950">
            <TrendingUp size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Forecasted Revenue</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">
              ${(forecast?.forecasted_revenue ?? 0).toLocaleString()}
            </b>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950">
            <CheckCircle size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Actual Won</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">
              ${(forecast?.actual_won_revenue ?? 0).toLocaleString()}
            </b>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950">
            <Clock size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Open Deals</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">
              {forecast?.open_deals_count ?? 0}
            </b>
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-320px)]">
          {STAGES.map((colStage) => {
            const colDeals = deals.filter((d) => d.stage === colStage);
            const colTotalValue = colDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div key={colStage} className="flex-1 min-w-[200px] bg-slate-100 dark:bg-slate-900/60 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      colStage === 'Closed Won' ? 'bg-emerald-500' :
                      colStage === 'Closed Lost' ? 'bg-rose-500' : 'bg-indigo-500'
                    }`} />
                    <b className="text-sm font-semibold text-slate-700 dark:text-slate-300">{colStage}</b>
                  </div>
                  <span className="bg-white dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full font-bold">
                    {colDeals.length}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 mb-4">${colTotalValue.toLocaleString()}</p>
                
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {colDeals.map((deal) => {
                    const matchedContact = contacts.find((c) => c.id === deal.contact_id);

                    return (
                      <div key={deal.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3 hover:shadow-md transition">
                        <div>
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{deal.name}</h4>
                          {matchedContact && (
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                              <User size={12} />
                              <span>{matchedContact.full_name}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                          <b className="text-sm text-slate-900 dark:text-white">${deal.value.toLocaleString()}</b>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar size={12} />
                            <span>{new Date(deal.close_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                          </div>
                        </div>

                        {/* Move stage dropdown helper */}
                        <select 
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal.id, e.target.value as typeof STAGES[number])}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded p-1 dark:bg-slate-700 dark:border-slate-600"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                  {colDeals.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Deal Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Deal</h3>
              <p className="text-xs text-slate-500 mt-1">Associate a deal with an existing customer contact record.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="label">Deal Name</span>
                <input required type="text" className="input" placeholder="e.g. Q3 Software License" value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <label className="block">
                <span className="label">Associated Contact</span>
                <select required value={contactId} onChange={(e) => setContactId(e.target.value)} className="input">
                  <option value="">Select a contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.company_name || 'Individual'})</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">Deal Value ($)</span>
                  <input required type="number" min="0" step="0.01" className="input" placeholder="e.g. 5000" value={value} onChange={(e) => setValue(e.target.value)} />
                </label>

                <label className="block">
                  <span className="label">Expected Close Date</span>
                  <input required type="date" className="input" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
                </label>
              </div>

              <label className="block">
                <span className="label">Pipeline Stage</span>
                <select value={stage} onChange={(e) => setStage(e.target.value as typeof STAGES[number])} className="input">
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Create Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
