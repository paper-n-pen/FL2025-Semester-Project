import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  username: string;
}

function PostPrePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/posts/${id}`);
        setPost(res.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('Post not found.');
        } else {
          setError('Failed to load the post.');
          console.error('Error fetching post:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (loading) return <p>Loading post...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '2rem', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>{post.title}</h1>
      <p style={{ fontSize: '1rem', color: 'gray', marginBottom: '2rem' }}>
        By <strong>{post.username}</strong> on {new Date(post.created_at).toLocaleString()}
      </p>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
        {post.content}
      </div>
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/posts')} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Back to List
        </button>
        <Link to={`/whiteboard?roomId=${post.id}`}>
          <button style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
            Enter Room
          </button>
        </Link>
      </div>
    </div>
  );
}

export default PostPrePage;
