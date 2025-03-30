import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import messageRoute from "./routes/message.route.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000; // Changed to PORT (uppercase) for consistency

// Route handler
app.get("/", (_, res) => {
  return res.status(200).json({
    message: "I'm coming from the backend",
    success: true,
  });
});

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Use express.urlencoded directly

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],  // Fixed the missing 'http://'
  credentials: true, // Corrected the 'Credential' to 'credentials'
};
app.use(cors(corsOptions));

// Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/post", postRoute);
app.use("/api/v1/message", messageRoute);

// Connect to MongoDB and start the server
app.listen(port, () => {
  connectDB();
  console.log(`Server listening at port ${port}`);
});
