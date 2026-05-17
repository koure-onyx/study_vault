// packages/lib/ai/provider.js
// NEVER call an AI API directly from a route. Always go through this file.
// Swap providers by changing the env variable AI_PROVIDER=gemini|openai

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

export async function generateCompletion({ systemPrompt, userPrompt, maxTokens = 1000 }) {
  if (AI_PROVIDER === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      `${systemPrompt}\n\n${userPrompt}`
    );
    return result.response.text();
  }

  if (AI_PROVIDER === 'openai') {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
    });
    return completion.choices[0].message.content;
  }

  throw new Error(`Unknown AI_PROVIDER: ${AI_PROVIDER}`);
}
