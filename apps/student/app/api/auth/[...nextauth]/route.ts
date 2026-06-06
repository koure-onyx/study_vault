import NextAuth from 'next-auth';
import { authOptions } from '@studyvault/lib/auth/options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
