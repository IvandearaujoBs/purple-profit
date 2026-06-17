import { useEffect, useState } from "react";
import { fetchAllExpenses, loadAllExpenses, type Expense } from "@/lib/expenses";

export function useExpenses() {
  const [list, setList] = useState<Expense[]>(loadAllExpenses());
  useEffect(() => {
    void fetchAllExpenses().then(setList);
    const onChange = () => setList(loadAllExpenses());
    const onAuth = () => { void fetchAllExpenses().then(setList); };
    window.addEventListener("expenses:changed", onChange);
    window.addEventListener("auth:changed", onAuth);
    return () => {
      window.removeEventListener("expenses:changed", onChange);
      window.removeEventListener("auth:changed", onAuth);
    };
  }, []);
  return list;
}
