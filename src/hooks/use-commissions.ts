import { useEffect, useState } from "react";
import { fetchAll, loadAll, type Commission } from "@/lib/commissions";

export function useCommissions() {
  const [list, setList] = useState<Commission[]>(loadAll());
  useEffect(() => {
    void fetchAll().then(setList);
    const onChange = () => setList(loadAll());
    const onAuth = () => { void fetchAll().then(setList); };
    window.addEventListener("commissions:changed", onChange);
    window.addEventListener("auth:changed", onAuth);
    return () => {
      window.removeEventListener("commissions:changed", onChange);
      window.removeEventListener("auth:changed", onAuth);
    };
  }, []);
  return list;
}
