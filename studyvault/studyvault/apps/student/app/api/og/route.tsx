import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const title = searchParams.get('title')?.slice(0, 100) || 'StudyVault Pakistan';
    const subtitle = searchParams.get('subtitle')?.slice(0, 100) || 'Excellence in Education';
    const type = searchParams.get('type') || 'topic';
    const subject = searchParams.get('subject') || 'Physics';
    
    // Fetch a custom font or use system fonts
    const fontData = await fetch(
      new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff')
    ).then((res) => res.arrayBuffer());

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
            backgroundImage: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
            fontFamily: 'Inter, sans-serif',
            padding: '60px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative Circle */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              opacity: 0.1,
            }}
          />
          
          {/* Pakistani Flag Stripe */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '12px',
              background: 'linear-gradient(90deg, #01411C 0%, #FFFFFF 50%, #01411C 100%)',
            }}
          />
          
          {/* Main Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              width: '100%',
              maxWidth: '900px',
              textAlign: 'center',
              zIndex: 1,
            }}
          >
            {/* Logo & Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '30px',
                gap: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: '#01411C',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                📚
              </div>
              <div
                style={{
                  fontSize: '42px',
                  fontWeight: '800',
                  color: '#01411C',
                  letterSpacing: '-1px',
                }}
              >
                StudyVault PK
              </div>
            </div>
            
            {/* Subject Badge */}
            <div
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                padding: '10px 24px',
                borderRadius: '9999px',
                fontSize: '22px',
                fontWeight: '600',
                marginBottom: '24px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                boxShadow: '0 4px 6px rgba(5, 150, 105, 0.2)',
              }}
            >
              {subject}
            </div>
            
            {/* Title */}
            <h1
              style={{
                fontSize: '56px',
                fontWeight: '800',
                color: '#01411C',
                margin: '0 0 24px 0',
                lineHeight: '1.15',
                textAlign: 'center',
                maxWidth: '850px',
                letterSpacing: '-1.5px',
              }}
            >
              {title}
            </h1>
            
            {/* Subtitle */}
            <div
              style={{
                fontSize: '28px',
                color: '#374151',
                margin: '0 0 40px 0',
                textAlign: 'center',
                fontWeight: '500',
              }}
            >
              {subtitle}
            </div>
            
            {/* Type Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: '#ffffff',
                border: '2px solid #059669',
                color: '#059669',
                padding: '14px 32px',
                borderRadius: '16px',
                fontSize: '24px',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)',
              }}
            >
              {type === 'topic' && '📖'}
              {type === 'chapter' && '📚'}
              {type === 'quiz' && '✏️'}
              {type.toUpperCase()}
            </div>
          </div>
          
          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '30px',
              fontSize: '20px',
              color: '#6b7280',
              textAlign: 'center',
              width: '100%',
              fontWeight: '600',
              letterSpacing: '0.5px',
            }}
          >
            studyvault.pk • Made for Pakistani Students 🇵🇰
          </div>
          
          {/* Bottom Gradient Stripe */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: 'linear-gradient(90deg, #01411C 0%, #059669 50%, #01411C 100%)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
            weight: 800,
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}
