import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import ChatController from './controllers/chatController.js';
import dotenv from 'dotenv';
import morgan from 'morgan';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enhanced Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
        }
    }
}));

// Rate Limiting - Simplified
const limiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 500, // Reasonable limit for local development
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Rate limit exceeded. Please try again later.',
});
app.use('/api/', limiter);

// Middleware Configurations
app.use(express.json({
    limit: process.env.PAYLOAD_LIMIT || '10kb',
    strict: true
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Enable CORS for all origins - simplified
app.use(cors());
console.log('CORS enabled for all origins');

// Logging
app.use(morgan('dev'));

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
        timestamp: new Date().toISOString()
    });
});

// Error Handling Middleware
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Server Error',
        message: err.message
    });
});

// Server Initialization
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful Shutdown Handlers
['SIGTERM', 'SIGINT'].forEach(signal => {
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