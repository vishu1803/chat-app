import express from "express";
import { getProfile, logout, register, login, editProfile, getSuggestedUsers, followOrUnfollow } from "../controllers/user.controller.js";  // Import the necessary functions
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();  // Fixed: Router should be capitalized

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/:id/profile').get(isAuthenticated, getProfile);
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePicture'), editProfile); 
router.route('/suggested').get(isAuthenticated, getSuggestedUsers);  
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow);  



export default router;
