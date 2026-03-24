const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// ==================== DASHBOARD STATS ====================

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, asyncHandler(async (req, res) => {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Low stock products (less than 10)
    const lowStockProducts = await Product.countDocuments({ countInStock: { $lt: 10 } });

    // Recent orders
    const recentOrders = await Order.find({})
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);

    // Orders by status
    const pendingOrders = await Order.countDocuments({ isDelivered: false });
    const deliveredOrders = await Order.countDocuments({ isDelivered: true });
    const paidOrders = await Order.countDocuments({ isPaid: true });

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { $month: '$createdAt' },
                revenue: { $sum: '$totalPrice' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Category breakdown (products per category)
    const categoryBreakdown = await Product.aggregate([
        { $match: { category: { $ne: null, $ne: '' } } },
        { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$countInStock' } } },
        { $sort: { count: -1 } }
    ]);

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: todayStart } });
    const todayRevenueResult = await Order.aggregate([
        { $match: { isPaid: true, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

    res.json({
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
        lowStockProducts,
        pendingOrders,
        deliveredOrders,
        paidOrders,
        recentOrders,
        monthlyRevenue,
        categoryBreakdown,
        todayOrders,
        todayRevenue
    });
}));

// ==================== PRODUCT CRUD ====================

// @desc    Get all products (admin)
// @route   GET /api/admin/products
// @access  Private/Admin
router.get('/products', protect, admin, asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const keyword = req.query.keyword
        ? { name: { $regex: req.query.keyword, $options: 'i' } }
        : {};

    const total = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        products,
        page,
        pages: Math.ceil(total / limit),
        total
    });
}));

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
router.post('/products', protect, admin, asyncHandler(async (req, res) => {
    const {
        name,
        price,
        originalPrice,
        description,
        image,
        images,
        brand,
        category,
        countInStock,
        material,
        color,
        careInstructions,
        isFeatured
    } = req.body;

    const product = new Product({
        user: req.user._id,
        name,
        price,
        originalPrice: originalPrice || 0,
        description,
        image: image || '/images/sample.jpg',
        images: images || [],
        brand,
        category,
        countInStock: countInStock || 0,
        material,
        color,
        careInstructions,
        isFeatured: isFeatured || false,
        numReviews: 0,
        rating: 0
    });

    const createdProduct = await product.save();

    // Emit socket updates
    const io = req.app.get('socketio');
    if (io) {
        // For new products
        io.emit('productCreated', {
            id: createdProduct._id,
            name: createdProduct.name,
            category: createdProduct.category,
            price: createdProduct.price,
            originalPrice: createdProduct.originalPrice,
            image: createdProduct.image,
            images: createdProduct.images,
            countInStock: createdProduct.countInStock,
            description: createdProduct.description,
            isFeatured: createdProduct.isFeatured,
            createdAt: createdProduct.createdAt
        });
        
        // Also emit stock update for consistency
        io.emit('stockUpdate', {
            productId: createdProduct._id,
            countInStock: createdProduct.countInStock
        });
    }

    res.status(201).json(createdProduct);
}));

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
router.put('/products/:id', protect, admin, asyncHandler(async (req, res) => {
    const {
        name,
        price,
        originalPrice,
        description,
        image,
        images,
        brand,
        category,
        countInStock,
        material,
        color,
        careInstructions,
        isFeatured
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.price = price !== undefined ? price : product.price;
        product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
        product.description = description || product.description;
        product.image = image || product.image;
        product.images = images || product.images;
        product.brand = brand || product.brand;
        product.category = category || product.category;
        product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
        product.material = material || product.material;
        product.color = color || product.color;
        product.careInstructions = careInstructions || product.careInstructions;
        product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

        const updatedProduct = await product.save();

        // Emit socket update
        const io = req.app.get('socketio');
        if (io) {
            io.emit('stockUpdate', {
                productId: updatedProduct._id,
                countInStock: updatedProduct.countInStock
            });
        }

        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
router.delete('/products/:id', protect, admin, asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        const productId = product._id;
        await Product.deleteOne({ _id: req.params.id });
        
        // Emit socket deletion
        const io = req.app.get('socketio');
        if (io) {
            io.emit('productDeleted', { productId });
        }
        
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

// ==================== STOCK MANAGEMENT ====================

// @desc    Get low stock products
// @route   GET /api/admin/products/lowstock
// @access  Private/Admin
router.get('/products/lowstock', protect, admin, asyncHandler(async (req, res) => {
    const threshold = Number(req.query.threshold) || 10;
    const products = await Product.find({ countInStock: { $lt: threshold } })
        .sort({ countInStock: 1 });
    res.json(products);
}));

// @desc    Update product stock
// @route   PUT /api/admin/products/:id/stock
// @access  Private/Admin
router.put('/products/:id/stock', protect, admin, asyncHandler(async (req, res) => {
    const { countInStock, operation } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
        if (operation === 'add') {
            product.countInStock += countInStock;
        } else if (operation === 'subtract') {
            product.countInStock = Math.max(0, product.countInStock - countInStock);
        } else {
            product.countInStock = countInStock;
        }

        const updatedProduct = await product.save();

        // Emit socket update
        const io = req.app.get('socketio');
        if (io) {
            io.emit('stockUpdate', {
                productId: updatedProduct._id,
                countInStock: updatedProduct.countInStock
            });
        }

        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
}));

// @desc    Bulk update stock
// @route   PUT /api/admin/products/bulk-stock
// @access  Private/Admin
router.put('/products/bulk-stock', protect, admin, asyncHandler(async (req, res) => {
    const { updates } = req.body; // Array of { productId, countInStock }

    const results = await Promise.all(
        updates.map(async (update) => {
            const product = await Product.findById(update.productId);
            if (product) {
                product.countInStock = update.countInStock;
                return await product.save();
            }
            return null;
        })
    );

    const finalResults = results.filter(r => r !== null);

    // Emit socket updates for bulk
    const io = req.app.get('socketio');
    if (io) {
        finalResults.forEach(product => {
            io.emit('stockUpdate', {
                productId: product._id,
                countInStock: product.countInStock
            });
        });
    }

    res.json(finalResults);
}));

// ==================== USER MANAGEMENT ====================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        users,
        page,
        pages: Math.ceil(total / limit),
        total
    });
}));

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', protect, admin, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
router.put('/users/:id', protect, admin, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.isAdmin = req.body.isAdmin !== undefined ? req.body.isAdmin : user.isAdmin;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', protect, admin, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.isAdmin) {
            res.status(400);
            throw new Error('Cannot delete admin user');
        }
        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

// ==================== ORDER MANAGEMENT ====================

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
router.get('/orders', protect, admin, asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status === 'paid') filter.isPaid = true;
    if (req.query.status === 'unpaid') filter.isPaid = false;
    if (req.query.status === 'delivered') filter.isDelivered = true;
    if (req.query.status === 'pending') filter.isDelivered = false;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        orders,
        page,
        pages: Math.ceil(total / limit),
        total
    });
}));

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
router.get('/orders/:id', protect, admin, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
}));

// @desc    Update order to delivered
// @route   PUT /api/admin/orders/:id/deliver
// @access  Private/Admin
router.put('/orders/:id/deliver', protect, admin, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
}));

// @desc    Update order to paid
// @route   PUT /api/admin/orders/:id/pay
// @access  Private/Admin
router.put('/orders/:id/pay', protect, admin, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id || 'ADMIN_MARKED',
            status: 'COMPLETED',
            update_time: new Date().toISOString(),
            email_address: req.body.email_address || ''
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
}));

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put('/orders/:id/status', protect, admin, asyncHandler(async (req, res) => {
    const { orderStatus } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(orderStatus)) {
        res.status(400);
        throw new Error('Invalid order status');
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    order.orderStatus = orderStatus;

    if (orderStatus === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
    } else if (orderStatus === 'cancelled') {
        order.cancelledAt = Date.now();
        order.isDelivered = false;
    } else if (orderStatus === 'confirmed' || orderStatus === 'processing' || orderStatus === 'shipped' || orderStatus === 'pending') {
        order.isDelivered = false;
    }

    const updatedOrder = await order.save();

    // Emit socket update for order status
    const io = req.app.get('socketio');
    if (io) {
        io.emit('orderStatusUpdated', {
            orderId: updatedOrder._id,
            status: updatedOrder.orderStatus
        });
    }

    res.json(updatedOrder);
}));

// @desc    Delete order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
router.delete('/orders/:id', protect, admin, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        await Order.deleteOne({ _id: req.params.id });
        res.json({ message: 'Order removed' });
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
}));

module.exports = router;
