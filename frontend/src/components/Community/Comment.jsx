import React from 'react';

const Comment = ({ c }) => {
  return (
    <div className="border-l pl-3 ml-2 mt-2">
      <div className="text-sm text-gray-700"><strong>{c.author || 'Anonymous'}</strong> · <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span></div>
      <div className="text-sm mt-1">{c.text}</div>
    </div>
  );
};

export default Comment;
