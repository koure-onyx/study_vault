import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@studyvault/db/connect';
import User from '@studyvault/db/models/User';

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const hasGoogleOAuth = googleClientId && googleClientSecret && !googleClientId.startsWith('placeholder');

export const authOptions = {
  providers: hasGoogleOAuth
    ? [
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
        }),
      ]
    : [],
  callbacks: {
    async signIn({ user, account, profile }: any) {
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
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.dbUserId;
        session.user.role = token.role;
        session.user.board = token.board;
        session.user.grade = token.grade;
        session.user.class = token.class;
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
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
    async redirect({ url, baseUrl }: any) {
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
};

// For credentials-based auth (email/password)
export const credentialsProvider = CredentialsProvider({
  name: 'credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials: any) {
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Email and password required');
    }

    await connectDB();
    const user = await User.findOne({ email: credentials.email.toLowerCase() });
    
    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password');
    }

    const valid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const onboardingComplete = Boolean(user.onboardingComplete || user.student_profile?.onboarding_completed);
    
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      board: user.board || user.student_profile?.board,
      grade: user.grade || user.student_profile?.grade,
      class: user.class || user.student_profile?.class,
      onboardingComplete,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
    };
  },
});
