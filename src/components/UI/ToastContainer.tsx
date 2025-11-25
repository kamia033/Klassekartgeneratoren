import React from 'react';
import { useToast } from '../../context/ToastContext';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            backgroundColor: toast.type === 'error' ? '#ff5252' : toast.type === 'success' ? '#4caf50' : '#2196f3',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            minWidth: '200px',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
