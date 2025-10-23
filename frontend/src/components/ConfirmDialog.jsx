import { useState, useEffect } from 'react';

let showConfirmFunction = null;

export const useConfirm = () => {
  return (message, title = 'Confirm Action') => {
    return new Promise((resolve) => {
      if (showConfirmFunction) {
        showConfirmFunction(message, title, resolve);
      } else {
        resolve(false);
      }
    });
  };
};

export default function ConfirmDialog() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    showConfirmFunction = (message, title, resolve) => {
      setDialog({ message, title, resolve });
    };

    return () => {
      showConfirmFunction = null;
    };
  }, []);

  const handleConfirm = () => {
    if (dialog?.resolve) {
      dialog.resolve(true);
    }
    setDialog(null);
  };

  const handleCancel = () => {
    if (dialog?.resolve) {
      dialog.resolve(false);
    }
    setDialog(null);
  };

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] animate-fade-in">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">{dialog.title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-gray-300 text-base leading-relaxed">{dialog.message}</p>
        </div>

        {/* Footer */}
        <div className="bg-gray-900/50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg shadow-red-500/30"
          >
            Confirm
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.9);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
