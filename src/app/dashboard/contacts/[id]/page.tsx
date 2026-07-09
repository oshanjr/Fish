export const dynamic = "force-dynamic";

import { getContactById } from "@/lib/actions/contacts";
import ContactDetailClient from "./contact-detail-client";
import { notFound } from "next/navigation";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const contact = await getContactById(id);
    return <ContactDetailClient contact={contact} />;
  } catch {
    notFound();
  }
}
