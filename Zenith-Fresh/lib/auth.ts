import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { APICache } from './cache';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo user credentials as mentioned in CLAUDE.md
        if (credentials.email === 'zenithfresh25@gmail.com' && 
            credentials.password === 'F^bf35(llm1120!2a') {
          return {
            id: 'demo-user',
            email: 'zenithfresh25@gmail.com',
            name: 'Demo User',
            role: 'admin'
          } as any;
        }

        // Add your database user verification logic here
        // For now, return null for other credentials
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Cache session data for faster lookups
        const sessionCacheKey = `auth:session:${token.id}`;
        
        const cachedSession = await APICache.get(sessionCacheKey);
        if (cachedSession) {
          return cachedSession as any;
        }
        
        (session.user as any).id = token.id || '';
        (session.user as any).role = (token as any).role;
        (session.user as any).accessToken = token.accessToken;
        
        // Cache the session for 5 minutes
        await APICache.set(sessionCacheKey, session, { ttl: 300 });
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow all sign-ins for now
      return true;
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', { 
        userId: user.id, 
        email: user.email, 
        provider: account?.provider,
        isNewUser 
      });
    },
    async signOut({ token, session }) {
      console.log('User signed out:', { userId: token?.id });
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};