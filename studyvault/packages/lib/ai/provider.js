const { GoogleGenerativeAI } = require('google-generative-ai');
const OpenAI = require('openai');

class AIProvider {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'gemini';
    this.initClient();
  }

  initClient() {
    if (this.provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
      }
      this.client = new GoogleGenerativeAI(apiKey);
    } else if (this.provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set');
      }
      this.client = new OpenAI({ apiKey });
    } else {
      throw new Error(`Unsupported AI provider: ${this.provider}`);
    }
  }

  async generateContent(prompt, options = {}) {
    const { temperature = 0.7, maxTokens = 2048 } = options;

    if (this.provider === 'gemini') {
      const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      });
      return result.response.text();
    } else if (this.provider === 'openai') {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      });
      return completion.choices[0].message.content;
    }
  }

  async explainTopic(topicTitle, topicContent, difficulty = 'medium') {
    const prompt = `You are an expert teacher for Pakistani students (Grade 9-10). 
Explain the following topic in a clear, engaging way:

Topic: ${topicTitle}
Content: ${topicContent}
Difficulty Level: ${difficulty}

Provide:
1. A simple explanation (2-3 paragraphs)
2. Key concepts in bullet points
3. A real-world example relevant to Pakistani students
4. Common mistakes to avoid

Keep the language simple and encouraging.`;

    return await this.generateContent(prompt);
  }

  async generateQuestions(topicTitle, topicContent, count = 5, difficulty = 'medium') {
    const prompt = `You are an expert educator creating quiz questions for Pakistani students (Grade 9-10).

Topic: ${topicTitle}
Content: ${topicContent}
Difficulty: ${difficulty}
Number of Questions: ${count}

Generate ${count} multiple-choice questions. For each question, provide:
- The question text
- 4 options (A, B, C, D)
- The correct answer (just the letter)
- A brief explanation

Format as JSON array with this structure:
[
  {
    "question": "...",
    "options": [
      {"id": "A", "text": "..."},
      {"id": "B", "text": "..."},
      {"id": "C", "text": "..."},
      {"id": "D", "text": "..."}
    ],
    "correctAnswer": "A",
    "explanation": "..."
  }
]

Return ONLY the JSON array, no other text.`;

    const response = await this.generateContent(prompt);
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse AI-generated questions:', e);
      throw new Error('Failed to generate questions');
    }
  }

  async summarizeContent(content, maxLength = 200) {
    const prompt = `Summarize the following educational content in ${maxLength} words or less:

${content}

Provide a concise summary that captures the key points.`;

    return await this.generateContent(prompt);
  }

  async generateKeyPoints(content) {
    const prompt = `Extract 5-7 key points from the following content:

${content}

Format as a JSON array of strings: ["point 1", "point 2", ...]
Return ONLY the JSON array.`;

    const response = await this.generateContent(prompt);
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse key points:', e);
      return [];
    }
  }
}

module.exports = new AIProvider();
