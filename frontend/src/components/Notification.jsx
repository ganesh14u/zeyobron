import { useState, useEffect } from 'react';

let showNotificationFunction = null;

export const useNotification = () => {
  return (message, type = 'info') => {
    // 1. Try to show immediately if component is mounted
    if (showNotificationFunction) {
      showNotificationFunction(message, type);
    }

    // 2. Always queue in localStorage to survive reloads/redirects
    const pending = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
    pending.push({ id: Date.now(), message, type, timestamp: Date.now() });
    localStorage.setItem('pendingNotifications', JSON.stringify(pending));
  };
};

export default function Notification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Hook for immediate display
    showNotificationFunction = (message, type) => {
      // Don't show immediately if loader is active (stay in queue)
      if (document.getElementById('global-loader')) return;

      const id = Date.now();
      setNotifications(prev => {
        if (prev.find(n => n.message === message)) return prev; // Avoid duplicates
        return [...prev, { id, message, type }];
      });

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 7000); // 7 seconds duration
    };

    // Check for pending notifications from a previous page/reload
    const checkPending = () => {
      // Don't show queued items while loader is active
      if (document.getElementById('global-loader')) return;

      const pending = JSON.parse(localStorage.getItem('pendingNotifications') || '[]');
      if (pending.length > 0) {
        const now = Date.now();
        const fresh = pending.filter(n => now - n.timestamp < 10000);

        fresh.forEach(n => showNotificationFunction(n.message, n.type));
        localStorage.removeItem('pendingNotifications');
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 1000);
    window.addEventListener('userDataUpdated', checkPending);

    return () => {
      showNotificationFunction = null;
      clearInterval(interval);
      window.removeEventListener('userDataUpdated', checkPending);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => (
    <svg
      stroke="currentColor"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 flex-shrink-0 mr-2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      ></path>
    </svg>
  );

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/90 backdrop-blur-md border-emerald-500 text-emerald-100 hover:bg-emerald-900';
      case 'error':
        return 'bg-red-950/90 backdrop-blur-md border-red-500 text-red-100 hover:bg-red-900';
      case 'warning':
        return 'bg-amber-950/90 backdrop-blur-md border-amber-500 text-amber-100 hover:bg-amber-900';
      case 'info':
      default:
        return 'bg-blue-950/90 backdrop-blur-md border-blue-500 text-blue-100 hover:bg-blue-900';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'success': return 'text-emerald-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-amber-500';
      case 'info':
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[2147483647] flex flex-col gap-3 min-w-[300px] max-w-sm pointer-events-none">
      {notifications.map(({ id, message, type }) => (
        <div
          key={id}
          role="alert"
          onClick={() => removeNotification(id)}
          className={`${getStyles(type)} border-l-4 p-4 rounded-xl flex items-center transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 animate-notification pointer-events-auto`}
        >
          <div className={getIconColor(type)}>
            {getIcon(type)}
          </div>
          <p className="text-[12px] font-black uppercase tracking-widest leading-tight">
            {message}
          </p>
        </div>
      ))}
      <style jsx>{`
        @keyframes notificationSlide {
          from {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
        .animate-notification {
          animation: notificationSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
