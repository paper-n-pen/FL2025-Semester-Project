// my-react-app/src/CreatePost.tsx

import { useState } from 'react';
import axios from 'axios';

function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('You must be logged in to post.');
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3000/api/posts',
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('✅ Post created successfully!');
      setTitle('');
      setContent('');
    } catch (err: any) {
      console.error(err);
      setMessage('❌ Failed to create post.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h2>Create a Post</h2>
      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        style={{ display: 'block', width: '100%', marginBottom: '1rem' }}
      />
      <textarea
        placeholder="Write your post content..."
        value={content}
        onChange={e => setContent(e.target.value)}
        required
        style={{ display: 'block', width: '100%', height: '150px', marginBottom: '1rem' }}
      />
      <button type="submit">Publish</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default CreatePost;
