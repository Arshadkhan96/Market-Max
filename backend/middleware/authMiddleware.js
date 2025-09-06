const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to protect routes
const protect = async (req, res, next) => {
    let token;

    // 1. Check if authorization header exists AND starts with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            // 2. Get token from header ("Bearer <token>")
            token = req.headers.authorization.split(" ")[1];
            
            if (!token) {
                return res.status(401).json({ 
                    success: false,
                    message: "No token provided" 
                });
            }
            
            // 3. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 4. Get user from database (excluding password)
            req.user = await User.findById(decoded.user.id).select("-password");
            
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: "User not found" 
                });
            }
            
            // 5. Move to next middleware/route
            next();
            
        } catch (error) {
            console.error("Token verification failed:", error);
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    message: "Session expired. Please log in again.",
                    isTokenExpired: true
                });
            }
            
            res.status(401).json({ 
                success: false,
                message: "Not authorized, please log in again" 
            });
        }
    } else {
        res.status(401).json({ 
            success: false,
            message: "Not authorized, no token provided" 
        });
    }
};


// Middleware to check if the user is an admin
const admin = (req, res, next) => {
    try {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            console.warn(`Unauthorized admin access attempt by user: ${req.user._id}`);
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        // User is admin, proceed to next middleware
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: "Server error during admin verification"
        });
    }
};
module.exports = { protect , admin};