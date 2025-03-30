import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js"; // Assuming you have a Comment model

// Add a new post
export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.userId; // Corrected from req.id to req.userId

        // Check if an image is provided
        if (!image) return res.status(400).json({ message: 'Image required' });

        // Optimize the image
        const optimizedImageBuffer = await sharp(image.buffer)
            .resize({ width: 800, height: 800, fit: "inside" })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        // Convert the buffer to a data URI
        const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;

        // Upload the image to Cloudinary
        const cloudResponse = await cloudinary.uploader.upload(fileUri);

        // Create a new post
        const post = await Post.create({
            caption,
            image: cloudResponse.secure_url,
            author: authorId
        });

        // Find the author and add the post to their posts array
        const user = await User.findById(authorId);
        if (user) {
            user.posts.push(post._id);
            await user.save();
        }

        // Populate the author's details, excluding the password
        await post.populate({ path: 'author', select: '-password' });

        return res.status(201).json({
            message: 'New post added',
            post,
            success: true,
        });
    } catch (error) {
        console.log(`Error in addNewPost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Get all posts with pagination
export const getAllPost = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;  // Default to page 1, 10 posts per page

        const posts = await Post.find()
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip((page - 1) * limit) // Implement pagination
            .limit(parseInt(limit))   // Limit the results per page
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        const totalPosts = await Post.countDocuments();

        return res.status(200).json({
            posts,
            totalPosts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            success: true
        });
    } catch (error) {
        console.log(`Error in getAllPost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Get all posts of a specific user
export const getUserPost = async (req, res) => {
    try {
        const authorId = req.userId; // Changed to req.userId
        const posts = await Post.find({ author: authorId })
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'username profilePicture' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username profilePicture'
                }
            });

        return res.status(200).json({
            posts,
            success: true
        });
    } catch (error) {
        console.log(`Error in getUserPost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Like a post
export const likePost = async (req, res) => {
    try {
        const userId = req.userId; // Changed to req.userId
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        await post.updateOne({ $addToSet: { likes: userId } });

        return res.status(200).json({ message: 'Post liked', success: true });
    } catch (error) {
        console.log(`Error in likePost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Dislike a post
export const dislikePost = async (req, res) => {
    try {
        const userId = req.userId; // Changed to req.userId
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        await post.updateOne({ $pull: { likes: userId } });

        return res.status(200).json({ message: 'Post disliked', success: true });
    } catch (error) {
        console.log(`Error in dislikePost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Add a comment to a post
export const addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId; // Changed to req.userId
        const { text } = req.body;

        if (!text) return res.status(400).json({ message: 'Text is required', success: false });

        const comment = await Comment.create({
            text,
            author: userId,
            post: postId
        });

        await comment.populate({ path: 'author', select: "username profilePicture" });

        const post = await Post.findById(postId);
        post.comments.push(comment._id);
        await post.save();

        return res.status(200).json({
            message: 'Comment added',
            comment,
            success: true
        });
    } catch (error) {
        console.log(`Error in addComment: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Get comments of a specific post
export const getCommentOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId })
            .populate('author', 'username profilePicture');

        if (!comments || comments.length === 0) {
            return res.status(404).json({ message: 'No comments found for this post', success: false });
        }

        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.log(`Error in getCommentOfPost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Delete a post
export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.userId; // Changed to req.userId

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        if (post.author.toString() !== authorId) {
            return res.status(403).json({ message: 'Unauthorized', success: false });
        }

        await Post.findByIdAndDelete(postId);

        const user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        await Comment.deleteMany({ post: postId });

        return res.status(200).json({
            success: true,
            message: 'Post deleted'
        });
    } catch (error) {
        console.log(`Error in deletePost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

// Bookmark or unbookmark a post
export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.userId; // Changed to req.userId

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found', success: false });

        const user = await User.findById(userId);

        if (user.bookmarks.includes(post._id)) {
            await user.updateOne({ $pull: { bookmarks: post._id } });
            return res.status(200).json({ message: 'Post removed from bookmarks', success: true });
        } else {
            await user.updateOne({ $addToSet: { bookmarks: post._id } });
            return res.status(200).json({ message: 'Post bookmarked', success: true });
        }
    } catch (error) {
        console.log(`Error in bookmarkPost: ${error.message}`);
        res.status(500).json({ message: 'Server error', success: false });
    }
};

export default {
    addNewPost,
    getAllPost,
    getUserPost,
    likePost,
    dislikePost,
    addComment,
    getCommentOfPost,
    deletePost,
    bookmarkPost
};
