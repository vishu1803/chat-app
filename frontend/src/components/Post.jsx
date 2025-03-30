import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from './ui/button'
import { FaHeart, FaRegHeart } from "react-icons/fa"
import CommentDialog from './CommentDialog'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'sonner'
import store from '@/redux/store'
import { setPosts } from '@/redux/postSlice'
import PropTypes from 'prop-types';


const Post = ({ post }) => {
    const [text, setText] = useState("");
    const [open, setOpen] = useState(false);
    const { user } = useSelector(store => store.auth);
    const { posts } = useSelector(store => store.post);
    const [liked, setLiked] = useState(Array.isArray(post.likes) && post.likes.includes(user?._id) || false);
    const [postLike, setPostLike] = useState(Array.isArray(post.likes) ? post.likes.length : 0);

    const dispatch = useDispatch();
    const changeEventHandler = (e) => {
        const inputText = e.target.value;
        if (inputText.trim()) {
            setText(inputText);
        } else {
            setText("");
        }
    };

    const likeOrDislikeHandler = async () => {
        try {
          const action = liked ? 'dislike' : 'like';
          const res = await axios.get(
            `http://localhost:8000/api/v1/post/${post._id}/${action}`, // Correct URL without "delete"
            { withCredentials: true }
          );
      
          if (res.data.success) {
            const updatedLikes = liked ? postLike - 1 : postLike + 1;
            setPostLike(updatedLikes);
            setLiked(!liked);
            // apne post ko update krunga
            const updatedPostData = posts.map(p => 
                p._id === post._id ? {
                    ...p, 
                    likes : liked ? p.likes.filter(id => id !== user._id) : [...p.likes, user._id]
                } : p
            );
            dispatch(setPosts(updatedPostData));

            toast.success(res.data.message);
          }
        } catch (error) {
          console.error(error);
          toast.error('Failed to update like status');
        }
      };
      



    const deletePostHandler = async () => { // Mark function as async
        try {
            const res = await axios.delete(
                `http://localhost:8000/api/v1/post/delete/${post?._id}`,
                { withCredentials: true }
            );
            if (res.data.success) {
                // Update posts state excluding the deleted post
                const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id);
                dispatch(setPosts(updatedPostData));
                toast.success(res.data.message);
            }

        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'An error occurred');
        }
    };


    return (
        <div className='my-8 w-full max-w-sm mx-auto'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <Avatar>
                        <AvatarImage src={post.author?.profilePicture} alt="author_image" />
                        <AvatarFallback> CN</AvatarFallback>
                    </Avatar>
                    <h1>{post.author?.username}</h1>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <MoreHorizontal className='cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className='flex flex-col items-center text-sm text-center'>
                        <Button variant='ghost' className='cursor-pointer w-fit text-[#ED4956] font-bold'>
                            Unfollow
                        </Button>
                        <Button variant='ghost' className='cursor-pointer w-fit'>
                            Add to favorite
                        </Button>
                        {
                            user && user?._id == post?.author._id &&
                            <Button onClick={deletePostHandler}
                                variant='ghost' className='cursor-pointer w-fit'>
                                Delete
                            </Button>
                        }
                    </DialogContent>
                </Dialog>
            </div>

            <img className='rounded-sm my-2 w-full aspect-square object-cover' src={post.image} alt="post_img" />

            <div className='flex items-center justify-between my-2'>
                <div className='flex items-center gap-3'>
                    {liked ? (
                        <FaHeart size={'22px'} className='cursor-pointer text-red-500' />
                    ) : (
                        <FaRegHeart size={'22px'} className='cursor-pointer hover:text-gray-600' onClick={likeOrDislikeHandler} />
                    )}
                    <MessageCircle onClick={() => setOpen(true)} className='cursor-pointer hover:text-gray-600' />
                    <Send className='cursor-pointer hover:text-gray-600' />
                </div>

                <Bookmark className='cursor-pointer hover:text-gray-600' />
            </div>

            {/* Safe access to likes */}
            <span className='font-medium block mb-2'>
                {postLike} likes
            </span>

            <p>
                <span className='font-medium mr-2'>{post.author?.username}</span>
                {post.caption}
            </p>

            <span onClick={() => setOpen(true)} className='cursor-pointer text-sm text-gray-400'>
                View all {post.comments?.length || 0} comments
            </span>
            <CommentDialog open={open} setOpen={setOpen} />
            <div className='flex items-center justify-between'>
                <input
                    type="text"
                    placeholder='Add a comment...'
                    value={text}
                    onChange={changeEventHandler}
                    className='outline-none text-sm w-full'
                />
                {text && <span className='text-[#3BADF8]' onClick={postComment}>Post</span>}
            </div>
        </div>
    );
};
Post.propTypes = {
    post: PropTypes.shape({
        _id: PropTypes.string.isRequired,         // Ensure post._id is a string and required
        likes: PropTypes.arrayOf(PropTypes.string), // Ensure post.likes is an array of strings
        author: PropTypes.shape({
            username: PropTypes.string.isRequired,
            profilePicture: PropTypes.string,
        }).isRequired,                            // Ensure author object has a username and profilePicture
        image: PropTypes.string.isRequired,        // Ensure post image is a string and required
        caption: PropTypes.string,                 // Ensure post caption is a string (optional)
        comments: PropTypes.array,                 // Ensure post comments is an array (optional)
    }).isRequired,                                 // Ensure post prop is passed and it's required
};


export default Post;
