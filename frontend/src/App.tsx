import {Navigate,Route,Routes} from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactDetails from './pages/ContactDetails';
import Activities from './pages/Activities';
import AIInsights from './pages/AIInsights';
import Login from './pages/Login';

// Main branch module imports
import LeadsPage from './modules/leads/LeadsPage';
import SupportPage from './modules/support/SupportPage';
import WorkflowPage from './modules/workflow/WorkflowPage';
import AssistantPage from './modules/assistant/AssistantPage';
import CommunicationPage from './modules/communication/CommunicationPage';
import AnalyticsPage from './modules/analytics/AnalyticsPage';
import DocumentsPage from './modules/documents/DocumentsPage';
import TasksPage from './modules/tasks/TasksPage';
import UsersPage from './modules/users/UsersPage';
import NotificationsPage from './modules/notifications/NotificationsPage';
import SalesPage from './modules/sales/SalesPage';
import MarketingPage from './modules/marketing/MarketingPage';
import BillingPage from './modules/billing/BillingPage';

const Guard=({children}:{children:React.ReactNode})=>localStorage.getItem('access_token')?children:<Navigate to="/login"/>;

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route element={<Guard><Layout/></Guard>}>
        <Route index element={<Dashboard/>}/>
        <Route path="contacts" element={<Contacts/>}/>
        <Route path="contacts/:id" element={<ContactDetails/>}/>
        <Route path="activities" element={<Activities/>}/>
        <Route path="ai" element={<AIInsights/>}/>
        
        {/* Main branch routes */}
        <Route path="leads" element={<LeadsPage/>}/>
        <Route path="support" element={<SupportPage/>}/>
        <Route path="workflow" element={<WorkflowPage/>}/>
        <Route path="assistant" element={<AssistantPage/>}/>
        <Route path="communication" element={<CommunicationPage/>}/>
        <Route path="analytics" element={<AnalyticsPage/>}/>
        <Route path="documents" element={<DocumentsPage/>}/>
        <Route path="tasks" element={<TasksPage/>}/>
        <Route path="users" element={<UsersPage/>}/>
        <Route path="notifications" element={<NotificationsPage/>}/>
        <Route path="sales" element={<SalesPage/>}/>
        <Route path="marketing" element={<MarketingPage/>}/>
        <Route path="billing" element={<BillingPage/>}/>
        
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Route>
    </Routes>
  );
}

