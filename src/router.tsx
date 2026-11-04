import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const PathContext = createContext("/");

export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0] || "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

export function PathProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => {
    const normalized = normalizePath(window.location.pathname);
    if (normalized !== window.location.pathname) {
      window.history.replaceState(null, "", `${normalized}${window.location.search}${window.location.hash}`);
    }
    return normalized;
  });

  useEffect(() => {
    const sync = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
      return;
    }
    window.scrollTo(0, 0);
  }, [path]);

  return <PathContext.Provider value={path}>{children}</PathContext.Provider>;
}

export function usePath(): string {
  return useContext(PathContext);
}
