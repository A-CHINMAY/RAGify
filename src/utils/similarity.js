// Function to calculate cosine similarity between two vectors
export function cosineSimilarity(vec1, vec2) {
    // Ensure vectors are not empty and have the same length
    if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
        console.error('Invalid vectors for cosine similarity calculation.');
        return 0;
    }

    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    // Check if either of the vectors has zero magnitude
    if (magnitude1 === 0 || magnitude2 === 0) {
        console.error('One or both vectors are zero vectors.');
        return 0; // Return 0 if either vector has zero magnitude
    }

    return dotProduct / (magnitude1 * magnitude2);
}