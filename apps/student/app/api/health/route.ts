import { NextResponse } from 'next/server';
import dbConnect from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';
import Topic from '@studyvault/db/models/Topic';

/**
 * System Health Check Endpoint for StudyVault PK
 * 
 * Validates:
 * - MongoDB connectivity and response time
 * - Database collection integrity
 * - AI credit synchronization status
 * - Overall system readiness
 * 
 * Returns detailed health metrics for monitoring dashboards.
 */

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, any> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  try {
    // 1. Database Connection Test
    const dbStart = Date.now();
    try {
      await dbConnect();
      const dbLatency = Date.now() - dbStart;
      
      checks.database = {
        status: 'connected',
        latency_ms: dbLatency,
        healthy: dbLatency < 1000,
      };

      if (dbLatency >= 1000) {
        overallStatus = 'degraded';
      }
    } catch (dbError) {
      checks.database = {
        status: 'disconnected',
        error: (dbError as Error).message,
        healthy: false,
      };
      overallStatus = 'unhealthy';
    }

    // 2. Collection Integrity Checks (only if DB is connected)
    if (checks.database.healthy) {
      try {
        const [userCount, topicCount] = await Promise.all([
          User.countDocuments(),
          Topic.countDocuments({ is_live: true }),
        ]);

        checks.collections = {
          users: { count: userCount, healthy: true },
          topics: { count: topicCount, healthy: topicCount > 0 },
        };

        if (topicCount === 0) {
          overallStatus = 'degraded';
          checks.collections.topics.warning = 'No live topics found';
        }
      } catch (collectionError) {
        checks.collections = {
          status: 'error',
          error: (collectionError as Error).message,
          healthy: false,
        };
        overallStatus = 'degraded';
      }
    }

    // 3. AI Credit Sync Check (sample user check)
    try {
      const sampleUser = await User.findOne({
        'subscription.status': 'active',
        'subscription.ai_credits_reset_at': { $exists: true },
      }).select('subscription');

      if (sampleUser) {
        const lastReset = sampleUser.subscription?.ai_credits_reset_at;
        const now = new Date();
        
        // Check if reset logic is working (should reset daily)
        const shouldHaveReset = lastReset && 
          (now.getTime() - lastReset.getTime()) > 24 * 60 * 60 * 1000;

        checks.aiCredits = {
          status: shouldHaveReset ? 'needs_review' : 'synced',
          sample_checked: true,
          healthy: !shouldHaveReset,
        };

        if (shouldHaveReset) {
          overallStatus = 'degraded';
        }
      } else {
        checks.aiCredits = {
          status: 'no_active_users',
          healthy: true,
        };
      }
    } catch (aiCreditError) {
      checks.aiCredits = {
        status: 'check_failed',
        error: (aiCreditError as Error).message,
        healthy: false,
      };
      // Don't downgrade overall status for this
    }

    // 4. Overall System Metrics
    const totalLatency = Date.now() - startTime;
    
    checks.system = {
      total_check_time_ms: totalLatency,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Determine final status
    const isHealthy = overallStatus === 'healthy';
    const isDegraded = overallStatus === 'degraded';

    return NextResponse.json(
      {
        success: true,
        status: overallStatus,
        healthy: isHealthy,
        checks,
        message: isHealthy 
          ? 'All systems operational' 
          : isDegraded 
            ? 'Some systems degraded' 
            : 'Critical system failure',
      },
      { 
        status: isHealthy ? 200 : isDegraded ? 207 : 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );

  } catch (error) {
    console.error('[HealthCheck] Fatal error:', error);
    
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        healthy: false,
        checks: {
          fatal_error: {
            message: (error as Error).message,
            stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
          },
        },
        message: 'System health check failed',
      },
      { 
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
