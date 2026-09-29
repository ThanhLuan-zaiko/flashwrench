"use client";

import { useEffect } from "react";
import {
  type SpeculationScope,
  speculationRulesForScope,
} from "@/lib/speculation/scopes";
import { serializeSpeculationRules } from "@/lib/speculation/speculation-rules";

// Speculation Rules API (Chromium): each page area declares its profile in
// lib/speculation/scopes.ts. The script element is injected imperatively
// because React refuses to execute <script> tags it renders on the client
// (soft navigations warn), and removing it on unmount stops this scope's
// rules from leaking into the next page. Browsers without support parse
// the unknown script type and ignore it entirely.
export function SpeculationRules({ scope }: { scope: SpeculationScope }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "speculationrules";
    script.textContent = serializeSpeculationRules(
      speculationRulesForScope(scope),
    );
    document.head.appendChild(script);
    return () => script.remove();
  }, [scope]);

  return null;
}
