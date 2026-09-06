"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Truck,
  Store,
  Plus,
  Search,
  Phone,
  ArrowRight,
  Loader2,
  X,
  Trash2,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createContact, deleteContact, deleteTransaction } from "@/lib/actions/contacts";
import { contactSchema } from "@/lib/validations";
import type { ContactEntry, ContactType, ContactTransactionWithContact } from "@/types";
import Link from "next/link";

export default function ContactsClient({
  initialContacts,
  initialTransactions = [],
  userRole,
}: {
  initialContacts: ContactEntry[];
  initialTransactions?: ContactTransactionWithContact[];
  userRole?: string;
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<ContactType>("SUPPLIER");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [formError, setFormError] = useState("");

  // Delete dialogs state
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);

  const [deleteTxDialogOpen, setDeleteTxDialogOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<ContactTransactionWithContact | null>(null);

  const suppliers = contacts.filter(
    (c) =>
      c.type === "SUPPLIER" &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );
  const buyers = contacts.filter(
    (c) =>
      c.type === "BUYER" &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddDialog = (type: ContactType) => {
    setDialogType(type);
    setForm({ name: "", phone: "" });
    setFormError("");
    setDialogOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const data = { name: form.name, phone: form.phone, type: dialogType };
    const validation = contactSchema.safeParse(data);

    if (!validation.success) {
      setFormError(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createContact(data);
        if (result.success) {
          setContacts((prev) => [...prev, result.data]);
          setDialogOpen(false);
        }
      } catch {
        setFormError("Failed to create contact.");
      }
    });
  };

  const openDeleteContactDialog = (id: string, name: string) => {
    setContactToDelete({ id, name });
    setDeleteContactDialogOpen(true);
  };

  const confirmDeleteContact = () => {
    if (!contactToDelete) return;
    const { id } = contactToDelete;

    startTransition(async () => {
      try {
        await deleteContact(id);
        setContacts((prev) => prev.filter((c) => c.id !== id));
        setTransactions((prev) => prev.filter((t) => t.contactId !== id));
        setDeleteContactDialogOpen(false);
        setContactToDelete(null);
      } catch {
        // Silently fail
        setDeleteContactDialogOpen(false);
      }
    });
  };

  const openDeleteTxDialog = (tx: ContactTransactionWithContact) => {
    setTxToDelete(tx);
    setDeleteTxDialogOpen(true);
  };

  const confirmDeleteTransaction = () => {
    if (!txToDelete) return;
    const { id, contactName, amount } = txToDelete;

    startTransition(async () => {
      try {
        const res = await deleteTransaction(id);
        if (res.success) {
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          setContacts((prev) =>
            prev.map((c) =>
              c.name === contactName
                ? {
                    ...c,
                    totalBalance:
                      res.newBalance !== undefined
                        ? res.newBalance
                        : c.totalBalance - amount,
                  }
                : c
            )
          );
          setDeleteTxDialogOpen(false);
          setTxToDelete(null);
        }
      } catch (err: any) {
        alert(err.message || "Failed to delete transaction");
        setDeleteTxDialogOpen(false);
      }
    });
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      t.contactName.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const renderContactList = (list: ContactEntry[], type: ContactType) => {
    const isSupplier = type === "SUPPLIER";
    const accentColor = isSupplier ? "cyan" : "amber";

    if (list.length === 0) {
      return (
        <div className="text-center py-12">
          <div
            className={`w-14 h-14 rounded-2xl bg-${accentColor}-50 flex items-center justify-center mx-auto mb-4`}
          >
            {isSupplier ? (
              <Truck className="w-7 h-7 text-cyan-300" />
            ) : (
              <Store className="w-7 h-7 text-amber-300" />
            )}
          </div>
          <p className="text-sm text-slate-400 mb-1">
            No {isSupplier ? "suppliers" : "buyers"} found
          </p>
          <p className="text-xs text-slate-400">
            {search
              ? "Try adjusting your search"
              : `Add your first ${isSupplier ? "supplier" : "buyer"} to get started`}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {list.map((contact) => {
          const balanceAbs = Math.abs(contact.totalBalance);
          const hasBalance = balanceAbs > 0;

          return (
            <div
              key={contact.id}
              className="group bg-white rounded-xl border border-slate-200/60 hover:border-slate-300 hover:shadow-md hover:shadow-slate-100 transition-all duration-200"
            >
              <div className="flex items-center justify-between p-4">
                <Link
                  href={`/dashboard/contacts/${contact.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
                      isSupplier
                        ? "bg-gradient-to-br from-cyan-500 to-teal-500"
                        : "bg-gradient-to-br from-amber-500 to-orange-500"
                    }`}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {contact.name}
                    </p>
                    {contact.phone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-3">
                  {hasBalance && (
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-medium text-slate-400 tracking-wider">
                        {contact.totalBalance > 0 ? "Outstanding" : "Overpaid"}
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          contact.totalBalance > 0
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        LKR{" "}
                        {balanceAbs.toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  )}
                  {!hasBalance && (
                    <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                      Settled
                    </span>
                  )}

                  {userRole === "MANAGER" && (
                    <button
                      onClick={() => openDeleteContactDialog(contact.id, contact.name)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <Link
                    href={`/dashboard/contacts/${contact.id}`}
                    prefetch={false}
                    className="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-500 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-sky-500" />
          <h1 className="text-xl font-bold text-slate-800">
            Sellers & Buyers
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Manage your fish suppliers and bulk buyers with credit tracking
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all bg-white"
        />
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg bg-white border border-slate-200/60 h-auto p-1 rounded-xl">
          <TabsTrigger
            value="suppliers"
            className="rounded-lg py-2.5 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <Truck className="w-4 h-4 mr-1.5 sm:mr-2" />
            Suppliers ({suppliers.length})
          </TabsTrigger>
          <TabsTrigger
            value="buyers"
            className="rounded-lg py-2.5 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <Store className="w-4 h-4 mr-1.5 sm:mr-2" />
            Buyers ({buyers.length})
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-lg py-2.5 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:shadow-sm text-xs sm:text-sm"
          >
            <Receipt className="w-4 h-4 mr-1.5 sm:mr-2" />
            Transactions ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => openAddDialog("SUPPLIER")}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
          {renderContactList(suppliers, "SUPPLIER")}
        </TabsContent>

        <TabsContent value="buyers" className="mt-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => openAddDialog("BUYER")}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Buyer
            </button>
          </div>
          {renderContactList(buyers, "BUYER")}
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-sky-500" />
                  All Transactions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full transaction history across suppliers and buyers
                </p>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  {search
                    ? "No transactions match your search."
                    : "No transactions recorded yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Amount (LKR)
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString("en-LK", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            href={`/dashboard/contacts/${tx.contactId}`}
                            className="font-medium text-slate-800 hover:text-sky-600 flex items-center gap-1.5"
                          >
                            <span>{tx.contactName}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                tx.contactType === "SUPPLIER"
                                  ? "bg-cyan-50 text-cyan-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {tx.contactType === "SUPPLIER"
                                ? "Supplier"
                                : "Buyer"}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-slate-600 font-medium">
                          {tx.description}
                        </td>
                        <td
                          className={`px-5 py-3 text-right font-semibold whitespace-nowrap ${
                            tx.amount > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {userRole === "MANAGER" && (
                            <button
                              onClick={() => openDeleteTxDialog(tx)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === "SUPPLIER" ? (
                <Truck className="w-5 h-5 text-cyan-500" />
              ) : (
                <Store className="w-5 h-5 text-amber-500" />
              )}
              Add New {dialogType === "SUPPLIER" ? "Supplier" : "Buyer"}
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                placeholder="Contact name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  input.value = input.value.replace(/[^0-9+\-\s()]/g, "");
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"
                placeholder="07X XXX XXXX"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`flex-1 py-2.5 rounded-lg text-white text-sm font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${
                  dialogType === "SUPPLIER"
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 shadow-cyan-500/20 hover:shadow-cyan-500/40"
                    : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/20 hover:shadow-amber-500/40"
                }`}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add{" "}
                    {dialogType === "SUPPLIER" ? "Supplier" : "Buyer"}
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Contact Dialog */}
      <Dialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete Contact
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete{" "}
              <strong className="text-slate-700 font-semibold">
                "{contactToDelete?.name}"
              </strong>
              ? All associated transaction history will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setDeleteContactDialogOpen(false);
                setContactToDelete(null);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={confirmDeleteContact}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Contact
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Dialog */}
      <Dialog open={deleteTxDialogOpen} onOpenChange={setDeleteTxDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete Transaction
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to delete this transaction? Total balance will be automatically recalculated. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {txToDelete && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-700">
                  {new Date(txToDelete.date).toLocaleDateString("en-LK", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact:</span>
                <span className="font-semibold text-slate-700">
                  {txToDelete.contactName} ({txToDelete.contactType})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Description:</span>
                <span className="font-semibold text-slate-700 max-w-[200px] truncate text-right">
                  {txToDelete.description}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">Amount:</span>
                <span
                  className={`font-bold ${
                    txToDelete.amount > 0 ? "text-rose-600" : "text-emerald-600"
                  }`}
                >
                  {txToDelete.amount > 0 ? "+" : ""}
                  {txToDelete.amount.toLocaleString("en-LK", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  LKR
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setDeleteTxDialogOpen(false);
                setTxToDelete(null);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={confirmDeleteTransaction}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Transaction
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
