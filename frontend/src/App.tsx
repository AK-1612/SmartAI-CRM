import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import AnalyticsPage from "./modules/analytics/AnalyticsPage";
import AssistantPage from "./modules/assistant/AssistantPage";
import AuthenticationPage from "./modules/authentication/AuthenticationPage";
import CommunicationPage from "./modules/communication/CommunicationPage";
import ContactsPage from "./modules/contacts/ContactsPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./modules/documents/DocumentsPage";
import LeadsPage from "./modules/leads/LeadsPage";
import MarketingPage from "./modules/marketing/MarketingPage";
import NotificationsPage from "./modules/notifications/NotificationsPage";
import SalesPage from "./modules/sales/SalesPage";
import SupportPage from "./modules/support/SupportPage";
import TasksPage from "./modules/tasks/TasksPage";
import UsersPage from "./modules/users/UsersPage";
import WorkflowPage from "./modules/workflow/WorkflowPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="auth" element={<AuthenticationPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="workflow" element={<WorkflowPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="communication" element={<CommunicationPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
