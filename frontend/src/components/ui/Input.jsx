import React from 'react';

export default function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-slate-900 mb-2">{label}</label>}
      <input {...props} className={`w-full ${props.className || ''}`} />
    </div>
  );
}
