import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import connectDB from '@studyvault/db/connect';
import Subscription from '@studyvault/db/models/Subscription';

/**
 * GET /api/admin/webhooks
 * Returns last 50 webhook events chronologically
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const webhooks = await Subscription.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .select('provider amount status transaction_id payment_method metadata createdAt')
      .lean();

    return NextResponse.json({
      success: true,
      data: webhooks.map(webhook => ({
        id: webhook._id,
        provider: webhook.payment_method || 'unknown',
        amount: webhook.amount,
        currency: webhook.currency,
        status: webhook.status === 'active' ? 200 : webhook.status === 'pending' ? 400 : 500,
        statusCode: webhook.status,
        transactionId: webhook.transaction_id,
        metadata: webhook.metadata,
        createdAt: webhook.createdAt
      }))
    });

  } catch (error) {
    console.error('[Admin Webhooks GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhooks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
