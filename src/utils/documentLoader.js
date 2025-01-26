import fs from 'fs/promises';
import path from 'path';

class DocumentLoader {
    constructor(documentsDir) {
        this.documentsDir = documentsDir;
    }

    async loadDocuments(maxChunkSize = 300) {
        try {
            const files = await fs.readdir(this.documentsDir);
            const documents = await Promise.all(
                files.map(async (file) => {
                    const filePath = path.join(this.documentsDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const chunks = this._intelligentSplit(content, maxChunkSize);
                    return {
                        id: path.basename(file, path.extname(file)),
                        chunks
                    };
                })
            );

            return documents.filter(doc => doc.chunks.length > 0);
        } catch (error) {
            console.error('Error loading documents:', error);
            return [];
        }
    }

    _intelligentSplit(text, chunkSize = 300) {
        const sanitizedText = text.replace(/\r\n/g, '\n');
        const paragraphs = sanitizedText.split('\n\n');
        const chunks = [];

        paragraphs.forEach(para => {
            const sentences = para.split(/(?<=[.!?])\s+/);
            let currentChunk = '';

            for (const sentence of sentences) {
                const potentialChunk = (currentChunk + ' ' + sentence).trim();

                if (potentialChunk.length <= chunkSize) {
                    currentChunk = potentialChunk;
                } else {
                    if (currentChunk) {
                        chunks.push(currentChunk.toLowerCase().trim());
                    }
                    currentChunk = sentence;
                }
            }

            if (currentChunk) {
                chunks.push(currentChunk.toLowerCase().trim());
            }
        });

        return chunks.filter(chunk => chunk.length > 0);
    }
}

export default DocumentLoader;