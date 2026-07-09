import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const identifier = credentials.email as string; // we reuse 'email' field in NextAuth config for identifier
        const password = credentials.password as string;

        // Determine if it's an email (Manager/Supervisor) or phone number (Employee)
        if (identifier.includes("@")) {
          const user = await prisma.user.findUnique({
            where: { email: identifier },
          });

          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
          if (!isPasswordValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
          };
        } else {
          // Employee login by phone
          const employee = await prisma.employee.findUnique({
            where: { phone: identifier },
          });

          if (!employee || !employee.passwordHash) return null;

          const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
          if (!isPasswordValid) return null;

          return {
            id: employee.id,
            name: employee.name,
            email: employee.phone || "",
            role: "EMPLOYEE" as UserRole,
          };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
