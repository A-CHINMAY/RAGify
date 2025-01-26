import EmbeddingGenerator from '../utils/embeddingGenerator.js';

class RAGService {
    constructor(similarityThreshold = 0.5) {
        this.embeddingGenerator = new EmbeddingGenerator();
        this.qaData = [];
        this.qaEmbeddings = [];
        this.similarityThreshold = similarityThreshold;
    }

    async initialize(documents) {
        try {
            await this.embeddingGenerator.initialize();

            // Load QA data directly if passed as parameter
            this.qaData = documents.length > 0
                ? documents.flatMap(doc =>
                    doc.chunks.map(chunk => ({
                        question: chunk,
                        answer: doc.id
                    }))
                )
                : require('../data/qaData.json'); // Fallback to JSON import

            // Generate embeddings for questions
            this.qaEmbeddings = await this.embeddingGenerator.generateEmbeddings(
                this.qaData.map(qa => qa.question)
            );
        } catch (error) {
            console.error('RAG initialization error:', error);
        }
    }

    async generateResponse(query) {
        try {
            const [queryEmbedding] = await this.embeddingGenerator.generateEmbeddings([query]);

            const similarities = this.qaEmbeddings.map((embedding, index) => ({
                similarity: this.embeddingGenerator.cosineSimilarity(queryEmbedding, embedding),
                index
            }));

            similarities.sort((a, b) => b.similarity - a.similarity);

            const topMatches = similarities.filter(match =>
                match.similarity >= this.similarityThreshold
            );

            if (topMatches.length > 0) {
                const bestMatchIndex = topMatches[0].index;
                return this.qaData[bestMatchIndex].answer;
            }

            // Fallback to partial matching
            const partialMatches = this.qaData.filter(qa =>
                query.toLowerCase().includes(qa.question.toLowerCase()) ||
                qa.question.toLowerCase().includes(query.toLowerCase())
            );

            return partialMatches.length > 0
                ? partialMatches[0].answer
                : "I couldn't find a precise answer to your question.";

        } catch (error) {
            console.error('Response generation error:', error);
            return 'Unable to generate a response.';
        }
    }
}

export default RAGService;