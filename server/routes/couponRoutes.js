const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES ====================

// @desc    Get all active coupons (for homepage display)
// @route   GET /api/coupons/active
// @access  Public
router.get('/active', asyncHandler(async (req, res) => {
    const now = new Date();
    const coupons = await Coupon.find({
        status: 'active',
        expiryDate: { $gt: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] }
    }).select('couponCode discountType discountValue minimumPurchaseAmount expiryDate description');

    res.json(coupons);
}));

// @desc    Validate a coupon code at checkout
// @route   POST /api/coupons/validate
// @access  Private
router.post('/validate', protect, asyncHandler(async (req, res) => {
    const { couponCode, orderTotal } = req.body;

    if (!couponCode) {
        res.status(400);
        throw new Error('Coupon code is required');
    }

    const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase().trim() });

    if (!coupon) {
        res.status(404);
        throw new Error('Invalid Coupon Code');
    }

    if (coupon.status !== 'active') {
        res.status(400);
        throw new Error('This coupon is no longer active');
    }

    const now = new Date();
    if (coupon.expiryDate < now) {
        res.status(400);
        throw new Error('Coupon Expired');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
        res.status(400);
        throw new Error('Coupon Usage Limit Reached');
    }

    if (orderTotal < coupon.minimumPurchaseAmount) {
        res.status(400);
        throw new Error(`Discount code is valid for a minimum ₹${coupon.minimumPurchaseAmount.toFixed(1)} cart value only`);
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((orderTotal * coupon.discountValue) / 100);
    } else {
        discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);

    res.json({
        valid: true,
        coupon: {
            _id: coupon._id,
            couponCode: coupon.couponCode,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
        },
        discountAmount,
        message: 'Coupon applied successfully!',
    });
}));

// ==================== ADMIN ROUTES ====================

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
router.get('/', protect, admin, asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Coupon.countDocuments();
    const coupons = await Coupon.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        coupons,
        page,
        pages: Math.ceil(total / limit),
        total,
    });
}));

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private/Admin
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const {
        couponCode,
        discountType,
        discountValue,
        minimumPurchaseAmount,
        expiryDate,
        usageLimit,
        status,
        description,
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase().trim() });
    if (existingCoupon) {
        res.status(400);
        throw new Error('Coupon code already exists');
    }

    const coupon = new Coupon({
        couponCode: couponCode.toUpperCase().trim(),
        discountType,
        discountValue,
        minimumPurchaseAmount: minimumPurchaseAmount || 0,
        expiryDate,
        usageLimit: usageLimit || 100,
        status: status || 'active',
        description: description || '',
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
}));

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        res.status(404);
        throw new Error('Coupon not found');
    }

    const {
        couponCode,
        discountType,
        discountValue,
        minimumPurchaseAmount,
        expiryDate,
        usageLimit,
        status,
        description,
    } = req.body;

    // If code is being changed, check it's not a duplicate
    if (couponCode && couponCode.toUpperCase().trim() !== coupon.couponCode) {
        const existingCoupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase().trim() });
        if (existingCoupon) {
            res.status(400);
            throw new Error('Coupon code already exists');
        }
        coupon.couponCode = couponCode.toUpperCase().trim();
    }

    coupon.discountType = discountType || coupon.discountType;
    coupon.discountValue = discountValue !== undefined ? discountValue : coupon.discountValue;
    coupon.minimumPurchaseAmount = minimumPurchaseAmount !== undefined ? minimumPurchaseAmount : coupon.minimumPurchaseAmount;
    coupon.expiryDate = expiryDate || coupon.expiryDate;
    coupon.usageLimit = usageLimit !== undefined ? usageLimit : coupon.usageLimit;
    coupon.status = status || coupon.status;
    coupon.description = description !== undefined ? description : coupon.description;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
}));

// @desc    Toggle coupon status (active/inactive)
// @route   PUT /api/coupons/:id/toggle
// @access  Private/Admin
router.put('/:id/toggle', protect, admin, asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        res.status(404);
        throw new Error('Coupon not found');
    }

    coupon.status = coupon.status === 'active' ? 'inactive' : 'active';
    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
}));

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
        res.status(404);
        throw new Error('Coupon not found');
    }

    await Coupon.deleteOne({ _id: req.params.id });
    res.json({ message: 'Coupon removed' });
}));

module.exports = router;
