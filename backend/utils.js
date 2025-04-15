require("dotenv").config();
const fetch = require("node-fetch");

// 💡 Gemini Embedding Function
async function embedText(text) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedText?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: text
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      throw new Error(data.error?.message || "Unknown error from Gemini API");
    }

    return data.embedding.values; // 768-dimensional vector
  } catch (err) {
    console.error("Error obtaining embedding from Gemini API:", err.message);
    return Array(768).fill(0); // fallback vector
  }
}

// 🧮 Insurance Coverage Calculation Function
function calculateCoverage(income, familySize, premiumAdjustment = 0.0) {
  const multiplier = familySize > 1 ? 10 : 8;
  const baseCoverage = income * multiplier;
  const adjustedCoverage = baseCoverage * (1 - premiumAdjustment);
  return adjustedCoverage;
}

module.exports = { embedText, calculateCoverage };
