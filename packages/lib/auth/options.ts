import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "../mongodb";
import { User } from "@study-vault/db";

/**
 * Sprint 1: Auth Cleanup
 * 
 * Changes:
 * 1. Strictly enforce Google Provider (removed Credentials provider)
 * 2. Session callback explicitly maps user.id to session
 * 3. Fixes "Login Button Ghosting" by ensuring consistent session state
 */
export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
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
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Ensure only Google provider is used
      if (account?.provider !== "google") {
        return false;
      }
      
      // Sync user data with database on sign in
      if (user.email) {
        try {
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user if doesn't exist
            await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
            });
          } else {
            // Update last login
            await User.updateOne(
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
      // CRITICAL FIX: Explicitly map user.id to session
      // This prevents "Login Button Ghosting" where client-side useSession
      // has undefined or stale user data
      
      if (token.sub && session.user) {
        session.user.id = token.sub;
        
        // Fetch fresh user data from DB to ensure consistency
        try {
          const dbUser = await User.findOne({ email: session.user.email });
          if (dbUser) {
            session.user.role = dbUser.role || "student";
            session.user.subscriptionStatus = dbUser.subscriptionStatus || "free";
            session.user.lastLogin = dbUser.lastLogin;
          }
        } catch (error) {
          console.error("Error fetching user data for session:", error);
        }
      }
      
      return session;
    },
    
    async jwt({ token, user, trigger, session }) {
      // Persist user data to JWT token
      if (user) {
        token.id = user.id;
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }
      
      return token;
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
