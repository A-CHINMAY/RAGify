import RAGService from '../services/ragService.js';
import DocumentLoader from '../utils/documentLoader.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

class ChatController {
    constructor() {
        this.ragService = new RAGService();
        this.isInitialized = false;
        this.documentsPath = path.resolve(
            path.dirname(fileURLToPath(import.meta.url)),
            '../../data/documents'
        );
    }

    async loadQAData() {
        try {
            const qaDataPath = path.resolve(this.documentsPath, 'qaData.json');
            const data = await fs.readFile(qaDataPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('QA data loading error:', error);
            return [];
        }
    }

    async initializeIfNeeded() {
        if (this.isInitialized) return;

        try {
            const qaData = await this.loadQAData();
            const documents = [{
                id: 'qaData',
                chunks: qaData.map(item => item.question)
            }];

            await this.ragService.initialize(documents);
            this.ragService.qaData = qaData; // Restore original QA data

            this.isInitialized = true;
            console.log('RAG service initialized with QA data');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.isInitialized = false;
        }
    }

    async handleChatRequest(req, res) {
        try {
            await this.initializeIfNeeded();

            const { query } = req.body;
            if (!query) {
                return res.status(400).json({ error: 'Query is required.' });
            }

            const response = await this.ragService.generateResponse(query);

            res.json({ response });
        } catch (error) {
            console.error('Chat request error:', error);
            res.status(500).json({ error: 'Failed to process request' });
        }
    }
}

export default ChatController;