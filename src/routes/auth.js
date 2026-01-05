const express = require("express");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validateSignupData } = require("../utils/validation");
const userAuth = require("../middleware/auth");

// Signup Route
authRouter.post("/signup", async (req, res) => {
    try {
        // Validate signup data
        validateSignupData(req);

        const { firstName, lastName, emailId, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            return res.status(400).json({ 
                error: "User with this email already exists" 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash
        });

        const savedUser = await user.save();
        
        // Generate JWT token
        const token = await user.getJWT();

        // Set cookie
        res.cookie("token", token, {
            expires: new Date(Date.now() + 86400000), // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        // Send response (don't send password)
        res.status(201).json({
            message: "User registered successfully",
            data: {
                _id: savedUser._id,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                emailId: savedUser.emailId
            }
        });

    } catch (err) {
        console.error("Signup error:", err);
        res.status(400).json({ 
            error: err.message || "Failed to register user" 
        });
    }
});

// Login Route
authRouter.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;

        // Validate input
        if (!emailId || !password) {
            return res.status(400).json({ 
                error: "Email and password are required" 
            });
        }

        // Find user
        const user = await User.findOne({ emailId });
        if (!user) {
            return res.status(401).json({ 
                error: "Invalid email or password" 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: "Invalid email or password" 
            });
        }

        // Generate JWT token
        const token = await user.getJWT();

        // Set cookie
        res.cookie("token", token, {
            expires: new Date(Date.now() + 86400000), // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        // Send response (don't send password)
        res.status(200).json({
            message: "Login successful",
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ 
            error: "Login failed. Please try again" 
        });
    }
});

// Logout Route
authRouter.post("/logout", async (req, res) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true
        });

        res.status(200).json({ 
            message: "User logged out successfully" 
        });

    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ 
            error: "Logout failed" 
        });
    }
});

// Get current user profile (protected route)
authRouter.get("/profile", userAuth, async (req, res) => {
    try {
        res.status(200).json({
            message: "Profile fetched successfully",
            data: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                emailId: req.user.emailId,
                createdAt: req.user.createdAt
            }
        });
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({ 
            error: "Failed to fetch profile" 
        });
    }
});

// Check authentication status
authRouter.get("/check-auth", userAuth, (req, res) => {
    res.status(200).json({
        authenticated: true,
        user: {
            _id: req.user._id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            emailId: req.user.emailId
        }
    });
});

module.exports = authRouter;