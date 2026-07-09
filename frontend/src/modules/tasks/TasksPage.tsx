import { useState, useMemo } from 'react';
import { 
  CheckSquare, Plus, Search, Calendar, Clock, 
  Trash2, Play, CheckCircle2, AlertCircle, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  assignedTo: string;
}

const initialTasks: TaskItem[] = [
  { id: '1', title: 'Follow up with Acme Corp on Contract terms', description: 'Schedule a call to discuss the revised SLA terms of the software license.', priority: 'high', status: 'in_progress', dueDate: '2026-07-10', assignedTo: 'Anil Kumar' },
  { id: '2', title: 'Generate Q3 sales forecast report', description: 'Compile the pipeline data from the Leads and Opportunities dashboard.', priority: 'medium', status: 'pending', dueDate: '2026-07-15', assignedTo: 'Sarah Jenkins' },
  { id: '3', title: 'Resolve ticket #1043 - AWS billing issue', description: 'Escalated billing ticket for high-value customer Globex Corp.', priority: 'high', status: 'pending', dueDate: '2026-07-09', assignedTo: 'Support Team' },
  { id: '4', title: 'Prepare marketing campaign creative brief', description: 'Draft Q4 customer loyalty program brief and asset design specs.', priority: 'low', status: 'completed', dueDate: '2026-07-05', assignedTo: 'Sarah Jenkins' },
  { id: '5', title: 'Conduct onboarding call with TechStart LLC', description: 'Initial walk-through of the Nexus AI platform settings and integrations.', priority: 'medium', status: 'completed', dueDate: '2026-07-02', assignedTo: 'Anil Kumar' }
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Modal state
  const [modal, setModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                            task.description.toLowerCase().includes(search.toLowerCase()) ||
                            task.assignedTo.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Task title is required');
      return;
    }
    const newTask: TaskItem = {
      id: String(tasks.length + 1),
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      status: 'pending',
      dueDate: newDueDate || new Date().toISOString().split('T')[0],
      assignedTo: localStorage.getItem('user_email') || 'Admin User'
    };
    setTasks([newTask, ...tasks]);
    toast.success('Task created successfully');
    setModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleStatusChange = (id: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast.success('Task status updated');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Task deleted');
    }
  };

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'badge-amber text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300';
      case 'medium': return 'badge-blue';
      default: return 'badge-gray';
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Work Management</p>
          <h1 className="page-title">Tasks & Reminders</h1>
          <p className="page-copy">Track client commitments, calls, follow-ups, and automate next steps.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={18} />
          Create Task
        </button>
      </div>

      {/* Task Metrics */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-slate-500">Total Active Tasks</p>
          <b className="text-2xl mt-1 block">{tasks.filter(t => t.status !== 'completed').length}</b>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Urgent Tasks (High)</p>
          <b className="text-2xl mt-1 block text-amber-600">{tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}</b>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Completed This Week</p>
          <b className="text-2xl mt-1 block text-emerald-600">{tasks.filter(t => t.status === 'completed').length}</b>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Completion Rate</p>
          <b className="text-2xl mt-1 block">
            {tasks.length ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%
          </b>
        </div>
      </div>

      <section className="card overflow-hidden">
        {/* Search & Filters */}
        <div className="grid gap-3 border-b border-slate-100 p-4 dark:border-slate-800 md:grid-cols-3">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="input pl-10" 
              placeholder="Search tasks..." 
            />
          </label>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            className="input"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select 
            value={priorityFilter} 
            onChange={e => setPriorityFilter(e.target.value)} 
            className="input"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Task List */}
        {!filteredTasks.length ? (
          <div className="p-8 text-center text-slate-500">No tasks found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.map(task => (
              <article key={task.id} className="flex items-start gap-4 p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition">
                <div className="mt-1">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="text-emerald-600" size={20} />
                  ) : task.status === 'in_progress' ? (
                    <RefreshCw className="text-indigo-600 animate-spin-slow" size={20} />
                  ) : (
                    <AlertCircle className="text-slate-400" size={20} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`font-semibold text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {task.title}
                    </h3>
                    <span className={priorityBadge(task.priority)}>{task.priority}</span>
                    <span className="badge-gray capitalize">{task.status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{task.description}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Due: {task.dueDate}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> Assigned: {task.assignedTo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {task.status !== 'completed' && (
                    <button 
                      onClick={() => handleStatusChange(task.id, task.status === 'pending' ? 'in_progress' : 'completed')}
                      className="icon-btn hover:text-indigo-600"
                      title={task.status === 'pending' ? 'Start Task' : 'Complete Task'}
                    >
                      {task.status === 'pending' ? <Play size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <button 
                      onClick={() => handleStatusChange(task.id, 'pending')}
                      className="icon-btn hover:text-amber-600"
                      title="Reopen Task"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="icon-btn hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Task Creation Modal */}
      {modal && (
        <div className="modal-backdrop">
          <form onSubmit={handleCreate} className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Create New Task</h2>
              <button type="button" onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="space-y-4">
              <label>
                <span className="label">Task Title *</span>
                <input 
                  required
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="e.g. Schedule proposal walk-through" 
                  className="input" 
                />
              </label>
              <label>
                <span className="label">Description</span>
                <textarea 
                  rows={3}
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Outline key notes, objectives, or action items..." 
                  className="input resize-none" 
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="label">Priority</span>
                  <select 
                    value={newPriority} 
                    onChange={e => setNewPriority(e.target.value as any)} 
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label>
                  <span className="label">Due Date</span>
                  <input 
                    type="date" 
                    value={newDueDate} 
                    onChange={e => setNewDueDate(e.target.value)} 
                    className="input" 
                  />
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Task</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
