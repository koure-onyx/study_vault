import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@studyvault/db/connect";
import User from "@studyvault/db/models/User";

/**
 * Shared NextAuth config used by admin + student apps.
 * Google is enabled only when credentials are present.
 */
const hasGoogleOAuth =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET) &&
  !process.env.GOOGLE_CLIENT_ID?.startsWith("placeholder");

const providers: any[] = hasGoogleOAuth
  ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    ]
  : [];

// Fallback provider to prevent NextAuth from failing if no providers are configured
if (providers.length === 0) {
  providers.push({
    id: "placeholder",
    name: "Placeholder",
    type: "credentials",
    credentials: {},
    authorize: () => null,
  });
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return false;
      }

      if (user.email) {
        try {
          await connectDB();
          const UserModel = User as any;
          const existingUser = await UserModel.findOne({ email: user.email });

          if (!existingUser) {
            await UserModel.create({
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            });
          } else {
            await UserModel.updateOne(
              { email: user.email },
              { $set: { lastLogin: new Date() } }
            );
          }
        } catch (error) {
          console.error("Error syncing user on sign in:", error);
        }
      }
      
      return true;
    },

    async session({ session, token, user }) {
      if (session.user) {
        const tokenAny = token as any;
        const sessionUser = session.user as any;
        const userId = (tokenAny.sub || tokenAny.id) as string | undefined;
        if (userId) {
          sessionUser.id = userId;
        }

        try {
          await connectDB();
          const UserModel = User as any;
          const dbUser = await UserModel.findOne({ email: session.user.email });
          if (dbUser) {
            sessionUser.role = dbUser.role || "student";
            sessionUser.subscriptionStatus = dbUser.subscriptionStatus || "free";
            sessionUser.lastLogin = dbUser.lastLogin;
          }
        } catch (error) {
          console.error("Error fetching user data for session:", error);
        }
      }

      return session;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        (token as any).id = user.id || token.sub;
      }

      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }

      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
