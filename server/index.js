const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

connectDB();

const app = express();

// CORS configuration
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

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                         origin.startsWith('http://localhost:') || 
                         origin.endsWith('.vercel.app');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.error(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
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
app.use('/api/promotions', require('./routes/promotionRoutes'));

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

    const basePort = Number(PORT) || 5000;
    const maxPortAttempts = 10;

    const startServerWithFallback = (port, attemptsLeft) => {
        const onError = (error) => {
            if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
                const nextPort = port + 1;
                console.warn(`Port ${port} is in use. Retrying on ${nextPort}...`);
                startServerWithFallback(nextPort, attemptsLeft - 1);
                return;
            }

            console.error('Failed to start server:', error);
            process.exit(1);
        };

        server.once('error', onError);

        server.listen(port, () => {
            server.off('error', onError);
            console.log(`Server running in development mode on port ${port}`);
        });
    };

    startServerWithFallback(basePort, maxPortAttempts);
}