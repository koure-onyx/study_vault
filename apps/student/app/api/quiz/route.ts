import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@studyvault/db/connect';
import Question from '@studyvault/db/models/Question';
import UserProgress from '@studyvault/db/models/UserProgress';
import Topic from '@studyvault/db/models/Topic';
import { verifyToken } from '@studyvault/lib/auth/jwt';

const success = (data: any, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

const error = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: message }, { status });

// GET /api/quiz?topicId=xxx&type=mcq|short&count=5
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');
    const type = searchParams.get('type') || 'mcq';
    const count = parseInt(searchParams.get('count') || '5');

    if (!topicId) {
      return error('Topic ID is required', 400);
    }

    // Get verified questions for this topic
    const questions = await Question.find({
      topic_id: topicId,
      type,
      is_verified: true,
    })
      .select('question options correct_answer explanation steps difficulty')
      .limit(count);

    // If not enough questions, we'll need to generate more via AI
    const needsGeneration = questions.length < count;

    return success({
      questions: questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: type === 'mcq' ? q.options : undefined,
        type: q.type,
        difficulty: q.difficulty,
      })),
      totalAvailable: questions.length,
      needsGeneration,
    });
  } catch (err: any) {
    console.error('Quiz fetch error:', err);
    return error('Failed to fetch quiz questions', 500);
  }
}

// POST /api/quiz/submit - Submit quiz answers and get results
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const token = req.cookies.get('token')?.value;
    let userId;
    
    if (token) {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    }

    const body = await req.json();
    const { topicId, answers, quizType = 'mcq' } = body;

    if (!topicId || !answers) {
      return error('Topic ID and answers are required', 400);
    }

    // Get all questions for this topic
    const questions = await Question.find({
      topic_id: topicId,
      type: quizType,
      is_verified: true,
    }).select('correct_answer explanation steps');

    if (questions.length === 0) {
      return error('No questions found for this topic', 404);
    }

    // Calculate score
    let correctCount = 0;
    const results = questions.map((q, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === q.correct_answer;
      
      if (isCorrect) correctCount++;

      return {
        questionId: q._id,
        userAnswer,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
        steps: q.steps,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const xpEarned = score >= 80 ? 50 : score >= 60 ? 30 : 10;

    // Update user progress if logged in
    let progressUpdate = null;
    if (userId) {
      const topic = await Topic.findById(topicId);
      
      progressUpdate = await UserProgress.findOneAndUpdate(
        { user_id: userId, topic_id: topicId },
        {
          user_id: userId,
          topic_id: topicId,
          chapter_id: topic?.chapter_id,
          book_id: topic?.book_id,
          program_id: topic?.program_id,
          quiz_attempts: { $inc: 1 },
          highest_quiz_score: { $max: score },
          last_quiz_score: score,
          mastery_status: score >= 80 ? 'mastered' : score >= 30 ? 'in_progress' : 'locked',
          progress_percent: Math.min(100, (0.7 * score) + 30), // 30% from reading
          xp_earned: { $inc: xpEarned },
          last_accessed: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // Update question analytics
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAnswer = answers[i];
      
      await Question.findByIdAndUpdate(q._id, {
        $inc: {
          total_attempts: 1,
          ...(userAnswer === q.correct_answer 
            ? { correct_attempts: 1 }
            : { [`distractor_stats.${userAnswer}.count`]: 1 }
          ),
        },
      });
    }

    return success({
      score,
      totalQuestions: questions.length,
      correctCount,
      xpEarned,
      results,
      masteryStatus: score >= 80 ? 'mastered' : score >= 30 ? 'in_progress' : 'locked',
      progress: progressUpdate?.progress_percent || null,
    });
  } catch (err: any) {
    console.error('Quiz submit error:', err);
    return error('Failed to submit quiz', 500);
  }
}
