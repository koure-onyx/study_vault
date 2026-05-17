import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import Subscription from '@studyvault/db/models/Subscription';
import crypto from 'crypto';

// Mock EasyPaisa/JazzCash API endpoints (replace with real ones in production)
const EASYPAISA_API = process.env.EASYPAISA_API_URL || 'https://mock.easypaisa.com.pk/api';
const JAZZCASH_API = process.env.JAZZCASH_API_URL || 'https://mock.jazzcash.com.pk/api';

const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 500, // PKR per month
    features: ['Unlimited AI Explanations', 'Basic Progress Tracking', 'Ad-free Experience'],
    aiCreditsPerDay: 50,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 1200, // PKR per month
    features: ['Unlimited AI Everything', 'Advanced Analytics', 'Downloadable Content', 'Priority Support', 'Family Plan (3 users)'],
    aiCreditsPerDay: -1, // unlimited
  },
  family: {
    id: 'family',
    name: 'Family',
    price: 2500, // PKR per month
    features: ['Everything in Premium', 'Up to 5 Family Members', 'Parent Dashboard', 'Progress Reports'],
    aiCreditsPerDay: -1,
  },
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, planId, paymentMethod } = body;

    if (!userId || !planId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, planId, paymentMethod' },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate unique transaction ID
    const transactionId = `SV_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Calculate expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create pending subscription record
    const subscription = await Subscription.create({
      user_id: user._id,
      plan: planId,
      status: 'pending',
      amount: plan.price,
      currency: 'PKR',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      expires_at: expiresAt,
      metadata: {
        initiated_at: new Date(),
        payment_gateway: paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash',
      },
    });

    // Prepare payment request based on method
    let paymentUrl = '';
    let paymentData = {};

    if (paymentMethod === 'easypaisa') {
      // Mock EasyPaisa payment initialization
      paymentUrl = `${EASYPAISA_API}/checkout?txn=${transactionId}&amount=${plan.price}`;
      paymentData = {
        method: 'easypaisa',
        redirect_url: `${process.env.STUDENT_APP_URL}/premium/success?txn=${transactionId}`,
        cancel_url: `${process.env.STUDENT_APP_URL}/premium/cancel`,
      };
    } else if (paymentMethod === 'jazzcash') {
      // Mock JazzCash payment initialization
      paymentUrl = `${JAZZCASH_API}/checkout?txn=${transactionId}&amount=${plan.price}`;
      paymentData = {
        method: 'jazzcash',
        redirect_url: `${process.env.STUDENT_APP_URL}/premium/success?txn=${transactionId}`,
        cancel_url: `${process.env.STUDENT_APP_URL}/premium/cancel`,
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported payment method' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        plan: plan.name,
        amount: plan.price,
        currency: 'PKR',
        paymentUrl,
        paymentData,
        subscriptionId: subscription._id,
        expiresAt: expiresAt.toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize checkout' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).populate('subscription');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const currentPlan = user.subscription?.plan || 'free';
    const isPremium = ['basic', 'premium', 'family'].includes(currentPlan);
    const expiresAt = user.subscription?.expires_at || null;
    const aiCreditsUsed = user.subscription?.ai_credits_used_today || 0;
    const planDetails = PLANS[currentPlan as keyof typeof PLANS] || {
      name: 'Free',
      price: 0,
      features: ['Limited Access', '5 AI Credits/Day', 'Ads Supported'],
      aiCreditsPerDay: 5,
    };

    return NextResponse.json({
      success: true,
      data: {
        currentPlan: currentPlan,
        planName: planDetails.name,
        isPremium,
        expiresAt,
        aiCreditsUsed,
        dailyLimit: planDetails.aiCreditsPerDay,
        features: planDetails.features,
        availablePlans: Object.values(PLANS),
      },
    });

  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
