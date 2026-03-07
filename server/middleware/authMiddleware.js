const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const protect = asyncHandler(async (req, res, next) => {
    let token;

    console.log('Auth Headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header');

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            console.log('Token received (first 20 chars):', token.substring(0, 20) + '...');

            // Verify Clerk token
            const decoded = await clerkClient.verifyToken(token);
            console.log('Token decoded successfully, user ID:', decoded.sub);

            const clerkUser = await clerkClient.users.getUser(decoded.sub);

            if (!clerkUser) {
                res.status(401);
                throw new Error('Not authorized, user not found in Clerk');
            }

            const email = clerkUser.emailAddresses[0]?.emailAddress;
            console.log('Clerk user email:', email);

            // Find or Create user in local DB
            let user = await User.findOne({
                $or: [
                    { googleId: decoded.sub }, // Support legacy naming if any
                    { clerkId: decoded.sub },
                    { email: email }
                ]
            });

            if (!user) {
                // Create user if doesn't exist
                console.log('Creating new user in DB...');
                user = await User.create({
                    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Clerk User',
                    email: email,
                    password: Math.random().toString(36).slice(-10), // Required by schema
                    picture: clerkUser.imageUrl,
                    clerkId: decoded.sub,
                    isAdmin: true // Make first user admin for testing
                });
            } else if (!user.clerkId) {
                // Update existing user with clerkId
                user.clerkId = decoded.sub;
                if (!user.picture) user.picture = clerkUser.imageUrl;
                await user.save();
            }

            console.log('User found/created:', user.email, 'isAdmin:', user.isAdmin);
            req.user = user;
            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            console.error('Full error:', error);
            res.status(401);
            throw new Error('Not authorized, token failed: ' + error.message);
        }
    }

    if (!token) {
        console.log('No token found in request');
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});


const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

module.exports = { protect, admin };

