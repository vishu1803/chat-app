import React from 'react';
import Post from './Post';
import { useSelector } from 'react-redux';

const Posts = () => {
  const { posts, loading } = useSelector(store => store.post); // Assuming you have a 'loading' state in your store

  return (
    <div>
      {loading ? (
        <p>Loading posts...</p> // Display this while posts are being fetched
      ) : posts && posts.length > 0 ? (
        posts.map((post) => <Post key={post._id} post={post} />)
      ) : (
        <p>No posts available.</p> // Fallback if no posts are found
      )}
    </div>
  );
};

export default Posts;
