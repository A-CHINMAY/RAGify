import EmbeddingGenerator from './embeddingGenerator.js';

class VectorStore {
    constructor(embeddingDimension = 768) {
        this.index = [];
        this.embeddingGenerator = new EmbeddingGenerator();
        this.embeddingDimension = embeddingDimension;
    }

    async indexDocuments(documents) {
        try {
            await this.embeddingGenerator.initialize();

            for (const doc of documents) {
                const chunks = doc.chunks || [doc];

                if (chunks.length === 0) continue;

                const vectors = await this.embeddingGenerator.generateEmbeddings(chunks);

                this.index.push({
                    document: doc,
                    vectors: vectors
                });
            }

            console.log(`Indexed ${this.index.length} documents`);
        } catch (error) {
            console.error('Indexing error:', error);
        }
    }

    async retrieveRelevantDocuments(query, topN = 5, similarityThreshold = 0.5) {
        try {
            const [queryVector] = await this.embeddingGenerator.generateEmbeddings([query]);

            const scoredDocuments = this.index.flatMap(({ document, vectors }) =>
                vectors.map(vector => ({
                    document,
                    similarity: this.embeddingGenerator.cosineSimilarity(queryVector, vector)
                }))
            );

            return scoredDocuments
                .filter(doc => doc.similarity >= similarityThreshold)
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topN)
                .map(item => item.document);

        } catch (error) {
            console.error('Retrieval error:', error);
            return [];
        }
    }
}

export default VectorStore;