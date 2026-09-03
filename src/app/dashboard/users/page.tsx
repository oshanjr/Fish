import { getSystemUsers } from "@/lib/actions/users";
import UsersClient from "./users-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "System Users | Fish Store Manager",
};

export default async function UsersPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "MANAGER") {
    redirect("/dashboard");
  }

  const users = await getSystemUsers();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <UsersClient 
        initialUsers={users} 
        currentUserId={session.user.id!} 
      />
    </div>
  );
}
