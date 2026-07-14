import { CreditCard, Check, Zap, Building2, Rocket, Shield } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individuals and small teams getting started.',
    icon: Rocket,
    color: 'slate',
    features: [
      'Up to 500 contacts',
      'Basic lead management',
      'Email campaign (500/mo)',
      'Sales pipeline (3 stages)',
      'Task & activity management',
      'Community support',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For growing teams that need AI automation and advanced features.',
    icon: Zap,
    color: 'indigo',
    popular: true,
    features: [
      'Unlimited contacts',
      'AI lead scoring & prioritization',
      'Email + SMS + WhatsApp campaigns',
      'Full sales pipeline management',
      'AI sales forecasting',
      'Customer churn prediction',
      'Workflow automation engine',
      'Document management + e-signature',
      'Priority support',
    ],
    current: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organisations needing multi-tenant, white-label, and ERP integration.',
    icon: Building2,
    color: 'violet',
    features: [
      'Everything in Pro',
      'Multi-tenant CRM',
      'White Label CRM',
      'Mobile App (Android & iOS)',
      'AI Voice Calling Assistant',
      'Customer 360° View',
      'Business Intelligence Dashboard',
      'ERP & HRMS Integration',
      'Inventory Management Integration',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    current: false,
  },
];

const invoices = [
  { id: 'INV-001', date: 'Jun 2026', amount: '$0.00', status: 'Free plan', plan: 'Free' },
];

export default function BillingPage() {
  const [tab, setTab] = useState<'plans' | 'invoices' | 'payment'>('plans');

  const handleUpgrade = (planId: string) => {
    if (planId === 'free') return;
    if (planId === 'enterprise') {
      toast.success('Our team will contact you within 24 hours.');
      return;
    }
    toast.success('Upgrade flow coming soon. You can use all features for free right now!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="page-title">Billing & Plans</h1>
        <p className="page-copy">Manage your subscription plan, payment methods, and invoices.</p>
      </div>

      {/* Free notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
        <Shield size={20} className="mt-0.5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Full CRM access — no payment required
          </p>
          <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
            You can use all core CRM features including contacts, leads, sales pipeline, marketing,
            support, tasks, workflow, AI assistant, analytics, and documents completely free.
            Upgrade anytime for advanced AI models and enterprise features.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 w-fit">
        {(['plans', 'invoices', 'payment'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Plans Tab */}
      {tab === 'plans' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`card relative flex flex-col p-6 ${
                  plan.popular
                    ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-950'
                    : ''
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      plan.color === 'indigo'
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950'
                        : plan.color === 'violet'
                        ? 'bg-violet-100 text-violet-600 dark:bg-violet-950'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                    }`}
                  >
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  )}
                </div>

                <ul className="mb-6 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check
                        size={15}
                        className={`mt-0.5 shrink-0 ${
                          plan.color === 'indigo'
                            ? 'text-indigo-600'
                            : plan.color === 'violet'
                            ? 'text-violet-600'
                            : 'text-emerald-600'
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.current ? (
                  <button
                    disabled
                    className="btn-secondary w-full justify-center cursor-default opacity-70"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full justify-center ${
                      plan.popular ? 'btn-primary' : 'btn-secondary'
                    } inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition`}
                  >
                    {plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Invoices Tab */}
      {tab === 'invoices' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="font-medium">{inv.id}</td>
                    <td>{inv.date}</td>
                    <td>{inv.plan}</td>
                    <td>{inv.amount}</td>
                    <td>
                      <span className="badge-green">{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {tab === 'payment' && (
        <div className="card max-w-lg p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Payment Method</h2>
          </div>
          <p className="text-sm text-slate-500">
            No payment method on file. You are on the Free plan — no card required.
          </p>
          <button
            onClick={() => toast.success('Payment setup will be available when you upgrade.')}
            className="btn-secondary"
          >
            Add Payment Method
          </button>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Accepted: Stripe, Razorpay. Your card details are never stored on our servers.
          </p>
        </div>
      )}
    </div>
  );
}
