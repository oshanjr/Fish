"use client";

import { useState, useTransition } from "react";
import { addSystemUser, deleteSystemUser } from "@/lib/actions/users";
import { Shield, Plus, Trash2, Loader2, UserCog, Mail, Key } from "lucide-react";
import { systemUserSchema } from "@/lib/validations";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export default function UsersClient({ 
  initialUsers,
  currentUserId
}: { 
  initialUsers: SystemUser[],
  currentUserId: string
}) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SUPERVISOR",
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validation = systemUserSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await addSystemUser(form);
        if (result.success) {
          setUsers((prev) => [result.data as SystemUser, ...prev]);
          setForm({ name: "", email: "", password: "", role: "SUPERVISOR" });
          setSuccess("System user created successfully");
        }
      } catch (err: any) {
        setError(err.message || "Failed to create user");
      }
    });
  };

  const handleDeleteUser = (id: string) => {
    if (!confirm("Are you sure you want to delete this user? They will lose all access immediately.")) {
      return;
    }

    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await deleteSystemUser(id);
        if (result.success) {
          setUsers((prev) => prev.filter(u => u.id !== id));
          setSuccess("System user deleted successfully");
        }
      } catch (err: any) {
        setError(err.message || "Failed to delete user");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold text-slate-800">System Users</h1>
        </div>
        <p className="text-sm text-slate-500">
          Manage users who have access to the dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add User Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" />
              Add System User
            </h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Access Level
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 bg-white"
                >
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="MANAGER">Manager</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Managers have full access including user management. Supervisors cannot access users, reports or sync.
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-md hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create User"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" />
                Registered Users
              </h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                {users.length} Users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Added On
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === "MANAGER" 
                            ? "bg-purple-100 text-purple-700" 
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString("en-LK", {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {user.id !== currentUserId ? (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 italic px-2">You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No system users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
