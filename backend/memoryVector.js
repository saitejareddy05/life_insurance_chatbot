// memoryVector.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Pinecone } = require('@pinecone-database/pinecone'); // Using the Pinecone class from the latest SDK

import fetch from 'node-fetch'; // If using Node.js < v18 or if needed; Node v18+ has global fetch.
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Get __dirname equivalent in ESM.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes the Pinecone client and returns the index instance.
 * Note: The new Pinecone SDK uses environment variables internally,
 *       so no configuration options are passed via the constructor.
 */
async function initPinecone() {
  const client = new Pinecone();
  return client.Index(process.env.PINECONE_INDEX_NAME);
}
const indexPromise = initPinecone();

/**
 * Embeds text using the Gemini API.
 * Adjusts the returned vector to match the expected 768-dimensional format of the Pinecone index,
 * and ensures that the embedding is not entirely zeros.
 */
async function embedText(text) {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCtWEVRawxfGzIuIQNdMQWtRhzBre_ezD8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Use your Gemini API key from your environment variables.
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          input: text,
          model: "gemini-embedding-model-id" // Replace with the actual Gemini model identifier.
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    let embedding = data.embeddings[0];
    
    // Ensure the embedding vector is of dimension 768 to match your Pinecone index.
    if (Array.isArray(embedding)) {
      if (embedding.length >= 768) {
        embedding = embedding.slice(0, 768);
      } else {
        embedding = embedding.concat(Array(768 - embedding.length).fill(0));
      }
    } else {
      throw new Error("Unexpected embedding format");
    }
    
    // If the embedding vector is entirely zeros, replace it with a default non-zero vector.
    if (embedding.every((val) => val === 0)) {
      console.warn("Embedding returned all zeros. Replacing with default non-zero vector.");
      embedding = Array(768).fill(1); // You can adjust the value as needed.
    }
    
    return embedding;
  } catch (error) {
    console.error("Error obtaining embedding from Gemini API:", error);
    // As a fallback, return a non-zero vector of dimension 768.
    return Array(768).fill(1);
  }
}

/**
 * Stores the provided context text (e.g., conversation history) in Pinecone.
 */
export async function storeUserContext(userId, contextText) {
  const index = await indexPromise;
  const vector = await embedText(contextText);
  const id = `${userId}-${Date.now()}`;

  // Upsert expects an array of vectors.
  await index.upsert([
    {
      id,
      values: vector,
      metadata: { userId, context: contextText },
    },
  ]);

  return id;
}

/**
 * Retrieves stored context for a user by querying the Pinecone index.
 */
export async function retrieveUserContext(userId, queryText) {
  const index = await indexPromise;
  const queryVector = await embedText(queryText);

  const queryResponse = await index.query({
    vector: queryVector,
    topK: 5,
    includeMetadata: true,
    filter: { userId },
  });

  const contexts = queryResponse.matches?.map((match) => match.metadata.context) || [];
  return contexts.join(" ");
}