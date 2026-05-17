import { NextRequest, NextResponse } from 'next/server';
import { generateCompletion } from '@studyvault/lib/ai/provider';
import { PROMPTS } from '@studyvault/lib/ai/prompts';
import connectDB from '@studyvault/db/connect';
import Topic from '@studyvault/db/models/Topic';
import User from '@studyvault/db/models/User';

// Standard API response shape
const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { topicId, userId } = body;

    if (!topicId || !userId) {
      return error('Missing topicId or userId', 400);
    }

    // Fetch topic
    const topic = await Topic.findById(topicId);
    if (!topic || !topic.is_live) {
      return error('Topic not found', 404);
    }

    // Check AI cache first (smart cache - zero cost if approved)
    if (topic.ai_cache?.explanation?.text && topic.ai_cache.explanation.is_approved) {
      return success({
        explanation: topic.ai_cache.explanation.text,
        isCached: true,
        generatedAt: topic.ai_cache.explanation.generated_at,
        modelUsed: topic.ai_cache.explanation.model_used,
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
    const dailyLimit = isPremium ? 9999 : 5; // Unlimited for premium, 5 for free

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
        `Daily AI limit reached. ${isPremium ? 'Unlimited for premium users.' : 'Upgrade to premium for unlimited explanations.'}`,
        429
      );
    }

    // Generate explanation using AI
    const promptData = PROMPTS.EXPLAIN_TOPIC(topic.title, topic.raw_text);
    const explanation = await generateCompletion({
      systemPrompt: promptData.systemPrompt,
      userPrompt: promptData.userPrompt,
      maxTokens: 800,
    });

    // Save to AI cache
    topic.ai_cache = topic.ai_cache || {};
    topic.ai_cache.explanation = {
      text: explanation,
      generated_at: new Date(),
      model_used: process.env.AI_PROVIDER || 'gemini',
      is_approved: false, // Requires admin approval before showing to all users
    };
    await topic.save();

    // Increment credit usage
    user.subscription!.ai_credits_used_today! += 1;
    await user.save();

    return success({
      explanation,
      isCached: false,
      creditsUsed: 1,
      creditsRemaining: dailyLimit - user.subscription!.ai_credits_used_today!,
      requiresApproval: true,
    });

  } catch (err: any) {
    console.error('AI Explain Error:', err.message);
    return error(`Failed to generate explanation: ${err.message}`, 500);
  }
}
