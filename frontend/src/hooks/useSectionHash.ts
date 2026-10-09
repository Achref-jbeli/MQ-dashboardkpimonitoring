import { useState, useEffect, useCallback } from "react";

export interface UseSectionHashOptions {
  defaultSection: string;
  validSections: string[];
  aliases?: Record<string, string>;
}

/**
 * Custom hook to synchronize dashboard active section with URL hash.
 * Supports:
 * - Refresh state persistence (window.location.hash)
 * - Direct URL opening (/admin#teams, /admin#kpi-management, etc.)
 * - Browser Back and Forward buttons (hashchange & popstate events)
 * - No full page reload on navigation
 * - Query parameter preservation
 */
export function useSectionHash({
  defaultSection,
  validSections,
  aliases = {},
}: UseSectionHashOptions) {
  const resolveSection = useCallback(
    (hashStr: string): string => {
      const raw = hashStr.replace(/^#/, "").trim().toLowerCase();
      if (!raw) return defaultSection;

      // Check alias mapping first
      if (aliases[raw]) return aliases[raw];

      // Check direct match (case-insensitive)
      const directMatch = validSections.find(
        (sec) => sec.toLowerCase() === raw
      );
      if (directMatch) return directMatch;

      return defaultSection;
    },
    [defaultSection, validSections, aliases]
  );

  const [currentSection, setCurrentSection] = useState<string>(() => {
    return resolveSection(window.location.hash);
  });

  // Keep state in sync with URL hash changes (back/forward, direct link, refresh)
  useEffect(() => {
    const handleHashChange = () => {
      const resolved = resolveSection(window.location.hash);
      setCurrentSection(resolved);
    };

    const initialResolved = resolveSection(window.location.hash);
    const normalizedHash = `#${initialResolved}`;

    // Normalize empty or invalid hash to default section hash without reloading
    if (!window.location.hash || window.location.hash === "#" || window.location.hash !== normalizedHash) {
      if (!window.location.hash || window.location.hash === "#") {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}${normalizedHash}`
        );
      }
    }

    setCurrentSection(initialResolved);

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [resolveSection]);

  const setSection = useCallback(
    (nextSection: string) => {
      const canonical = aliases[nextSection] || nextSection;
      setCurrentSection(canonical);

      const targetHash = `#${nextSection}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(
          null,
          "",
          `${window.location.pathname}${window.location.search}${targetHash}`
        );
      }
    },
    [aliases]
  );

  return [currentSection, setSection] as const;
}
