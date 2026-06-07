import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Question from '@studyvault/db/models/Question';
import Topic from '@studyvault/db/models/Topic';
import { generateCompletion } from '@studyvault/lib/ai/provider';
import { PROMPTS } from '@studyvault/lib/ai/prompts';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import User from '@studyvault/db/models/User';

const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

// POST /api/ai/generate-questions
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    await connectDB();

    // Check user's AI credits
    const dbUser = await User.findById(user.id);
    if (!dbUser) {
      return error('User not found', 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const resetAt = dbUser.subscription?.ai_credits_reset_at;
    if (!resetAt || resetAt < today) {
      // Reset credits for new day
      dbUser.subscription.ai_credits_used_today = 0;
      dbUser.subscription.ai_credits_reset_at = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      await dbUser.save();
    }

    const dailyLimit = dbUser.subscription?.plan === 'premium' ? 999 : 5;
    if ((dbUser.subscription?.ai_credits_used_today || 0) >= dailyLimit) {
      return error(
        `Daily AI limit reached. ${dbUser.subscription?.plan === 'free' ? 'Upgrade to premium for unlimited questions.' : 'Try again tomorrow.'}`,
        429
      );
    }

    const body = await req.json();
    const { topicId, type = 'mcq', count = 5 } = body;

    if (!topicId) {
      return error('Topic ID is required', 400);
    }

    // First, check if we already have enough verified questions (smart cache)
    const existingQuestions = await Question.find({
      topic_id: topicId,
      type,
      is_verified: true,
    }).limit(count);

    if (existingQuestions.length >= count) {
      // Return cached questions - no AI cost!
      return success({
        questions: existingQuestions.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          steps: q.steps,
          source: q.source,
        })),
        generated: false,
        message: 'Returning existing questions from cache',
      });
    }

    // Need to generate more questions via AI
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return error('Topic not found', 404);
    }

    const questionsNeeded = count - existingQuestions.length;
    
    // Get the appropriate prompt
    let prompt;
    if (type === 'mcq') {
      prompt = PROMPTS.GENERATE_MCQS(topic.title, topic.raw_text, questionsNeeded);
    } else if (type === 'short') {
      prompt = PROMPTS.GENERATE_SHORT_QUESTIONS(topic.title, topic.raw_text, questionsNeeded);
    } else {
      return error('Invalid question type', 400);
    }

    // Generate questions using AI
    const aiResponse = await generateCompletion({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      maxTokens: 2000,
    });

    // Parse AI response as JSON
    let generatedQuestions;
    try {
      // Remove markdown code blocks if present
      const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      generatedQuestions = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr, aiResponse);
      return error('Failed to parse AI-generated questions', 500);
    }

    // Validate and save generated questions
    const savedQuestions = [];
    for (const q of generatedQuestions) {
      if (!q.question || (type === 'mcq' && !q.options)) {
        continue; // Skip invalid questions
      }

      const questionDoc = await Question.create({
        topic_id: topicId,
        chapter_id: topic.chapter_id,
        book_id: topic.book_id,
        program_id: topic.program_id,
        type,
        question: q.question,
        options: q.options || [],
        correct_answer: q.correct_answer || q.model_answer,
        explanation: q.explanation,
        steps: q.steps || [],
        source: 'ai_generated',
        difficulty: 'medium',
        is_verified: false, // Needs admin review
        created_by: user.id,
      });

      savedQuestions.push({
        _id: questionDoc._id,
        question: questionDoc.question,
        options: questionDoc.options,
        correct_answer: questionDoc.correct_answer,
        explanation: questionDoc.explanation,
        steps: questionDoc.steps,
        source: questionDoc.source,
      });
    }

    // Update user's AI credit usage
    dbUser.subscription.ai_credits_used_today += 1;
    await dbUser.save();

    // Combine existing and newly generated questions
    const allQuestions = [
      ...existingQuestions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        steps: q.steps,
        source: q.source,
      })),
      ...savedQuestions,
    ].slice(0, count);

    return success({
      questions: allQuestions,
      generated: true,
      newCount: savedQuestions.length,
      creditsUsed: dbUser.subscription.ai_credits_used_today,
      creditsRemaining: dailyLimit - dbUser.subscription.ai_credits_used_today,
    });
  } catch (err: any) {
    console.error('Generate questions error:', err);
    return error(err.message || 'Failed to generate questions', 500);
  }
}
