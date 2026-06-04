import NextAuth from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';

// Admin-specific NextAuth handler using shared authOptions
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
