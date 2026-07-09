"use client";

import { useState, useTransition } from "react";
import {
  Fish,
  Plus,
  Trash2,
  Scale,
  DollarSign,
  Loader2,
  Settings,
} from "lucide-react";
import { createFishIntake, deleteInventoryLog } from "@/lib/actions/inventory";
import { addFishType } from "@/lib/actions/fish-types";
import { fishIntakeSchema } from "@/lib/validations";

interface InventoryLog {
  id: string;
  fishType: string;
  incomingWeight: number;
  buyingPricePerKg: number;
  sellingPricePerKg: number;
  wastageWeight: number;
}

interface FishTypeModel {
  id: string;
  name: string;
}

export default function MorningIntakeClient({
  initialLogs,
  fishTypes: initialFishTypes,
}: {
  initialLogs: InventoryLog[];
  fishTypes: FishTypeModel[];
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [fishTypes, setFishTypes] = useState(initialFishTypes);
  const [isPending, startTransition] = useTransition();
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const [formData, setFormData] = useState({
    fishType: "",
    incomingWeight: "",
    buyingPricePerKg: "",
    sellingPricePerKg: "",
  });
  const [error, setError] = useState("");

  const handleAddFishType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    startTransition(async () => {
      try {
        const result = await addFishType(newTypeName);
        if (result.success) {
          setFishTypes((prev) => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)));
          setFormData((prev) => ({ ...prev, fishType: result.data.name }));
          setNewTypeName("");
          setIsAddingType(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to add fish type.");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.fishType === "ADD_NEW") {
      setIsAddingType(true);
      return;
    }

    const data = {
      fishType: formData.fishType,
      incomingWeight: parseFloat(formData.incomingWeight),
      buyingPricePerKg: parseFloat(formData.buyingPricePerKg),
      sellingPricePerKg: parseFloat(formData.sellingPricePerKg),
    };

    const validation = fishIntakeSchema.safeParse(data);
    
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createFishIntake(data);
        if (result.success) {
          setLogs((prev) => [
            {
              id: result.data.id,
              fishType: result.data.fishType,
              incomingWeight: Number(result.data.incomingWeight),
              buyingPricePerKg: Number(result.data.buyingPricePerKg),
              sellingPricePerKg: Number(result.data.sellingPricePerKg),
              wastageWeight: Number(result.data.wastageWeight),
            },
            ...prev,
          ]);
          setFormData({
            fishType: "",
            incomingWeight: "",
            buyingPricePerKg: "",
            sellingPricePerKg: "",
          });
        }
      } catch {
        setError("Failed to add fish intake. Please try again.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteInventoryLog(id);
        setLogs((prev) => prev.filter((log) => log.id !== id));
      } catch {
        setError("Failed to delete entry.");
      }
    });
  };

  const totalWeight = logs.reduce((sum, log) => sum + log.incomingWeight, 0);
  const totalCost = logs.reduce(
    (sum, log) => sum + log.incomingWeight * log.buyingPricePerKg,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Fish className="w-5 h-5 text-cyan-500" />
          <h1 className="text-xl font-bold text-slate-800">Morning Intake</h1>
        </div>
        <p className="text-sm text-slate-500">
          Record today&apos;s fish supply deliveries
        </p>
      </div>

      {/* Add Form */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-500" />
            Add Fish Supply
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {isAddingType ? (
          <form onSubmit={handleAddFishType} className="mb-6 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                New Fish Type Name
              </label>
              <input
                type="text"
                autoFocus
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
                placeholder="e.g., Yellowfin Tuna"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !newTypeName.trim()}
              className="px-4 py-2.5 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50 transition-colors"
            >
              Save Type
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingType(false);
                setFormData((prev) => ({ ...prev, fishType: "" }));
              }}
              className="px-4 py-2.5 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-200"
            >
              Cancel
            </button>
          </form>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Fish Type
              </label>
              <select
                value={formData.fishType}
                onChange={(e) => {
                  if (e.target.value === "ADD_NEW") {
                    setIsAddingType(true);
                    setFormData((prev) => ({ ...prev, fishType: "" }));
                  } else {
                    setFormData((prev) => ({ ...prev, fishType: e.target.value }));
                  }
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
              >
                <option value="">Select fish type</option>
                {fishTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
                <option value="ADD_NEW" className="font-semibold text-cyan-600">
                  + Add New Fish Type...
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <Scale className="w-3 h-3 inline mr-1" />
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.incomingWeight}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    incomingWeight: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Buying Price/kg (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.buyingPricePerKg}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    buyingPricePerKg: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Selling Price/kg (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.sellingPricePerKg}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sellingPricePerKg: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || isAddingType}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-sky-400 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Entry
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">
            Total Entries
          </p>
          <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">
            Total Weight
          </p>
          <p className="text-2xl font-bold text-cyan-600">
            {totalWeight.toFixed(2)} kg
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
          <p className="text-xs font-medium text-slate-500 mb-1">
            Total Buying Cost
          </p>
          <p className="text-2xl font-bold text-amber-600">
            LKR {totalCost.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            Today&apos;s Intake Log
          </h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <Fish className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No entries yet. Add your first fish supply above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Fish Type
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Weight (kg)
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Buy/kg
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sell/kg
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-700">
                      {log.fishType}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {log.incomingWeight.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {log.buyingPricePerKg.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {log.sellingPricePerKg.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-700">
                      LKR{" "}
                      {(log.incomingWeight * log.buyingPricePerKg).toLocaleString(
                        "en-LK",
                        { minimumFractionDigits: 2 }
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
