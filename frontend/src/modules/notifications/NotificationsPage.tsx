import { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Info, 
  AlertTriangle, 
  XOctagon, 
  CheckCircle2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getNotifications, markNotificationRead, deleteNotification, Notification } from '../../api/notifications';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterUnread]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getNotifications(filterUnread);
      setNotifications(data);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      toast.success('Marked as read');
      fetchData();
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success('Notification cleared');
      fetchData();
    } catch (err) {
      toast.error('Failed to clear notification');
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="eyebrow text-sm text-slate-500 font-semibold uppercase tracking-wide">System Notifications</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Notifications 
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setFilterUnread(false)} 
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              !filterUnread ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800'
            }`}
          >
            All Alerts
          </button>
          <button 
            onClick={() => setFilterUnread(true)} 
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
              filterUnread ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((item) => {
          const isRead = !!item.read_at;
          
          return (
            <div 
              key={item.id} 
              className={`card p-5 flex items-start gap-4 border transition ${
                isRead 
                  ? 'border-slate-100 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/10' 
                  : 'border-indigo-100 bg-indigo-50/10 dark:border-indigo-900/30 dark:bg-indigo-950/5 hover:border-indigo-200 shadow-sm'
              }`}
            >
              {/* Icon based on Alert Type */}
              <span className={`rounded-xl p-2.5 flex items-center justify-center ${
                item.type === 'error' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950' :
                item.type === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950' :
                item.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' :
                'bg-indigo-50 text-indigo-600 dark:bg-indigo-950'
              }`}>
                {item.type === 'error' ? <XOctagon size={18} /> :
                 item.type === 'warning' ? <AlertTriangle size={18} /> :
                 item.type === 'success' ? <CheckCircle2 size={18} /> :
                 <Info size={18} />}
              </span>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <h4 className={`text-sm font-semibold text-slate-900 dark:text-white ${isRead ? 'opacity-70' : ''}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {item.due_at && (
                  <p className="text-[10px] text-slate-500 font-medium">
                    Due Date: {new Date(item.due_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 self-center">
                {!isRead && (
                  <button 
                    onClick={() => handleMarkRead(item.id)} 
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-emerald-600 transition" 
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(item.id)} 
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-rose-600 transition" 
                  title="Clear alert"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div className="card p-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
            <Bell className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-medium">No system notifications found</p>
            <p className="text-xs text-slate-500 mt-1">You are all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
