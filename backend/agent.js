// agent.js
import fetch from 'node-fetch';

export async function generateResponse(query, newContext, pastContext) {
  // Build the prompt using both query and context data
  let prompt = `User query: ${query}\n`;
  
  if (pastContext && Object.keys(pastContext).length > 0) {
    prompt += `Past context: ${JSON.stringify(pastContext)}\n`;
  }
  
  if (newContext && Object.keys(newContext).length > 0) {
    prompt += `New details: ${JSON.stringify(newContext)}\n`;
  }
  
  prompt += "Provide tailored life insurance advice comparing term life and whole life options with coverage recommendations based on the above details.";

  const apiURL = process.env.GEMINI_API_URL;
  const apiKey = process.env.GEMINI_API_KEY;
  
  // If using a placeholder URL, simulate a response for testing
  if (!apiURL || apiURL.includes("example.com")) {
    console.log("Using simulated response (placeholder API URL detected).");
    return `Simulated response for prompt: ${prompt}`;
  }
  
  try {
    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ prompt })
    });
  
    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${responseText}`);
    }
    
    const data = await response.json();
    return data.answer || "No answer received from the AI service.";
    
  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    return "Error fetching AI response.";
  }
}
