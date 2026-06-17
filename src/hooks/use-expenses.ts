import { useEffect, useState } from "react";
import { loadAllExpenses, type Expense } from "@/lib/expenses";

export function useExpenses() {
  const [list, setList] = useState<Expense[]>([]);
  useEffect(() => {
    setList(loadAllExpenses());
    const onChange = () => setList(loadAllExpenses());
    window.addEventListener("expenses:changed", onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("auth:changed", onChange);
    return () => {
      window.removeEventListener("expenses:changed", onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("auth:changed", onChange);
    };
  }, []);
  return list;
}
