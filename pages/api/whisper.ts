import { withFileUpload } from 'next-multiparty';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

interface OpenAIResponse {
  text?: string;          
  error?: { 
    message: string;   
  };
}

export const config = {
  api: {
    bodyParser: false, 
  },
};

export default withFileUpload(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', createReadStream(file.filepath), 'audio.wav');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(), 
      },
      body: formData as unknown as NodeJS.ReadableStream, 
    });

    const jsonResponse = (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      console.error('OpenAI API error:', jsonResponse);
      return res.status(response.status).json({
        error: jsonResponse.error?.message || 'Error communicating with OpenAI'
      });
    }

    if (!jsonResponse.text) {
      console.error('Unexpected OpenAI response structure:', jsonResponse);
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    return res.status(200).json({ text: jsonResponse.text });

  } catch (error: unknown) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : undefined
    });
  }
});
