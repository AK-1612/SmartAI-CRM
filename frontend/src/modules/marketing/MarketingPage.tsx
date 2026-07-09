import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Send, 
  Mail, 
  MessageSquare, 
  Play, 
  BarChart, 
  Plus, 
  Users, 
  Percent 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getCampaigns, createCampaign, sendCampaign, Campaign } from '../../api/marketing';

const CHANNELS = ['Email', 'SMS', 'WhatsApp'] as const;
const SEGMENTS = ['All', 'New Customer', 'High Value', 'Churn Risk'] as const;

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<typeof CHANNELS[number]>('Email');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [targetSegment, setTargetSegment] = useState<typeof SEGMENTS[number]>('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (e) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await createCampaign({
        name,
        channel,
        subject: channel === 'Email' ? subject : undefined,
        content,
        target_segment: targetSegment
      });
      toast.success('Campaign created successfully');
      setModalOpen(false);
      setName('');
      setSubject('');
      setContent('');
      setTargetSegment('All');
      fetchData();
    } catch (err) {
      toast.error('Failed to create campaign');
    }
  };

  const handleSend = async (id: string) => {
    const loadingToast = toast.loading('Sending campaign...');
    try {
      await sendCampaign(id);
      toast.success('Campaign dispatched successfully', { id: loadingToast });
      fetchData();
    } catch (err) {
      toast.error('Failed to dispatch campaign', { id: loadingToast });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // Aggregate stats
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + c.open_count, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.click_count, 0);
  const avgOpenRate = totalSent ? (totalOpens / totalSent) * 100 : 0;
  const avgClickRate = totalOpens ? (totalClicks / totalOpens) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow text-sm text-slate-500">Marketing & Outreach</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Marketing Campaigns</h1>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Campaign
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950">
            <Megaphone size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Campaigns</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">{campaigns.length}</b>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-950">
            <Send size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Dispatched</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">{totalSent.toLocaleString()}</b>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950">
            <Percent size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Avg Open Rate</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">{avgOpenRate.toFixed(1)}%</b>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950">
            <BarChart size={24} />
          </span>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Avg Click Rate</p>
            <b className="text-xl font-bold text-slate-900 dark:text-white">{avgClickRate.toFixed(1)}%</b>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((camp) => (
          <div key={camp.id} className="card p-6 flex flex-col justify-between h-[300px] border border-slate-200 dark:border-slate-700/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  camp.channel === 'Email' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950' :
                  camp.channel === 'SMS' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950'
                }`}>
                  {camp.channel === 'Email' ? <Mail size={12} /> : <MessageSquare size={12} />}
                  {camp.channel}
                </span>

                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  camp.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {camp.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">{camp.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Target segment: <strong>{camp.target_segment}</strong></p>
              </div>

              <p className="text-xs text-slate-500 line-clamp-3 dark:text-slate-400 italic">
                "{camp.content}"
              </p>
            </div>

            {/* Campaign Analytics / Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              {camp.status === 'Completed' ? (
                <div className="grid grid-cols-3 gap-2 w-full text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-400">Sent</span>
                    <b className="text-xs text-slate-900 dark:text-white">{camp.sent_count}</b>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-400">Opens</span>
                    <b className="text-xs text-slate-900 dark:text-white">{camp.open_count}</b>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-400">Clicks</span>
                    <b className="text-xs text-slate-900 dark:text-white">{camp.click_count}</b>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] text-slate-400">Created: {new Date(camp.created_at).toLocaleDateString()}</span>
                  <button onClick={() => handleSend(camp.id)} className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs">
                    <Play size={12} fill="currentColor" /> Dispatch
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full card p-12 text-center text-slate-400">
            No marketing campaigns created yet. Click "New Campaign" to create one.
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compose Marketing Campaign</h3>
              <p className="text-xs text-slate-500 mt-1">Design bulk promotional campaigns for customer segments.</p>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block">
                <span className="label">Campaign Name</span>
                <input required type="text" className="input" placeholder="e.g. Q4 Loyalty Discount" value={name} onChange={(e) => setName(e.target.value)} />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">Outreach Channel</span>
                  <select value={channel} onChange={(e) => setChannel(e.target.value as typeof CHANNELS[number])} className="input">
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="label">Target Segment</span>
                  <select value={targetSegment} onChange={(e) => setTargetSegment(e.target.value as typeof SEGMENTS[number])} className="input">
                    {SEGMENTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>

              {channel === 'Email' && (
                <label className="block">
                  <span className="label">Subject Line</span>
                  <input required type="text" className="input" placeholder="e.g. Exclusive 20% Off for High Value Customers" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </label>
              )}

              <label className="block">
                <span className="label">Campaign Content</span>
                <textarea required rows={4} className="input resize-none" placeholder="Draft your campaign copy here..." value={content} onChange={(e) => setContent(e.target.value)} />
              </label>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
