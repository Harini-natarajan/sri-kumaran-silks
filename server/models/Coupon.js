const mongoose = require('mongoose');

const couponSchema = mongoose.Schema(
    {
        couponCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        discountType: {
            type: String,
            required: true,
            enum: ['percentage', 'fixed'],
            default: 'percentage',
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        minimumPurchaseAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        usageLimit: {
            type: Number,
            required: true,
            default: 100,
            min: 1,
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster coupon code lookup
couponSchema.index({ couponCode: 1 });
couponSchema.index({ status: 1, expiryDate: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
