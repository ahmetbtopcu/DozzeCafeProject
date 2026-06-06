"use client";

import { useEffect, useState } from "react";
import { API_URL, fetchHealth } from "@/lib/api";

export default function BackendStatus() {
  const [status, setStatus] = useState<"loading" | "ok" | "cold" | "error">("loading");
  const [aiOk, setAiOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const h = await fetchHealth();
        if (!cancelled) {
          setStatus("ok");
          setAiOk(h.ai_healthy);
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 transition duration-200">
        Backend bağlanıyor…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700 transition duration-200" title={API_URL}>
        Backend uyuyor — 1 dk bekleyin veya demo cache
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800 ring-1 ring-emerald-100 transition duration-200">
        Canlı API
      </span>
      {!aiOk && (
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800 ring-1 ring-amber-100 transition duration-200">
          Demo modu (AI cache)
        </span>
      )}
    </div>
  );
}
