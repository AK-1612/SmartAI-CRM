import { useState, useMemo } from 'react';
import { 
  Users, Plus, Search, Mail, Shield, 
  UserCheck, UserX, ToggleLeft, ToggleRight, Trash2 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserItem {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'admin' | 'manager' | 'employee';
  status: 'active' | 'inactive';
  permissions: {
    contacts: boolean;
    leads: boolean;
    billing: boolean;
    settings: boolean;
  };
}

const initialUsers: UserItem[] = [
  { id: '1', name: 'Anil Kumar', email: 'anil@smartai.com', department: 'Sales', role: 'manager', status: 'active', permissions: { contacts: true, leads: true, billing: false, settings: true } },
  { id: '2', name: 'Sarah Jenkins', email: 'sarah.j@smartai.com', department: 'Marketing', role: 'employee', status: 'active', permissions: { contacts: true, leads: true, billing: false, settings: false } },
  { id: '3', name: 'Admin Account', email: 'admin@smartai.com', department: 'Operations', role: 'admin', status: 'active', permissions: { contacts: true, leads: true, billing: true, settings: true } },
  { id: '4', name: 'David Miller', email: 'david.m@smartai.com', department: 'Finance', role: 'employee', status: 'active', permissions: { contacts: false, leads: false, billing: true, settings: false } },
  { id: '5', name: 'Elena Rostova', email: 'elena.r@smartai.com', department: 'Customer Success', role: 'employee', status: 'inactive', permissions: { contacts: true, leads: false, billing: false, settings: false } }
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  
  // Modal state
  const [modal, setModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Sales');
  const [newRole, setNewRole] = useState<'admin' | 'manager' | 'employee'>('employee');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                            user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesDept = deptFilter === 'all' || user.department === deptFilter;
      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, search, roleFilter, deptFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Name and Email are required');
      return;
    }
    const newUser: UserItem = {
      id: String(users.length + 1),
      name: newName,
      email: newEmail,
      department: newDept,
      role: newRole,
      status: 'active',
      permissions: {
        contacts: true,
        leads: newRole !== 'employee',
        billing: false,
        settings: newRole === 'admin'
      }
    };
    setUsers([...users, newUser]);
    toast.success('User added successfully');
    setModal(false);
    setNewName('');
    setNewEmail('');
  };

  const togglePermission = (id: string, key: keyof UserItem['permissions']) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          permissions: {
            ...u.permissions,
            [key]: !u.permissions[key]
          }
        };
      }
      return u;
    }));
    toast.success('Permission updated');
  };

  const toggleStatus = (id: string) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        toast.success(`User status set to ${nextStatus}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const deleteUser = (id: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      setUsers(users.filter(u => u.id !== id));
      toast.success('User removed');
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Identity & Access</p>
          <h1 className="page-title">User Management</h1>
          <p className="page-copy">Manage employees, departments, roles, and fine-grained application permissions.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={18} />
          Add User
        </button>
      </div>

      <section className="card overflow-hidden">
        {/* Search and Filters */}
        <div className="grid gap-3 border-b border-slate-100 p-4 dark:border-slate-800 md:grid-cols-3">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="input pl-10" 
              placeholder="Search user name or email..." 
            />
          </label>
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)} 
            className="input"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="manager">Managers</option>
            <option value="employee">Employees</option>
          </select>
          <select 
            value={deptFilter} 
            onChange={e => setDeptFilter(e.target.value)} 
            className="input"
          >
            <option value="all">All Departments</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="Customer Success">Customer Success</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        {/* User List Table */}
        {!filteredUsers.length ? (
          <div className="p-8 text-center text-slate-500">No users match filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Dept & Role</th>
                  <th>Status</th>
                  <th>Permission Toggles</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12} /> {user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-slate-700 dark:text-slate-300">{user.department}</span>
                        <span className="text-[10px] uppercase font-bold text-indigo-600 mt-0.5">{user.role}</span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleStatus(user.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize transition ${
                          user.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}
                      >
                        {user.status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />}
                        {user.status}
                      </button>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-4 items-center">
                        {(['contacts', 'leads', 'billing', 'settings'] as const).map(perm => (
                          <label key={perm} className="flex items-center gap-1 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300">
                            <span className="capitalize">{perm}:</span>
                            <button 
                              type="button" 
                              onClick={() => togglePermission(user.id, perm)}
                              className="text-slate-500 hover:text-indigo-600 transition"
                            >
                              {user.permissions[perm] ? (
                                <ToggleRight className="text-indigo-600" size={18} />
                              ) : (
                                <ToggleLeft size={18} />
                              )}
                            </button>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => deleteUser(user.id)}
                          className="icon-btn hover:text-rose-600" 
                          title="Delete User"
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

      {/* User Creation Modal */}
      {modal && (
        <div className="modal-backdrop">
          <form onSubmit={handleCreate} className="card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Add New Team Member</h2>
              <button type="button" onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="space-y-4">
              <label>
                <span className="label">Full Name *</span>
                <input 
                  required
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. Elena Rostova" 
                  className="input" 
                />
              </label>
              <label>
                <span className="label">Email Address *</span>
                <input 
                  required
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)} 
                  placeholder="e.g. elena@smartai.com" 
                  className="input" 
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="label">Department</span>
                  <select 
                    value={newDept} 
                    onChange={e => setNewDept(e.target.value)} 
                    className="input"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Customer Success">Customer Success</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                  </select>
                </label>
                <label>
                  <span className="label">Access Role</span>
                  <select 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value as any)} 
                    className="input"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Add User</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
