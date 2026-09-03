export const dynamic = "force-dynamic";

import { getAllContacts } from "@/lib/actions/contacts";
import ContactsClient from "./contacts-client";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ContactsPage() {
  const session = await auth();
  if (session?.user?.role !== "MANAGER") {
    redirect("/dashboard");
  }

  const contacts = await getAllContacts();

  return <ContactsClient initialContacts={contacts} />;
}
