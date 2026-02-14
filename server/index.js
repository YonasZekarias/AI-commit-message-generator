require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const port = process.env.PORT || 5000;

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/api/generate-commits', async (req, res) => {
    try {
        const { diff } = req.body;
        if (!diff) return res.status(400).json({ error: 'Git diff is required.' });

        const prompt = `
            Analyze this git diff and generate exactly 3 professional commit messages.
            Use Conventional Commits (feat:, fix:, chore:, etc.). Keep under 72 chars.
            Return ONLY a valid JSON object with a single "commits" array containing the strings.
            Example: { "commits": ["feat: add login functionality", "fix: UI button alignment"] }
            
            Diff: ${diff}
        `;

        // Call the free Groq API
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            response_format: { type: 'json_object' }
        });

        // Parse the JSON response
        const result = JSON.parse(chatCompletion.choices[0].message.content);
        res.status(200).json({ commits: result.commits });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate commit messages.' });
    }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));