const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5176',
        'http://localhost:5175',
        'http://localhost:3000',
        process.env.CLIENT_URL,
        process.env.ADMIN_URL
    ].filter(Boolean),
    credentials: true
}));


// Parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/stripe', require('./routes/stripeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

// ... keep all your imports and app.use routes exactly as they are ...

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Consolidated Listen logic: Only runs locally, Vercel ignores this block
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running in development mode on port ${PORT}`);
    });
}

// CRITICAL: Export the app for Vercel's serverless handler
module.exports = app;