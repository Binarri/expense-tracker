import { cookies } from "next/headers";

export const EXPENSE_FILTERS = ["all", "income", "expense"] as const;

export type ExpenseFilter = (typeof EXPENSE_FILTERS)[number];

export async function getExpenseFilter(): Promise<ExpenseFilter> {
  const cookieStore = await cookies();

  const filter = cookieStore.get("expenseFilter")?.value;

  if (
    filter === "all" ||
    filter === "income" ||
    filter === "expense"
  ) {
    return filter;
  }

  return "all";
}