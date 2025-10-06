import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

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

        try {
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
        } catch (error) {
          console.error("Database error during authorization:", error);
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
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
