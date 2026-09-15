"use client"

import { useCallback, useEffect, useState } from "react"
import { getMerchandisers } from "@/lib/actions"

// Merchandiser roster is DB-backed (managed from the Orders page) rather
// than a hardcoded list, so every consumer fetches it instead of importing
// a static array. Cheap enough to call on every mount - the list is tiny.
export function useMerchandiserNames() {
  const [merchandiserNames, setMerchandiserNames] = useState<string[]>([])

  const refreshMerchandisers = useCallback(() => {
    getMerchandisers().then((list) => setMerchandiserNames(list.map((m) => m.name)))
  }, [])

  useEffect(() => {
    refreshMerchandisers()
  }, [refreshMerchandisers])

  return { merchandiserNames, refreshMerchandisers }
}
