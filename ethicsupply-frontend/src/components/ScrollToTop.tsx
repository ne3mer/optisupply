import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets window scroll on client-side navigation so long pages
 * (e.g. Suppliers list) do not keep scroll offset on the next route.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
