import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '@/generated/prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("Authorize function called with:", credentials);

        if (!credentials) {
          console.log("No credentials provided, returning null.");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        console.log("User found in DB:", user);

        if (user) {
          const passwordMatch = await bcrypt.compare(credentials.password, user.password);
          console.log("Password match result:", passwordMatch);

          if (passwordMatch) {
            console.log("Authentication successful, returning user object.");
            return { id: user.id.toString(), name: user.username, role: user.role };
          } else {
            console.log("Password mismatch, returning null.");
            return null;
          }
        } else {
          console.log("User not found, returning null.");
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // When the user signs in, add their role to the token
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add the role to the session object
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
