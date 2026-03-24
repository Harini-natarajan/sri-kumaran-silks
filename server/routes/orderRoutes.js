const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmails } = require('../utils/sendEmail');
const { calculateLoyaltyPoints, parsePointsUsed } = require('../utils/loyaltyPoints');

// ============================================
// STATIC ROUTES (must come before dynamic :id routes)
// ============================================

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get(
    '/myorders',
    protect,
    asyncHandler(async (req, res) => {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    })
);

// @desc    Track order
// @route   POST /api/orders/track
// @access  Public
router.post(
    '/track',
    asyncHandler(async (req, res) => {
        const { orderId, email } = req.body;

        if (!orderId || !email) {
            res.status(400);
            throw new Error('Please provide Order ID and Email');
        }

        let order;

        // Clean the orderId - remove # if present and convert to lowercase for matching
        const cleanOrderId = orderId.replace(/^#/, '').trim();

        // Check if input is a valid ObjectId (24 hex chars)
        if (cleanOrderId.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(cleanOrderId).populate('user', 'email');
        } else if (cleanOrderId.match(/^[0-9a-fA-F]{8}$/i)) {
            // Short order ID (last 8 characters) - search by regex matching end of _id
            const orders = await Order.find().populate('user', 'email');
            order = orders.find(o =>
                o._id.toString().toLowerCase().endsWith(cleanOrderId.toLowerCase())
            );
        } else {
            // Try searching by carrier tracking number
            order = await Order.findOne({
                'trackingDetails.trackingId': orderId
            }).populate('user', 'email');
        }

        if (order) {
            // Verify email matches the user who placed the order
            // Note: If guest checkout was implemented without creating User, we check shipping address email? 
            // Current system creates User (or assumes logged in). schema has user ref.

            const userEmail = order.user ? order.user.email : null;
            // Also check paymentResult email as fallback?

            if (userEmail && userEmail.toLowerCase() === email.toLowerCase()) {
                res.json({
                    _id: order._id,
                    orderStatus: order.orderStatus,
                    items: order.orderItems, // Show items summary
                    totalPrice: order.totalPrice,
                    isPaid: order.isPaid,
                    trackingDetails: order.trackingDetails || {},
                    createdAt: order.createdAt
                });
            } else {
                res.status(404); // Don't reveal existence
                throw new Error('Order not found or email does not match');
            }
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    })
);

// @desc    Create new COD order
// @route   POST /api/orders
// @access  Private
router.post(
    '/',
    protect,
    asyncHandler(async (req, res) => {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            couponCode,
            couponDiscount,
            couponId,
            pointsUsed,
        } = req.body;

        const parsedPoints = parsePointsUsed(pointsUsed);
        if (!parsedPoints.ok) {
            res.status(400);
            throw new Error(parsedPoints.message);
        }

        if (!orderItems || orderItems.length === 0) {
            res.status(400);
            throw new Error('No order items');
        }

        // Validate stock availability
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404);
                throw new Error(`Product not found: ${item.name}`);
            }
            if (product.countInStock < item.qty) {
                res.status(400);
                throw new Error(`Insufficient stock for ${item.name}. Available: ${product.countInStock}`);
            }
        }

        // Validate loyalty points. Deduction is done only after successful order creation.
        if (parsedPoints.value > 0) {
            const userDoc = await User.findById(req.user._id);
            if (!userDoc || userDoc.loyaltyPoints < parsedPoints.value) {
                res.status(400);
                throw new Error('Insufficient loyalty points');
            }

            if (parsedPoints.value > Math.floor(totalPrice || 0)) {
                res.status(400);
                throw new Error('Points used cannot exceed payable total');
            }
        }

        // Create order in database
        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            couponCode: couponCode || null,
            couponDiscount: couponDiscount || 0,
            coupon: couponId || null,
            pointsUsed: parsedPoints.value,
            orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
        });

        const createdOrder = await order.save();

        // For COD orders, update stock immediately and award points immediately
        if (paymentMethod === 'cod') {
            const pointsEarned = calculateLoyaltyPoints(createdOrder.totalPrice);
            createdOrder.pointsEarned = pointsEarned;
            await createdOrder.save();

            const userDoc = await User.findById(req.user._id);
            if (userDoc) {
                if (parsedPoints.value > 0) {
                    userDoc.loyaltyPoints = Math.max(userDoc.loyaltyPoints - parsedPoints.value, 0);
                    userDoc.lifetimeUsedPoints += parsedPoints.value;
                }
                userDoc.loyaltyPoints += pointsEarned;
                userDoc.lifetimeEarnedPoints += pointsEarned;
                await userDoc.save();
            }

            const io = req.app.get('socketio');
            for (const item of orderItems) {
                const updatedProduct = await Product.findByIdAndUpdate(item.product, {
                    $inc: { countInStock: -item.qty },
                }, { new: true });

                if (io && updatedProduct) {
                    io.emit('stockUpdate', {
                        productId: updatedProduct._id,
                        countInStock: updatedProduct.countInStock
                    });
                }
            }
        }

        // Increment coupon usedCount if a coupon was applied
        if (couponId) {
            await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
        }

        res.status(201).json({
            order: createdOrder,
        });

        // Emit socket update for new order
        const io = req.app.get('socketio');
        if (io) {
            io.emit('orderCreated', {
                id: createdOrder._id,
                orderId: createdOrder._id.toString().slice(-8).toUpperCase(),
                customerName: req.user?.name || 'Guest',
                amount: createdOrder.totalPrice,
                status: 'Confirmed'
            });
        }

        // Send confirmation emails after 30 seconds
        // (non-blocking – runs after response is sent)
        const customerEmail = req.user?.email || null;
        sendOrderConfirmationEmails(createdOrder, customerEmail, 30_000);
    })
);

// ============================================
// DYNAMIC ROUTES (with :id parameter)
// ============================================

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put(
    '/:id/cancel',
    protect,
    asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Only allow cancellation of pending or confirmed orders
        if (order.orderStatus !== 'pending' && order.orderStatus !== 'confirmed') {
            res.status(400);
            throw new Error('Cannot cancel order that is already being processed');
        }

        // Note: For Stripe refunds, you would need to implement refund logic here
        // using stripe.refunds.create() if needed

        order.orderStatus = 'cancelled';
        order.cancelledAt = Date.now();
        order.cancellationReason = req.body.reason || 'Cancelled by user';

        // Restore stock if order was confirmed/paid
        if (order.isPaid || order.paymentMethod === 'cod') {
            const io = req.app.get('socketio');
            for (const item of order.orderItems) {
                const updatedProduct = await Product.findByIdAndUpdate(item.product, {
                    $inc: { countInStock: item.qty },
                }, { new: true });

                if (io && updatedProduct) {
                    io.emit('stockUpdate', {
                        productId: updatedProduct._id,
                        countInStock: updatedProduct.countInStock
                    });
                }
            }
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    })
);

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get(
    '/:id',
    protect,
    asyncHandler(async (req, res) => {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (order) {
            // Make sure user can only access their own orders (unless admin)
            if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
                res.status(403);
                throw new Error('Not authorized to view this order');
            }
            res.json(order);
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    })
);

module.exports = router;
