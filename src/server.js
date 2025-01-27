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
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure the cache directory exists for transformers library
const cacheDir = path.join(__dirname, 'node_modules/@xenova/transformers/.cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
}

// Enhanced Security Middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    })
);

// More Dynamic Rate Limiting
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
        limit: process.env.PAYLOAD_LIMIT || '10kb',
        strict: true,
    })
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS with Dynamic Origin Configuration
const allowedOrigins = {
    production: ['https://ragify.vercel.app', 'https://ragify-a-chinmays-projects.vercel.app'],
    development: ['http://localhost:3000', 'http://127.0.0.1:5500'],
};

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins[NODE_ENV].includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Conditional Logging
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Chat Controller Initialization
const chatController = new ChatController();
chatController.initializeIfNeeded().catch(console.error);

// API Routes
app.post('/api/chat', async (req, res) => {
    try {
        await chatController.handleChatRequest(req, res);
    } catch (error) {
        console.error('Chat request error:', error);
        res.status(500).json({ error: 'Chat processing failed' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// Redirect Root to Frontend
app.get('/', (req, res) => {
    res.redirect('https://ragify.vercel.app'); // Update with your Vercel frontend URL
});

// Favicon Handling (Optional)
app.get('/favicon.ico', (req, res) => res.status(204));

// Error Handling Middleware
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    console.error('Error stack:', err.stack); // Log the stack trace for more insight
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
