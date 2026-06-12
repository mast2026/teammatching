import { useEffect, useState } from "react";
import { bindPathListener, route } from "../lib/navigation.js";

export function useRoute() {
  const [path, setPath] = useState(route);

  useEffect(() => {
    bindPathListener(setPath);
    const onPopState = () => setPath(route());
    const onNavigate = () => setPath(route());
    window.addEventListener("popstate", onPopState);
    window.addEventListener("mast:navigate", onNavigate);
    return () => {
      bindPathListener(null);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("mast:navigate", onNavigate);
    };
  }, []);

  return path;
}
