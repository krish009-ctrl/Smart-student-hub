require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

app.post('/summarize', upload.single('file'), async (req, res) => {
  try {
    let textToSummarize = req.body.text || '';
    const mode = req.body.mode || 'summary';
    const subject = req.body.subject || '';

    // If a PDF file was uploaded, extract its text
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Only PDF files are supported.' });
      }
      try {
        const data = await pdfParse(req.file.buffer);
        textToSummarize = data.text;
      } catch (err) {
        console.error('PDF parsing error:', err);
        return res.status(500).json({ error: 'Failed to extract text from PDF.' });
      }
    }

    textToSummarize = textToSummarize.trim();

    if (!textToSummarize) {
      return res.status(400).json({ error: 'No text or PDF content provided to summarize.' });
    }
    
    if (textToSummarize.length < 50) {
      return res.status(400).json({ error: 'Text is too short. Please provide at least 50 characters.' });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: OPENROUTER_API_KEY is missing.' });
    }

    // Prepare prompts based on mode
    const subjectContext = subject ? `\n(Subject: ${subject})` : '';
    const prompts = {
      summary: `You are a helpful study assistant for college students. Please provide a clear, concise summary of the following notes. Use simple language suitable for students.${subjectContext}\n\nNOTES:\n${textToSummarize}`,
      keypoints: `You are a helpful study assistant. Extract the most important key points from these notes. Format as a numbered list. Each point should be a clear, memorable fact or concept.${subjectContext}\n\nNOTES:\n${textToSummarize}`,
      qa: `You are a helpful study assistant. Generate 5-8 important exam-style questions AND their answers based on these notes. Format as Q1. [Question] A1. [Answer].${subjectContext}\n\nNOTES:\n${textToSummarize}`,
      explain: `You are a helpful teacher explaining to a beginner student. Explain the following notes in very simple language, using analogies and easy examples. Make it easy to understand even for a first-time reader.${subjectContext}\n\nNOTES:\n${textToSummarize}`
    };

    const prompt = prompts[mode] || prompts.summary;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-chat:free',
      messages: [
        { role: 'user', content: prompt }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000', 
        'X-Title': 'College Hub AI Summarizer'
      }
    });

    const result = response.data?.choices?.[0]?.message?.content || 'No response generated.';
    
    res.json({ result: result });

  } catch (error) {
    console.error('Summarization error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate summary. Please try again later.',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

app.listen(port, () => {
  console.log(`AI Summarizer backend running on http://localhost:${port}`);
});
