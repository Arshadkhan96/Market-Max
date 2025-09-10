const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect } = require("../middleware/authMiddleware");


// Register User
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Create and save user
        const newUser = new User({ name, email, password });
        const savedUser = await newUser.save();

        // Create JWT payload
        const payload = {
            user: {
                id: savedUser._id,
                role: savedUser.role || 'user'
            }
        };

        // Generate JWT token with 7 days expiry
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
            (err, token) => {
                if (err) {
                    console.error("JWT error:", err);
                    return res.status(500).json({ error: "Error generating token" });
                }

                // Return complete response with _id
                res.status(201).json({
                    user: {
                        _id: savedUser._id,  // Explicitly include _id
                        name: savedUser.name,
                        email: savedUser.email,
                        role: savedUser.role || 'customer'
                    },
                    token,
                });
            }
        );

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Server error during registration" });
    }
});


//@route/POST /api/users/Login
//@desc Authenticate user
//@access Public

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Compare passwords (assuming you have a matchPassword method in your User model)
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user._id,  // Fixed: using user instead of savedUser
                role: user.role || 'customer'  // Default to 'customer' if role not specified
            }
        };

        // Generate JWT token with 7 days expiry
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
            (err, token) => {
                if (err) {
                    console.error("JWT error:", err);
                    return res.status(500).json({ error: "Error generating token" });
                }

                // Return complete response with user data
                res.json({
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role || 'customer'
                    },
                    token,
                    message: "Login successful"
                });
            }
        );

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error during login" });
    }
});

//@route GET api/user/profile
//@desc GET logged-in user's profile(Protected Route)
//@access Private

router.get("/profile", protect,async (req,res)=>{
    res.json(req.user)

})

module.exports = router;

