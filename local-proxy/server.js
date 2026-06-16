require('dotenv').config();
const express = require('express');
const cors = require('cors');
const xss = require('xss');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Open CORS Middleware for Local Development
app.use(cors());

app.use(express.json({ limit: '10kb' })); // Limit payload size to prevent DoS

// 2. Rate Limiting Middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 3. One-Generation Limit (In-Memory Cache)
// In AWS, you would use DynamoDB to permanently track this state.
const generatedCandidates = new Set();

// Proxy Endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const candidate = req.body;
    
    // Check if candidate already generated a test
    if (!candidate.id) {
      return res.status(400).json({ error: 'Candidate ID is required' });
    }
    if (generatedCandidates.has(candidate.id)) {
      return res.status(403).json({ error: 'Test generation already completed for this candidate. Retakes are not allowed.' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_AI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(500).json({ error: 'API_KEY is not configured on the server.' });
    }

    // 4. Data Sanitization to prevent Prompt Injection
    // Using xss to strip any HTML/script tags, and slicing to prevent massive text blocks
    const cleanRole = xss(candidate?.role || 'Software Engineer').slice(0, 100);
    const cleanStream = xss(candidate?.stream || 'Computer Science').slice(0, 100);
    const cleanSpecialization = xss(candidate?.specialization || 'Software Engineering').slice(0, 100);
    const rawInterests = Array.isArray(candidate?.interests) ? candidate.interests.join(', ') : 'programming';
    const cleanInterests = xss(rawInterests).slice(0, 200);

    const promptContext = `The candidate is applying for the role of STRICTLY "${cleanRole}". Their stream is ${cleanStream}, specialization is ${cleanSpecialization}, and interests are ${cleanInterests}.`;
    const promptContent = `Generate 10 UNIQUE, HIGH-DIFFICULTY multiple choice questions for a senior technical assessment. ${promptContext} The questions MUST strictly relate to the job role. DO NOT repeat any questions or use basic/entry-level concepts. Return ONLY a valid JSON array of objects, where each object has "id" (number starting from 1), "text" (the question string), "options" (array of exactly 4 answer strings), and "correctAnswer" (the exact string of the correct option). No markdown code fences, no extra text.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. You MUST respond with ONLY a valid JSON array, no markdown, no explanation.'
          },
          {
            role: 'user',
            content: promptContent
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('Groq API Error: Status', response.status);
      return res.status(response.status).json({ error: 'Failed to fetch from Groq API' });
    }

    const data = await response.json();
    const textResponse = data.choices[0].message.content;
    const cleaned = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Mark candidate as having generated their test
    generatedCandidates.add(candidate.id);

    res.json(parsed);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error processing the request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Secured Local AI Proxy Server running on http://localhost:${PORT}`);
});
