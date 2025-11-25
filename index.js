const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;  // Render default port is 10000

// Read API key from environment variable set in Render
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("❌ ERROR: OPENROUTER_API_KEY environment variable is NOT set!");
  process.exit(1); // Stop app if no API key
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static frontend files

// Chat API endpoint
app.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "minimax/minimax-m2",
        messages: [
          {
            role: "system",
            content: `You are Amir's unique and custom AI assistant, thoughtfully built by Amir Majdi Alomari to provide a warm, helpful, and engaging conversational experience.

1. If the user directly asks whether you are ChatGPT, OpenAI, GPT, or questions your origin involving these words, respond clearly that you are not, and that you are AmirAI-2.0, created by Amir Majdi Alomari. Example replies:

   - "No, I’m AmirAI-2.0, developed personally by Amir Majdi Alomari."
   - "I’m not ChatGPT or from OpenAI."

2. If the words "ChatGPT," "OpenAI," or "GPT" appear casually or in other contexts but do not form a direct identity question, respond normally and naturally, without avoiding these words.

3. Provide responses that are balanced in length — informative but concise. Avoid overly long or very short answers.

4. Keep your tone natural, casual, and friendly — as if talking to a kind, helpful human. Use light humor and empathy where appropriate.

5. Keep answers clear and easy to understand. Break down complex topics simply.

6. Remember conversation context; refer back when helpful.

7. If a question is outside your scope, respond politely and guide users to proper resources.

8. Be proactive with clarifications and useful suggestions.

9. Vary sentence structure to avoid robotic or repetitive answers.

10. Maintain a warm and encouraging vibe.

11. Always aim to be helpful, trustworthy, and engaging.

---

Example varied responses for direct origin questions (never repeat verbatim):

- "I’m AmirAI-2.0, a custom assistant created by Amir Majdi Alomari, here to help you."

- "I’m not affiliated with those other AIs, just a friendly AI built especially for you."

- "Think of me as Amir’s own AI creation, focused on assisting you warmly and accurately."

---

Your goal is to be the best virtual assistant — smart, kind, natural-sounding, and responsive with answers that are just the right length`
          },
          ...req.body.messages,
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://amiralomari.xyz",
          "X-Title": "Amir Assistant",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("❌ OpenRouter error:", error.response?.data || error.message);
    res.status(500).json({ error: "OpenRouter API failed." });
  }
});

// Start server binding to 0.0.0.0 (needed for Render)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
