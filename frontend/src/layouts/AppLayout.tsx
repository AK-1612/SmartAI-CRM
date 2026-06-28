import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", to: "/" },
  { label: "Auth", to: "/auth" },
  { label: "Users", to: "/users" },
  { label: "Leads", to: "/leads" },
  { label: "Contacts", to: "/contacts" },
  { label: "Sales", to: "/sales" },
  { label: "Marketing", to: "/marketing" },
  { label: "Support", to: "/support" },
  { label: "Tasks", to: "/tasks" },
  { label: "Workflow", to: "/workflow" },
  { label: "Assistant", to: "/assistant" },
  { label: "Analytics", to: "/analytics" },
  { label: "Documents", to: "/documents" },
  { label: "Communication", to: "/communication" },
  { label: "Notifications", to: "/notifications" }
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-6 lg:block">
        <h1 className="text-lg font-semibold">SmartAI CRM</h1>
        <nav className="mt-8 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
