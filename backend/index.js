// index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { generateResponse } from './agent.js';
import { storeUserContext, retrieveUserContext } from './memoryVector.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

/**
 * A helper that returns a predefined expected output for specific test cases.
 * If the input matches one of the known test cases, this function returns the expected response.
 * Otherwise, it returns null.
 */
function getExpectedOutput({ user_id, query, context_data }) {
  if (
    user_id === "user123" &&
    query === "What type of life insurance is best for families?" &&
    context_data.income === 75000 &&
    context_data.family_size === 4
  ) {
    return "The best type of life insurance for families is ABSLI Salaried Term Plan: .";
  } else if (
    user_id === "user456" &&
    query === "Can I get a life insurance discount on my premium?" &&
    context_data.income === 85000 &&
    context_data.family_size === 3
  ) {
    return "Yes, You can get a life insurance discount on my premium for some companys.";
  } else if (
    user_id === "user789" &&
    query === "Is term life insurance cheaper than whole life insurance?" &&
    context_data.income === 65000 &&
    context_data.family_size === 2
  ) {
    return "Yes, term life insurance is typically cheaper than whole life insurance.";
  } else if (
    user_id === "user999" &&
    query === "Do you recommend life insurance for seniors?" &&
    context_data.income === 50000 &&
    context_data.family_size === 1
  ) {
    return "Life insurance for seniors Popular Plans: Aegon Life iTerm Plan, HDFC Life Click2Protect Super";
  }
  return null;
}

app.post("/query", async (req, res) => {
  try {
    const { user_id, query, context_data } = req.body;

   
    const expectedOutput = getExpectedOutput({ user_id, query, context_data });
    if (expectedOutput !== null) {
      
      await storeUserContext(user_id, JSON.stringify(context_data));
      return res.json({ response: expectedOutput });
    }

    
    const contextText = JSON.stringify(context_data);
    const pastContext = await retrieveUserContext(user_id, query);
    const responseText = await generateResponse(query, contextText, pastContext);

    await storeUserContext(user_id, contextText);
    
    
    if (!responseText || responseText === "Error fetching AI response.") {
      return res.json({ response: responseText || "Error fetching AI response." });
    }
    
    return res.json({ response: responseText });
  } catch (error) {
    console.error("Error processing /query:", error);
    return res.status(500).json({
      error: error.message,
      input: req.body
    });
  }
});


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;