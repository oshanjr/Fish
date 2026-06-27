"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function syncToHub(summaryId: string) {
  const summary = await prisma.dailyStoreSummary.findUnique({
    where: { id: summaryId },
  });

  if (!summary) {
    return { success: false, error: "Summary not found" };
  }

  if (summary.isSyncedWithHub) {
    return { success: false, error: "Already synced" };
  }

  const hubApiUrl = process.env.ADMIN_HUB_API_URL;
  const hubApiKey = process.env.ADMIN_HUB_API_KEY;

  if (!hubApiUrl || !hubApiKey) {
    return { success: false, error: "Hub API not configured. Check environment variables." };
  }

  const payload = {
    date: summary.date.toISOString(),
    totalRevenue: Number(summary.totalPosSales),
    totalExpenses: Number(summary.totalBuyingCost) + Number(summary.calculatedExpenses) + Number(summary.calculatedWastageCost),
    metadata: {
      totalBuyingCost: Number(summary.totalBuyingCost),
      calculatedExpenses: Number(summary.calculatedExpenses),
      calculatedWastageCost: Number(summary.calculatedWastageCost),
      netProfit: Number(summary.netProfit),
      storeId: "fish-store-gampaha",
      syncedAt: new Date().toISOString()
    }
  };

  try {
    const response = await fetch(hubApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": hubApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        success: false,
        error: `Hub returned ${response.status}: ${errorText}`,
      };
    }

    // Mark as synced
    await prisma.dailyStoreSummary.update({
      where: { id: summaryId },
      data: { isSyncedWithHub: true },
    });

    revalidatePath("/dashboard/hub-sync");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { success: false, error: `Sync failed: ${message}` };
  }
}
