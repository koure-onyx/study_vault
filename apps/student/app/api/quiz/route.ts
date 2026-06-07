import { NextRequest } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import connectDB from '@studyvault/db/connect';
import Question from '@studyvault/db/models/Question';
import Quiz from '@studyvault/db/models/Quiz.js';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { topicId, answers, score, timeSpent } = await req.json();

    if (!topicId || !answers) {
      return Response.json({ success: false, error: 'topicId and answers required' }, { status: 400 });
    }

    await connectDB();

    // Get questions to validate answers
    const questions = await Question.find({ topic_id: topicId, is_verified: true }).lean();
    
    let correctCount = 0;
    for (const q of questions) {
      const userAnswer = answers.find((a: any) => a.questionId === q._id.toString());
      if (userAnswer && userAnswer.selected === q.correct_answer) {
        correctCount++;
      }
    }

    const calculatedScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const finalScore = score !== undefined ? score : calculatedScore;

    // Save quiz record
    const quiz = await Quiz.create({
      user_id: user.id,
      topic_id: topicId,
      score: finalScore,
      answers,
      time_spent: timeSpent || 0,
    });

    return Response.json({
      success: true,
      data: { 
        quiz,
        score: finalScore,
        correctCount,
        totalQuestions: questions.length,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');

    await connectDB();

    const query = { user_id: user.id };
    if (topicId) {
      Object.assign(query, { topic_id: topicId });
    }

    const quizzes = await Quiz.find(query).sort({ created_at: -1 }).limit(20).lean();

    return Response.json({
      success: true,
      data: { quizzes },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
