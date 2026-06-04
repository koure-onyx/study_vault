import { NextRequest } from 'next/server';

function logoutResponse() {
  const response = Response.json({ success: true, data: { message: 'Logged out' } });
  response.headers.set(
    'Set-Cookie',
    `sv_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
  return response;
}

export async function DELETE(_req: NextRequest) {
  return logoutResponse();
}

export async function POST(_req: NextRequest) {
  return logoutResponse();
}
