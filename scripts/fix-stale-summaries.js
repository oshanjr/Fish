/**
 * One-time script to recalculate and update all dailyStoreSummary records
 * with correct buying costs and net profits from fishInventoryLog and dailyExpense.
 *
 * Run with: node scripts/fix-stale-summaries.js
 * Add --dry-run to preview without writing.
 */

const { PrismaClient } = require("../node_modules/.prisma/client");
const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) {
    console.log("=== DRY RUN MODE (no writes) ===\n");
  }

  // 1. Get all daily store summaries
  const summaries = await prisma.dailyStoreSummary.findMany({
    orderBy: { date: "asc" },
  });

  console.log(`Found ${summaries.length} daily store summary records.\n`);

  // 2. Get all inventory logs and expenses
  const allInventory = await prisma.fishInventoryLog.findMany({
    select: { date: true, incomingWeight: true, buyingPricePerKg: true },
  });

  const allExpenses = await prisma.dailyExpense.findMany({
    select: { date: true, amount: true },
  });

  // Build maps by date key (YYYY-MM-DD)
  const inventoryMap = new Map();
  for (const inv of allInventory) {
    const key = inv.date.toISOString().split("T")[0];
    const cost = Number(inv.incomingWeight) * Number(inv.buyingPricePerKg);
    inventoryMap.set(key, (inventoryMap.get(key) || 0) + cost);
  }

  const expenseMap = new Map();
  for (const exp of allExpenses) {
    const key = exp.date.toISOString().split("T")[0];
    expenseMap.set(key, (expenseMap.get(key) || 0) + Number(exp.amount));
  }

  let updatedCount = 0;
  let skippedCount = 0;
  let totalBuyingDiff = 0;
  let totalExpenseDiff = 0;
  let totalProfitDiff = 0;

  for (const summary of summaries) {
    const key = summary.date.toISOString().split("T")[0];

    const correctBuyingCost = Math.round((inventoryMap.get(key) || 0) * 100) / 100;
    const correctExpenses = Math.round((expenseMap.get(key) || 0) * 100) / 100;
    const posSales = Number(summary.totalPosSales);
    const correctNetProfit = Math.round((posSales - correctBuyingCost - correctExpenses) * 100) / 100;

    const oldBuying = Number(summary.totalBuyingCost);
    const oldExpenses = Number(summary.calculatedExpenses);
    const oldProfit = Number(summary.netProfit);

    const buyingDiff = correctBuyingCost - oldBuying;
    const expenseDiff = correctExpenses - oldExpenses;
    const profitDiff = correctNetProfit - oldProfit;

    const needsUpdate =
      Math.abs(buyingDiff) > 0.01 ||
      Math.abs(expenseDiff) > 0.01 ||
      Math.abs(profitDiff) > 0.01;

    if (needsUpdate) {
      if (Math.abs(buyingDiff) > 0.01 || Math.abs(expenseDiff) > 0.01) {
        console.log(
          `${key}: Buying ${oldBuying.toLocaleString()} -> ${correctBuyingCost.toLocaleString()} (${buyingDiff >= 0 ? "+" : ""}${buyingDiff.toLocaleString()}) | ` +
          `Expenses ${oldExpenses.toLocaleString()} -> ${correctExpenses.toLocaleString()} (${expenseDiff >= 0 ? "+" : ""}${expenseDiff.toLocaleString()}) | ` +
          `Profit ${oldProfit.toLocaleString()} -> ${correctNetProfit.toLocaleString()}`
        );
      }

      if (!dryRun) {
        await prisma.dailyStoreSummary.update({
          where: { id: summary.id },
          data: {
            totalBuyingCost: correctBuyingCost,
            calculatedExpenses: correctExpenses,
            netProfit: correctNetProfit,
          },
        });
      }

      updatedCount++;
      totalBuyingDiff += buyingDiff;
      totalExpenseDiff += expenseDiff;
      totalProfitDiff += profitDiff;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Updated: ${updatedCount} records`);
  console.log(`Skipped (already correct): ${skippedCount} records`);
  console.log(`Total buying cost adjustment: ${totalBuyingDiff >= 0 ? "+" : ""}${totalBuyingDiff.toLocaleString()} LKR`);
  console.log(`Total expense adjustment: ${totalExpenseDiff >= 0 ? "+" : ""}${totalExpenseDiff.toLocaleString()} LKR`);
  console.log(`Total profit adjustment: ${totalProfitDiff >= 0 ? "+" : ""}${totalProfitDiff.toLocaleString()} LKR`);

  if (dryRun) {
    console.log("\nNo changes written. Run without --dry-run to apply.");
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));

