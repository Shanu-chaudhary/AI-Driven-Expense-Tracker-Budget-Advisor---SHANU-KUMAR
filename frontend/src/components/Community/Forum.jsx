import React, { useEffect, useState, useContext } from 'react';
import Post from './Post';
import axios from '../../api/axios';
import { ToastContext } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import Card from '../ui/Card';
import Button from '../ui/Button';

const STORAGE_KEY = 'forum_posts_v1';

const loadPosts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
};

const savePosts = (posts) => localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));

const Forum = () => {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { addToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  useEffect(()=>{
    // try backend first
    const load = async () => {
      try {
        const res = await axios.get('/forum/posts');
        if (res.data) {
          // normalize posts so frontend can use `id` consistently (backend may use _id)
          const normalized = (Array.isArray(res.data) ? res.data : []).map(p => ({ ...p, id: p.id || p._id }));
          setPosts(normalized.reverse ? normalized.reverse() : normalized);
          return;
        }
      } catch (e) {
        // fallback to local
        console.warn('Forum backend unavailable, falling back to local', e);
        setPosts(loadPosts());
      }
    };
    load();
  }, []);

  const createPost = async () => {
    if(!title.trim() || !body.trim()) return addToast('Title and body required', 'error');
    const payload = { title: title.trim(), body: body.trim() };
    try {
      const res = await axios.post('/forum/posts', payload);
      if (res.data) {
        setPosts(p => [res.data, ...p]);
        addToast('Post created', 'success');
        setTitle(''); setBody('');
        return;
      }
    } catch (e) {
      console.warn('Backend post failed, saving locally', e);
    }
    const p = { id: Date.now().toString(), title: title.trim(), body: body.trim(), author: 'You', createdAt: new Date().toISOString(), likes:0, comments:[] };
    const next = [p, ...posts];
    setPosts(next); savePosts(next);
    setTitle(''); setBody('');
    addToast('Post saved locally', 'info');
  };

  const likePost = async (id) => {
    try {
      const res = await axios.post(`/forum/posts/${id}/like`);
      if (res.data) {
        setPosts(p => p.map(x => x.id === id || x._id === id ? res.data : x));
        addToast('Liked', 'success');
        return;
      }
    } catch (e) {
      console.warn('Like via backend failed, falling back');
    }
    const next = posts.map(p => p.id === id ? {...p, likes: (p.likes||0) + 1 } : p);
    setPosts(next); savePosts(next);
  };

  const deletePost = async (id) => {
    // try backend delete first
    try {
      const res = await axios.delete(`/forum/posts/${id}`);
      if (res.data) {
        setPosts(p => p.filter(x => !(x.id === id || x._id === id)));
        addToast('Post deleted', 'success');
        return;
      }
    } catch (e) {
      console.warn('Backend delete failed, falling back to local', e?.response?.data || e.message);
    }
    // fallback: delete locally-saved posts
    const next = posts.filter(p => !(p.id === id));
    setPosts(next); savePosts(next);
    addToast('Post deleted locally', 'info');
  };

  const commentPost = async (id, text) => {
    const payload = { text };
    try {
      const res = await axios.post(`/forum/posts/${id}/comments`, payload);
      if (res.data) {
        setPosts(p => p.map(x => x.id === id || x._id === id ? res.data : x));
        addToast('Comment added', 'success');
        return;
      }
    } catch (e) {
      console.warn('Backend comment failed, falling back to local', e);
    }
    const next = posts.map(p => p.id === id ? {...p, comments: [...(p.comments||[]), { text, author: 'You', createdAt: new Date().toISOString() }]} : p);
    setPosts(next); savePosts(next);
    addToast('Comment saved locally', 'info');
  };

  return (
    <div>
      <Card className="mb-4 p-4">
        <h4 className="font-semibold mb-2 bp-gradient-text">Financial Tips Forum</h4>
        <div className="mb-2">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Post title" className="w-full border border-blue-200 rounded p-2 mb-2 bg-white text-slate-900" />
          <textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Share a tip or question..." className="w-full border border-blue-200 rounded p-2 mb-2 bg-white text-slate-900" rows={3} />
          <div className="flex justify-end">
            <Button onClick={createPost}>Post</Button>
          </div>
        </div>
      </Card>

      <div>
        {posts.length === 0 ? (
          <div className="text-sm text-slate-600">No posts yet. Start the conversation about money-saving tips!</div>
        ) : (
          posts.map(p => {
            const isOwn = (p.author === 'You') || (user && (p.authorId === user.id || p.authorName === user.name || p.authorName === user.email));
            return <Post key={p.id || p._id} post={p} onLike={likePost} onComment={commentPost} onDelete={deletePost} canDelete={isOwn} />
          })
        )}
      </div>
    </div>
  );
};

export default Forum;
