const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Promotion = require('../models/Promotion');
const { protect, admin } = require('../middleware/authMiddleware');

// Default seed data - used when DB is empty
const DEFAULT_PROMOTIONS = [
    {
        type: 'hero_banner', order: 0, isActive: true,
        image: 'https://www.kumaransilksonline.com/cdn/shop/articles/Significance-of-the-Peacock-Motif-in-Kanchipuram-Silk-Sarees_047b739c-5831-4421-9ec2-8dd96f442a2e.jpg?v=1766576608&width=1024',
        subtitle: 'Handwoven Excellence', title: 'Timeless Elegance of Silk',
        description: 'Explore our exclusive collection of Kanchipuram and Banarasi sarees, woven with tradition and passion.',
        link: '/products?category=Kanchipuram'
    },
    {
        type: 'hero_banner', order: 1, isActive: true,
        image: 'https://2.wlimg.com/product_images/bc-full/2021/2/1818401/golden-bridal-silk-sarees-1614519409-5737874.jpeg',
        subtitle: 'Royal Banarasi Collection', title: 'Weaving Stories in Gold',
        description: 'Adorn yourself with the intricate artistry of Banarasi silk, perfect for weddings and festivities.',
        link: '/products?category=Banarasi'
    },
    {
        type: 'hero_banner', order: 2, isActive: true,
        image: 'https://www.palamsilk.com/cdn/shop/files/DSC_6450_1024x1024.jpg?v=1685651913',
        subtitle: 'Contemporary Soft Silk', title: 'Modern Grace & Comfort',
        description: 'Experience the perfect blend of tradition and comfort with our lightweight soft silk collection.',
        link: '/products?category=Soft Silk'
    },
    {
        type: 'promo_slide', order: 0, isActive: true,
        tag: 'Limited Offer', title: 'Get 20% Off Your First Order',
        subtitle: 'Use code', code: 'SILK20', afterCode: 'at checkout',
        cta: 'Shop Now', link: '/products'
    },
    {
        type: 'promo_slide', order: 1, isActive: true,
        tag: 'New Arrivals', title: 'The Royal Kanchipuram Collection',
        subtitle: 'Explore', code: 'NEW50', afterCode: 'exclusive designs',
        cta: 'Explore Now', link: '/products?category=Kanchipuram'
    },
    {
        type: 'promo_slide', order: 2, isActive: true,
        tag: 'Free Shipping', title: 'Complimentary Global Delivery',
        subtitle: 'On orders above', code: '₹2000', afterCode: 'across India',
        cta: 'Buy Now', link: '/products'
    },
    {
        type: 'announcement', order: 0, isActive: true,
        text: '🎉 Free Shipping on Orders Above ₹2,000 | Use code SILK20 for 20% off your first order!',
        bgColor: '#9A3412', textColor: '#ffffff', link: '/products'
    }
];

// ── PUBLIC ROUTES ─────────────────────────────────────────────────────────────

// @desc  Get all active promotions (public)
// @route GET /api/promotions
router.get('/', asyncHandler(async (req, res) => {
    let promotions = await Promotion.find({ isActive: true }).sort({ type: 1, order: 1 });
    
    // Seed defaults if DB is empty
    if (promotions.length === 0) {
        await Promotion.insertMany(DEFAULT_PROMOTIONS);
        promotions = await Promotion.find({ isActive: true }).sort({ type: 1, order: 1 });
    }

    // Group by type for convenient consumption
    const result = {
        hero_banners: promotions.filter(p => p.type === 'hero_banner'),
        promo_slides: promotions.filter(p => p.type === 'promo_slide'),
        announcements: promotions.filter(p => p.type === 'announcement'),
    };
    res.json(result);
}));

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────────

// @desc  Get ALL promotions (admin, including inactive)
// @route GET /api/promotions/admin/all
router.get('/admin/all', protect, admin, asyncHandler(async (req, res) => {
    let promotions = await Promotion.find({}).sort({ type: 1, order: 1 });
    if (promotions.length === 0) {
        await Promotion.insertMany(DEFAULT_PROMOTIONS);
        promotions = await Promotion.find({}).sort({ type: 1, order: 1 });
    }
    res.json(promotions);
}));

// @desc  Create promotion
// @route POST /api/promotions
router.post('/', protect, admin, asyncHandler(async (req, res) => {
    const promo = new Promotion(req.body);
    const saved = await promo.save();
    res.status(201).json(saved);
}));

// @desc  Update promotion
// @route PUT /api/promotions/:id
router.put('/:id', protect, admin, asyncHandler(async (req, res) => {
    const promo = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) { res.status(404); throw new Error('Promotion not found'); }
    res.json(promo);
}));

// @desc  Delete promotion
// @route DELETE /api/promotions/:id
router.delete('/:id', protect, admin, asyncHandler(async (req, res) => {
    const promo = await Promotion.findById(req.params.id);
    if (!promo) { res.status(404); throw new Error('Promotion not found'); }
    await promo.deleteOne();
    res.json({ message: 'Promotion removed' });
}));

module.exports = router;
