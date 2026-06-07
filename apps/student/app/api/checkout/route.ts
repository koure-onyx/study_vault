import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorizedResponse } from '@studyvault/lib/auth/getAuthUser';
import connectDB from '@studyvault/db/connect';
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
    // SECURE: Extract userId from session/token using unified auth
    const user = await getAuthUser(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    await connectDB();

    const body = await request.json();
    const { planId, paymentMethod } = body;

    if (!planId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planId, paymentMethod' },
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

    // CONTRACT FIX: Return flattened data envelope matching UI expectations
    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          plan: planId,
          planName: plan.name,
          amount: plan.price,
          currency: 'PKR',
          status: 'pending',
          expiresAt: expiresAt.toISOString(),
        },
        transactionId,
        redirectUrl: paymentUrl,
        paymentUrl,
        paymentData,
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
    // SECURE: Extract userId from session/token using unified auth
    const user = await getAuthUser(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    await connectDB();

    const userDoc = await User.findById(user.id).populate('subscription');
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const currentPlan = userDoc.subscription?.plan || 'free';
    const isPremium = ['basic', 'premium', 'family'].includes(currentPlan);
    const expiresAt = userDoc.subscription?.expires_at || null;
    const aiCreditsUsed = userDoc.subscription?.ai_credits_used_today || 0;
    const planDetails = PLANS[currentPlan as keyof typeof PLANS] || {
      name: 'Free',
      price: 0,
      features: ['Limited Access', '5 AI Credits/Day', 'Ads Supported'],
      aiCreditsPerDay: 5,
    };

    // CONTRACT FIX: Return subscription object and redirectUrl for UI compatibility
    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          currentPlan,
          planName: planDetails.name,
          isPremium,
          expiresAt,
          aiCreditsUsed,
          dailyLimit: planDetails.aiCreditsPerDay,
          features: planDetails.features,
        },
        availablePlans: Object.values(PLANS),
        // For backward compatibility
        currentPlan,
        planName: planDetails.name,
        isPremium,
        expiresAt,
        aiCreditsUsed,
        dailyLimit: planDetails.aiCreditsPerDay,
        features: planDetails.features,
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
