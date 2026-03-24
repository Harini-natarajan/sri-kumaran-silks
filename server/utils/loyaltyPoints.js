const User = require('../models/User');

const POINTS_PER_RUPEES = 100;

const calculateLoyaltyPoints = (totalAmount = 0) => {
    const amount = Number(totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return 0;
    }

    return Math.floor(amount / POINTS_PER_RUPEES);
};

const getPointsTier = (points = 0) => {
    const normalizedPoints = Number.isFinite(Number(points)) ? Number(points) : 0;

    if (normalizedPoints >= 500) {
        return 'Platinum';
    }
    if (normalizedPoints >= 101) {
        return 'Gold';
    }
    return 'Silver';
};

const parsePointsUsed = (pointsUsed) => {
    const parsed = Number(pointsUsed || 0);

    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
        return {
            ok: false,
            value: 0,
            message: 'Points used must be a non-negative whole number',
        };
    }

    return {
        ok: true,
        value: parsed,
    };
};

const resolveUserForRewards = async ({ userId, email, fallbackUserId }) => {
    if (userId) {
        const byId = await User.findById(userId);
        if (byId) {
            return byId;
        }
    }

    if (fallbackUserId) {
        const byFallbackId = await User.findById(fallbackUserId);
        if (byFallbackId) {
            return byFallbackId;
        }
    }

    if (email) {
        return User.findOne({ email: String(email).toLowerCase() });
    }

    return null;
};

module.exports = {
    calculateLoyaltyPoints,
    getPointsTier,
    parsePointsUsed,
    resolveUserForRewards,
};
