import {
  Activity,
  BrainCircuit,
  LayoutDashboard,
  Users,
  X,
  Target,
  DollarSign,
  Megaphone,
  CheckSquare,
  FolderOpen,
  GitBranch,
  LifeBuoy,
  Mail,
  BarChart3,
  Bell,
  Settings
} from 'lucide-react';
import {NavLink} from 'react-router-dom';

const links=[
  ['/',LayoutDashboard,'Dashboard'],
  ['/contacts',Users,'Contacts'],
  ['/leads',Target,'Leads'],
  ['/sales',DollarSign,'Sales Pipeline'],
  ['/marketing',Megaphone,'Marketing'],
  ['/support',LifeBuoy,'Support'],
  ['/tasks',CheckSquare,'Tasks'],
  ['/workflow',GitBranch,'Workflow'],
  ['/assistant',BrainCircuit,'AI Assistant'],
  ['/analytics',BarChart3,'Analytics'],
  ['/documents',FolderOpen,'Documents'],
  ['/communication',Mail,'Communication Hub'],
  ['/notifications',Bell,'Notifications'],
  ['/users',Settings,'Users']
] as const;

export default function Sidebar({open,close}:{open:boolean;close:()=>void}){return <><div onClick={close} className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden ${open?'block':'hidden'}`}/><aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}><div className="mb-9 flex items-center justify-between px-2"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white"><BrainCircuit/></div><div><b>Nexus AI</b><p className="text-xs text-slate-500">Revenue intelligence</p></div></div><button onClick={close} className="lg:hidden"><X/></button></div><nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">{links.map(([to,Icon,label])=><NavLink onClick={close} key={to} to={to} end={to==='/'} className={({isActive})=>`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive?'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20':'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon size={19}/>{label}</NavLink>)}</nav><div className="mt-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white"><BrainCircuit className="mb-3"/><b className="text-sm">AI Copilot is ready</b><p className="mt-1 text-xs text-indigo-100">Score engagement and find your next best action.</p></div></aside></>}

