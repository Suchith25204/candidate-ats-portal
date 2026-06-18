require('dotenv').config();
const express = require('express');
const cors = require('cors');
const xss = require('xss');
const rateLimit = require('express-rate-limit');
const { DynamoDBClient, CreateTableCommand, ResourceInUseException } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const stytch = require('stytch');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Open CORS Middleware for Local Development
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const stytchClient = new stytch.B2BClient({
  project_id: process.env.VITE_STYTCH_PUBLIC_TOKEN || process.env.STYTCH_PROJECT_ID,
  secret: process.env.STYTCH_SECRET,
});

// 2. DynamoDB Local Connection
const ddbClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
  }
});

const docClient = DynamoDBDocumentClient.from(ddbClient);

// 3. Automatic Table Creation
const initializeDynamoDB = async () => {
  try {
    const params = {
      TableName: 'Candidates',
      AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    };
    await ddbClient.send(new CreateTableCommand(params));
    console.log("DynamoDB Table 'Candidates' created.");
  } catch (error) {
    if (error instanceof ResourceInUseException || error.name === 'ResourceInUseException') {
      console.log("DynamoDB Table 'Candidates' already exists.");
    } else {
      console.error("Error creating table:", error);
    }
  }
};

initializeDynamoDB();

// API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for regular app usage
  message: { error: 'Too many requests' }
});

// 4. API Endpoints

// STYTCH B2B AUTHENTICATION ROUTES
app.post('/api/b2b/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const response = await stytchClient.otps.email.discovery.send({
      email_address: email,
    });
    res.json(response);
  } catch (err) {
    console.error('Stytch Send OTP Error:', err);
    res.status(500).json({ error: err.error_message || err.message || 'Failed to send OTP' });
  }
});

app.post('/api/b2b/send-magic-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const response = await stytchClient.magicLinks.email.discovery.send({
      email_address: email,
      discovery_redirect_url: 'http://localhost:5173/authenticate'
    });
    res.json(response);
  } catch (err) {
    console.error('Stytch Send Magic Link Error:', err);
    res.status(500).json({ error: err.error_message || err.message || 'Failed to send Magic Link' });
  }
});

app.post('/api/b2b/authenticate', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'email and code are required' });

    const response = await stytchClient.otps.email.discovery.authenticate({
      email_address: email,
      code: code,
    });
    res.json(response);
  } catch (err) {
    console.error('Stytch Authenticate Error:', err);
    res.status(500).json({ error: err.error_message || err.message || 'Failed to authenticate' });
  }
});

// GET all candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const data = await docClient.send(new ScanCommand({ TableName: 'Candidates' }));
    res.json(data.Items || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// GET candidate by email
app.get('/api/candidates/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const data = await docClient.send(new GetCommand({
      TableName: 'Candidates',
      Key: { email }
    }));
    // If we want it to behave like the old mockDb, returning undefined for missing items is fine.
    if (!data.Item) {
      return res.status(200).json(null); // Return null so frontend knows it doesn't exist
    }
    res.json(data.Item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// GET recruiter by email
app.get('/api/recruiters/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const data = await docClient.send(new GetCommand({
      TableName: 'Recruiters',
      Key: { username: email } // Wait, mock DB uses username for Recruiters. Let's use email here or keep username.
    }));
    if (!data.Item) {
      return res.status(200).json(null);
    }
    res.json(data.Item);
  } catch (err) {
    // If table doesn't exist yet, we just return null safely
    res.status(200).json(null);
  }
});

// POST add new recruiter (Protected)
app.post('/api/recruiters/add', async (req, res) => {
  try {
    const { email, requesterEmail } = req.body;
    if (!email || !requesterEmail) return res.status(400).json({ error: 'email and requesterEmail are required' });

    // Security check: Verify the requester is actually a recruiter
    const checkRes = await docClient.send(new GetCommand({
      TableName: 'Recruiters',
      Key: { username: requesterEmail }
    }));
    
    if (!checkRes.Item) {
      return res.status(403).json({ error: 'Unauthorized: Requester is not an authenticated recruiter' });
    }

    // Insert new recruiter
    await docClient.send(new PutCommand({
      TableName: 'Recruiters',
      Item: {
        username: email,
        role: 'Recruiter',
        createdAt: new Date().toISOString()
      }
    }));
    
    res.json({ success: true, email });
  } catch (err) {
    console.error('Add Recruiter Error:', err);
    res.status(500).json({ error: 'Failed to add recruiter' });
  }
});

// POST create candidate
app.post('/api/candidates', async (req, res) => {
  try {
    const candidate = req.body;
    if (!candidate.email) return res.status(400).json({ error: 'Email is required' });

    await docClient.send(new PutCommand({
      TableName: 'Candidates',
      Item: candidate
    }));
    res.json(candidate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save candidate' });
  }
});

// PUT update candidate
app.put('/api/candidates/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;

    // Get current candidate state first to merge updates (simple partial update)
    const getRes = await docClient.send(new GetCommand({ TableName: 'Candidates', Key: { email } }));
    let currentItem = getRes.Item || { email };

    const updatedItem = { ...currentItem, ...updates };

    await docClient.send(new PutCommand({
      TableName: 'Candidates',
      Item: updatedItem
    }));
    res.json(updatedItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// 5. Existing AI Questions Endpoint
const generatedCandidates = new Set();
app.post('/api/generate-questions', apiLimiter, async (req, res) => {
  try {
    const candidate = req.body;

    // Check if candidate already generated a test
    if (!candidate.email) {
      return res.status(400).json({ error: 'Candidate email is required' });
    }
    if (generatedCandidates.has(candidate.email)) {
      return res.status(403).json({ error: 'Test generation already completed for this candidate. Retakes are not allowed.' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_AI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.status(500).json({ error: 'API_KEY is not configured on the server.' });
    }

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

    generatedCandidates.add(candidate.email);

    res.json(parsed);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error processing the request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Secured Local AI Proxy Server running on http://localhost:${PORT}`);
});
