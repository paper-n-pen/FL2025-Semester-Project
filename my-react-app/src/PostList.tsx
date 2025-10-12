import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  username: string;
}

function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/posts');
        setPosts(res.data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <p>Loading posts...</p>;
  if (posts.length === 0) return <p>No posts yet. Be the first to create one!</p>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h2>All Posts</h2>
      {posts.map(post => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
          <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ marginTop: 0 }}>{post.title}</h3>
          </Link>
          <p>{post.content.substring(0, 100)}...</p>
          <p style={{ fontSize: '0.9rem', color: 'gray', marginBottom: 0 }}>
            By <strong>{post.username}</strong> on {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default PostList;
