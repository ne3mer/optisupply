import { useEffect } from "react";

const BRAND = "OptiSupply";

/** Sets `document.title` for the current view (browser tab / history). */
export function usePageTitle(pageTitle: string | null | undefined) {
  useEffect(() => {
    if (!pageTitle?.trim()) {
      document.title = `${BRAND} — Ethical supply chain intelligence`;
      return;
    }
    const t = pageTitle.trim();
    document.title = t.startsWith(BRAND) ? t : `${BRAND} — ${t}`;
  }, [pageTitle]);
}
