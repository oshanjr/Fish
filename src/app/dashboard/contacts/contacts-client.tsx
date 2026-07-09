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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createContact, deleteContact } from "@/lib/actions/contacts";
import { contactSchema } from "@/lib/validations";
import type { ContactEntry, ContactType } from "@/types";
import Link from "next/link";

export default function ContactsClient({
  initialContacts,
}: {
  initialContacts: ContactEntry[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<ContactType>("SUPPLIER");
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [formError, setFormError] = useState("");

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

  const handleDelete = (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? All transaction history will be lost.`
      )
    )
      return;

    startTransition(async () => {
      try {
        await deleteContact(id);
        setContacts((prev) => prev.filter((c) => c.id !== id));
      } catch {
        // Silently fail
      }
    });
  };

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

                  <button
                    onClick={() => handleDelete(contact.id, contact.name)}
                    disabled={isPending}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/dashboard/contacts/${contact.id}`}
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
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-white border border-slate-200/60 h-auto p-1 rounded-xl">
          <TabsTrigger
            value="suppliers"
            className="rounded-lg py-2.5 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm"
          >
            <Truck className="w-4 h-4 mr-2" />
            Suppliers ({suppliers.length})
          </TabsTrigger>
          <TabsTrigger
            value="buyers"
            className="rounded-lg py-2.5 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm"
          >
            <Store className="w-4 h-4 mr-2" />
            Buyers ({buyers.length})
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
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
    </div>
  );
}
