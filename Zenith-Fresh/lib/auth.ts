import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id || '';
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};