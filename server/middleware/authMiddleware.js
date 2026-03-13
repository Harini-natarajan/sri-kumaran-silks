const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = process.env.CLERK_SECRET_KEY
    ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    : null;

const findOrCreateClerkUser = async (decoded) => {
    if (!clerkClient) {
        throw new Error('Clerk auth is not configured on server');
    }

    const clerkUser = await clerkClient.users.getUser(decoded.sub);

    if (!clerkUser) {
        throw new Error('Not authorized, user not found in Clerk');
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    let user = await User.findOne({
        $or: [
            { googleId: decoded.sub },
            { clerkId: decoded.sub },
            { email },
        ],
    });

    if (!user) {
        user = await User.create({
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Clerk User',
            email,
            password: Math.random().toString(36).slice(-10),
            picture: clerkUser.imageUrl,
            clerkId: decoded.sub,
            isAdmin: true,
        });
    } else if (!user.clerkId) {
        user.clerkId = decoded.sub;
        if (!user.picture) {
            user.picture = clerkUser.imageUrl;
        }
        await user.save();
    }

    return user;
};

const findJwtUser = async (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
        throw new Error('Not authorized, user not found');
    }

    return user;
};

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

            let user;

            try {
                if (!clerkClient) {
                    throw new Error('Clerk auth is not configured on server');
                }

                const decoded = await clerkClient.verifyToken(token);
                console.log('Clerk token decoded successfully, user ID:', decoded.sub);
                user = await findOrCreateClerkUser(decoded);
            } catch (clerkError) {
                console.log('Clerk token verification failed, trying JWT fallback...');
                user = await findJwtUser(token);
            }

            console.log('User authenticated:', user.email, 'isAdmin:', user.isAdmin);
            req.user = user;
            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
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

