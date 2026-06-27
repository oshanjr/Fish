import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import DashboardShell from "@/components/dashboard-shell";
import type { UserRole } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    id: session.user.id,
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    role: (session.user.role ?? "SUPERVISOR") as UserRole,
  };

  return (
    <SessionProvider session={session}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </SessionProvider>
  );
}
