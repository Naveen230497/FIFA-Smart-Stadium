/**
 * @fileoverview Vercel Serverless Proxy for Groq API
 * @module api/chat
 * 
 * This serverless function acts as a secure backend proxy between
 * the FIFA Connect 2026 frontend and the Groq LLM API.
 * 
 * Security: The GROQ_API_KEY is stored exclusively in Vercel
 * Environment Variables and is never exposed to the client.
 * 
 * Supports multi-language responses via the `lang` parameter.
 */

/**
 * Maps language codes to full language names for the system prompt.
 * @type {Object<string, string>}
 */
const LANGUAGE_MAP = {
  en: 'English',
  es: 'Spanish',
  fr: 'French'
};

/**
 * Vercel serverless handler for POST /api/chat
 * @param {import('http').IncomingMessage & {body: object}} req - The HTTP request
 * @param {import('http').ServerResponse} res - The HTTP response
 * @returns {Promise<void>}
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, lang, mode } = req.body;

  // Validate required fields
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt field.' });
  }

  // Validate prompt length to prevent abuse
  if (prompt.length > 2000) {
    return res.status(400).json({ error: 'Prompt exceeds maximum length of 2000 characters.' });
  }

  // Retrieve the API key from secure environment variables
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: GROQ_API_KEY is not set.' });
  }

  // Resolve the target language for multi-language support
  const targetLang = LANGUAGE_MAP[lang] || 'English';

  let systemMessageContent = '';

  if (mode === 'staff') {
    systemMessageContent = 'Act as an operational AI for FIFA 2026. Generate a 1-sentence urgent crowd management alert recommending opening a specific emergency gate due to congestion. You must include a "Reasoning:" section explaining exactly why you made this operational decision based on the telemetry data. Format it as an actionable alert.';
  } else {
    systemMessageContent = `You are the official FIFA 2026 Smart Stadium Assistant. You MUST respond entirely in ${targetLang}. 
Stadium Layout Context: 
- Food and Concessions are located at the East Gate.
- Emergency Egress and Exits are located at the West Gate.
- VIP Seating is at the North Stand.

If the user asks for food, explicitly suggest the East Gate. If they ask for an exit, explicitly suggest the West Gate. After suggesting the specific location, tell them to follow the route on the Schematic Wayfinding map. You must include a brief "Reasoning:" explaining why you suggested that route. Keep responses under 2 sentences. Do not mention wristbands or other apps.`;
  }

  // Build the system prompt
  const systemMessage = {
    role: 'system',
    content: systemMessageContent
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          systemMessage,
          { role: 'user', content: prompt }
        ],
        max_tokens: 256,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Groq API Error [${response.status}]: ${errText}`);
      return res.status(response.status).json({ error: `Groq API Error: ${errText}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
