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
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // OpenAI API request
    const formData = new FormData();
    formData.append('file', createReadStream(file.filepath), 'audio.wav');
    formData.append('model', 'whisper-1'); // Specify the correct Whisper model

    // Request to OpenAI's Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(), 
      },
      body: formData as unknown as NodeJS.ReadableStream, 
    });

    const jsonResponse = (await response.json()) as OpenAIResponse;

    if (response.ok && jsonResponse.text) {
      res.status(200).json({ text: jsonResponse.text });
    } else if (jsonResponse.error) {
      console.error('OPEN AI ERROR:', jsonResponse.error);
      res.status(400).json({ error: jsonResponse.error.message });
    } else {
      res.status(400).json({ error: 'Unknown error occurred' });
    }
  } catch (error) {
    console.error('Error processing file upload or OpenAI request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
