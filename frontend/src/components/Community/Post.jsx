import React, { useState } from 'react';
import Comment from './Comment';
import Card from '../ui/Card';
import Button from '../ui/Button';

const Post = ({ post, onLike, onComment, onDelete, canDelete }) => {
  const [commentText, setCommentText] = useState('');

  return (
    <Card className="mb-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-slate-900">{post.title}</div>
          <div className="text-xs text-slate-600">by {post.authorName || post.author || 'Anonymous'} · {new Date(post.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-sm text-slate-700">{post.likes || 0} 👍</div>
      </div>
      <div className="mt-2 text-sm text-slate-700">{post.body}</div>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => onLike(post.id || post._id)}>Like</Button>
        {canDelete ? (
          <Button size="sm" variant="danger" onClick={() => { if (window.confirm('Delete this post?')) onDelete(post.id || post._id); }}>Delete</Button>
        ) : null}
        <input value={commentText} onChange={(e)=>setCommentText(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm bg-transparent" placeholder="Add a comment" />
        <Button size="sm" onClick={()=>{ if(commentText.trim()){ onComment(post.id || post._id, commentText); setCommentText(''); } }}>Comment</Button>
      </div>

      <div className="mt-3">
        {(post.comments || []).map((c, i) => <Comment key={i} c={c} />)}
      </div>
    </Card>
  );
};

export default Post;
