export const dynamic = "force-dynamic";

import { getAllContacts, getAllContactTransactions } from "@/lib/actions/contacts";
import ContactsClient from "./contacts-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ContactsPage() {
  const session = await auth();
  if (session?.user?.role !== "MANAGER" && session?.user?.role !== "SUPERVISOR") {
    redirect("/dashboard");
  }

  let contacts: any[] = [];
  let transactions: any[] = [];

  try {
    const data = await Promise.all([
      getAllContacts(),
      getAllContactTransactions(200),
    ]);
    contacts = data[0];
    transactions = data[1];
  } catch (error) {
    console.error("Error fetching contacts data:", error);
  }

  return (
    <ContactsClient 
      initialContacts={contacts} 
      initialTransactions={transactions}
      userRole={session?.user?.role ?? "EMPLOYEE"}
    />
  );
}
