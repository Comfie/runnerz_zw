import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { normaliseContact, verifyCode } from "@/lib/otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      id: "otp",
      credentials: { contact: {}, code: {}, name: {} },
      async authorize(creds) {
        const { contact } = normaliseContact(String(creds?.contact ?? ""));
        const code = String(creds?.code ?? "");
        const otp = await db.otpCode.findFirst({
          where: { contact, consumed: false },
          orderBy: { createdAt: "desc" },
        });

        if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5) {
          return null;
        }

        if (!verifyCode(code, otp.codeHash)) {
          await db.otpCode.update({
            where: { id: otp.id },
            data: { attempts: { increment: 1 } },
          });
          return null;
        }

        await db.otpCode.update({
          where: { id: otp.id },
          data: { consumed: true },
        });

        const isEmail = contact.includes("@");
        const user = await db.user.upsert({
          where: isEmail ? { email: contact } : { phone: contact },
          update: {},
          create: {
            name: String(creds?.name ?? "Runner"),
            ...(isEmail ? { email: contact } : { phone: contact }),
          },
        });

        return { id: user.id, name: user.name, role: user.role } as {
          id: string;
          name: string;
          role: string;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role;
      }
      if (token.uid) {
        const currentUser = await db.user.findUnique({
          where: { id: String(token.uid) },
          select: { name: true, role: true },
        });
        if (currentUser) {
          token.name = currentUser.name;
          token.role = currentUser.role;
        }
      }
      return token;
    },
    session({ session, token }) {
      (session.user as { id?: unknown; role?: unknown }).id = token.uid;
      (session.user as { id?: unknown; role?: unknown }).role = token.role;
      return session;
    },
  },
});
