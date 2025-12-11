require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Database Helper
const DB_FILE = path.join(__dirname, 'db.json');

async function readDB() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { users: [] };
    }
}

async function writeDB(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Routes

// Get Cloudinary Signature for client-side uploads
app.get('/api/cloudinary-signature', (req, res) => {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
        timestamp: timestamp,
        folder: 'voice_bank_users'
    }, process.env.CLOUDINARY_API_SECRET);

    res.json({
        signature,
        timestamp,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY
    });
});

// API: Register User
app.post('/api/register', async (req, res) => {
    try {
        const { mobile, name, faceDescriptor, voiceSampleUrl, faceImageUrl } = req.body;

        const db = await readDB();

        if (db.users.find(u => u.mobile === mobile)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            mobile,
            name,
            faceDescriptor, // Stored as array/object
            voiceSampleUrl,
            faceImageUrl,
            balance: 50000,
            transactions: []
        };

        db.users.push(newUser);
        await writeDB(db);

        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// API: Get User Metadata (for login verification)
app.post('/api/user-lookup', async (req, res) => {
    try {
        const { mobile } = req.body;
        const db = await readDB();
        const user = db.users.find(u => u.mobile === mobile);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return public info needed for verification
        res.json({
            name: user.name,
            faceDescriptor: user.faceDescriptor,
            faceImageUrl: user.faceImageUrl
        });
    } catch (error) {
        res.status(500).json({ error: 'Lookup failed' });
    }
});

// API: Chatbot using Groq
// API: Chatbot using NVIDIA NIM (OpenAI Compatible)
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const OpenAI = require('openai');

        const openai = new OpenAI({
            apiKey: process.env.NVIDIA_API_KEY,
            baseURL: 'https://integrate.api.nvidia.com/v1',
        });

        const completion = await openai.chat.completions.create({
            model: "meta/llama-3.1-405b-instruct",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful, secure, and friendly banking voice assistant named 'Voice Pay Assistant'. Your goal is to help users with banking tasks like transfers, bill payments, and balance checks. Keep your responses concise (under 2 sentences) as they will be spoken out loud via Text-to-Speech. If the user asks about something you cannot do, politely guide them to available features."
                },
                { role: "user", content: message }
            ],
            temperature: 0.2,
            top_p: 0.7,
            max_tokens: 1024,
            stream: false
        });

        const output = completion.choices[0]?.message?.content || "I am not sure how to respond.";
        res.json({ reply: output });

    } catch (error) {
        console.error("Chat Server Error:", error);
        res.status(500).json({ reply: "I am having trouble connecting to the AI server." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
