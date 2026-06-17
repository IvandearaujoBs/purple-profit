import { useEffect, useState } from "react";
import { loadAllExpenses, type Expense } from "@/lib/expenses";

export function useExpenses() {
  const [list, setList] = useState<Expense[]>([]);
  useEffect(() => {
    setList(loadAllExpenses());
    const onChange = () => setList(loadAllExpenses());
    window.addEventListener("expenses:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("expenses:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return list;
}
