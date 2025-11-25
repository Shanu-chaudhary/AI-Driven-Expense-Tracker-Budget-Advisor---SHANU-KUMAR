import React, { useState } from 'react';
import Comment from './Comment';

const Post = ({ post, onLike, onComment, onDelete, canDelete }) => {
  const [commentText, setCommentText] = useState('');

  return (
    <div className="bg-white rounded shadow p-3 mb-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{post.title}</div>
          <div className="text-xs text-gray-500">by {post.authorName || post.author || 'Anonymous'} · {new Date(post.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-sm text-gray-600">{post.likes || 0} 👍</div>
      </div>
      <div className="mt-2 text-sm text-gray-700">{post.body}</div>

      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => onLike(post.id || post._id)} className="text-xs bg-orange_peel-500 text-white px-2 py-1 rounded">Like</button>
        {canDelete ? (
          <button onClick={() => { if (window.confirm('Delete this post?')) onDelete(post.id || post._id); }} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Delete</button>
        ) : null}
        <input value={commentText} onChange={(e)=>setCommentText(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="Add a comment" />
        <button onClick={()=>{ if(commentText.trim()){ onComment(post.id || post._id, commentText); setCommentText(''); } }} className="text-xs bg-sky-600 text-white px-2 py-1 rounded">Comment</button>
      </div>

      <div className="mt-3">
        {(post.comments || []).map((c, i) => <Comment key={i} c={c} />)}
      </div>
    </div>
  );
};

export default Post;
