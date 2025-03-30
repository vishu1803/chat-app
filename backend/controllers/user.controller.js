import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// Registering user
export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required.",
                success: false,
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({
                message: "User already exists.",
                success: false,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Account created successfully",
            success: true,
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: `Duplicate key error: ${Object.keys(error.keyPattern)[0]} already exists.`,
                success: false,
            });
        }

        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
};

// Login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                success: false,
            });
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Incorrect email or password.",
                success: false,
            });
        }

        const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1d' });

        // Populate each post id in the post array
        const populatedPosts = await Promise.all(
            user.posts.map(async (postId) => {
                const post = await Post.findById(postId);
                if (post && post.author.equals(user._id)) {
                    return post;
                }
                return null;
            })
        );

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: populatedPosts.filter(post => post !== null) // Filtering out null values
        };

        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back, ${user.username}`,
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
};

// Logout user
export const logout = async (_, res) => {
    try {
        return res.cookie("token", "", { maxAge: 0 }).json({
            message: 'Logged out successfully.',
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
};

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        }

        return res.status(200).json({
            user,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
};

// Edit user profile
export const editProfile = async (req, res) => {
    try {
        const userId = req.userId; // Updated to req.userId
        const { bio, gender } = req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if (profilePicture) {
            const fileUri = getDataUri(profilePicture);
            cloudResponse = await cloudinary.uploader.upload(fileUri);
        }

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        }

        if (bio) user.bio = bio;
        if (gender) user.gender = gender;
        if (profilePicture && cloudResponse) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message: 'Profile updated successfully.',
            success: true,
            user
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
};

// Get suggested users
export const getSuggestedUsers = async (req, res) => {
    try {
        const suggestedUsers = await User.find({ _id: { $ne: req.userId } }).select("-password");

        if (!suggestedUsers.length) {
            return res.status(404).json({
                message: 'No suggested users found.',
                success: false
            });
        }

        return res.status(200).json({
            success: true,
            users: suggestedUsers
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
};

// Follow or unfollow user
export const followOrUnfollow = async (req, res) => {
    try {
        const followerId = req.userId; // Updated to req.userId
        const targetUserId = req.params.id;

        if (followerId === targetUserId) {
            return res.status(400).json({
                message: 'You cannot follow yourself.',
                success: false
            });
        }

        const user = await User.findById(followerId);
        const targetUser = await User.findById(targetUserId);

        if (!user || !targetUser) {
            return res.status(404).json({
                message: 'User not found.',
                success: false
            });
        }

        const isFollowing = user.following.includes(targetUserId);

        if (isFollowing) {
            // Unfollow logic
            await Promise.all([
                User.updateOne({ _id: followerId }, { $pull: { following: targetUserId } }),
                User.updateOne({ _id: targetUserId }, { $pull: { followers: followerId } })
            ]);
            return res.status(200).json({
                message: 'Unfollowed successfully.',
                success: true
            });

        } else {
            // Follow logic
            await Promise.all([
                User.updateOne({ _id: followerId }, { $push: { following: targetUserId } }),
                User.updateOne({ _id: targetUserId }, { $push: { followers: followerId } })
            ]);
            return res.status(200).json({
                message: 'Followed successfully.',
                success: true
            });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error.",
            success: false,
        });
    }
};
