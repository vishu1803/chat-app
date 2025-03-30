import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    // Extract the token from cookies
    const token = req.cookies.token;
    
    // If no token is provided, return an unauthorized response
    if (!token) {
      return res.status(401).json({
        message: 'User not authenticated. No token provided.',
        success: false
      });
    }

    // Verify the token with the secret key
    const decode = await jwt.verify(token, process.env.SECRET_KEY);
    
    // If the token is invalid, return an unauthorized response
    if (!decode) {
      return res.status(401).json({
        message: 'Invalid token. Authentication failed.',
        success: false
      });
    }

    // Attach the userId from the decoded token payload to the request object
    req.userId = decode.userId; // Ensure this key exists in your token payload

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle specific token expiration case
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired. Please log in again.',
        success: false
      });
    }

    // For any other error, return a generic internal server error response
    return res.status(500).json({
      message: 'Internal Server Error during authentication.',
      success: false,
      error: error.message
    });
  }
};

export default isAuthenticated;
