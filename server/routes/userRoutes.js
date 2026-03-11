const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/authMiddleware');



// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
}));

// Google Auth is replaced by Clerk



// @desc    Register a new user
// @route   POST /api/users
// @access  Public
router.post('/', asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    console.log('Registration attempt for:', email);

    // Validate input
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please provide all required fields: name, email, password');
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });

    if (userExists) {
        res.status(400);
        throw new Error('An account with this email already exists');
    }

    try {
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
        });

        if (user) {
            console.log('User registered successfully:', user.email);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate key error
        if (error.code === 11000) {
            res.status(400);
            throw new Error('An account with this email already exists');
        }

        throw error;
    }
}));

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
router.get('/addresses', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json(user.addresses || []);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
router.post('/addresses', protect, asyncHandler(async (req, res) => {
    const { fullName, phone, address, city, state, postalCode, country, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        const newAddress = {
            fullName,
            phone,
            address,
            city,
            state,
            postalCode,
            country: country || 'India',
            isDefault: isDefault || false
        };

        // If this is set as default, unset others
        if (newAddress.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(newAddress);
        await user.save();
        res.status(201).json(user.addresses);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
router.put('/addresses/:id', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const address = user.addresses.id(req.params.id);
        if (address) {
            address.fullName = req.body.fullName || address.fullName;
            address.phone = req.body.phone || address.phone;
            address.address = req.body.address || address.address;
            address.city = req.body.city || address.city;
            address.state = req.body.state || address.state;
            address.postalCode = req.body.postalCode || address.postalCode;
            address.country = req.body.country || address.country;
            address.isDefault = req.body.isDefault !== undefined ? req.body.isDefault : address.isDefault;

            if (req.body.isDefault) {
                user.addresses.forEach(addr => {
                    if (addr._id.toString() !== req.params.id) {
                        addr.isDefault = false;
                    }
                });
            }

            await user.save();
            res.json(user.addresses);
        } else {
            res.status(404);
            throw new Error('Address not found');
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
router.delete('/addresses/:id', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== req.params.id);
        await user.save();
        res.json(user.addresses);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

module.exports = router;
