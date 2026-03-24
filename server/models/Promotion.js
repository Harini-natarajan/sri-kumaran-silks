const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['hero_banner', 'promo_slide', 'announcement'],
        required: true
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    // Hero banner fields
    image: { type: String, default: '' },

    // Shared fields
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String, default: '/products' },

    // Promo slide specific
    tag: { type: String, default: '' },
    code: { type: String, default: '' },
    afterCode: { type: String, default: '' },
    cta: { type: String, default: 'Shop Now' },

    // Announcement bar specific
    text: { type: String, default: '' },
    bgColor: { type: String, default: '#9A3412' },
    textColor: { type: String, default: '#ffffff' },

}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);
