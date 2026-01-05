const jwt = require('jsonwebtoken');
const User = require("../models/user");

const userAuth = async (req, res, next) => {
    try {
        // Read token from cookies
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ 
                error: "Authentication required. Please login to continue.",
                authenticated: false
            });
        }

        // Verify token
        const decodedObj = await jwt.verify(token, "Gungun@Sharma$790");
        const { _id } = decodedObj;

        // Find user
        const user = await User.findById(_id).select('-password');

        if (!user) {
            return res.status(401).json({ 
                error: "User not found. Please login again.",
                authenticated: false
            });
        }

        // Attach user to request object
        req.user = user;
        next();

    } catch (err) {
        console.error("Authentication error:", err);

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: "Invalid token. Please login again.",
                authenticated: false
            });
        }

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: "Session expired. Please login again.",
                authenticated: false
            });
        }

        res.status(401).json({ 
            error: "Authentication failed. Please login to continue.",
            authenticated: false
        });
    }
};

module.exports = userAuth;