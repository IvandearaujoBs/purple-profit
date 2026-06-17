import { useEffect, useState } from "react";
import { loadAll, type Commission } from "@/lib/commissions";

export function useCommissions() {
  const [list, setList] = useState<Commission[]>([]);
  useEffect(() => {
    setList(loadAll());
    const onChange = () => setList(loadAll());
    window.addEventListener("commissions:changed", onChange);
    window.addEventListener("storage", onChange);
    window.addEventListener("auth:changed", onChange);
    return () => {
      window.removeEventListener("commissions:changed", onChange);
      window.removeEventListener("storage", onChange);
      window.removeEventListener("auth:changed", onChange);
    };
  }, []);
  return list;
}
