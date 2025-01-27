import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ChatController from './controllers/chatController.js';
import dotenv from 'dotenv';
import morgan from 'morgan';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memory usage monitoring
const logMemoryUsage = () => {
    const used = process.memoryUsage();
    console.log('Memory usage:');
    for (let key in used) {
        console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
};

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(cors({
    origin: ['https://ragify.vercel.app'],  // Allow specific origin
    methods: ['GET', 'POST', 'OPTIONS'],   // Allow GET, POST, OPTIONS methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers in the request
    credentials: true                      // Allow credentials if needed
}));

// Handle the OPTIONS preflight request
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);  // Allow dynamic origin
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow specific methods
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow specific headers
    res.header('Access-Control-Allow-Credentials', 'true'); // Allow credentials if needed
    res.send();
});

// Lightweight Helmet config
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
}));

// Memory-conscious rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Reduced from 100 to 50 for free tier
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', limiter);

// Reduced payload limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Conditional logging only in development
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Initialize chat controller with lazy loading
let chatController = null;

// Lazy initialize controller only when needed
const getChatController = async () => {
    if (!chatController) {
        chatController = new ChatController();
        await chatController.initializeIfNeeded();
    }
    return chatController;
};

// API Routes with memory management
app.post('/api/chat', async (req, res) => {
    try {
        const controller = await getChatController();
        await controller.handleChatRequest(req, res);

        // Log memory usage after each request in production
        if (NODE_ENV === 'production') {
            logMemoryUsage();
        }
    } catch (error) {
        console.error('Chat request error:', error);
        res.status(500).json({ error: 'Chat processing failed' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        environment: NODE_ENV,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 + 'MB'
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Server Error',
        message: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    });
});

// Server initialization
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${NODE_ENV})`);
    logMemoryUsage();
});

// Graceful shutdown with memory cleanup
const cleanup = () => {
    if (chatController) {
        // Add cleanup logic for transformers if needed
        chatController = null;
    }
    global.gc && global.gc(); // Force garbage collection if available
};

['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
        console.log(`${signal} received: closing server`);
        cleanup();
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});

export default app;