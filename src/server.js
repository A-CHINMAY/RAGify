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

const app = express();
app.set('trust proxy', 1); // Trust first proxy - important for Render

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure the cache directory exists for transformers library
const cacheDir = path.join(__dirname, 'node_modules/@xenova/transformers/.cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

// Simplified CORS configuration
app.use(cors({
    origin: ['https://ragify.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Modified Helmet configuration to allow connection from Vercel
app.use(
    helmet({
        contentSecurityPolicy: false, // Disable CSP temporarily
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: NODE_ENV === 'production' ? 15 * 60 * 1000 : 30 * 60 * 1000,
    max: NODE_ENV === 'production' ? 100 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Rate limit exceeded. Please try again later.',
});
app.use('/api/', limiter);

// Middleware Configurations
app.use(
    express.json({
        limit: process.env.PAYLOAD_LIMIT || '10mb',
        strict: true,
    })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conditional Logging
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Serve Static Files (Optional for API-only backend)
app.use(
    express.static(path.join(__dirname, 'public'), {
        maxAge: NODE_ENV === 'production' ? '1d' : '1h',
        etag: true,
        lastModified: true,
    })
);

// Chat Controller Initialization
const chatController = new ChatController();
await chatController.initializeIfNeeded().catch(console.error);

// API Routes
app.post('/api/chat', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://ragify.vercel.app');
    try {
        await chatController.handleChatRequest(req, res);
    } catch (error) {
        console.error('Chat request error:', error);
        res.status(500).json({ error: 'Chat processing failed' });
    }
});

app.get('/api/health', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://ragify.vercel.app');
    res.json({
        status: 'healthy',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// Favicon Handling
app.get('/favicon.ico', (req, res) => res.status(204));

// Error Handling Middleware
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
        error: 'Server Error',
        message: NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    });
});

// Server Initialization
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${NODE_ENV})`);
});

// Graceful Shutdown Handlers
['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
        console.log(`${signal} received: closing server`);
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});

// Unhandled Error Handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

export default app;