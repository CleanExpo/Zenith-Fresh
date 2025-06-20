import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { Session } from 'next-auth';
import { Role } from '@prisma/client';

// Extend the session user type to include id
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Check for the specific admin credentials first (hardcoded for production safety)
          if (credentials.email.toLowerCase() === 'zenithfresh25@gmail.com' && credentials.password === 'F^bf35(llm1120!2a') {
            return {
              id: 'admin-user-001',
              email: 'zenithfresh25@gmail.com',
              name: 'Admin User',
            };
          }

          // For database users, wrap in try-catch for production safety
          try {
            const user = await prisma.user.findUnique({
              where: {
                email: credentials.email.toLowerCase(),
              },
            });

            if (!user) {
              return null;
            }

            const isPasswordValid = await compare(credentials.password, user.password);

            if (!isPasswordValid) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } catch (dbError) {
            console.error('Database auth error:', dbError);
            // Fall back to hardcoded admin if database fails
            if (credentials.email.toLowerCase() === 'zenithfresh25@gmail.com' && credentials.password === 'F^bf35(llm1120!2a') {
              return {
                id: 'admin-user-001',
                email: 'zenithfresh25@gmail.com',
                name: 'Admin User',
              };
            }
            return null;
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
  },
};
