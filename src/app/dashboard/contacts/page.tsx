export const dynamic = "force-dynamic";

import { getAllContacts } from "@/lib/actions/contacts";
import ContactsClient from "./contacts-client";

export default async function ContactsPage() {
  const contacts = await getAllContacts();

  return <ContactsClient initialContacts={contacts} />;
}
