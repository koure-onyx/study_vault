import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';

// In-memory store for global AI provider config (in production, use Redis or DB)
let globalAIProvider = process.env.AI_PROVIDER || 'gemini';

/**
 * GET /api/admin/config/ai-provider
 * Returns current active AI provider
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

    return NextResponse.json({
      success: true,
      data: {
        provider: globalAIProvider,
        availableProviders: ['gemini', 'openai', 'auto-balance']
      }
    });

  } catch (error) {
    console.error('[Admin AI Config GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/config/ai-provider
 * Updates global AI provider configuration
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider } = body;

    // Validate provider
    const validProviders = ['gemini', 'openai', 'auto-balance'];
    if (!provider || !validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Update global configuration
    globalAIProvider = provider;
    
    // Update environment variable for child processes
    process.env.AI_PROVIDER = provider;

    console.log(`[AI Provider Switched] Changed from previous to: ${provider}`);

    return NextResponse.json({
      success: true,
      message: `AI provider successfully switched to ${provider}`,
      data: {
        provider: globalAIProvider,
        switchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Admin AI Config POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
