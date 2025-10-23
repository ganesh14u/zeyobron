import { useState, useEffect } from 'react';

let showNotificationFunction = null;

export const useNotification = () => {
  return (message, type = 'info') => {
    if (showNotificationFunction) {
      showNotificationFunction(message, type);
    }
  };
};

export default function Notification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    showNotificationFunction = (message, type) => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);
      
      // Auto remove after 4 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 4000);
    };

    return () => {
      showNotificationFunction = null;
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default: // info
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getColors = (type) => {
    switch(type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-blue-500 border-blue-600';
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[9999] space-y-3">
      {notifications.map(({ id, message, type }) => (
        <div
          key={id}
          className={`${getColors(type)} border-l-4 text-white px-6 py-4 rounded-lg shadow-2xl min-w-[320px] max-w-md animate-slide-in flex items-start gap-3`}
          style={{
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(type)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm leading-relaxed">{message}</p>
          </div>
          <button
            onClick={() => removeNotification(id)}
            className="flex-shrink-0 ml-2 hover:bg-white/20 rounded p-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
