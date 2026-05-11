"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to real-time changes on an encounter and its games.
 * Calls onUpdate() whenever something changes so the parent can re-fetch or re-render.
 */
export function useEncounterRealtime(encounterId: string, onUpdate: () => void) {
  const stable = useCallback(onUpdate, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!encounterId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`encounter:${encounterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "encounters",
          filter: `id=eq.${encounterId}`,
        },
        () => stable()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => stable()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "compositions",
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => stable()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, stable]);
}
