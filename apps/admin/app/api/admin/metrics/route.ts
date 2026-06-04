import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import Subscription from '@studyvault/db/models/Subscription';

/**
 * GET /api/admin/metrics
 * Returns real-time system analytical data
 */
export async function GET() {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Execute parallel MongoDB aggregation queries
    const [
      totalUsers,
      premiumSubscribers,
      totalRevenue,
      webhookStats
    ] = await Promise.all([
      // 1. Total registered users
      User.countDocuments({}),
      
      // 2. Active premium subscribers
      User.countDocuments({
        'subscription.status': 'active',
        'subscription.plan': { $in: ['basic', 'premium', 'family'] }
      }),
      
      // 3. Total course revenue (sum of successful transactions)
      Subscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // 4. Webhook reconciliation success rate
      Subscription.aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 100 },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calculate webhook success rate
    const successful = webhookStats.find(s => s._id === 'active')?.count || 0;
    const failed = webhookStats.find(s => s._id === 'expired')?.count || 0;
    const pending = webhookStats.find(s => s._id === 'pending')?.count || 0;
    const total = successful + failed + pending;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        premiumSubscribers,
        totalRevenue: totalRevenue[0]?.total || 0,
        webhookStats: {
          successful,
          failed,
          pending,
          total,
          successRate: Math.round(successRate * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('[Admin Metrics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
