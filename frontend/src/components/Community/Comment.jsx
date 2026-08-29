import React from 'react';

const Comment = ({ c }) => {
  return (
    <div className="border-l border-blue-200 pl-3 ml-2 mt-2">
      <div className="text-sm text-slate-900"><strong>{c.author || 'Anonymous'}</strong> · <span className="text-xs text-slate-600">{new Date(c.createdAt).toLocaleString()}</span></div>
      <div className="text-sm mt-1 text-slate-700">{c.text}</div>
    </div>
  );
};

export default Comment;
