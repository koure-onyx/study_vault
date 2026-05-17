import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title')?.slice(0, 80) || 'StudyVault Pakistan';
    const subtitle = searchParams.get('subtitle')?.slice(0, 100) || 'Excellence in Education';
    const type = searchParams.get('type') || 'Topic';
    
    // Pakistani Green Color
    const pkGreen = '#01411C';
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            fontFamily: 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Top Banner - Pakistani Flag Colors */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '24px',
              background: `linear-gradient(90deg, ${pkGreen} 0%, #FFFFFF 50%, ${pkGreen} 100%)`,
            }}
          />
          
          {/* Crescent and Star Icon */}
          <div
            style={{
              fontSize: '80px',
              marginBottom: '20px',
              marginTop: '40px',
            }}
          >
            ☪️
          </div>
          
          {/* Main Title */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 'bold',
              color: pkGreen,
              margin: '0 0 24px 0',
              lineHeight: '1.1',
              textAlign: 'center',
              maxWidth: '900px',
              padding: '0 40px',
            }}
          >
            {title}
          </h1>
          
          {/* Subtitle */}
          <p
            style={{
              fontSize: '36px',
              color: '#374151',
              margin: '0 0 48px 0',
              textAlign: 'center',
              maxWidth: '800px',
              padding: '0 40px',
            }}
          >
            {subtitle}
          </p>
          
          {/* Type Badge */}
          <div
            style={{
              backgroundColor: pkGreen,
              color: '#ffffff',
              padding: '16px 48px',
              borderRadius: '9999px',
              fontSize: '28px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: '0 10px 25px rgba(1, 65, 28, 0.3)',
            }}
          >
            {type}
          </div>
          
          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              fontSize: '24px',
              color: '#6B7280',
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            studyvault.pk • Made for Pakistani Students 🇵🇰
          </div>
          
          {/* Decorative Elements */}
          <div
            style={{
              position: 'absolute',
              top: '100px',
              right: '60px',
              fontSize: '120px',
              opacity: '0.1',
              color: pkGreen,
            }}
          >
            📚
          </div>
          
          <div
            style={{
              position: 'absolute',
              bottom: '120px',
              left: '60px',
              fontSize: '100px',
              opacity: '0.1',
              color: pkGreen,
            }}
          >
            ✨
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
    });
  }
}
