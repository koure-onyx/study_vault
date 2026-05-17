import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@studyvault/lib/ai/provider';
import { PROMPTS } from '@studyvault/lib/ai/prompts';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';
import User from '@studyvault/db/models/User';
import Question from '@studyvault/db/models/Question';

// Standard API response shape
const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { topicId, userId, count = 5 } = body;

    if (!topicId || !userId) {
      return error('Missing topicId or userId', 400);
    }

    // Fetch topic
    const topic = await Topic.findById(topicId);
    if (!topic || !topic.is_live) {
      return error('Topic not found', 404);
    }

    // Check AI cache first - if flashcards already generated and approved
    if (topic.ai_cache?.flashcards && topic.ai_cache.flashcards_approved) {
      return success({
        flashcards: topic.ai_cache.flashcards,
        isCached: true,
        generatedAt: topic.ai_cache.flashcards_generated_at,
        creditsUsed: 0,
      });
    }

    // Fetch user to check AI credits
    const user = await User.findById(userId);
    if (!user) {
      return error('User not found', 404);
    }

    // Check daily AI credits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isPremium = user.subscription?.plan === 'premium' || user.subscription?.plan === 'family';
    const dailyLimit = isPremium ? 9999 : 5;

    // Reset credits if it's a new day
    if (!user.subscription?.ai_credits_reset_at || 
        new Date(user.subscription.ai_credits_reset_at) < today) {
      user.subscription = user.subscription || { plan: 'free', status: 'active' };
      user.subscription.ai_credits_used_today = 0;
      user.subscription.ai_credits_reset_at = new Date();
      await user.save();
    }

    if (user.subscription!.ai_credits_used_today >= dailyLimit) {
      return error(
        `Daily AI limit reached. ${isPremium ? 'Unlimited for premium users.' : 'Upgrade to premium for unlimited flashcards.'}`,
        429
      );
    }

    // Generate flashcards using AI
    const promptData = PROMPTS.GENERATE_FLASHCARDS(topic.title, topic.raw_text, count);
    const response = await generateCompletion({
      systemPrompt: promptData.systemPrompt,
      userPrompt: promptData.userPrompt,
      maxTokens: 1500,
    });

    // Parse JSON response
    let flashcards;
    try {
      // Remove markdown code blocks if present
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      flashcards = JSON.parse(cleanResponse);
      
      // Validate structure
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }
      
      flashcards = flashcards.map((fc: any) => ({
        front: fc.front || '',
        back: fc.back || '',
        is_ai_generated: true,
      }));
    } catch (parseErr: any) {
      console.error('Failed to parse AI flashcards response:', parseErr);
      return error('Failed to parse AI-generated flashcards', 500);
    }

    // Save to AI cache
    topic.ai_cache = topic.ai_cache || {};
    topic.ai_cache.flashcards = flashcards;
    topic.ai_cache.flashcards_generated_at = new Date();
    topic.ai_cache.flashcards_approved = false; // Requires admin approval
    await topic.save();

    // Also save as Questions for future reuse (smart cache)
    const questionsToSave = flashcards.map((fc: any) => ({
      topic_id: topic._id,
      chapter_id: topic.chapter_id,
      book_id: topic.book_id,
      program_id: topic.program_id,
      type: 'mcq' as const,
      question: fc.front,
      correct_answer: fc.back,
      explanation: '',
      source: 'ai_generated' as const,
      difficulty: topic.difficulty || 'medium',
      created_by: user._id,
    }));

    // Bulk insert questions (ignore duplicates)
    if (questionsToSave.length > 0) {
      await Question.insertMany(questionsToSave, { ordered: false });
    }

    // Increment credit usage
    user.subscription!.ai_credits_used_today! += 1;
    await user.save();

    return success({
      flashcards,
      isCached: false,
      creditsUsed: 1,
      creditsRemaining: dailyLimit - user.subscription!.ai_credits_used_today!,
      requiresApproval: true,
    });

  } catch (err: any) {
    console.error('AI Flashcards Error:', err.message);
    return error(`Failed to generate flashcards: ${err.message}`, 500);
  }
}
