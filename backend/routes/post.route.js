import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import { 
    addComment, 
    addNewPost, 
    bookmarkPost, 
    deletePost, 
    dislikePost, 
    getAllPost, 
    getCommentOfPost, 
    getUserPost, 
    likePost 
} from "../controllers/post.controller.js";

const router = express.Router();

router.route("/addpost").post(isAuthenticated, upload.single('image'), addNewPost);
router.route("/all").get(isAuthenticated, getAllPost);
router.route("/userpost").get(isAuthenticated, getUserPost);
router.route("/:id/like").get(isAuthenticated, likePost);        // Dynamic :id parameter
router.route("/:id/dislike").get(isAuthenticated, dislikePost);  // Dynamic :id parameter
router.route("/:id/comment").post(isAuthenticated, addComment);  // Dynamic :id parameter
router.route("/:id/comment/all").post(isAuthenticated, getCommentOfPost);  // Dynamic :id parameter
router.route("/delete/:id").delete(isAuthenticated, deletePost); // Dynamic :id parameter
router.route("/:id/bookmark").post(isAuthenticated, bookmarkPost); // Dynamic :id parameter

export default router;
