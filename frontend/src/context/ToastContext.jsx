import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext({ addToast: ()=>{} });

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type='info', timeout=4000) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x=>x.id!==id)), timeout);
  }, []);

  const remove = (id) => setToasts(t => t.filter(x=>x.id!==id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow text-white ${t.type==='error' ? 'bg-red-600' : t.type==='success' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-sm">{t.message}</div>
              <button onClick={()=>remove(t.id)} className="text-xs opacity-80">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
