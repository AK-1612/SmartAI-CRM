import { useState, useMemo } from 'react';
import { 
  FolderOpen, Plus, Search, FileText, Download, 
  Trash2, ExternalLink, Calendar, HardDrive, ShieldCheck 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DocumentItem {
  id: string;
  name: string;
  type: 'contract' | 'proposal' | 'invoice' | 'nda';
  size: string;
  version: string;
  status: 'active' | 'draft' | 'archived';
  uploadedBy: string;
  uploadedAt: string;
}

const initialDocuments: DocumentItem[] = [
  { id: '1', name: 'Acme Corp Software License Agreement.pdf', type: 'contract', size: '2.4 MB', version: 'v2.1', status: 'active', uploadedBy: 'Anil Kumar', uploadedAt: '2026-07-01' },
  { id: '2', name: 'Q3 Enterprise Growth Proposal.docx', type: 'proposal', size: '1.8 MB', version: 'v1.0', status: 'draft', uploadedBy: 'Sarah Jenkins', uploadedAt: '2026-07-05' },
  { id: '3', name: 'INV-2026-089 - Salesforce Integration.pdf', type: 'invoice', size: '420 KB', version: 'v1.0', status: 'active', uploadedBy: 'Finance Dept', uploadedAt: '2026-07-08' },
  { id: '4', name: 'Mutual Non-Disclosure Agreement (NDA).pdf', type: 'nda', size: '1.2 MB', version: 'v3.0', status: 'active', uploadedBy: 'Legal Team', uploadedAt: '2026-06-15' },
  { id: '5', name: 'Globex Corp SLA Addendum.pdf', type: 'contract', size: '980 KB', version: 'v1.2', status: 'archived', uploadedBy: 'Anil Kumar', uploadedAt: '2026-05-20' }
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>(initialDocuments);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Upload modal state
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'contract' | 'proposal' | 'invoice' | 'nda'>('contract');
  const [newSize, setNewSize] = useState('1.5 MB');

  const filteredDocs = useMemo(() => {
    return docs.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                            doc.uploadedBy.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [docs, search, filterType]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Document name is required');
      return;
    }
    const newDoc: DocumentItem = {
      id: String(docs.length + 1),
      name: newName.endsWith('.pdf') || newName.endsWith('.docx') ? newName : `${newName}.pdf`,
      type: newType,
      size: newSize,
      version: 'v1.0',
      status: 'active',
      uploadedBy: localStorage.getItem('user_email') || 'Admin User',
      uploadedAt: new Date().toISOString().split('T')[0]
    };
    setDocs([newDoc, ...docs]);
    toast.success('Document uploaded successfully');
    setModal(false);
    setNewName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocs(docs.filter(d => d.id !== id));
      toast.success('Document removed');
    }
  };

  const badgeColor = (status: string) => {
    switch(status) {
      case 'active': return 'badge-green';
      case 'draft': return 'badge-amber';
      default: return 'badge-gray';
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Enterprise Assets</p>
          <h1 className="page-title">Document Management</h1>
          <p className="page-copy">Contracts, version control, proposals, and secure customer records.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={18} />
          Upload Document
        </button>
      </div>

      {/* Storage and Statistics */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950">
            <HardDrive size={22} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Storage Used</p>
            <b className="text-lg">6.78 MB of 100 MB</b>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950">
            <FileText size={22} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Total Files</p>
            <b className="text-lg">{docs.length} assets</b>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="text-xs text-slate-500">Security Verification</p>
            <b className="text-lg">100% Compliant</b>
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        {/* Search & Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="input pl-10" 
              placeholder="Search document name or uploader..." 
            />
          </label>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)} 
            className="input md:w-48"
          >
            <option value="all">All Types</option>
            <option value="contract">Contracts</option>
            <option value="proposal">Proposals</option>
            <option value="invoice">Invoices</option>
            <option value="nda">NDAs</option>
          </select>
        </div>

        {/* Documents Table */}
        {!filteredDocs.length ? (
          <div className="p-8 text-center text-slate-500">No documents match the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => (
                  <tr key={doc.id}>
                    <td className="font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-slate-400" />
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td className="capitalize">{doc.type}</td>
                    <td>{doc.size}</td>
                    <td className="font-mono text-xs">{doc.version}</td>
                    <td>
                      <span className={badgeColor(doc.status)}>{doc.status}</span>
                    </td>
                    <td>{doc.uploadedBy}</td>
                    <td>{doc.uploadedAt}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => toast.success(`Downloading ${doc.name}...`)}
                          className="icon-btn" 
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => toast.success(`Viewing details for ${doc.name}`)}
                          className="icon-btn" 
                          title="View Details"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)} 
                          className="icon-btn hover:text-rose-600" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Upload Modal */}
      {modal && (
        <div className="modal-backdrop">
          <form onSubmit={handleUpload} className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Upload New Asset</h2>
              <button type="button" onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="space-y-4">
              <label>
                <span className="label">Document Name *</span>
                <input 
                  required
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. Service Level Agreement" 
                  className="input" 
                />
              </label>
              <label>
                <span className="label">Document Type</span>
                <select 
                  value={newType} 
                  onChange={e => setNewType(e.target.value as any)} 
                  className="input"
                >
                  <option value="contract">Contract</option>
                  <option value="proposal">Proposal</option>
                  <option value="invoice">Invoice</option>
                  <option value="nda">NDA</option>
                </select>
              </label>
              <label>
                <span className="label">Simulated Size</span>
                <input 
                  type="text" 
                  value={newSize} 
                  onChange={e => setNewSize(e.target.value)} 
                  className="input" 
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Upload Asset</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
