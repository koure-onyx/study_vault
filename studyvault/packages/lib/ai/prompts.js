module.exports = {
  EXPLAIN_TOPIC: `You are an expert teacher for Pakistani students (Grade 9-10). 
Explain the following topic in a clear, engaging way:

Topic: {topicTitle}
Content: {topicContent}
Difficulty Level: {difficulty}

Provide:
1. A simple explanation (2-3 paragraphs)
2. Key concepts in bullet points
3. A real-world example relevant to Pakistani students
4. Common mistakes to avoid

Keep the language simple and encouraging.`,

  GENERATE_QUESTIONS: `You are an expert educator creating quiz questions for Pakistani students (Grade 9-10).

Topic: {topicTitle}
Content: {topicContent}
Difficulty: {difficulty}
Number of Questions: {count}

Generate {count} multiple-choice questions. For each question, provide:
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

Return ONLY the JSON array, no other text.`,

  SUMMARIZE_CONTENT: `Summarize the following educational content in {maxLength} words or less:

{content}

Provide a concise summary that captures the key points.`,

  GENERATE_KEY_POINTS: `Extract 5-7 key points from the following content:

{content}

Format as a JSON array of strings: ["point 1", "point 2", ...]
Return ONLY the JSON array.`,

  INGEST_BOOK: `You are processing a textbook chapter for StudyVault PK, a Pakistani educational platform.

Book: {bookTitle}
Grade: {grade}
Subject: {subject}
Chapter: {chapterTitle}

Convert the following content into structured format with:
1. Clear headings
2. Definitions
3. Examples
4. Formulas (if any)
5. Important notes
6. Warnings/common mistakes

Content:
{content}

Return as JSON array of content blocks with type and content fields.`,

  GENERATE_SEO: `Generate SEO metadata for an educational topic page.

Topic: {topicTitle}
Subject: {subject}
Grade: {grade}
Board: {board}

Provide:
1. SEO Title (max 60 characters)
2. SEO Description (max 160 characters)
3. Keywords (comma-separated)

Return as JSON object.`,
};
