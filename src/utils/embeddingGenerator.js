import { pipeline } from '@xenova/transformers';

class EmbeddingGenerator {
    constructor(modelName = 'sentence-transformers/all-mpnet-base-v2', dimension = 768) {
        this.model = null;
        this.cache = new Map();
        this.modelName = modelName;
        this.dimension = dimension;
    }

    async initialize() {
        if (!this.model) {
            try {
                this.model = await pipeline('feature-extraction', this.modelName, {
                    quantized: false
                });
                console.log('Embedding model initialized successfully.');
            } catch (error) {
                console.error('Model initialization failed:', error);
                throw new Error('Cannot initialize embedding model');
            }
        }
        return this.model;
    }

    _createZeroVector() {
        return new Array(this.dimension).fill(0);
    }

    async generateEmbeddings(texts) {
        await this.initialize();

        return Promise.all(
            texts.map(async (text) => {
                if (!text || typeof text !== 'string' || text.trim() === '') {
                    return this._createZeroVector();
                }

                const processedText = text.toLowerCase().trim();

                if (this.cache.has(processedText)) {
                    return this.cache.get(processedText);
                }

                try {
                    const result = await this.model(processedText);
                    const embedding = Array.from(result.data);

                    this.cache.set(processedText, embedding);
                    return embedding;
                } catch (error) {
                    console.error('Embedding generation error:', error);
                    return this._createZeroVector();
                }
            })
        );
    }

    cosineSimilarity(vec1, vec2) {
        if (!vec1 || !vec2 || vec1.length !== vec2.length) {
            return 0;
        }

        const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
        const magnitude1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
        const magnitude2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));

        return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
    }
}

export default EmbeddingGenerator;