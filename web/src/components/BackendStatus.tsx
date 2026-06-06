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
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
        Backend bağlanıyor…
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700" title={API_URL}>
        Backend uyuyor — 1 dk bekleyin veya demo cache
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
        Canlı API
      </span>
      {!aiOk && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
          Demo modu (AI cache)
        </span>
      )}
    </div>
  );
}
