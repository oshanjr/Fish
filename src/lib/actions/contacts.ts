"use server";

import { prisma } from "@/lib/prisma";
import { contactSchema, contactTransactionSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getAllContacts(type?: "SUPPLIER" | "BUYER") {
  const contacts = await prisma.contact.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });

  return contacts.map((c) => ({
    ...c,
    totalBalance: Number(c.totalBalance),
  }));
}

export async function getContactById(id: string) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  return {
    ...contact,
    totalBalance: Number(contact.totalBalance),
    transactions: contact.transactions.map((t) => ({
      ...t,
      date: t.date.toISOString(),
      amount: Number(t.amount),
    })),
  };
}

export async function createContact(data: {
  name: string;
  phone?: string;
  type: "SUPPLIER" | "BUYER";
}) {
  const validated = contactSchema.parse(data);

  const contact = await prisma.contact.create({
    data: {
      name: validated.name,
      phone: validated.phone || null,
      type: validated.type,
      totalBalance: 0,
    },
  });

  revalidatePath("/dashboard/contacts");
  return {
    success: true,
    data: { ...contact, totalBalance: Number(contact.totalBalance) },
  };
}

export async function updateContact(
  id: string,
  data: { name: string; phone?: string }
) {
  const contact = await prisma.contact.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone || null,
    },
  });

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${id}`);
  return {
    success: true,
    data: { ...contact, totalBalance: Number(contact.totalBalance) },
  };
}

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/dashboard/contacts");
  return { success: true };
}

export async function addTransaction(data: {
  contactId: string;
  description: string;
  amount: number;
}) {
  const validated = contactTransactionSchema.parse(data);

  // Create the transaction
  const transaction = await prisma.contactTransaction.create({
    data: {
      contactId: validated.contactId,
      description: validated.description,
      amount: validated.amount,
    },
  });

  // Recalculate total balance from all transactions
  const result = await prisma.contactTransaction.aggregate({
    where: { contactId: validated.contactId },
    _sum: { amount: true },
  });

  const newBalance = Number(result._sum.amount || 0);

  await prisma.contact.update({
    where: { id: validated.contactId },
    data: { totalBalance: newBalance },
  });

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${validated.contactId}`);
  return {
    success: true,
    data: {
      ...transaction,
      date: transaction.date.toISOString(),
      amount: Number(transaction.amount),
    },
  };
}

export async function deleteTransaction(id: string) {
  const transaction = await prisma.contactTransaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  await prisma.contactTransaction.delete({ where: { id } });

  // Recalculate total balance
  const result = await prisma.contactTransaction.aggregate({
    where: { contactId: transaction.contactId },
    _sum: { amount: true },
  });

  const newBalance = Number(result._sum.amount || 0);

  await prisma.contact.update({
    where: { id: transaction.contactId },
    data: { totalBalance: newBalance },
  });

  revalidatePath("/dashboard/contacts");
  revalidatePath(`/dashboard/contacts/${transaction.contactId}`);
  return { success: true };
}

export async function getTodaysTransactions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const transactions = await prisma.contactTransaction.findMany({
    where: {
      date: {
        gte: today,
      }
    },
    include: {
      contact: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return transactions.map(t => ({
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    amount: Number(t.amount),
  }));
}

