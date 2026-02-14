require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai'); // We use the OpenAI package for OpenRouter

const app = express();
const port = process.env.PORT || 5000;

// Initialize the client pointing to OpenRouter instead of OpenAI
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

app.use(cors());
// api.use(cors({
//     origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
// }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'AI Commit Generator API is running via OpenRouter!' });
});

app.post('/api/generate-commits', async (req, res) => {
    try {
        const { diff } = req.body;

        if (!diff || diff.trim() === '') {
            return res.status(400).json({ error: 'Git diff is required.' });
        }

        const prompt = `
            You are an expert software engineer. I will provide you with a git diff. 
            Your job is to analyze the changes and generate exactly 3 highly professional commit messages.
            
            Rules:
            1. Use the Conventional Commits specification (e.g., feat:, fix:, refactor:, chore:, docs:).
            2. Keep each message under 72 characters.
            3. Do not include any explanations, greetings, or markdown formatting.
            4. Return ONLY a valid JSON array of strings. Example: ["feat: add user login", "fix: resolve header UI bug", "refactor: clean up auth logic"]

            Here is the git diff:
            ${diff}
        `;

        // Call the free model via OpenRouter
        const completion = await openai.chat.completions.create({
            model: "openrouter/free",
            messages: [
                { role: "user", content: prompt }
            ],
            // Force the AI to output valid JSON
            response_format: { type: "json_object" } 
        });

        // Parse the AI's response
        const aiResponseText = completion.choices[0].message.content;
        
        // Sometimes Llama returns {"commits": ["..."]}, sometimes just the array. 
        // We handle the parsing safely here:
        let commitMessages;
        try {
            const parsed = JSON.parse(aiResponseText);
            commitMessages = Array.isArray(parsed) ? parsed : (parsed.commits || Object.values(parsed)[0]);
        } catch (e) {
            // Fallback if parsing fails
            commitMessages = ["Error parsing AI response. Please try again."];
        }

        res.status(200).json({ commits: commitMessages });

    } catch (error) {
        console.error('Error generating commits:', error);
        res.status(500).json({ error: 'Failed to generate commit messages.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});