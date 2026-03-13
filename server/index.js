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
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:5176',
            'http://localhost:5177',
            'http://localhost:5178',
            'http://localhost:5179',
            'http://localhost:5180',
            'http://localhost:3000',
            process.env.CLIENT_URL,
            process.env.ADMIN_URL
        ].filter(Boolean);
        
        const isVercel = origin && (origin.endsWith('.vercel.app') || origin === 'https://sri-kumaran-silks-admin-neon.vercel.app');
        const isLocal = !origin || origin.startsWith('http://localhost:') || allowedOrigins.includes(origin);

        if (isLocal || isVercel) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));


// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Export the app for Vercel
module.exports = app;

// WebSocket setup for local development / persistent servers
if (process.env.NODE_ENV !== 'production') {
    const http = require('http');
    const { Server } = require('socket.io');
    
    const server = http.createServer(app);
    console.log('Initializing Socket.io...');
    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || origin.startsWith('http://localhost:') || origin === process.env.CLIENT_URL || origin === process.env.ADMIN_URL) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true
        }
    });

    // Make io accessible in routes
    app.set('socketio', io);

    io.on('connection', (socket) => {
        console.log(`Socket Connected: ${socket.id}`);
        
        socket.on('disconnect', () => {
            console.log(`Socket Disconnected: ${socket.id}`);
        });
    });

    // Heartbeat to keep connection alive and verify server is running
    setInterval(() => {
        const connectedCount = io.engine.clientsCount;
        if (connectedCount > 0) {
            console.log(`Live Socket Connections: ${connectedCount}`);
        }
    }, 60000);

    server.listen(PORT, () => {
        console.log(`Server running in development mode on port ${PORT}`);
    });
}