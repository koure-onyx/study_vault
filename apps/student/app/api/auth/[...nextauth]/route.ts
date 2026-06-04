import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const hasGoogleOAuth = googleClientId && googleClientSecret && !googleClientId.startsWith('placeholder');

const providers: any[] = [];
if (hasGoogleOAuth) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    })
  );
}

const handler = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        await connectDB();
        try {
          let dbUser = await User.findOne({ email: user.email?.toLowerCase() });

          if (!dbUser) {
            dbUser = await User.create({
              name: user.name,
              email: user.email?.toLowerCase(),
              google_id: profile?.sub || account.providerAccountId,
              avatar_url: user.image,
              is_verified: true,
              role: 'student',
              onboardingComplete: false,
              student_profile: {
                onboarding_completed: false,
              },
            });
          } else if (!dbUser.google_id) {
            dbUser.google_id = profile?.sub || account.providerAccountId;
            dbUser.avatar_url = user.image;
            await dbUser.save();
          }
          return true;
        } catch (err) {
          console.error('Error saving user on sign in', err);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).user.id = token.dbUserId;
        (session as any).user.role = token.role;
        (session as any).user.board = token.board;
        (session as any).user.grade = token.grade;
        (session as any).user.class = token.class;
        (session as any).user.onboardingComplete = Boolean(token.onboardingComplete);
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email.toLowerCase() }).lean();
        if (dbUser) {
          token.dbUserId = dbUser._id.toString();
          token.role = dbUser.role;
          token.board = dbUser.board || dbUser.student_profile?.board;
          token.grade = dbUser.grade || dbUser.student_profile?.grade;
          token.class = dbUser.class || dbUser.student_profile?.class;
          token.onboardingComplete = Boolean(
            dbUser.onboardingComplete || dbUser.student_profile?.onboarding_completed
          );
        }
      } else if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email.toLowerCase() }).lean();
        if (dbUser) {
          token.dbUserId = dbUser._id.toString();
          token.role = dbUser.role;
          token.board = dbUser.board || dbUser.student_profile?.board;
          token.grade = dbUser.grade || dbUser.student_profile?.grade;
          token.class = dbUser.class || dbUser.student_profile?.class;
          token.onboardingComplete = Boolean(
            dbUser.onboardingComplete || dbUser.student_profile?.onboarding_completed
          );
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
