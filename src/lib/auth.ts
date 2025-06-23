import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { compare, hash } from 'bcryptjs';
import { Session } from 'next-auth';
import { getServerSession } from 'next-auth';

// Token refresh function
async function refreshAccessToken(token: any) {
  try {
    const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    // Update the Account in the database with the new token
    await prisma.account.update({
        where: {
            provider_providerAccountId: {
                provider: 'google',
                providerAccountId: token.user.id, // Assuming user.id is providerAccountId
            },
        },
        data: {
            access_token: refreshedTokens.access_token,
            expires_at: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
            refresh_token: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        }
    });

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

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
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-production',
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
            return null;
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/business.manage"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }

      // Persist the OAuth access_token and other details to the token right after sign-in
      if (account) {
        token.accessToken = account.access_token;
        token.accessTokenExpires = Date.now() + (account.expires_at ?? 0) * 1000;
        token.refreshToken = account.refresh_token;
      }

      // If the access token has not expired, return the previous token
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // If the access token has expired and we have a refresh token, refresh it
      if (token.refreshToken) {
        console.log("Access token has expired, refreshing...");
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && token.user) {
        session.user = {
          id: token.user.id,
          email: token.user.email,
          name: token.user.name,
        };
      }
      
      return session;
    },
  },
};

// Helper function to get the server session
export async function auth() {
  return await getServerSession(authOptions);
}
