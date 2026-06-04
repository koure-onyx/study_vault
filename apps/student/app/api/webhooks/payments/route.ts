import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@studyvault/db/connect';
import Subscription from '@studyvault/db/models/Subscription';
import User from '@studyvault/db/models/User';

// Mock verification for EasyPaisa/JazzCash webhooks
// In production, verify signatures using provider-specific secrets

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { transaction_id, status, payment_method, amount, currency, metadata } = body;

    // Validate required fields
    if (!transaction_id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing transaction_id or status' },
        { status: 400 }
      );
    }

    // Verify this is from a trusted source (mock check)
    const authToken = request.headers.get('x-payment-auth-token');
    const expectedToken = payment_method === 'easypaisa' 
      ? process.env.EASYPAISA_WEBHOOK_SECRET 
      : process.env.JAZZCASH_WEBHOOK_SECRET;

    if (authToken !== expectedToken) {
      // In production, return 401. For now, log and continue for testing
      console.warn('Webhook auth token mismatch - continuing for testing');
    }

    // Find the subscription by transaction ID
    const subscription = await Subscription.findOne({ transaction_id });
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found for this transaction' },
        { status: 404 }
      );
    }

    // Handle different payment statuses
    if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'PAID') {
      // Update subscription to active
      subscription.status = 'active';
      subscription.metadata = {
        ...subscription.metadata,
        completed_at: new Date(),
        payment_confirmed_at: new Date(),
        gateway_response: metadata,
      };
      await subscription.save();

      // Update user's subscription plan and reset AI credits
      const user = await User.findById(subscription.user_id);
      if (user) {
        user.subscription.plan = subscription.plan;
        user.subscription.status = 'active';
        user.subscription.expires_at = subscription.expires_at;
        user.subscription.ai_credits_used_today = 0;
        user.subscription.ai_credits_reset_at = new Date();
        await user.save();

        console.log(`✅ Payment successful for user ${user.email} - Plan: ${subscription.plan}`);
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Payment confirmed successfully',
          subscriptionId: subscription._id,
          userId: user?._id,
          plan: subscription.plan,
        },
      });

    } else if (status === 'FAILED' || status === 'CANCELLED' || status === 'REFUNDED') {
      // Mark subscription as failed/cancelled
      subscription.status = status === 'CANCELLED' ? 'cancelled' : 'expired';
      subscription.metadata = {
        ...subscription.metadata,
        failed_at: new Date(),
        failure_reason: metadata?.reason || 'Payment failed',
      };
      await subscription.save();

      console.log(`❌ Payment failed for transaction ${transaction_id}`);

      return NextResponse.json({
        success: true,
        data: {
          message: 'Payment failed or cancelled',
          subscriptionId: subscription._id,
        },
      });

    } else if (status === 'PENDING') {
      // Keep subscription in pending state
      subscription.metadata = {
        ...subscription.metadata,
        pending_updated_at: new Date(),
      };
      await subscription.save();

      return NextResponse.json({
        success: true,
        data: {
          message: 'Payment still pending',
          subscriptionId: subscription._id,
        },
      });

    } else {
      return NextResponse.json(
        { success: false, error: `Unknown payment status: ${status}` },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint to check webhook status (for debugging)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('txn');

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({ transaction_id: transactionId })
      .populate('user_id', 'email name');

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: subscription.transaction_id,
        status: subscription.status,
        plan: subscription.plan,
        amount: subscription.amount,
        currency: subscription.currency,
        paymentMethod: subscription.payment_method,
        createdAt: subscription.createdAt,
        expiresAt: subscription.expires_at,
        metadata: subscription.metadata,
        userEmail: (subscription.user_id as any)?.email,
      },
    });

  } catch (error: any) {
    console.error('Webhook status check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch webhook status' },
      { status: 500 }
    );
  }
}
