import type { NextApiRequest, NextApiResponse } from 'next';

interface MessageSchema {
  role: 'assistant' | 'user' | 'system';
  content: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Validate request body
    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: req.body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Error communicating with OpenAI'
      });
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response structure:', data);
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    const newSystemMessageSchema: MessageSchema = {
      role: 'system',
      content: data.choices[0].message.content,
    };

    return res.status(200).json(newSystemMessageSchema);

  } catch (error: unknown) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' 
        ? error instanceof Error ? error.message : 'Unknown error'
        : undefined
    });
  }
}
