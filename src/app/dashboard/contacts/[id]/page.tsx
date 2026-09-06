export const dynamic = "force-dynamic";

import { getContactById } from "@/lib/actions/contacts";
import ContactDetailClient from "./contact-detail-client";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const session = await auth();
  if (session?.user?.role !== "MANAGER" && session?.user?.role !== "SUPERVISOR") {
    redirect("/dashboard");
  }

  try {
    const contact = await getContactById(id);
    return (
      <ContactDetailClient 
        contact={contact} 
        userRole={session?.user?.role ?? "EMPLOYEE"}
      />
    );
  } catch {
    notFound();
  }
}
