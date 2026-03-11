const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Stripe = require('stripe');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect } = require('../middleware/authMiddleware');
const { sendOrderConfirmationEmails } = require('../utils/sendEmail');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
        } = req.body;

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
            orderStatus: 'pending',
        });

        const createdOrder = await order.save();

        // Create line items for Stripe
        const lineItems = orderItems.map((item) => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.name,
                    images: item.image ? [item.image] : [],
                    description: `Premium Silk Saree from Kumaran Silks`,
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

        try {
            // Create Stripe Checkout Session
            // Note: UPI automatically shows QR code for scanning
            const session = await stripe.checkout.sessions.create({
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
                },
                billing_address_collection: 'required',
                phone_number_collection: {
                    enabled: true,
                },
            });

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
                // Update order with payment details
                order.isPaid = true;
                order.paidAt = Date.now();
                order.orderStatus = 'confirmed';
                order.stripePaymentIntentId = session.payment_intent;
                order.paymentResult = {
                    id: session.payment_intent,
                    status: session.payment_status,
                    update_time: new Date().toISOString(),
                    email_address: session.customer_email || req.user.email,
                    method: 'card',
                };

                // Update product stock
                for (const item of order.orderItems) {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { countInStock: -item.qty },
                    });
                }

                const updatedOrder = await order.save();

                // Send confirmation emails 30 s after payment verified
                const customerEmail = session.customer_email || req.user?.email || null;
                sendOrderConfirmationEmails(updatedOrder, customerEmail, 30_000);

                res.json({
                    success: true,
                    order: updatedOrder,
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
    express.raw({ type: 'application/json' }),
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
                        order.isPaid = true;
                        order.paidAt = Date.now();
                        order.orderStatus = 'confirmed';
                        order.stripePaymentIntentId = session.payment_intent;
                        order.paymentResult = {
                            id: session.payment_intent,
                            status: 'paid',
                            update_time: new Date().toISOString(),
                            email_address: session.customer_email,
                            method: 'card',
                        };

                        // Update product stock
                        for (const item of order.orderItems) {
                            await Product.findByIdAndUpdate(item.product, {
                                $inc: { countInStock: -item.qty },
                            });
                        }

                        await order.save();
                        console.log(`Order ${orderId} marked as paid via webhook`);

                        // Send confirmation emails 30 s after webhook received
                        sendOrderConfirmationEmails(order, session.customer_email, 30_000);
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
