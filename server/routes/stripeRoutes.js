const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Stripe = require('stripe');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmails } = require('../utils/sendEmail');
const {
    calculateLoyaltyPoints,
    parsePointsUsed,
    resolveUserForRewards,
} = require('../utils/loyaltyPoints');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const finalizePaidOrder = async ({ req, order, paymentIntentId, customerEmail, customerName, amountPaid, rewardsUserId }) => {
    if (!order || order.isPaid) {
        return order;
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
    order.stripePaymentIntentId = paymentIntentId;
    order.paymentResult = {
        id: paymentIntentId,
        status: 'paid',
        update_time: new Date().toISOString(),
        email_address: customerEmail,
        method: 'card',
    };

    const paidAmount = Number.isFinite(Number(amountPaid)) ? Number(amountPaid) : Number(order.totalPrice || 0);
    const pointsEarned = calculateLoyaltyPoints(paidAmount);
    order.pointsEarned = pointsEarned;

    const userDoc = await resolveUserForRewards({
        userId: rewardsUserId,
        email: customerEmail,
        fallbackUserId: order.user,
    });

    if (userDoc) {
        if (order.pointsUsed > 0) {
            userDoc.loyaltyPoints = Math.max(userDoc.loyaltyPoints - order.pointsUsed, 0);
            userDoc.lifetimeUsedPoints += order.pointsUsed;
        }

        userDoc.loyaltyPoints += pointsEarned;
        userDoc.lifetimeEarnedPoints += pointsEarned;
        await userDoc.save();
    }

    const io = req.app.get('socketio');
    for (const item of order.orderItems) {
        const updatedProduct = await Product.findByIdAndUpdate(item.product, {
            $inc: { countInStock: -item.qty },
        }, { new: true });

        if (io && updatedProduct) {
            io.emit('stockUpdate', {
                productId: updatedProduct._id,
                countInStock: updatedProduct.countInStock,
            });
        }
    }

    await order.save();

    if (io) {
        io.emit('orderCreated', {
            id: order._id,
            orderId: order._id.toString().slice(-8).toUpperCase(),
            customerName: customerName || 'Guest',
            amount: order.totalPrice,
            status: 'Confirmed',
        });
    }

    sendOrderConfirmationEmails(order, customerEmail, 30_000);
    return order;
};

// ============================================
// STRIPE PAYMENT ROUTES
// ============================================

// @desc    Get Stripe Public Key
// @route   GET /api/stripe/config
// @access  Public
router.get('/config', (req, res) => {
    res.json({
        publicKey: process.env.STRIPE_PUBLIC_KEY,
    });
});

// @desc    Create Stripe Checkout Session
// @route   POST /api/stripe/create-checkout-session
// @access  Private
router.post(
    '/create-checkout-session',
    protect,
    asyncHandler(async (req, res) => {
        const {
            orderItems,
            shippingAddress,
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
            throw new Error('No order items provided');
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

        // Validate loyalty points. Deduction happens only after successful payment.
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

        // Create order in database with pending status
        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod: 'stripe',
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            couponCode: couponCode || null,
            couponDiscount: couponDiscount || 0,
            coupon: couponId || null,
            pointsUsed: parsedPoints.value,
            orderStatus: 'pending',
        });

        const createdOrder = await order.save();

        // Create line items for Stripe
        const lineItems = orderItems.map((item) => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.name,
                    images: (item.image && item.image.startsWith('http')) ? [item.image] : [],
                    description: `Premium Silk Saree from SriKumaranSilks`,
                },
                unit_amount: Math.round(item.price * 100), // Convert to paise
            },
            quantity: item.qty,
        }));

        // Add shipping as a line item if not free
        if (shippingPrice > 0) {
            lineItems.push({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'Shipping & Handling',
                        description: 'Standard delivery',
                    },
                    unit_amount: Math.round(shippingPrice * 100),
                },
                quantity: 1,
            });
        }

        // Add tax as a line item
        if (taxPrice > 0) {
            lineItems.push({
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: 'GST (5%)',
                        description: 'Goods and Services Tax',
                    },
                    unit_amount: Math.round(taxPrice * 100),
                },
                quantity: 1,
            });
        }

        // Calculate total discount from coupons and points
        let stripeCouponId = null;
        const totalDiscount = (couponDiscount || 0) + parsedPoints.value;

        if (totalDiscount > 0) {
            try {
                // Dynamically create a 1-time Stripe coupon for the exact discount amount
                const stripeCoupon = await stripe.coupons.create({
                    amount_off: Math.round(totalDiscount * 100), // convert to paise
                    currency: 'inr',
                    duration: 'once',
                    name: `Discount (${couponCode ? 'Coupon' : ''}${couponCode && parsedPoints.value ? ' + ' : ''}${parsedPoints.value ? 'Points' : ''})`,
                });
                stripeCouponId = stripeCoupon.id;
            } catch (err) {
                console.error("Failed to create Stripe discount coupon:", err);
            }
        }

        try {
            // Create Stripe Checkout Session
            // Note: UPI automatically shows QR code for scanning
            const sessionConfig = {
                payment_method_types: ['card', 'link'],
                payment_method_options: {
                    card: {
                        request_three_d_secure: 'automatic',
                    },
                },
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${createdOrder._id}`,
                cancel_url: `${process.env.CLIENT_URL}/payment-failed?order_id=${createdOrder._id}`,
                customer_email: req.user.email,
                metadata: {
                    orderId: createdOrder._id.toString(),
                    userId: req.user._id.toString(),
                    pointsUsed: parsedPoints.value.toString(),
                },
                billing_address_collection: 'required',
                phone_number_collection: {
                    enabled: true,
                },
            };

            if (stripeCouponId) {
                sessionConfig.discounts = [{ coupon: stripeCouponId }];
            }

            const session = await stripe.checkout.sessions.create(sessionConfig);

            // Update order with Stripe session ID
            createdOrder.stripeSessionId = session.id;
            await createdOrder.save();

            // Increment coupon usedCount if a coupon was applied
            if (couponId) {
                await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
            }

            res.status(201).json({
                order: createdOrder,
                sessionId: session.id,
                sessionUrl: session.url,
            });
        } catch (stripeError) {
            // Delete the order if Stripe session creation fails
            await Order.findByIdAndDelete(createdOrder._id);
            console.error('Stripe Error:', stripeError);
            res.status(500);
            throw new Error(`Payment initialization failed: ${stripeError.message}`);
        }
    })
);

// @desc    Verify Stripe Payment (after redirect from checkout)
// @route   POST /api/stripe/verify-session
// @access  Private
router.post(
    '/verify-session',
    protect,
    asyncHandler(async (req, res) => {
        const { sessionId, orderId } = req.body;

        if (!sessionId || !orderId) {
            res.status(400);
            throw new Error('Session ID and Order ID are required');
        }

        const order = await Order.findById(orderId);

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Verify the session belongs to this order
        if (order.stripeSessionId !== sessionId) {
            res.status(400);
            throw new Error('Session ID does not match order');
        }

        try {
            // Retrieve the session from Stripe
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            if (session.payment_status === 'paid') {
                // If webhook hasn't already processed it
                if (!order.isPaid) {
                    await finalizePaidOrder({
                        req,
                        order,
                        paymentIntentId: session.payment_intent,
                        customerEmail: session.customer_email || req.user?.email || null,
                        customerName: req.user?.name || 'Guest',
                        amountPaid: (session.amount_total || 0) / 100,
                        rewardsUserId: session.metadata?.userId,
                    });
                } // End if (!order.isPaid)

                res.json({
                    success: true,
                    order: order,
                    message: 'Payment verified successfully',
                });
            } else {
                res.status(400);
                throw new Error('Payment not completed');
            }
        } catch (stripeError) {
            console.error('Stripe verification error:', stripeError);
            res.status(500);
            throw new Error(`Payment verification failed: ${stripeError.message}`);
        }
    })
);

// @desc    Stripe Webhook Handler
// @route   POST /api/stripe/webhook
// @access  Public (webhook from Stripe)
router.post(
    '/webhook',
    asyncHandler(async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const orderId = session.metadata.orderId;

                if (orderId) {
                    const order = await Order.findById(orderId);
                    if (order && !order.isPaid) {
                        await finalizePaidOrder({
                            req,
                            order,
                            paymentIntentId: session.payment_intent,
                            customerEmail: session.customer_email || null,
                            customerName: session.customer_details?.name || 'Guest',
                            amountPaid: (session.amount_total || 0) / 100,
                            rewardsUserId: session.metadata?.userId,
                        });

                        console.log(`Order ${orderId} marked as paid via webhook`);
                    }
                }
                break;
            }

            case 'checkout.session.expired': {
                const session = event.data.object;
                const orderId = session.metadata.orderId;

                if (orderId) {
                    const order = await Order.findById(orderId);
                    if (order && !order.isPaid && order.orderStatus === 'pending') {
                        order.orderStatus = 'cancelled';
                        order.cancelledAt = Date.now();
                        order.cancellationReason = 'Payment session expired';
                        await order.save();

                        console.log(`Order ${orderId} cancelled due to expired session`);
                    }
                }
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                console.log('Payment failed:', paymentIntent.id);
                // Could add order cancellation logic here if needed
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    })
);

// @desc    Create Payment Intent (for Stripe Elements - alternative method)
// @route   POST /api/stripe/create-payment-intent
// @access  Private
router.post(
    '/create-payment-intent',
    protect,
    asyncHandler(async (req, res) => {
        const { amount, orderId } = req.body;

        if (!amount || amount <= 0) {
            res.status(400);
            throw new Error('Valid amount is required');
        }

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to paise
                currency: 'inr',
                metadata: {
                    orderId: orderId || '',
                    userId: req.user._id.toString(),
                },
            });

            res.json({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            });
        } catch (stripeError) {
            console.error('Stripe Error:', stripeError);
            res.status(500);
            throw new Error(`Failed to create payment intent: ${stripeError.message}`);
        }
    })
);

module.exports = router;
