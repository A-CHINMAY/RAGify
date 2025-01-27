import RAGService from '../services/ragService.js';
import DocumentLoader from '../utils/documentLoader.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

class ChatController {
    constructor() {
        this.ragService = null; // Lazy initialize
        this.isInitialized = false;
        this.documentsPath = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            '../../src/data/documents'
        );
        this.qaData = null; // Store QA data separately
    }

    async loadQAData() {
        if (this.qaData) return this.qaData;

        try {
            const qaDataPath = path.resolve(this.documentsPath, 'qaData.json');
            const data = await fs.readFile(qaDataPath, 'utf-8');
            this.qaData = JSON.parse(data);
            return this.qaData;
        } catch (error) {
            console.error('QA data loading error:', error);
            return [];
        }
    }

    async initializeIfNeeded() {
        if (this.isInitialized) return;

        try {
            const qaData = await this.loadQAData();

            // Initialize RAG service only when needed
            if (!this.ragService) {
                this.ragService = new RAGService();

                const documents = [{
                    id: 'qaData',
                    chunks: qaData.map(item => item.question)
                }];

                await this.ragService.initialize(documents);
            }

            this.isInitialized = true;
            console.log('RAG service initialized with QA data');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    async handleChatRequest(req, res) {
        try {
            const { query } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required.' });
            }

            // Ensure initialization
            if (!this.isInitialized || !this.ragService) {
                await this.initializeIfNeeded();
            }

            const response = await this.ragService.generateResponse(query);
            res.json({ response });

        } catch (error) {
            console.error('Chat request error:', error);
            res.status(500).json({ error: 'Failed to process request' });
        }
    }

    // Method to clean up resources
    cleanup() {
        if (this.ragService) {
            this.ragService.cleanup && this.ragService.cleanup();
            this.ragService = null;
        }
        this.isInitialized = false;
    }
}

export default ChatController;